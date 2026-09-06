import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

export default function Login() {
  const { signIn, sessionExpiredNotice, clearSessionExpiredNotice } = useAuth();
  const { success: showSuccessToast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => () => clearSessionExpiredNotice(), [clearSessionExpiredNotice]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);

    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      setError('Please enter your email or username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(trimmedId, password);

      if (res.requireVerification) {
        setUnverifiedEmail(res.email || trimmedId);
        setError(res.error || 'Your email address is not verified yet.');
        return;
      }

      if (res.error) {
        setError(res.error);
        return;
      }

      showSuccessToast('Welcome back to AchievedIT!');
      navigate('/');
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
          <h1 className="font-display text-2xl font-bold text-ink-900">Welcome Back</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-500">
            Sign in to your AchievedIT registry
          </p>
        </div>

        {sessionExpiredNotice && (
          <div className="mb-4">
            <Alert variant="info">Your session expired — please log in again to continue.</Alert>
          </div>
        )}

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-border bg-parchment-100 p-6 sm:p-8 shadow-xl"
        >
          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
              {unverifiedEmail && (
                <div className="mt-3 text-center">
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brass px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brass-dark transition shadow"
                  >
                    <span>Verify Email with 6-Digit OTP</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Email or Username */}
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Email or Username
            </span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brass"
                placeholder="you@college.edu or username"
              />
            </div>
          </label>

          {/* Password */}
          <label className="mb-2 block">
            <div className="flex items-center justify-between mb-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Password
              </span>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brass-dark hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-brass"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size={16} /> : <LogIn size={16} />}
            <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-brass-dark hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
