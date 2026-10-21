import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { Sparkles, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#0071E3] to-[#5856D6] rounded-2xl flex items-center justify-center mx-auto text-white shadow-md shadow-[#0071E3]/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            {isLogin ? 'Sign in to Cognify' : 'Create your account'}
          </h2>
          <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#98989D]">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-semibold text-[#0071E3] dark:text-[#32ADE6] hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Demo Fast-Login Pills: local development builds only */}
        {import.meta.env.DEV && (
          <div className="apple-card p-3.5 space-y-2 text-xs">
            <span className="font-semibold text-[#86868B] block uppercase tracking-wider text-[10px]">
              Quick Demo Sign-In
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('instructor@demo.local')}
                className="px-3 py-1 bg-[#0071E3]/10 hover:bg-[#0071E3]/15 text-[#0071E3] dark:text-[#32ADE6] rounded-full font-medium active:scale-95 transition"
              >
                Instructor (instructor@demo.local)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('student@demo.local')}
                className="px-3 py-1 bg-[#34C759]/10 hover:bg-[#34C759]/15 text-[#248A3D] dark:text-[#34C759] rounded-full font-medium active:scale-95 transition"
              >
                Student (student@demo.local)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#D70015] dark:text-[#FF453A] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="apple-card p-6 sm:p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#86868B] mb-1">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#86868B] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#86868B] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868B] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 apple-btn-primary py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-full flex items-center justify-center gap-2"
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
