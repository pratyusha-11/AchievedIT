import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import logo from '../assets/AchievedIT_logo.png';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { verifyEmailOtp, resendVerificationOtp } = useAuth();
  const { success: showSuccessToast } = useToast();

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError(null);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits filled, auto-submit
    if (digit && index === 5) {
      const fullCode = updated.join('');
      if (fullCode.length === 6) {
        submitOtp(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;

    const digits = pasted.split('');
    setOtpDigits(digits);
    inputRefs.current[5]?.focus();
    submitOtp(pasted);
  };

  const submitOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { error: verifyErr, user } = await verifyEmailOtp(email.trim().toLowerCase(), code);
      if (verifyErr) {
        setError(verifyErr);
        return;
      }

      showSuccessToast('Email verified successfully! Welcome to AchievedIT.');
      navigate('/');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending || !email) return;

    setIsResending(true);
    setError(null);

    try {
      const { error: resendErr, message } = await resendVerificationOtp(email.trim().toLowerCase());
      if (resendErr) {
        setError(resendErr);
        return;
      }

      showSuccessToast(message || 'A new verification code has been sent.');
      setCooldown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-parchment px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Header Branding */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-105 mb-3 group">
            <img
              src={logo}
              alt="AchievedIT"
              className="h-10 w-10 object-contain drop-shadow-sm"
            />
            <span className="font-display text-2xl font-bold tracking-tight text-ink-900 group-hover:text-brass transition-colors">
              AchievedIT
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-900">Verify Your Email</h1>
          <p className="mt-1 text-sm text-ink-500">
            We sent a 6-digit verification code to
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-parchment-200 px-3 py-1 font-mono text-xs font-semibold text-ink-900">
            <Mail size={13} className="text-brass" />
            <span>{email || 'your email'}</span>
          </div>
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-border bg-parchment-100 p-6 sm:p-8 shadow-xl">
          {error && <div className="mb-6"><Alert variant="error">{error}</Alert></div>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitOtp();
            }}
          >
            {/* 6 Digits Boxes */}
            <div className="mb-6 flex items-center justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="focus-ring h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-border bg-parchment-200/50 text-center font-mono text-xl font-bold text-ink-900 outline-none transition-all focus:border-brass focus:bg-parchment-100"
                />
              ))}
            </div>

            <p className="mb-6 text-center text-xs text-ink-500">
              ⏱️ Code expires in 10 minutes · Maximum 5 attempts allowed
            </p>

            <button
              type="submit"
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
              <span>{isVerifying ? 'Verifying code…' : 'Verify & Continue'}</span>
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 border-t border-border/80 pt-6 text-center">
            <p className="text-xs text-ink-500 mb-2">Didn't receive the email?</p>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brass-dark hover:underline disabled:opacity-50"
              >
                {isResending ? <Spinner size={13} /> : <RefreshCw size={13} />}
                <span>Resend verification code</span>
              </button>
            ) : (
              <span className="font-mono text-xs text-ink-500">
                Resend available in {cooldown}s
              </span>
            )}
          </div>
        </div>

        {/* Back Link */}
        <p className="mt-6 text-center text-xs text-ink-500">
          Wrong email address?{' '}
          <Link to="/signup" className="font-semibold text-brass-dark hover:underline">
            Back to sign up
          </Link>
          {' · '}
          <Link to="/login" className="font-semibold text-brass-dark hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
