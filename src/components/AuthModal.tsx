import React, { useState, useEffect } from 'react';
import { soundFx } from '../utils/sound';
import { API_BASE_URL, apiFetch } from '../config/api';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  KeyRound, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

export type AuthPortalMode = 'CHOOSE' | 'USER_LOGIN' | 'USER_REGISTER' | 'ADMIN_LOGIN' | 'OTP';

interface AuthModalProps {
  onSuccess: (user: any, token: string) => void;
  onClose?: () => void;
  initialMode?: 'CHOOSE' | 'LOGIN' | 'REGISTER' | 'ADMIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose, initialMode }) => {
  const [mode, setMode] = useState<AuthPortalMode>(() => {
    if (initialMode === 'ADMIN') return 'ADMIN_LOGIN';
    if (initialMode === 'REGISTER') return 'USER_REGISTER';
    if (initialMode === 'LOGIN') return 'USER_LOGIN';
    return 'CHOOSE';
  });

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    soundFx.playBlip(1000);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.needVerification) {
          setMode('OTP');
          setInfoMsg('Your account is pending verification. A 6-digit OTP code was sent to your email.');
          setCooldown(60);
        } else {
          setErrorMsg(data.error || 'Login failed. Please check credentials.');
        }
        setLoading(false);
        return;
      }

      soundFx.playLevelUp();
      onSuccess(data.user, data.token);
    } catch (err) {
      setErrorMsg('Network error connecting to System Window backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    soundFx.playBlip(1100);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Admin authentication failed. Invalid credentials.');
        setLoading(false);
        return;
      }

      // PART 5 — VERIFY BACKEND ROLE IS ADMIN
      if (data.user.role !== 'ADMIN') {
        soundFx.playBlip(500);
        setErrorMsg('ACCESS DENIED — ADMIN CLEARANCE REQUIRED. This account does not hold Administrator privileges.');
        setLoading(false);
        return;
      }

      soundFx.playLevelUp();
      onSuccess(data.user, data.token);
    } catch (err) {
      setErrorMsg('Network error connecting to System Window backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    soundFx.playBlip(1100);

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      soundFx.playAchievement();
      setMode('OTP');
      setInfoMsg('Passcode transmitted! Enter the 6-digit OTP sent to your email.');
      setCooldown(60);
    } catch (err) {
      setErrorMsg('Network error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    soundFx.playBlip(1200);

    try {
      const res = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'OTP verification failed.');
        setLoading(false);
        return;
      }

      soundFx.playLevelUp();
      onSuccess(data.user, data.token);
    } catch (err) {
      setErrorMsg('Network error verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setErrorMsg('');
    setInfoMsg('');
    soundFx.playBlip(900);

    try {
      const res = await apiFetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to resend OTP.');
        return;
      }

      setInfoMsg('New 6-digit OTP passcode transmitted to your email.');
      setCooldown(60);
    } catch (err) {
      setErrorMsg('Network error resending OTP.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
      <div className="system-panel-glow max-w-lg w-full p-6 sm:p-8 rounded-2xl border-2 border-white/30 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
        <div className="animate-scanline" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Dynamic Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/30 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md mx-auto">
            {mode === 'ADMIN_LOGIN' ? (
              <ShieldAlert className="w-7 h-7 text-purple-300 animate-pulse" />
            ) : (
              <Lock className="w-7 h-7 text-purple-300 animate-pulse" />
            )}
          </div>

          <h2 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
            {mode === 'CHOOSE' && 'SYSTEM LOGIN'}
            {mode === 'USER_LOGIN' && 'USER LOGIN'}
            {mode === 'USER_REGISTER' && 'NEW HUNTER REGISTRATION'}
            {mode === 'ADMIN_LOGIN' && 'ADMIN LOGIN'}
            {mode === 'OTP' && '6-DIGIT OTP VERIFICATION'}
          </h2>

          <p className="text-xs font-mono text-purple-300/80">
            {mode === 'CHOOSE' && 'Choose your access level'}
            {mode === 'USER_LOGIN' && 'Personal RPG System Authentication'}
            {mode === 'USER_REGISTER' && 'Register your personal RPG account'}
            {mode === 'ADMIN_LOGIN' && 'System Control Center Root Clearance'}
            {mode === 'OTP' && '[SYSTEM OTP VERIFICATION PROTOCOL]'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 font-mono text-xs flex items-start space-x-2 mb-5">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-white/15 border border-white/30 text-purple-300 font-mono text-xs flex items-start space-x-2 mb-5">
            <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* PART 1: TWO SEPARATE ACCESS OPTIONS SCREEN */}
        {mode === 'CHOOSE' && (
          <div className="space-y-4 font-mono">
            {/* USER LOGIN CARD */}
            <div
              onClick={() => {
                soundFx.playBlip(900);
                setErrorMsg('');
                setMode('USER_LOGIN');
              }}
              className="system-panel p-5 rounded-2xl border-white/20 hover:border-purple-400/60 hover:bg-white/15 transition cursor-pointer group shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-purple-300" />
                    <span className="font-orbitron font-bold text-lg text-white group-hover:text-purple-300 transition">
                      USER LOGIN
                    </span>
                  </div>
                  <p className="text-xs text-white/60">Personal RPG System Dashboard</p>
                </div>
                <div className="hex-btn px-4 py-2 bg-white/10 group-hover:bg-purple-500/30 border border-white/30 text-white font-orbitron font-bold text-xs flex items-center space-x-1">
                  <span>ENTER</span>
                  <ChevronRight className="w-4 h-4 text-purple-300" />
                </div>
              </div>
            </div>

            {/* ADMIN LOGIN CARD */}
            <div
              onClick={() => {
                soundFx.playBlip(1100);
                setErrorMsg('');
                setMode('ADMIN_LOGIN');
              }}
              className="system-panel p-5 rounded-2xl border-white/20 hover:border-purple-400/60 hover:bg-white/15 transition cursor-pointer group shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-purple-300 animate-pulse" />
                    <span className="font-orbitron font-bold text-lg text-white group-hover:text-purple-300 transition">
                      ADMIN LOGIN
                    </span>
                  </div>
                  <p className="text-xs text-white/60">System Control Center Root Clearance</p>
                </div>
                <div className="hex-btn px-4 py-2 bg-white/10 group-hover:bg-purple-500/30 border border-white/30 text-white font-orbitron font-bold text-xs flex items-center space-x-1">
                  <span>ENTER</span>
                  <ChevronRight className="w-4 h-4 text-purple-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PART 2: USER LOGIN FORM */}
        {mode === 'USER_LOGIN' && (
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. hunter@shadowguild.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full hex-btn py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'LOGIN'}</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[3]" />
              </button>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playBlip(700);
                    setErrorMsg('');
                    setMode('USER_REGISTER');
                  }}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/15 text-purple-300 hover:bg-white/10 transition font-bold"
                >
                  CREATE ACCOUNT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playBlip(600);
                    setErrorMsg('');
                    setMode('CHOOSE');
                  }}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/60 hover:text-white transition flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* USER REGISTRATION FORM */}
        {mode === 'USER_REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                HUNTER CODENAME / NAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Sung Jin-Woo"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. hunter@shadowguild.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                PASSWORD (BCRYPT ENCRYPTED)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <button
                type="submit"
                disabled={loading}
                className="w-full hex-btn py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition"
              >
                <span>{loading ? 'REGISTERING...' : 'REGISTER ACCOUNT'}</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip(600);
                  setErrorMsg('');
                  setMode('USER_LOGIN');
                }}
                className="w-full py-2 rounded-xl bg-white/5 border border-white/15 text-white/60 hover:text-white transition flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK TO USER LOGIN</span>
              </button>
            </div>
          </form>
        )}

        {/* PART 3: ADMIN LOGIN FORM */}
        {mode === 'ADMIN_LOGIN' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                ADMIN EMAIL
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. thishantht644@gmail.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                ADMIN PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 font-mono text-xs">
              <button
                type="submit"
                disabled={loading}
                className="w-full hex-btn py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-white font-orbitron font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(168,85,247,0.5)] transition"
              >
                <span>{loading ? 'AUTHENTICATING ADMIN...' : 'ENTER ADMIN SYSTEM'}</span>
                <ShieldCheck className="w-4 h-4 text-purple-300" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip(600);
                  setErrorMsg('');
                  setMode('CHOOSE');
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/60 hover:text-white transition flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK</span>
              </button>
            </div>
          </form>
        )}

        {/* OTP VERIFICATION FORM */}
        {mode === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                ENTER 6-DIGIT PASSCODE (SENT TO {email.toUpperCase()})
              </label>
              <p className="text-[11px] font-mono text-purple-300/80 mb-2">
                • Code expires in 10 minutes &nbsp;|&nbsp; Max 5 wrong attempts
              </p>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-white/10 border border-white/30 rounded-xl pl-10 pr-3 py-2.5 text-center font-mono font-bold text-xl text-purple-300 tracking-[8px] focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full hex-btn py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition disabled:opacity-50"
            >
              <span>{loading ? 'VERIFYING...' : 'VERIFY OTP & ENTER DASHBOARD'}</span>
              <ShieldCheck className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-center justify-between text-xs font-mono border-t border-white/15 pt-3">
              <button
                type="button"
                onClick={() => setMode('USER_LOGIN')}
                className="text-white/60 hover:text-purple-300 transition"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                disabled={cooldown > 0}
                onClick={handleResendOtp}
                className={`flex items-center space-x-1 ${
                  cooldown > 0 ? 'text-white/40 cursor-not-allowed' : 'text-purple-300 hover:underline font-bold'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
