import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import {
  BookOpen,
  Brain,
  BarChart3,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Award,
  ShieldCheck,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Also highlight for nested routes (e.g. /instructor/courses/...). */
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
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  EduPulse LMS
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">
                  NextGen Learning
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive(item)
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {(user.first_name || user.email)[0]}
                  </div>
                  <div className="flex flex-col text-left whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{displayName}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        user.role === 'INSTRUCTOR'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : user.role === 'ADMIN'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                isActive(item)
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}

          <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500">
                  Signed in as <span className="font-bold text-slate-800 dark:text-white">{user.email}</span> ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg"
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
