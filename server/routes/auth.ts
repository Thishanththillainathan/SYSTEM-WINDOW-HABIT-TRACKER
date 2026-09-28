import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../postgres';
import { sendOtpEmail } from '../email';
import { generateToken, verifyTokenMiddleware, AuthRequest, authRateLimiter } from '../middleware/auth';
import { logChange } from '../changeLogger';

const router = Router();

// Apply Rate Limiter to Auth Endpoints
router.use(authRateLimiter);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. Customer Registration
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Server-side Input Validation
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const hunterName = typeof username === 'string' ? username.trim() : '';
    if (!hunterName) {
      res.status(400).json({ error: 'Hunter name (username) is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    const existing = existingRes.rows[0];

    if (existing) {
      if (existing.status === 'verified') {
        res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
        return;
      }
      // If user exists but pending_verification, delete old unverified user record to re-register
      await query("DELETE FROM users WHERE LOWER(email) = LOWER($1) AND status = 'pending_verification'", [cleanEmail]);
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const defaultStats = JSON.stringify({
      STR: 10,
      INT: 10,
      VIT: 10,
      WIS: 10,
      CHA: 10,
    });

    // Create user with status: pending_verification
    await query(`
      INSERT INTO users (
        id, email, password_hash, role, status, username, title, level, xp, xp_to_next_level, rank, streak, longest_streak, points, awakening_date, stats_json, account_status, has_completed_onboarding
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
    `, [
      userId,
      cleanEmail,
      passwordHash,
      'customer',
      'pending_verification',
      hunterName,
      'E-Rank Awakened',
      1,
      0,
      1000,
      'E',
      0,
      0,
      0,
      new Date().toISOString().split('T')[0],
      defaultStats,
      'ACTIVE',
      false
    ]);

    // Generate secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const nowMs = Date.now();
    const expiresAtMs = nowMs + 10 * 60 * 1000; // 10 minutes expiry rule

    console.log(`OTP generated for ${cleanEmail}`);

    // Clear all previous OTPs for this email
    await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    
    // Insert new OTP record with hash and resend metrics
    const otpId = `otp-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    await query(`
      INSERT INTO otps (id, email, otp_code, otp_hash, expires_at, failed_attempts, resend_count, resend_window_start, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [otpId, cleanEmail, 'HASHED', otpHash, expiresAtMs, 0, 0, nowMs, nowMs]);

    // Transmit OTP code via email service (never log in terminal)
    const sendResult = await sendOtpEmail(cleanEmail, otpCode);

    if (!sendResult.success) {
      // Allow immediate resend without 60s cooldown on failure
      await query('UPDATE otps SET created_at = 0 WHERE id = $1', [otpId]);
      res.status(500).json({
        error: sendResult.error || 'Account created, but verification email could not be delivered. Please click Resend OTP to try again.',
        needVerification: true,
        email: cleanEmail,
      });
      return;
    }

    res.json({
      success: true,
      needVerification: true,
      email: cleanEmail,
      message: 'Registration initiated. A 6-digit OTP code has been transmitted to your email.',
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// 2. Verify OTP
router.post('/verify-otp', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otpCode || '').trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      res.status(400).json({ error: 'OTP must be a valid 6-digit numerical code.' });
      return;
    }

    // Fetch the latest OTP record for this email
    const otpRes = await query(
      'SELECT * FROM otps WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1',
      [cleanEmail]
    );

    const otpRecord = otpRes.rows[0];

    if (!otpRecord) {
      res.status(400).json({ error: 'No verification passcode found for this email. Please click Resend OTP.' });
      return;
    }

    // Check if max failed attempts reached (5 max)
    const currentAttempts = Number(otpRecord.failed_attempts || 0);
    if (currentAttempts >= 5) {
      await query('DELETE FROM otps WHERE id = $1', [otpRecord.id]);
      res.status(400).json({ error: 'Maximum wrong attempts (5) exceeded. Please click Resend OTP to obtain a new code.' });
      return;
    }

    // Check Expiration (10-minute validity)
    const currentMs = Date.now();
    const expiresMs = Number(otpRecord.expires_at);

    if (currentMs > expiresMs) {
      res.status(400).json({ error: 'OTP passcode has expired. Please click Resend OTP to obtain a new code.' });
      return;
    }

    // Verify OTP against stored hash (or fallback to legacy plaintext if any)
    const storedHash = otpRecord.otp_hash || otpRecord.otp_code || '';
    let isMatch = false;

    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(cleanOtp, storedHash);
    } else {
      isMatch = storedHash === cleanOtp;
    }

    if (!isMatch) {
      const newAttempts = currentAttempts + 1;
      if (newAttempts >= 5) {
        await query('DELETE FROM otps WHERE id = $1', [otpRecord.id]);
        res.status(400).json({ error: 'Maximum wrong attempts (5) reached. Please click Resend OTP for a new code.' });
        return;
      } else {
        await query('UPDATE otps SET failed_attempts = $1 WHERE id = $2', [newAttempts, otpRecord.id]);
        const remaining = 5 - newAttempts;
        res.status(400).json({ error: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` });
        return;
      }
    }

    // Single-use: Invalidate/Delete used OTP
    await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [cleanEmail]);

    // Update user status to 'verified'
    await query("UPDATE users SET status = 'verified' WHERE LOWER(email) = LOWER($1)", [cleanEmail]);

    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    const user = userRes.rows[0];

    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    await logChange({
      userId: user.id,
      actionType: 'PROFILE_CREATED',
      entityType: 'PROFILE',
      entityId: user.id,
      description: `Account verified and Hunter profile created for ${user.username}`,
      newValue: user.username
    });

    // Issue JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userStats = user.stats_json ? JSON.parse(user.stats_json) : { STR: 10, INT: 10, VIT: 10, WIS: 10, CHA: 10 };

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        title: user.title,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: user.xp_to_next_level,
        rank: user.rank,
        streak: user.streak,
        longestStreak: user.longest_streak,
        points: user.points,
        awakeningDate: user.awakening_date,
        stats: userStats,
        role: user.role === 'admin' ? 'ADMIN' : 'USER',
        accountStatus: user.account_status,
        hasCompletedOnboarding: Boolean(user.has_completed_onboarding),
      },
    });
  } catch (err: any) {
    console.error('Verify OTP error details:', err?.message || err);
    res.status(500).json({ error: `Server error during OTP verification: ${err?.message || 'Unknown'}` });
  }
});

// 3. Resend OTP (with 60s cooldown and max 5 resends/hour)
router.post('/resend-otp', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Ensure user exists and is pending verification
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    const user = userRes.rows[0];

    if (!user) {
      res.status(400).json({ error: 'No account found with this email. Please register first.' });
      return;
    }

    if (user.status === 'verified') {
      res.status(400).json({ error: 'Account is already verified. Please log in.' });
      return;
    }

    const lastOtpRes = await query(
      'SELECT * FROM otps WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1',
      [cleanEmail]
    );
    const lastOtp = lastOtpRes.rows[0];

    const nowMs = Date.now();

    // 60-second cooldown check (bypassed if created_at === 0 due to failed delivery)
    if (lastOtp && Number(lastOtp.created_at) > 0 && (nowMs - Number(lastOtp.created_at)) < 60000) {
      const waitSec = Math.ceil((60000 - (nowMs - Number(lastOtp.created_at))) / 1000);
      res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new OTP.` });
      return;
    }

    // Hourly resend limit check (max 5 resends per hour)
    let resendCount = Number(lastOtp?.resend_count || 0);
    let resendWindowStart = Number(lastOtp?.resend_window_start || nowMs);

    if (!lastOtp || (nowMs - resendWindowStart) >= 3600000) {
      // Reset resend window after 1 hour
      resendCount = 0;
      resendWindowStart = nowMs;
    }

    if (resendCount >= 5) {
      res.status(429).json({ error: 'Maximum OTP resend limit reached (5 per hour). Please try again later.' });
      return;
    }

    const newResendCount = resendCount + 1;

    // Generate NEW secure 6-digit OTP & Hash
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAtMs = nowMs + 10 * 60 * 1000; // 10 minutes expiry

    console.log(`OTP generated for ${cleanEmail}`);

    await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    
    const otpId = `otp-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    await query(`
      INSERT INTO otps (id, email, otp_code, otp_hash, expires_at, failed_attempts, resend_count, resend_window_start, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [otpId, cleanEmail, 'HASHED', otpHash, expiresAtMs, 0, newResendCount, resendWindowStart, nowMs]);

    const sendResult = await sendOtpEmail(cleanEmail, otpCode);

    if (!sendResult.success) {
      await query('UPDATE otps SET created_at = 0 WHERE id = $1', [otpId]);
      res.status(500).json({ error: sendResult.error || 'Could not send verification email. Please try again.' });
      return;
    }

    res.json({ success: true, message: 'New 6-digit OTP code transmitted to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error during OTP resend.' });
  }
});

// 4. Standard Login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    const user = userRes.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Reject login if status !== 'verified'
    if (user.status !== 'verified') {
      res.status(403).json({
        error: 'Your account is pending verification. Please complete OTP verification first.',
        needVerification: true,
        email: cleanEmail,
      });
      return;
    }

    // Issue JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userStats = user.stats_json ? JSON.parse(user.stats_json) : { STR: 10, INT: 10, VIT: 10, WIS: 10, CHA: 10 };

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        title: user.title,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: user.xp_to_next_level,
        rank: user.rank,
        streak: user.streak,
        longestStreak: user.longest_streak,
        points: user.points,
        awakeningDate: user.awakening_date,
        stats: userStats,
        role: user.role === 'admin' ? 'ADMIN' : 'USER',
        accountStatus: user.account_status,
        hasCompletedOnboarding: Boolean(user.has_completed_onboarding),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
});

// 5. Logout
router.post('/logout', (req: AuthRequest, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Get Current Authenticated User (Me)
router.get('/me', verifyTokenMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.user!.userId]);
    const user = userRes.rows[0];

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const userStats = user.stats_json ? JSON.parse(user.stats_json) : { STR: 10, INT: 10, VIT: 10, WIS: 10, CHA: 10 };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        title: user.title,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: user.xp_to_next_level,
        rank: user.rank,
        streak: user.streak,
        longestStreak: user.longest_streak,
        points: user.points,
        awakeningDate: user.awakening_date,
        stats: userStats,
        role: user.role === 'admin' ? 'ADMIN' : 'USER',
        accountStatus: user.account_status,
        hasCompletedOnboarding: Boolean(user.has_completed_onboarding),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// Diagnostic endpoint to check SMTP environment status (SAFE - NO SECRETS EXPOSED)
router.get('/smtp-status', (req: AuthRequest, res: Response): void => {
  res.json({
    SMTP_HOST: process.env.SMTP_HOST?.trim() ? 'SET' : 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT?.trim() ? 'SET' : 'MISSING',
    SMTP_USER: process.env.SMTP_USER?.trim() ? 'SET' : 'MISSING',
    SMTP_PASS: process.env.SMTP_PASS?.trim() ? 'SET' : 'MISSING',
    EMAIL_FROM: process.env.EMAIL_FROM?.trim() ? 'SET' : 'MISSING',
  });
});

export default router;
