import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Plus,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

import logo from '../assets/AchievedIT_logo.png';

interface NavbarProps {
  onAddCertificate?: () => void;
}

export default function Navbar({ onAddCertificate }: NavbarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Achievements', path: '/achievements', icon: Award },
    { label: 'Profile', path: '/profile', icon: UserIcon }
  ];

  // User initials for avatar
  const initials = (user?.fullName || user?.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-parchment-100/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img
                src={logo}
                alt="AchievedIT"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-ink-900 group-hover:text-brass transition-colors">
                AchievedIT
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brass/10 text-brass-dark font-semibold'
                      : 'text-ink-500 hover:text-ink-900 hover:bg-parchment-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Add Button */}
          {onAddCertificate && (
            <button
              onClick={onAddCertificate}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 py-1.5 text-sm font-medium text-parchment-100 shadow-sm transition hover:bg-ink-700 active:scale-95"
            >
              <Plus size={15} />
              <span>Add Certificate</span>
            </button>
          )}

          <ThemeToggle />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="focus-ring flex items-center gap-2 rounded-full p-1 transition hover:bg-parchment-200"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/15 text-brass-dark font-display text-xs font-bold border border-brass/30">
                {initials}
              </div>
              <ChevronDown
                size={14}
                className={`hidden sm:block text-ink-500 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-parchment-100 p-2 shadow-2xl animate-scale-in z-50">
                <div className="border-b border-border/80 px-3 py-2.5 mb-1">
                  <p className="font-display text-sm font-semibold text-ink-900 truncate">
                    {user?.fullName || 'AchievedIT User'}
                  </p>
                  <p className="font-mono text-xs text-ink-500 truncate">
                    @{user?.username || 'user'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>Verified Account</span>
                  </div>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-ink-700 hover:bg-parchment-200 hover:text-ink-900 transition"
                  >
                    <UserIcon size={15} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/profile#security"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-ink-700 hover:bg-parchment-200 hover:text-ink-900 transition"
                  >
                    <KeyRound size={15} />
                    <span>Change Password</span>
                  </Link>

                  <Link
                    to="/achievements"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-ink-700 hover:bg-parchment-200 hover:text-ink-900 transition"
                  >
                    <Award size={15} />
                    <span>My Achievements</span>
                  </Link>
                </div>

                <div className="border-t border-border/80 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-parchment-200 hover:text-ink-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-parchment-100 px-4 py-4 space-y-3 animate-fade-in">
          {onAddCertificate && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAddCertificate();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-parchment-100 shadow-sm"
            >
              <Plus size={16} />
              <span>Add Certificate</span>
            </button>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-brass/10 text-brass-dark font-semibold'
                      : 'text-ink-500 hover:bg-parchment-200 hover:text-ink-900'
                  }`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border pt-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
