import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Sparkles, BookOpen, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { createQueryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth';
import { Navbar } from './components/shared/Navbar';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { NotBuiltYet } from './components/shared/NotBuiltYet';
import { AuthPage } from './features/auth/AuthPage';
import { InstructorDashboard } from './features/authoring/InstructorDashboard';
import { CourseEditor } from './features/authoring/CourseEditor';
import { QuizBuilder } from './features/quizzes/QuizBuilder';
import { QuizPlayer } from './features/quizzes/QuizPlayer';
import { QuizResult } from './features/quizzes/QuizResult';
import { StudyCentrePage } from './features/study-centre/StudyCentrePage';
import { CourseCatalogue } from './features/courses/CourseCatalogue';
import { CourseDetails } from './features/courses/CourseDetails';
import { StudentDashboard } from './features/dashboard/StudentDashboard';
import { LearningWorkspace } from './features/learning/LearningWorkspace';
import { StudentAnalyticsView } from './features/analytics/StudentAnalyticsView';
import { CourseAnalyticsPage } from './features/analytics/CourseAnalyticsPage';
import { AdminAnalyticsPage } from './features/analytics/AdminAnalyticsPage';
import { QuizLeaderboardPage } from './features/analytics/QuizLeaderboardPage';
import { CertificatesPage } from './features/certificates/CertificatesPage';
import { VerifyCertificatePage } from './features/certificates/VerifyCertificatePage';
import type { UserRole } from './types';

const INSTRUCTOR_ROLES: UserRole[] = ['INSTRUCTOR', 'ADMIN'];

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.08] text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          <span className="w-2 h-2 rounded-full bg-[#34C759]" />
          <span>Cognify LMS · Intelligent Learning Workspace</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] apple-title-hero leading-[1.08]">
          Master every concept with <span className="text-[#0071E3] dark:text-[#32ADE6]">precision</span> and clarity.
        </h1>

        <p className="text-base sm:text-lg text-[#6E6E73] dark:text-[#98989D] max-w-2xl mx-auto apple-body leading-relaxed">
          Cognify combines structured course curricula with automated AI study tools, real-time analytics, and tamper-proof verification for a seamless learning journey.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {user ? (
            <Link
              to="/dashboard"
              className="apple-btn-primary px-6 py-3 text-sm font-semibold rounded-full gap-2 shadow-md"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="apple-btn-primary px-6 py-3 text-sm font-semibold rounded-full gap-2 shadow-md"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/courses"
            className="apple-btn-secondary px-6 py-3 text-sm font-medium rounded-full"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>

      {/* Feature Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="apple-card p-6 sm:p-8 space-y-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
          <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">Structured Courses</h3>
            <p className="text-sm text-[#86868B] dark:text-[#98989D] leading-relaxed">
              Curated modules, rich lesson notes, and synced video transcripts designed for deep conceptual understanding.
            </p>
          </div>
        </div>

        <div className="apple-card p-6 sm:p-8 space-y-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
          <div className="w-12 h-12 rounded-2xl bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">AI Study Tools</h3>
            <p className="text-sm text-[#86868B] dark:text-[#98989D] leading-relaxed">
              Instant flashcards, concise summaries, and targeted MCQ practices generated on-demand from course content.
            </p>
          </div>
        </div>

        <div className="apple-card p-6 sm:p-8 space-y-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
          <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">Verified Credentials</h3>
            <p className="text-sm text-[#86868B] dark:text-[#98989D] leading-relaxed">
              Real-time progress telemetry, interactive quizzes, and cryptographically verifiable certificates upon completion.
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Platform Highlights */}
      <div className="apple-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white via-[#FAFAFC] to-[#F2F2F7] dark:from-[#1C1C1E] dark:via-[#161618] dark:to-[#111113]">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[#0071E3] dark:text-[#32ADE6]">
            <ShieldCheck className="w-4 h-4" />
            <span>Built For Academic & Industry Rigor</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Ready to elevate your knowledge?
          </h2>
          <p className="text-sm text-[#86868B] dark:text-[#98989D] max-w-xl">
            Join students and educators learning with high-signal video material, automated assessments, and interactive revision workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="apple-btn-primary px-6 py-3 text-sm font-semibold rounded-full shadow-sm"
          >
            Browse Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
};

const instructorOnly = (element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={INSTRUCTOR_ROLES}>{element}</ProtectedRoute>
);
const signedIn = (element: React.ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;
const adminOnly = (element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>{element}</ProtectedRoute>
);

/** Route table. Frontend guards are for usability only; the API enforces every permission. */
export const AppRoutes: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-[#000000]">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />

        {/* Student Experience & Courses Routes */}
        <Route path="/courses" element={<CourseCatalogue />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/courses/:courseId/learn" element={signedIn(<LearningWorkspace />)} />
        <Route path="/courses/:courseId/learn/:lessonId" element={signedIn(<LearningWorkspace />)} />
        <Route path="/dashboard" element={signedIn(<StudentDashboard />)} />

        {/* Instructor Authoring Studio */}
        <Route path="/instructor" element={instructorOnly(<InstructorDashboard />)} />
        <Route path="/instructor/courses/new" element={instructorOnly(<CourseEditor />)} />
        <Route path="/instructor/courses/:id/edit" element={instructorOnly(<CourseEditor />)} />
        <Route path="/instructor/courses/:courseId/quizzes" element={instructorOnly(<QuizBuilder />)} />
        <Route
          path="/instructor/courses/:id/analytics"
          element={instructorOnly(<CourseAnalyticsPage />)}
        />

        {/* Quizzes & AI Study Centre */}
        <Route path="/quizzes/:id" element={signedIn(<QuizPlayer />)} />
        <Route path="/quizzes/:id/results" element={signedIn(<QuizResult />)} />
        <Route path="/quizzes/:id/leaderboard" element={signedIn(<QuizLeaderboardPage />)} />
        <Route path="/study-centre" element={signedIn(<StudyCentrePage />)} />

        {/* Analytics & Profile */}
        <Route path="/analytics" element={signedIn(<StudentAnalyticsView />)} />
        <Route path="/admin/analytics" element={adminOnly(<AdminAnalyticsPage />)} />

        {/* Certificates (verification is public) */}
        <Route path="/certificates" element={signedIn(<CertificatesPage />)} />
        <Route path="/certificates/verify" element={<VerifyCertificatePage />} />
        <Route path="/verify" element={<VerifyCertificatePage />} />
        <Route path="/verify/:code" element={<VerifyCertificatePage />} />
        <Route path="/profile" element={signedIn(<StudentAnalyticsView />)} />

        <Route path="*" element={<NotBuiltYet title="Page not found" owner="unknown route" />} />
      </Routes>
    </main>
  </div>
);

function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
