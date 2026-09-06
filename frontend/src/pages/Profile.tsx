import { useState, useMemo, FormEvent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  CheckCircle2,
  Calendar,
  Lock,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Award,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

export default function Profile() {
  const { user, changePassword, signOut } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  // Scroll to security section if navigated via #security
  useEffect(() => {
    if (location.hash === '#security') {
      const el = document.getElementById('security');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  const initials = (user?.fullName || user?.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangeError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setChangeError('New password cannot be identical to current password.');
      return;
    }

    if (strengthScore < 100) {
      setChangeError('New password does not meet all security guidelines.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({ currentPassword, newPassword, confirmPassword });
      if (res.error) {
        setChangeError(res.error);
        return;
      }

      showSuccessToast('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : '2026';

  return (
    <div className="flex min-h-screen flex-col bg-parchment transition-colors duration-200">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
            Account Profile
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Manage your personal credentials, verification status, and security settings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-parchment-100 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-brass-dark via-brass to-brass-light text-white font-display text-2xl font-bold shadow-lg shadow-brass/25 border-4 border-parchment-100 mb-4">
                  {initials}
                </div>

                <h2 className="font-display text-lg font-bold text-ink-900">
                  {user?.fullName}
                </h2>
                <p className="font-mono text-xs text-ink-500 mt-0.5">
                  @{user?.username}
                </p>

                {/* Verified Email Badge */}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>Email Verified</span>
                </div>
              </div>

              <div className="mt-6 border-t border-border/80 pt-6 space-y-3 text-xs">
                <div className="flex items-center justify-between text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} /> Email
                  </span>
                  <span className="font-medium text-ink-900 truncate max-w-[150px]">
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center justify-between text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> Member Since
                  </span>
                  <span className="font-medium text-ink-900">{memberSince}</span>
                </div>

                <div className="flex items-center justify-between text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <Shield size={14} /> Account Type
                  </span>
                  <span className="font-medium text-ink-900">Standard Member</span>
                </div>
              </div>

              <div className="mt-6 border-t border-border/80 pt-6">
                <button
                  onClick={signOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security & Password Settings */}
          <div className="md:col-span-2 space-y-6">
            <div
              id="security"
              className="rounded-2xl border border-border bg-parchment-100 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/80 pb-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass/10 text-brass">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-ink-900">
                    Security & Password
                  </h3>
                  <p className="text-xs text-ink-500">
                    Ensure your account is using a strong password.
                  </p>
                </div>
              </div>

              {changeError && (
                <div className="mb-5">
                  <Alert variant="error">{changeError}</Alert>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Current Password
                  </span>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brass"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brass"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {/* New Password */}
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                    New Password
                  </span>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brass"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brass"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {/* Confirm New Password */}
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Confirm New Password
                  </span>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brass"
                      placeholder="Repeat new password"
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

                {/* Password Strength Checker */}
                {newPassword && (
                  <div className="rounded-xl border border-border bg-parchment-200/50 p-3 text-xs space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-ink-500">Security Requirement:</span>
                      <span className={`font-bold ${strengthScore === 100 ? 'text-emerald-500' : 'text-ink-700'}`}>
                        {strengthScore === 100 ? 'Verified Strong' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-ink-500">
                      <span className={`flex items-center gap-1 ${rules.length ? 'text-emerald-600 font-medium' : ''}`}>
                        {rules.length ? <Check size={12} /> : <X size={12} />} 8+ Characters
                      </span>
                      <span className={`flex items-center gap-1 ${rules.upper ? 'text-emerald-600 font-medium' : ''}`}>
                        {rules.upper ? <Check size={12} /> : <X size={12} />} Uppercase
                      </span>
                      <span className={`flex items-center gap-1 ${rules.digit ? 'text-emerald-600 font-medium' : ''}`}>
                        {rules.digit ? <Check size={12} /> : <X size={12} />} Number
                      </span>
                      <span className={`flex items-center gap-1 ${rules.special ? 'text-emerald-600 font-medium' : ''}`}>
                        {rules.special ? <Check size={12} /> : <X size={12} />} Symbol (@$!%*?)
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || strengthScore < 100}
                    className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-6 py-2.5 text-sm font-semibold text-parchment-100 shadow-sm transition hover:bg-ink-700 disabled:opacity-50"
                  >
                    {submitting && <Spinner size={15} />}
                    <span>{submitting ? 'Updating password…' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
