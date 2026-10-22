import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { GraduationCap, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

const DEMO_PASSWORD = 'password123';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        });
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, isLogin ? 'Login failed' : 'Registration failed'));
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
    <div className="landing-ambient-canvas min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-teal-500/20 via-orange-500/10 to-transparent blur-[120px] rounded-full opacity-60 dark:opacity-40"
      />

      <div className="max-w-md w-full space-y-6 relative z-10 page-transition-enter">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md shadow-teal-600/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            {isLogin ? 'Sign in to Cognify' : 'Create your account'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Demo Fast-Login Pills: local development builds only */}
        {import.meta.env.DEV && (
          <div className="lms-card p-3.5 space-y-2 text-xs">
            <span className="font-semibold text-[#64748B] block uppercase tracking-wider text-[10px] font-mono">
              Quick Demo Sign-In
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('instructor@demo.local')}
                className="px-3 py-1 bg-teal-500/10 hover:bg-teal-500/15 text-teal-700 dark:text-teal-300 rounded-full font-medium active:scale-95 transition"
              >
                Instructor (instructor@demo.local)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('student@demo.local')}
                className="px-3 py-1 bg-orange-500/10 hover:bg-orange-500/15 text-orange-700 dark:text-orange-300 rounded-full font-medium active:scale-95 transition"
              >
                Student (student@demo.local)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="liquid-glass p-6 sm:p-8 rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#868E96] mb-1">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#868E96] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#121316] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#868E96] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#121316] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#868E96] mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#868E96] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#121316] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#868E96] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#868E96] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#121316] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-4 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
};
