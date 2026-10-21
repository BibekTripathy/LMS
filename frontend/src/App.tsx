import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Award, BarChart3, ClipboardCheck, PlayCircle, Sparkles } from 'lucide-react';
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

const HOME_FEATURES = [
  { icon: PlayCircle, title: 'Learn at your pace', text: 'Video lessons, transcripts and reading material that remember where you stopped.' },
  { icon: ClipboardCheck, title: 'Graded quizzes', text: 'Timed assessments marked on the server, with explanations after you submit.' },
  { icon: Sparkles, title: 'AI study tools', text: 'Instructor-reviewed flashcards, summaries and a revision plan built from your results.' },
  { icon: BarChart3, title: 'Track progress', text: 'See completion, quiz scores and recent activity for every course.' },
  { icon: Award, title: 'Verifiable certificates', text: 'Finish a course to earn a certificate anyone can verify with its code.' },
];

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
        AI-Powered Next-Gen LMS
      </div>
      <h1 className="max-w-4xl mx-auto text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Master New Skills with Interactive Courses & AI Study Tools
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Learn with structured curriculum modules, track your video progress automatically, test your understanding with assessments, and reinforce knowledge with AI flashcards and summaries.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {user ? (
          <Link
            to={user.role === 'STUDENT' ? '/dashboard' : '/instructor'}
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            {user.role === 'STUDENT' ? 'Go to My Learning Hub' : 'Go to Instructor Studio'}
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            Get Started
          </Link>
        )}
        <Link
          to="/courses"
          className="inline-block px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm rounded-xl shadow-sm transition"
        >
          Explore Course Catalogue
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-10 text-left">
        {HOME_FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
          >
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{text}</p>
          </div>
        ))}
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
