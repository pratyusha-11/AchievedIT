import { FormEvent, useState, useMemo, useRef, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import logo from '../assets/AchievedIT_logo.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RecoveryStep = 'email' | 'otp' | 'reset' | 'done';

export default function ForgotPassword() {
  const { forgotPassword, verifyResetOtp, resetPassword } = useAuth();
  const { success: showSuccessToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password rules validation
  const rules = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      lower: /[a-z]/.test(newPassword),
      upper: /[A-Z]/.test(newPassword),
      digit: /\d/.test(newPassword),
      special: /[@$!%*?&#^~_+=<>.-]/.test(newPassword),
      match: Boolean(newPassword && confirmPassword && newPassword === confirmPassword)
    };
  }, [newPassword, confirmPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (rules.length) score += 20;
    if (rules.lower) score += 20;
    if (rules.upper) score += 20;
    if (rules.digit) score += 20;
    if (rules.special) score += 20;
    return score;
  }, [rules]);

  // Step 1: Request Reset Code
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await forgotPassword(trimmed);
      if (res.error) {
        setError(res.error);
        return;
      }

      showSuccessToast('Reset code sent! Check your inbox.');
      setStep('otp');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your reset code.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await verifyResetOtp(email.trim().toLowerCase(), code);
      if (res.error) {
        setError(res.error);
        return;
      }

      setStep('reset');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Set New Password
  const handleSetNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please complete both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strengthScore < 100) {
      setError('New password must satisfy all security rules.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword({
        email: email.trim().toLowerCase(),
        otp: otpDigits.join(''),
        newPassword,
        confirmPassword
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      showSuccessToast('Password reset successfully!');
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-parchment px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Branding Header */}
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 mb-5 group transition-transform hover:scale-105"
          >
            <img
              src={logo}
              alt="AchievedIT"
              className="h-8 w-8 object-contain drop-shadow-sm"
            />
            <span className="font-display text-lg font-bold tracking-tight text-ink-700 group-hover:text-brass transition-colors">
              AchievedIT
            </span>
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Reset Password
          </h1>
          <p className="mt-1 text-xs font-mono uppercase tracking-wider text-ink-500">
            Secure Account Recovery
          </p>
        </div>

        {/* Wizard Card */}
        <div className="rounded-2xl border border-border bg-parchment-100 p-6 sm:p-8 shadow-xl">
          {error && <div className="mb-5"><Alert variant="error">{error}</Alert></div>}

          {/* STEP 1: EMAIL */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-ink-500 mb-2 leading-relaxed">
                Enter your registered email address and we will send you a 6-digit OTP code to verify your identity.
              </p>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                  Registered Email
                </span>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brass"
                    placeholder="you@college.edu"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 disabled:opacity-50"
              >
                {submitting ? <Spinner size={16} /> : <ArrowRight size={16} />}
                <span>{submitting ? 'Sending code…' : 'Send Reset Code'}</span>
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-medium text-ink-900">Enter the 6-digit code sent to</p>
                <p className="font-mono text-xs text-brass-dark font-semibold mt-0.5">{email}</p>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="focus-ring h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-border bg-parchment-200/50 text-center font-mono text-xl font-bold text-ink-900 outline-none transition focus:border-brass"
                  />
                ))}
              </div>

              <p className="text-center text-xs text-ink-500">
                ⏱️ Code valid for 10 minutes
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-ink-700 hover:bg-parchment-200 transition"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="submit"
                  disabled={submitting || otpDigits.join('').length !== 6}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 disabled:opacity-50"
                >
                  {submitting ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
                  <span>{submitting ? 'Verifying…' : 'Verify Code'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ENTER NEW PASSWORD */}
          {step === 'reset' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <p className="text-xs text-ink-500 mb-2">
                Create a new strong password for your AchievedIT account.
              </p>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                  New Password *
                </span>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brass"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brass"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                  Confirm New Password *
                </span>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brass"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brass"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {/* Password strength */}
              {newPassword && (
                <div className="rounded-xl border border-border bg-parchment-200/50 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between font-medium">
                    <span className="text-ink-500">Security:</span>
                    <span className="font-bold">{strengthScore === 100 ? 'Strong' : 'Incomplete'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-ink-500">
                    <span className={`flex items-center gap-1 ${rules.length ? 'text-emerald-600 font-medium' : ''}`}>
                      {rules.length ? <Check size={12} /> : <X size={12} />} 8+ Chars
                    </span>
                    <span className={`flex items-center gap-1 ${rules.upper ? 'text-emerald-600 font-medium' : ''}`}>
                      {rules.upper ? <Check size={12} /> : <X size={12} />} Uppercase
                    </span>
                    <span className={`flex items-center gap-1 ${rules.digit ? 'text-emerald-600 font-medium' : ''}`}>
                      {rules.digit ? <Check size={12} /> : <X size={12} />} Number
                    </span>
                    <span className={`flex items-center gap-1 ${rules.special ? 'text-emerald-600 font-medium' : ''}`}>
                      {rules.special ? <Check size={12} /> : <X size={12} />} Symbol
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || strengthScore < 100}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 disabled:opacity-50"
              >
                {submitting ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
                <span>{submitting ? 'Updating password…' : 'Save New Password'}</span>
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink-900">
                Password Reset Complete!
              </h3>
              <p className="text-sm text-ink-500 leading-relaxed max-w-xs mx-auto">
                Your password has been successfully updated. You can now log in with your new credentials.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-6 py-2.5 text-sm font-semibold text-parchment-100 shadow-md hover:bg-ink-700 transition"
              >
                <span>Go to Login</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>

        {/* Footer Back Link */}
        {step !== 'done' && (
          <p className="mt-6 text-center text-sm text-ink-500">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-brass-dark hover:underline">
              Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
