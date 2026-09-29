import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, pool } from '../postgres';
import { sendOtpEmail } from '../email';
import { generateToken, verifyTokenMiddleware, AuthRequest, authRateLimiter } from '../middleware/auth';
import { logChange } from '../changeLogger';

const router = Router();

// Apply Rate Limiter to Auth Endpoints
router.use(authRateLimiter);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: any): { valid: boolean; cleanEmail: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, cleanEmail: '', error: 'Email address is required.' };
  }
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
    return { valid: false, cleanEmail: '', error: 'A valid email address is required.' };
  }
  const domain = cleanEmail.split('@')[1];
  const invalidDomains = ['test.com', 'example.com', 'invalid.com', 'localhost', 'test', 'local'];
  if (invalidDomains.includes(domain) || !domain.includes('.')) {
    return { valid: false, cleanEmail: '', error: 'Please enter a valid, active email address.' };
  }
  return { valid: true, cleanEmail };
}

// 1. Customer Registration (WITH STRICT PG TRANSACTION, STEP LOGGING & FINITE TIMEOUTS)
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, username } = req.body;

  // Server-side Input Validation
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    res.status(400).json({ error: emailCheck.error });
    return;
  }
  const cleanEmail = emailCheck.cleanEmail;

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const hunterName = typeof username === 'string' ? username.trim() : '';
  if (!hunterName) {
    res.status(400).json({ error: 'Hunter name (username) is required.' });
    return;
  }

  console.log(`[REGISTRATION STEP: INPUT_VALIDATION] Input validation passed for ${cleanEmail}`);

  let client;
  try {
    client = await pool.connect();
  } catch (connErr: any) {
    console.error(`[REGISTRATION ERROR: DB_CONNECT] Failed to acquire DB connection:`, connErr?.message || connErr);
    res.status(503).json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'Database connection failed. Please try again in a few moments.'
    });
    return;
  }

  try {
    await client.query('BEGIN');

    // Step 1: Check existing user conflict
    console.log(`[REGISTRATION STEP: CHECK_CONFLICT] Checking user records for ${cleanEmail}`);
    const existingRes = await client.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    const existing = existingRes.rows[0];

    if (existing) {
      if (existing.status === 'verified') {
        console.log(`[REGISTRATION STEP: CONFLICT_VERIFIED] Email conflict detected for verified account ${cleanEmail}`);
        await client.query('ROLLBACK');
        res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
        return;
      }
      // Delete previous unverified record within transaction so user can re-register freshly
      console.log(`[REGISTRATION STEP: CLEAN_PENDING] Removing stale unverified profile for ${cleanEmail}`);
      await client.query("DELETE FROM otps WHERE LOWER(email) = LOWER($1)", [cleanEmail]);
      await client.query("DELETE FROM users WHERE LOWER(email) = LOWER($1) AND status = 'pending_verification'", [cleanEmail]);
    }

    // Step 2: Hash password & insert pending user
    console.log(`[REGISTRATION STEP: USER_INSERT] Creating pending user record for ${cleanEmail}`);
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

    await client.query(`
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

    // Step 3: Generate & insert OTP
    console.log(`[REGISTRATION STEP: OTP_INSERT] Creating OTP passcode record for ${cleanEmail}`);
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const nowMs = Date.now();
    const expiresAtMs = nowMs + 10 * 60 * 1000; // 10 minutes expiry
    const otpId = `otp-${nowMs}-${Math.floor(Math.random() * 1000)}`;

    await client.query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    await client.query(`
      INSERT INTO otps (id, email, otp_code, otp_hash, expires_at, failed_attempts, resend_count, resend_window_start, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [otpId, cleanEmail, 'HASHED', otpHash, expiresAtMs, 0, 0, nowMs, nowMs]);

    // Step 4: Transmit OTP via Brevo SMTP
    console.log(`[REGISTRATION STEP: SMTP_SEND] Transmitting verification email to ${cleanEmail}`);
    const sendResult = await sendOtpEmail(cleanEmail, otpCode);

    if (!sendResult.success) {
      console.error(`[REGISTRATION ERROR: SMTP_FAILED] Email delivery failed for ${cleanEmail}: ${sendResult.error}`);
      // ROLLBACK: Undo user and OTP creation in database completely
      await client.query('ROLLBACK');
      res.status(502).json({
        error: 'EMAIL_DELIVERY_FAILED',
        message: sendResult.error || 'We could not send the OTP email right now. Please try again.',
      });
      return;
    }

    // Step 5: COMMIT Transaction after successful email transmission
    await client.query('COMMIT');
    console.log(`[REGISTRATION STEP: SUCCESS] Account registration initiated successfully for ${cleanEmail}`);

    res.json({
      success: true,
      needVerification: true,
      email: cleanEmail,
      message: 'Registration initiated. A 6-digit OTP code has been transmitted to your email.',
    });
  } catch (err: any) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error(`[REGISTRATION ERROR: EXCEPTION] ${cleanEmail}:`, err?.message || err);

    if (err?.code === '57014' || err?.message?.includes('timeout')) {
      res.status(503).json({
        error: 'DATABASE_TIMEOUT',
        message: 'Database operation timed out. Please try again.',
      });
      return;
    }

    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Registration could not be completed. Please try again.',
    });
  } finally {
    if (client) {
      client.release();
    }
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

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      res.status(400).json({ error: emailCheck.error });
      return;
    }
    const cleanEmail = emailCheck.cleanEmail;

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
