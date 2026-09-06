import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import logo from '../assets/AchievedIT_logo.png';

export default function Signup() {
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-parchment px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 mb-3 group transition-transform hover:scale-105"
          >
            <img
              src={logo}
              alt="AchievedIT"
              className="h-9 w-9 object-contain drop-shadow-sm"
            />
            <span className="font-display text-xl font-bold tracking-tight text-ink-700 group-hover:text-brass transition-colors">
              AchievedIT
            </span>
          </Link>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-500">
            Create Your Account
          </p>
        </div>

        {isClerkConfigured ? (
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            fallbackRedirectUrl="/"
          />
        ) : (
          <div className="rounded-2xl border border-border bg-parchment-100 p-8 text-center max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-ink-900 mb-2">Clerk Setup Required</h3>
            <p className="text-sm text-ink-500 mb-4">
              Please add <code className="bg-parchment-200 px-1.5 py-0.5 rounded text-xs text-brass">VITE_CLERK_PUBLISHABLE_KEY</code> in Vercel or your local <code className="bg-parchment-200 px-1.5 py-0.5 rounded text-xs text-brass">.env</code> to activate authentication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
