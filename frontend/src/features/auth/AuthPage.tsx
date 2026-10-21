import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { NotebookPen, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';

/** Matches the local demo accounts created in README §5; never used in production builds. */
const DEMO_PASSWORD = 'DemoPass123!';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Return to the protected page that sent the user here, otherwise to their role's home.
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const homeFor = (role: string) => (role === 'STUDENT' ? '/dashboard' : '/instructor');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        const signedIn = await login({ email, password });
        navigate(from ?? homeFor(signedIn.role), { replace: true });
      } else {
        if (!firstName.trim()) {
          throw new Error('Please enter your first name.');
        }
        const created = await register({ email, password, first_name: firstName, last_name: lastName });
        navigate(from ?? homeFor(created.role), { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Authentication failed. Please check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setIsLogin(true);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-latte-base dark:bg-frappe-base">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 bg-frappe-blue rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl">
            <NotebookPen className="w-8 h-8" />
          </div>
          <div className="mt-2 font-notebook text-4xl font-bold text-frappe-blue">NoteBox</div>
          <h2 className="mt-2 text-2xl font-bold text-latte-text dark:text-frappe-text tracking-tight">
            {isLogin ? 'Welcome back' : '📝 Create your account'}
          </h2>
          <p className="mt-2 text-sm text-latte-subtext1 dark:text-frappe-subtext1">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-semibold text-frappe-blue hover:underline"
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>

        {/* Demo Fast-Login Pills: local development builds only (accounts from the README) */}
        {import.meta.env.DEV && (
        <div className="p-3 bg-latte-mantle dark:bg-frappe-mantle rounded-xl border border-latte-surface1 dark:border-frappe-surface1 shadow-sm text-xs">
          <span className="font-semibold text-latte-subtext0 dark:text-frappe-subtext0 block mb-1.5 uppercase tracking-wider text-[10px]">
            Quick Demo Sign-In
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('instructor@demo.local')}
              className="px-2.5 py-1 bg-latte-surface0 dark:bg-frappe-surface0 text-frappe-blue rounded font-medium hover:bg-latte-surface1 dark:hover:bg-frappe-surface1 transition"
            >
              Instructor (instructor@demo.local)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('student@demo.local')}
              className="px-2.5 py-1 bg-latte-surface0 dark:bg-frappe-surface0 text-frappe-green rounded font-medium hover:bg-latte-surface1 dark:hover:bg-frappe-surface1 transition"
            >
              Student (student@demo.local)
            </button>
          </div>
        </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1 mb-1">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-latte-overlay0 dark:text-frappe-overlay0 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full pl-9 pr-3 py-2.5 bg-latte-mantle dark:bg-frappe-mantle border border-latte-surface1 dark:border-frappe-surface1 rounded-lg text-sm focus:ring-2 focus:ring-frappe-blue focus:outline-none text-latte-text dark:text-frappe-text"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2.5 bg-latte-mantle dark:bg-frappe-mantle border border-latte-surface1 dark:border-frappe-surface1 rounded-lg text-sm focus:ring-2 focus:ring-frappe-blue focus:outline-none text-latte-text dark:text-frappe-text"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1 mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-latte-overlay0 dark:text-frappe-overlay0 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-latte-mantle dark:bg-frappe-mantle border border-latte-surface1 dark:border-frappe-surface1 rounded-lg text-sm focus:ring-2 focus:ring-frappe-blue focus:outline-none text-latte-text dark:text-frappe-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-latte-overlay0 dark:text-frappe-overlay0 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-latte-mantle dark:bg-frappe-mantle border border-latte-surface1 dark:border-frappe-surface1 rounded-lg text-sm focus:ring-2 focus:ring-frappe-blue focus:outline-none text-latte-text dark:text-frappe-text"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3 px-4 bg-frappe-blue hover:bg-frappe-sapphire text-white font-semibold text-sm rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
