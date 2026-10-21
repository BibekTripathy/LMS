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
  Award,
  ShieldCheck,
  BadgeCheck,
  Moon,
  Sun,
  PenLine,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  prefix?: boolean;
}

/** Links depend on role: students learn, instructors author, admins also see platform stats. */
function navItemsFor(role: string | undefined): NavItem[] {
  const courses: NavItem = { to: '/courses', label: 'Courses', icon: BookOpen };
  const study: NavItem = { to: '/study-centre', label: 'Study Centre', icon: Sparkles };
  const studio: NavItem = { to: '/instructor', label: 'Studio', icon: LayoutDashboard, prefix: true };

  switch (role) {
    case 'STUDENT':
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        courses,
        study,
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/certificates', label: 'Certificates', icon: Award },
      ];
    case 'INSTRUCTOR':
      return [studio, courses, study];
    case 'ADMIN':
      return [studio, courses, study, { to: '/admin/analytics', label: 'Platform', icon: ShieldCheck }];
    default:
      return [courses, { to: '/verify', label: 'Verify Certificate', icon: BadgeCheck }];
  }
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nb-theme');
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
      localStorage.setItem('nb-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('nb-theme', 'light');
    }
  }, [dark]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const items = navItemsFor(user?.role);
  const isActive = (item: NavItem) =>
    item.prefix ? location.pathname.startsWith(item.to) : location.pathname === item.to;
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email.split('@')[0];

  return (
    <nav className="bg-latte-mantle/95 dark:bg-frappe-mantle/95 backdrop-blur-md border-b-2 border-latte-surface0 dark:border-frappe-surface1 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-frappe-blue flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <PenLine className="w-5 h-5" />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-notebook font-bold text-xl text-latte-blue dark:text-frappe-lavender tracking-tight">
                  NoteBox
                </span>
                <span className="text-[10px] text-latte-subtext0 dark:text-frappe-subtext0 font-semibold tracking-wider uppercase -mt-1">
                  Learn & Grow
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive(item)
                      ? 'bg-latte-surface0 text-latte-blue dark:bg-frappe-surface0 dark:text-frappe-blue font-semibold'
                      : 'text-latte-subtext1 hover:text-latte-blue hover:bg-latte-mantle dark:text-frappe-subtext1 dark:hover:text-frappe-blue dark:hover:bg-frappe-surface0'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-latte-subtext1 dark:text-frappe-subtext1 hover:bg-latte-surface0 dark:hover:bg-frappe-surface0 transition"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-latte-surface0 dark:bg-frappe-surface0 border border-latte-surface1 dark:border-frappe-surface1">
                  <div className="w-7 h-7 rounded-full bg-frappe-mauve text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {(user.first_name || user.email)[0]}
                  </div>
                  <div className="flex flex-col text-left whitespace-nowrap">
                    <span className="text-xs font-semibold text-latte-text dark:text-frappe-text leading-tight">{displayName}</span>
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
              </>
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

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden items-center gap-2">
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
        <div className="lg:hidden border-t-2 border-latte-surface0 dark:border-frappe-surface1 bg-latte-mantle dark:bg-frappe-mantle px-4 pt-3 pb-6 space-y-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                isActive(item)
                  ? 'bg-latte-surface0 text-latte-blue dark:bg-frappe-surface0 dark:text-frappe-blue font-semibold'
                  : 'text-latte-text dark:text-frappe-text hover:bg-latte-surface0 dark:hover:bg-frappe-surface0'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-latte-surface0 dark:border-frappe-surface1">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-xs font-semibold text-latte-subtext0 dark:text-frappe-subtext0">
                  Signed in as <span className="font-bold text-latte-text dark:text-frappe-text">{user.email}</span> ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-frappe-red bg-latte-surface0 dark:bg-frappe-surface0 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium border border-latte-surface1 dark:border-frappe-surface1 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium bg-frappe-blue text-white rounded-lg"
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
