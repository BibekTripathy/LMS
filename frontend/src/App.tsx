import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
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
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Decorative notebook header */}
      <div className="relative inline-block">
        <span className="font-notebook text-6xl sm:text-7xl font-bold text-latte-blue dark:text-frappe-lavender drop-shadow-sm">
          NoteBox
        </span>
        <span className="absolute -top-2 -right-6 text-2xl rotate-12">📓</span>
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-latte-surface0 dark:bg-frappe-surface0 text-latte-subtext1 dark:text-frappe-subtext1 text-xs font-semibold border border-latte-surface1 dark:border-frappe-surface1">
        📝 Your interactive learning notebook
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-latte-text dark:text-frappe-text tracking-tight leading-snug">
        Learn smarter with structured courses,<br />
        <span className="text-latte-blue dark:text-frappe-blue">AI study tools</span> &amp; sticky-note simplicity

      </h1>
      <p className="text-base text-latte-subtext1 dark:text-frappe-subtext1 max-w-2xl mx-auto leading-relaxed">
        NoteBox turns complex topics into bite-sized lessons. Track your progress, quiz yourself with AI, and keep your learning organised — just like your favourite notebook.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {user ? (
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-frappe-blue hover:bg-frappe-sapphire text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            Open My Notebook
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-frappe-blue hover:bg-frappe-sapphire text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            Get Started — It&apos;s Free
          </Link>
        )}
        <Link
          to="/courses"
          className="inline-block px-6 py-3 bg-latte-surface0 dark:bg-frappe-surface0 hover:bg-latte-surface1 dark:hover:bg-frappe-surface1 text-latte-text dark:text-frappe-text border border-latte-surface1 dark:border-frappe-surface1 font-bold text-sm rounded-xl shadow-sm transition"
        >
          Browse Courses
        </Link>
      </div>

      {/* Sticky note feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
        <div className="sticky-yellow rounded-xl p-5 shadow-sm rotate-[-0.5deg]">
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-notebook text-lg font-bold text-latte-text">Structured Courses</h3>
          <p className="text-sm text-latte-subtext1 mt-1">Organised modules and lessons to keep your learning on track.</p>
        </div>
        <div className="sticky-blue rounded-xl p-5 shadow-sm rotate-[0.3deg]">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-notebook text-lg font-bold text-latte-text dark:text-frappe-text">AI Study Tools</h3>
          <p className="text-sm text-latte-subtext1 dark:text-frappe-subtext1 mt-1">Flashcards, summaries and MCQ quizzes generated just for you.</p>
        </div>
        <div className="sticky-green rounded-xl p-5 shadow-sm rotate-[-0.2deg]">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-notebook text-lg font-bold text-latte-text">Track Progress</h3>
          <p className="text-sm text-latte-subtext1 mt-1">Visual analytics to see how far you&apos;ve come — and what&apos;s next.</p>
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
  <div className="min-h-screen flex flex-col">
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
