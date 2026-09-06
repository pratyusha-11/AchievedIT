import { FormEvent, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, AtSign, Mail, Lock, Eye, EyeOff, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

export default function Signup() {
  const { signUp } = useAuth();
  const { success: showToastSuccess } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password rules validation
  const rules = useMemo(() => {
    return {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      digit: /\d/.test(password),
      special: /[@$!%*?&#^~_+=<>.-]/.test(password),
      match: Boolean(password && confirmPassword && password === confirmPassword)
    };
  }, [password, confirmPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (rules.length) score += 20;
    if (rules.lower) score += 20;
    if (rules.upper) score += 20;
    if (rules.digit) score += 20;
    if (rules.special) score += 20;
    return score;
  }, [rules]);

  const strengthColor =
    strengthScore <= 40
      ? 'bg-rose-500'
      : strengthScore <= 80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const strengthLabel =
    strengthScore <= 40 ? 'Weak' : strengthScore <= 80 ? 'Good' : 'Strong';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedFull = fullName.trim();
    const trimmedUser = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFull || !trimmedUser || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in every field.');
      return;
    }

    if (!USERNAME_REGEX.test(trimmedUser)) {
      setError('Username must be 3-30 characters (letters, numbers, underscores, dots).');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strengthScore < 100) {
      setError('Password does not meet all security requirements.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUp({
        fullName: trimmedFull,
        username: trimmedUser,
        email: trimmedEmail,
        password,
        confirmPassword
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      showToastSuccess('Verification code sent! Please check your email inbox.');
      navigate(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
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
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brass-dark via-brass to-brass-light text-white shadow-md shadow-brass/20">
            <span className="font-display text-lg font-bold">A</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Create Account</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-500">
            AchievedIT · Personal achievement registry
          </p>
        </div>

        {/* Signup Form Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-border bg-parchment-100 p-6 sm:p-8 shadow-xl"
        >
          {error && <div className="mb-5"><Alert variant="error">{error}</Alert></div>}

          {/* Full Name */}
          <label className="mb-3.5 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Full Name *
            </span>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brass"
                placeholder="Peter Parker"
              />
            </div>
          </label>

          {/* Username */}
          <label className="mb-3.5 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Username *
            </span>
            <div className="relative">
              <AtSign size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-3 text-sm font-mono outline-none transition-colors focus:border-brass"
                placeholder="peter11"
              />
            </div>
          </label>

          {/* Email */}
          <label className="mb-3.5 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Email Address *
            </span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brass"
                placeholder="you@university.edu"
              />
            </div>
          </label>

          {/* Password */}
          <label className="mb-3.5 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Password *
            </span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-brass"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brass transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* Confirm Password */}
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Confirm Password *
            </span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-brass"
                placeholder="Re-type password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brass transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mb-5 rounded-xl border border-border bg-parchment-200/50 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span className="text-ink-500">Password Strength:</span>
                <span className={`font-bold ${strengthScore === 100 ? 'text-emerald-500' : 'text-ink-700'}`}>
                  {strengthLabel}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full ${strengthColor} transition-all duration-300`}
                  style={{ width: `${strengthScore}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-ink-500">
                <span className={`flex items-center gap-1 ${rules.length ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                  {rules.length ? <Check size={12} /> : <X size={12} />} 8+ Characters
                </span>
                <span className={`flex items-center gap-1 ${rules.upper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                  {rules.upper ? <Check size={12} /> : <X size={12} />} Uppercase
                </span>
                <span className={`flex items-center gap-1 ${rules.digit ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                  {rules.digit ? <Check size={12} /> : <X size={12} />} Number
                </span>
                <span className={`flex items-center gap-1 ${rules.special ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                  {rules.special ? <Check size={12} /> : <X size={12} />} Symbol (@$!%*?)
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size={16} /> : <UserPlus size={16} />}
            <span>{submitting ? 'Creating account…' : 'Sign Up with Email'}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brass-dark hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
