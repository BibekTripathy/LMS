import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import {
  BookOpen,
  BarChart3,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Moon,
  Sun,
  NotebookPen,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('nb-theme') === 'dark' ||
        (!localStorage.getItem('nb-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('nb-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('nb-theme', 'light');
    }
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
      isActive(path)
        ? 'bg-latte-surface0 text-latte-blue dark:bg-frappe-surface0 dark:text-frappe-blue font-semibold'
        : 'text-latte-subtext1 hover:text-latte-blue hover:bg-latte-mantle dark:text-frappe-subtext1 dark:hover:text-frappe-blue dark:hover:bg-frappe-surface0'
    }`;

  return (
    <nav className="bg-latte-mantle/95 dark:bg-frappe-mantle/95 backdrop-blur-md border-b-2 border-latte-surface0 dark:border-frappe-surface1 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-frappe-blue dark:bg-frappe-blue flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <NotebookPen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-notebook font-bold text-xl text-latte-blue dark:text-frappe-lavender tracking-tight">
                  NoteBox
                </span>
                <span className="text-[10px] text-latte-subtext0 dark:text-frappe-subtext0 font-semibold tracking-wider uppercase -mt-1">
                  Learn & Grow
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {user && (
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              <Link to="/courses" className={navLinkClass('/courses')}>
                <BookOpen className="w-4 h-4" />
                Courses
              </Link>
              <Link to="/study-centre" className={navLinkClass('/study-centre')}>
                <Sparkles className="w-4 h-4 text-frappe-mauve" />
                Study Centre
              </Link>
              <Link to="/analytics" className={navLinkClass('/analytics')}>
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
              {isInstructor && (
                <div className="pl-2 ml-2 border-l border-latte-surface0 dark:border-frappe-surface1 flex items-center space-x-1">
                  <Link
                    to="/instructor"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/instructor')
                        ? 'bg-frappe-blue text-white shadow-sm'
                        : 'text-latte-blue bg-latte-mantle hover:bg-latte-surface0 dark:bg-frappe-surface0 dark:text-frappe-blue dark:hover:bg-frappe-surface1'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Studio
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-latte-subtext1 dark:text-frappe-subtext1 hover:bg-latte-surface0 dark:hover:bg-frappe-surface0 transition"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {isInstructor && (
                  <Link
                    to="/instructor/courses/new"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-frappe-blue hover:bg-frappe-sapphire text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New Course
                  </Link>
                )}

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-latte-surface0 dark:bg-frappe-surface0 border border-latte-surface1 dark:border-frappe-surface1">
                  <div className="w-7 h-7 rounded-full bg-frappe-mauve text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user.first_name ? user.first_name[0] : user.email[0]}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-latte-text dark:text-frappe-text leading-tight">
                      {user.first_name
                        ? `${user.first_name} ${user.last_name || ''}`
                        : user.email.split('@')[0]}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        user.role === 'INSTRUCTOR'
                          ? 'text-frappe-blue'
                          : user.role === 'ADMIN'
                          ? 'text-frappe-red'
                          : 'text-frappe-green'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-latte-subtext1 dark:text-frappe-subtext1 hover:text-frappe-red hover:bg-latte-surface0 dark:hover:bg-frappe-surface0 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-latte-subtext1 dark:text-frappe-subtext1 hover:text-latte-blue dark:hover:text-frappe-blue transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-frappe-blue hover:bg-frappe-sapphire text-white rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 text-latte-subtext1 dark:text-frappe-subtext1 hover:bg-latte-surface0 dark:hover:bg-frappe-surface0 rounded-lg"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-latte-subtext1 dark:text-frappe-subtext1 hover:bg-latte-surface0 dark:hover:bg-frappe-surface0 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-latte-surface0 dark:border-frappe-surface1 bg-latte-mantle dark:bg-frappe-mantle px-4 pt-3 pb-6 space-y-2">
          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-latte-blue dark:text-frappe-blue bg-latte-surface0 dark:bg-frappe-surface0 rounded-lg"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
          <Link to="/courses" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-latte-text dark:text-frappe-text rounded-lg hover:bg-latte-surface0 dark:hover:bg-frappe-surface0">
            <BookOpen className="w-4 h-4" /> Courses
          </Link>
          <Link to="/study-centre" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-frappe-mauve rounded-lg hover:bg-latte-surface0 dark:hover:bg-frappe-surface0">
            <Sparkles className="w-4 h-4" /> AI Study Centre
          </Link>
          <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-latte-text dark:text-frappe-text rounded-lg hover:bg-latte-surface0 dark:hover:bg-frappe-surface0">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
          {isInstructor && (
            <Link to="/instructor" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-frappe-blue bg-latte-surface0 dark:bg-frappe-surface0 rounded-lg">
              <LayoutDashboard className="w-4 h-4" /> Instructor Studio
            </Link>
          )}
          <div className="pt-3 border-t border-latte-surface0 dark:border-frappe-surface1">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-xs font-semibold text-latte-subtext0 dark:text-frappe-subtext0">
                  Signed in as <span className="font-bold text-latte-text dark:text-frappe-text">{user.email}</span> ({user.role})
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-frappe-red bg-latte-surface0 dark:bg-frappe-surface0 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2 text-sm font-medium border border-latte-surface1 dark:border-frappe-surface1 rounded-lg">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2 text-sm font-medium bg-frappe-blue text-white rounded-lg">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
