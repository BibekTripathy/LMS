import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import {
  BarChart3,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Moon,
  Sun,
  Award,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isInstructor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognify-theme') || localStorage.getItem('nb-theme');
      if (stored) return stored === 'dark';
      if (typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('cognify-theme', 'dark');
      localStorage.setItem('nb-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('cognify-theme', 'light');
      localStorage.setItem('nb-theme', 'light');
    }
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5 ${
      isActive(path)
        ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#0071E3] dark:text-[#32ADE6] font-semibold'
        : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
    }`;

  const isStudent = user && !isInstructor && !isAdmin;

  return (
    <nav className="sticky top-0 z-50 w-full apple-glass transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group focus:outline-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071E3] to-[#5856D6] flex items-center justify-center text-white shadow-sm shadow-[#0071E3]/20 group-hover:scale-105 active:scale-95 transition-transform duration-150">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-[17px] tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Cognify
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#86868B]">
                  LMS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Student only links */}
              {isStudent && (
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              )}

              {/* Universal Course Catalogue link */}
              <Link to="/courses" className={navLinkClass('/courses')}>
                <Compass className="w-3.5 h-3.5" />
                Courses
              </Link>

              {/* Student only links */}
              {isStudent && (
                <>
                  <Link to="/study-centre" className={navLinkClass('/study-centre')}>
                    <Sparkles className="w-3.5 h-3.5 text-[#AF52DE]" />
                    Study Centre
                  </Link>
                  <Link to="/analytics" className={navLinkClass('/analytics')}>
                    <BarChart3 className="w-3.5 h-3.5" />
                    Analytics
                  </Link>
                  <Link to="/certificates" className={navLinkClass('/certificates')}>
                    <Award className="w-3.5 h-3.5" />
                    Certificates
                  </Link>
                </>
              )}

              {/* Instructor / Admin Studio */}
              {(isInstructor || isAdmin) && (
                <Link to="/instructor" className={navLinkClass('/instructor')}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Studio
                </Link>
              )}

              {/* Admin Platform Analytics */}
              {isAdmin && (
                <Link to="/admin/analytics" className={navLinkClass('/admin')}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  Platform
                </Link>
              )}

              {/* Logged-out links */}
              {!user && (
                <Link to="/certificates/verify" className={navLinkClass('/certificates/verify')}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Certificate
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDark(!dark)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? 'Light mode' : 'Dark mode'}
              className="p-1.5 rounded-full text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-150"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {isInstructor && (
                  <Link
                    to="/instructor/courses/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] rounded-full transition-all duration-150 shadow-sm shadow-[#0071E3]/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New Course
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#5856D6] to-[#AF52DE] text-white flex items-center justify-center font-semibold text-[11px] uppercase shadow-inner">
                    {user.first_name ? user.first_name[0] : user.email[0]}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[12px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] leading-none max-w-[120px] truncate">
                      {user.first_name
                        ? `${user.first_name} ${user.last_name || ''}`
                        : user.email.split('@')[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-[#86868B] uppercase tracking-wider mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-full active:scale-95 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-full active:scale-[0.98] transition-all duration-150"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full active:scale-[0.98] transition-all duration-150 shadow-sm shadow-[#0071E3]/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
              className="p-1.5 text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-full"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open main menu"
              className="p-1.5 text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-full"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-1">
          {isStudent && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <Compass className="w-4 h-4" /> Courses
          </Link>
          {isStudent && (
            <>
              <Link
                to="/study-centre"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#AF52DE] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
              >
                <Sparkles className="w-4 h-4" /> Study Centre
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </Link>
              <Link
                to="/certificates"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
              >
                <Award className="w-4 h-4" /> Certificates
              </Link>
            </>
          )}
          {(isInstructor || isAdmin) && (
            <Link
              to="/instructor"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#0071E3] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <LayoutDashboard className="w-4 h-4" /> Studio
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <BarChart3 className="w-4 h-4" /> Platform
            </Link>
          )}
          {!user && (
            <Link
              to="/certificates/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <ShieldCheck className="w-4 h-4" /> Verify Certificate
            </Link>
          )}

          <div className="pt-3 mt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 text-xs text-[#86868B]">
                  Signed in as <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{user.email}</span> ({user.role})
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 rounded-xl active:scale-[0.98] transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium rounded-full bg-black/[0.04] dark:bg-white/[0.08]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-[#0071E3] rounded-full shadow-sm shadow-[#0071E3]/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
