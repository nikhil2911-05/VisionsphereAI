import React, { useState } from 'react';
import { Mail, Lock, User, CheckCircle2, AlertCircle, Loader, Sparkles, KeyRound, HelpCircle, ArrowLeft, Phone, Hash, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, resetPassword, requestOtp } from '../services/api';

const Auth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [displayOtp, setDisplayOtp] = useState('');  // Show OTP in UI when email not configured
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetters && hasNumbers && hasSpecial;

  const strengthScore = [hasMinLength, hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;
  let strengthLabel = 'Very Weak';
  if (strengthScore === 2) strengthLabel = 'Weak';
  else if (strengthScore === 3) strengthLabel = 'Medium';
  else if (strengthScore === 4) strengthLabel = 'Strong';

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setMsg('');
    try {
      const data = await requestOtp(email);
      setMsg(data.message || 'New verification code sent!');
      setStatus('success');
      if (data.otp_code) setDisplayOtp(data.otp_code);
      startCooldown();
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.detail || 'Failed to resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');

    if ((mode === 'signup' || (mode === 'forgot' && otpSent)) && !isPasswordValid) {
      setStatus('error');
      setMsg('Please satisfy all password strength requirements.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setStatus('error');
      setMsg('Passwords do not match.');
      return;
    }

    if (mode === 'forgot' && otpSent && password !== confirmPassword) {
      setStatus('error');
      setMsg('Passwords do not match.');
      return;
    }

    try {
      if (mode === 'login') {
        // Sign In
        const data = await loginUser(email, password);
        setStatus('success');
        setMsg('Sign In successful! Loading dashboard...');
        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 1000);
      } else if (mode === 'signup') {
        // Sign Up
        const data = await registerUser(username, email, phone, password);
        setStatus('success');
        setMsg('Registration successful! Directing to Sign In...');
        setTimeout(() => {
          setMode('login');
          setUsername('');
          setPhone('');
          setPassword('');
          setConfirmPassword('');
          setShowPassword(false);
          setShowConfirmPassword(false);
          setStatus('idle');
          setMsg('');
        }, 1800);
      } else {
        // Forgot Password (Reset)
        if (!otpSent) {
          // Step 1: Send OTP code
          const data = await requestOtp(email);
          setStatus('success');
          setMsg(data.message || 'Verification code generated!');
          setOtpSent(true);
          if (data.otp_code) {
            setDisplayOtp(data.otp_code);
            setOtpCode(data.otp_code);  // Auto-fill the input
          }
          setTimeout(() => {
            setStatus('idle');
          }, 2000);
        } else {
          // Step 2: Verify OTP code & Reset
          const data = await resetPassword(email, otpCode, password);
          setStatus('success');
          setMsg('Password reset successful! Directing to Sign In...');
          setTimeout(() => {
            setMode('login');
            setOtpSent(false);
            setOtpCode('');
            setDisplayOtp('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirmPassword(false);
            setStatus('idle');
            setMsg('');
          }, 2000);
        }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      if (err.response) {
        setMsg(err.response.data?.detail || 'Authentication failed. Please verify credentials.');
      } else {
        setMsg('Database server unreachable. Ensure your FastAPI backend (port 8001) is running.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Premium Ambient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Main Glassmorphic Panel Container */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/20 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl relative z-10 hover:shadow-brand-500/5 transition-all duration-550">
        
        {/* Sparkle micro-badge */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-semibold">
            {mode === 'forgot' ? <KeyRound className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            VisionDetect AI Workspace
          </div>
        </div>

        {/* Header Titles */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1.5 transition-all flex items-center justify-center gap-2">
            {mode === 'login' && "Welcome back"}
            {mode === 'signup' && "Create developer account"}
            {mode === 'forgot' && (
              <>
                <KeyRound className="w-5 h-5 text-brand-500 animate-pulse" />
                <span>Reset password</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' && "Access state-of-the-art YOLOv26 object detection dashboard"}
            {mode === 'signup' && "Register to save custom detections and unlock database history"}
            {mode === 'forgot' && "Verify your registered email or phone number to securely reset credentials"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sign Up Mode: Username field */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="john_doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Email or Phone field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {mode === 'signup' ? "Email Address" : "Email or Phone Number"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400 flex items-center">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mode === 'forgot' && otpSent}
                className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-60"
                placeholder={mode === 'signup' ? "developer@domain.com" : "developer@domain.com or +15550199"}
                required
              />
            </div>
          </div>

          {/* Sign Up Mode: Phone Number field */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="+15550199"
                />
              </div>
            </div>
          )}

          {/* OTP Verification field (Forgot Step 2) */}
          {mode === 'forgot' && otpSent && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Verification Code (OTP)
              </label>

              {/* Email sent confirmation banner — shown when email delivery succeeds */}
              {otpSent && !displayOtp && (
                <div className="mb-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-center">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">📧 Verification code sent to your email!</p>
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-500 mt-1">Check your inbox (and spam folder) for a 6-digit code</p>
                </div>
              )}

              {/* Display OTP code in UI only when SMTP is not configured */}
              {displayOtp && (
                <div className="mb-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-400 dark:border-indigo-600 text-center">
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold mb-1.5 uppercase tracking-wider">Your Verification Code (Dev Mode)</p>
                  <p className="text-3xl font-extrabold tracking-[0.4em] text-indigo-600 dark:text-indigo-300 font-mono">{displayOtp}</p>
                  <p className="text-[10px] text-indigo-400 dark:text-indigo-500 mt-1.5">⏱ Expires in 10 minutes</p>
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <Hash className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="6-digit OTP code"
                  maxLength={6}
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-brand-600 dark:text-brand-400">
                  {displayOtp ? 'Code shown above (dev mode)' : '📬 Check your email inbox for the code'}
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Password field */}
          {(mode !== 'forgot' || otpSent) && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {mode === 'forgot' ? "New Password" : "Password"}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setOtpSent(false);
                      setMsg('');
                      setStatus('idle');
                      setPassword('');
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ellipsis"
                  placeholder={mode === 'login' ? "••••••••" : "Must contain 8+ chars (letters, numbers, symbols)"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Password strength checklist - only for signup and password reset modes */}
              {(mode === 'signup' || (mode === 'forgot' && otpSent)) && password.length > 0 && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/30 transition-all duration-350 ease-out animate-fadeIn text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    <span>Please create a strong password</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {strengthLabel}
                    </span>
                  </div>
                  
                  {/* Password strength indicator bar */}
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        strengthScore === 1 ? 'w-1/4 bg-rose-500' :
                        strengthScore === 2 ? 'w-2/4 bg-amber-500' :
                        strengthScore === 3 ? 'w-3/4 bg-emerald-500' :
                        strengthScore === 4 ? 'w-full bg-brand-500' : 'w-0'
                      }`}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                    Your password must be at least 8 characters long and include a mix of:
                  </p>

                  <ul className="grid grid-cols-2 gap-2 mt-2">
                    <li className={`flex items-center gap-2 font-medium transition-colors duration-350 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'}`}>
                      {hasMinLength ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}
                      <span>8+ characters</span>
                    </li>
                    <li className={`flex items-center gap-2 font-medium transition-colors duration-350 ${hasLetters ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'}`}>
                      {hasLetters ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}
                      <span>Letters (A-Z, a-z)</span>
                    </li>
                    <li className={`flex items-center gap-2 font-medium transition-colors duration-350 ${hasNumbers ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'}`}>
                      {hasNumbers ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}
                      <span>Numbers (0-9)</span>
                    </li>
                    <li className={`flex items-center gap-2 font-medium transition-colors duration-350 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'}`}>
                      {hasSpecial ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}
                      <span>Symbols (!, @, #, etc.)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password field (Sign Up & Forgot Password Mode Step 2) */}
          {(mode === 'signup' || (mode === 'forgot' && otpSent)) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {mode === 'forgot' ? "Confirm New Password" : "Confirm Password"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Status Banners */}
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-500 dark:text-amber-400 justify-center py-1">
              <Loader className="w-3.5 h-3.5 animate-spin" />
              Processing secure authentication handshake...
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {msg}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {msg}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {mode === 'login' && "Sign In"}
            {mode === 'signup' && "Sign Up"}
            {mode === 'forgot' && (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{otpSent ? "Verify & Reset Password" : "Send Verification Code"}</span>
              </>
            )}
          </button>

        </form>

        {/* Toggles */}
        <div className="text-center mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/40">
          {mode === 'forgot' ? (
            <button
              onClick={() => {
                setMode('login');
                setOtpSent(false);
                setOtpCode('');
                setDisplayOtp('');
                setPassword('');
                setConfirmPassword('');
                setShowPassword(false);
                setShowConfirmPassword(false);
                setMsg('');
                setStatus('idle');
              }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Remembered your password? Sign In
            </button>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setMsg('');
                  setStatus('idle');
                  setPassword('');
                  setConfirmPassword('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="font-bold text-brand-600 dark:text-brand-400 hover:underline transition-all"
              >
                {mode === 'login' ? "Sign Up Free" : "Sign In"}
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Auth;
