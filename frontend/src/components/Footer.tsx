import { Link } from 'react-router-dom';
import { Award, Heart, ShieldCheck } from 'lucide-react';
import logo from '../assets/AchievedIT_logo.png';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#252033] bg-[#0f0c18] text-[#938ba5]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-3 justify-items-center text-center">
          {/* Brand */}
          <div className="space-y-4 flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="AchievedIT"
                className="h-8 w-8 object-contain"
              />
            
              <span className="font-display text-lg font-bold text-white tracking-tight">
                AchievedIT
              </span>
            </div>

            <p className="text-sm text-[#827a94] max-w-sm leading-relaxed">
              Your intelligent, personal achievement registry. Upload, extract,
              organize, and showcase your verified credentials with AI precision.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                v1.0.0 Stable
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
                <ShieldCheck size={13} />
                Encrypted & Private
              </span>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Platform
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="transition hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/achievements" className="transition hover:text-white">
                  Achievements
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition hover:text-white">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <a href="#privacy" className="transition hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="transition hover:text-white">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#security" className="transition hover:text-white">
                  Security Overview
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-[#231e30] pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs">
          <p className="text-[#726a84]">
            © 2026 <span className="font-semibold text-white">AchievedIT</span>. All rights reserved.
          </p>

          <p className="flex items-center gap-1.5 font-medium text-[#c4bcd4]">
            <span>Designed & Developed by</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300">
              Pratyusha
            </span>
          </p>

          <div className="flex items-center gap-4 text-[#726a84]">
            <span>v1.0.0 Stable</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
