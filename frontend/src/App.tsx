import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  Sparkles,
  BookOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  Play,
  CheckCircle,
  FileText,
} from 'lucide-react';
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
  const [activeMockTab, setActiveMockTab] = useState<'video' | 'transcript' | 'flashcard'>('video');

  return (
    <div className="relative overflow-hidden">
      {/* Apple Subtle Radial Ambient Light Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-[#0071E3]/20 via-[#5856D6]/15 to-transparent blur-[120px] rounded-full opacity-60 dark:opacity-40"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            <span>Cognify LMS · Intelligent Learning Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] apple-title-hero leading-[1.05]">
            Master every concept with <span className="text-[#0071E3] dark:text-[#32ADE6]">precision</span> and clarity.
          </h1>

          <p className="text-base sm:text-lg text-[#6E6E73] dark:text-[#98989D] max-w-2xl mx-auto apple-body leading-relaxed">
            Cognify integrates structured course curricula with automated AI study summaries, interactive quizzes, real-time telemetry, and verifiable credentials.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {user ? (
              <Link
                to="/dashboard"
                className="apple-btn-primary px-7 py-3 text-sm font-semibold rounded-full gap-2 shadow-md shadow-[#0071E3]/25"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="apple-btn-primary px-7 py-3 text-sm font-semibold rounded-full gap-2 shadow-md shadow-[#0071E3]/25"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/courses"
              className="apple-btn-secondary px-7 py-3 text-sm font-medium rounded-full"
            >
              Explore Catalogue
            </Link>
          </div>
        </div>

        {/* Interactive Apple-Grade LMS Showcase Preview */}
        <div className="apple-card p-3 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl rounded-3xl">
          {/* macOS Window Title Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/[0.05] dark:border-white/[0.07] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 inline-block" />
              <span className="ml-3 text-xs font-mono text-[#86868B]">cognify-lms // workspace-v1.0</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-full">
              <button
                onClick={() => setActiveMockTab('video')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  activeMockTab === 'video'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#32ADE6] shadow-xs'
                    : 'text-[#86868B]'
                }`}
              >
                Video Player
              </button>
              <button
                onClick={() => setActiveMockTab('transcript')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  activeMockTab === 'transcript'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#32ADE6] shadow-xs'
                    : 'text-[#86868B]'
                }`}
              >
                Synced Transcript
              </button>
              <button
                onClick={() => setActiveMockTab('flashcard')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  activeMockTab === 'flashcard'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#AF52DE] shadow-xs'
                    : 'text-[#86868B]'
                }`}
              >
                AI Study Flashcard
              </button>
            </div>
          </div>

          {/* Interactive Workspace Body Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-2">
            {/* Main Content Pane */}
            <div className="lg:col-span-8 space-y-4">
              {activeMockTab === 'video' && (
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-[#0F172A] to-[#1E293B] aspect-video flex flex-col justify-between p-6 shadow-inner border border-white/10 text-white">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/10 backdrop-blur-md">
                      Module 2 · Lesson 4: Distributed Consensus Protocols
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30">
                      LIVE TELEMETRY
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95 shadow-lg">
                      <Play className="w-6 h-6 text-white ml-1 fill-white" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-white/70">
                      <span>14:28 / 24:10</span>
                      <span className="text-[#32ADE6]">Auto-sync with Raft State Diagrams</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#0071E3] to-[#32ADE6] w-3/5 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {activeMockTab === 'transcript' && (
                <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] p-6 aspect-video flex flex-col justify-between overflow-y-auto space-y-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0071E3] dark:text-[#32ADE6]">
                    <FileText className="w-4 h-4" />
                    <span>Synchronized Audio Transcript & Lecture Notes</span>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">
                    <p className="bg-[#0071E3]/10 p-2 rounded-lg border-l-2 border-[#0071E3]">
                      <span className="font-mono text-[11px] text-[#0071E3] font-semibold mr-2">[14:28]</span>
                      "When nodes in a cluster receive an AppendEntries RPC, they verify the term number against their local state before committing to disk."
                    </p>
                    <p className="opacity-70 p-2">
                      <span className="font-mono text-[11px] text-[#86868B] mr-2">[15:02]</span>
                      "Leader election triggers whenever heartbeat timeouts expire without acknowledgement from the existing coordinator."
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] text-[#86868B]">
                    Click any timestamp to seek video playback directly.
                  </div>
                </div>
              )}

              {activeMockTab === 'flashcard' && (
                <div className="rounded-2xl bg-gradient-to-br from-[#AF52DE]/10 via-black/[0.02] to-[#5856D6]/10 border border-[#AF52DE]/20 p-6 aspect-video flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#AF52DE]/20 text-[#8944AB] dark:text-[#BF5AF2]">
                      AI Study Card · 3 of 12
                    </span>
                    <span className="text-xs text-[#86868B]">Auto-generated by Claude / Gemini</span>
                  </div>
                  <div className="my-auto space-y-2 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">Key Concept</span>
                    <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Split-Brain Prevention
                    </h4>
                    <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#98989D] max-w-md mx-auto">
                      "Requires a strict majority quorum $Q = \lfloor n/2 \rfloor + 1$ ensuring only one partition can ever commit write transactions."
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 px-3 py-1 rounded-full">
                      Marked Mastered
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Syllabus Preview Pane */}
            <div className="lg:col-span-4 flex flex-col justify-between bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] rounded-2xl p-4 text-left space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">Course Syllabus</span>
                  <span className="text-xs font-mono font-semibold text-[#0071E3] dark:text-[#32ADE6]">75% Completed</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#34C759]" />
                      <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">1. Distributed Architecture</span>
                    </div>
                    <span className="text-[10px] text-[#86868B] font-mono">18m</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0071E3]/10 border border-[#0071E3]/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-[#0071E3] fill-[#0071E3]" />
                      <span className="font-semibold text-[#0071E3] dark:text-[#32ADE6]">2. Consensus Protocols</span>
                    </div>
                    <span className="text-[10px] text-[#0071E3] font-mono">24m</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs opacity-75">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#86868B]" />
                      <span className="text-[#6E6E73] dark:text-[#98989D]">3. Sharding & Partitioning</span>
                    </div>
                    <span className="text-[10px] text-[#86868B] font-mono">31m</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action Card */}
              <div className="p-3 bg-white dark:bg-[#2C2C2E] rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#AF52DE]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Knowledge Check</span>
                </div>
                <p className="text-[11px] text-[#86868B]">
                  Test your comprehension with 5 rapid questions generated from this lesson.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="apple-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition-all duration-200 text-left">
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

          <div className="apple-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition-all duration-200 text-left">
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

          <div className="apple-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition-all duration-200 text-left">
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
        <div className="apple-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white via-[#FAFAFC] to-[#F2F2F7] dark:from-[#1C1C1E] dark:via-[#161618] dark:to-[#111113] text-left">
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
