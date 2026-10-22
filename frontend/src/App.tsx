import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  BookOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  RotateCcw,
  Compass,
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

const LECTURE_NOTES = [
  {
    topic: 'State Machine Replication Invariant',
    text: 'Every consensus node executes identical state transitions deterministically. When commands are committed to the replicated log, replicas process state changes in matching ordinal sequence.',
    badge: 'Core Axiom',
    tag: 'Determinism',
  },
  {
    topic: 'AppendEntries RPC & Term Verification',
    text: 'Replicas reject AppendEntries requests if leader term < currentTerm. If the follower log does not contain an entry matching prevLogIndex and prevLogTerm, it rejects to force log harmonization.',
    badge: 'Safety Rule',
    tag: 'Log Consistency',
  },
  {
    topic: 'Leader Election Determinism',
    text: 'Nodes transit from Follower to Candidate when randomized election timers elapse (150ms–300ms) without coordinator heartbeats, voting for at most one candidate per term on a first-come basis.',
    badge: 'Liveness Rule',
    tag: 'Election Safety',
  },
];

const InteractiveShowcase: React.FC = () => {
  const [activeMockTab, setActiveMockTab] = useState<'notes' | 'flashcard' | 'assessment'>('notes');
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [flashcardMastered, setFlashcardMastered] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  const tabIndex = activeMockTab === 'notes' ? 0 : activeMockTab === 'flashcard' ? 1 : 2;

  return (
    <div className="liquid-glass rounded-3xl p-3 sm:p-5 shadow-[0_24px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.5)] relative z-20">
      {/* macOS Window Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.08] mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 inline-block shadow-2xs" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 inline-block shadow-2xs" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 inline-block shadow-2xs" />
          <span className="ml-2.5 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
            cognify-lms // workspace-v1.0
          </span>
        </div>

        {/* Translucent Finder Shifter Segmented Control */}
        <div className="relative grid grid-cols-3 p-1 rounded-full shifter-track w-full sm:w-[460px] self-start sm:self-auto">
          {/* Animated Translucent Indicator Pill */}
          <div
            className="absolute top-1 bottom-1 rounded-full shifter-pill transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
            style={{
              width: 'calc((100% - 8px) / 3)',
              left: '4px',
              transform: `translateX(${tabIndex * 100}%)`,
            }}
          />

          <button
            type="button"
            onClick={() => setActiveMockTab('notes')}
            className={`relative z-10 py-1.5 px-2 text-xs font-medium rounded-full text-center transition-colors truncate ${
              activeMockTab === 'notes'
                ? 'text-teal-700 dark:text-teal-300 font-semibold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Lecture Reader
          </button>
          <button
            type="button"
            onClick={() => setActiveMockTab('flashcard')}
            className={`relative z-10 py-1.5 px-2 text-xs font-medium rounded-full text-center transition-colors truncate ${
              activeMockTab === 'flashcard'
                ? 'text-orange-700 dark:text-orange-400 font-semibold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Concept Flashcard
          </button>
          <button
            type="button"
            onClick={() => setActiveMockTab('assessment')}
            className={`relative z-10 py-1.5 px-2 text-xs font-medium rounded-full text-center transition-colors truncate ${
              activeMockTab === 'assessment'
                ? 'text-teal-700 dark:text-teal-300 font-semibold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Knowledge Check
          </button>
        </div>
      </div>

      {/* Interactive Workspace Body Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1 sm:p-2 items-start">
        {/* Finder-Style Horizontal Sliding Viewport */}
        <div className="lg:col-span-8 finder-viewport rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-black/30 shadow-inner overflow-hidden min-h-[360px]">
          <div
            className="finder-track"
            style={{
              transform: `translateX(-${tabIndex * 33.333333}%)`,
            }}
          >
            {/* Pane 0: Lecture Reader */}
            <div className={`finder-pane ${tabIndex === 0 ? 'finder-pane-active' : 'finder-pane-inactive'}`}>
              <div className="p-5 sm:p-6 flex flex-col justify-between text-left rounded-2xl bg-white/70 dark:bg-[#111622]/80 backdrop-blur-xl space-y-4 min-h-[360px]">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                      Module 2 &bull; Distributed Consensus &amp; Raft Invariants
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                    5 min read &bull; Verified Academic Notes
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                  {LECTURE_NOTES.map((note, idx) => {
                    const isSelected = idx === selectedNoteIndex;
                    return (
                      <div
                        key={note.topic}
                        onClick={() => setSelectedNoteIndex(idx)}
                        className={`p-3.5 rounded-xl transition-all cursor-pointer border text-left ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/30 text-[#0F172A] dark:text-white shadow-2xs'
                            : 'border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] text-[#64748B] dark:text-[#94A3B8]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                            {note.topic}
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-teal-600 text-white font-semibold'
                              : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#64748B] dark:text-[#94A3B8]'
                          }`}>
                            {note.badge}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          {note.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.06]">
                  <span>Syllabus Chapter 2.4</span>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">Deterministic State Machines</span>
                </div>
              </div>
            </div>

            {/* Pane 1: Concept Flashcard with 3D Flip */}
            <div className={`finder-pane ${tabIndex === 1 ? 'finder-pane-active' : 'finder-pane-inactive'}`}>
              <div className="p-5 sm:p-6 flex flex-col justify-between text-left rounded-2xl bg-white/70 dark:bg-[#111622]/80 backdrop-blur-xl min-h-[360px]">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20">
                    Active Recall Flashcard &bull; Card 3 of 12
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">Click card to flip</span>
                </div>

                {/* 3D Flip Card Container */}
                <div
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="perspective-1000 my-auto cursor-pointer"
                >
                  <div
                    className={`relative w-full min-h-[170px] rounded-2xl p-6 text-center flex flex-col justify-center border transition-transform duration-500 transform-style-3d ${
                      cardFlipped
                        ? 'rotate-y-180 bg-orange-500/10 border-orange-500/30'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08]'
                    }`}
                  >
                    {!cardFlipped ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          Core Invariant Rule
                        </span>
                        <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                          Split-Brain Partition Prevention
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          Click to reveal mathematical proof &amp; quorum rule
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          Quorum Overlap Theorem
                        </span>
                        <p className="text-sm sm:text-base font-semibold text-[#0F172A] dark:text-white leading-relaxed max-w-lg mx-auto font-mono">
                          Q = floor(n / 2) + 1
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
                          Any two majority quorums must overlap by at least one server, guaranteeing at most one legitimate leader per term.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setFlashcardMastered(!flashcardMastered)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      flashcardMastered
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{flashcardMastered ? 'Mastered Concept' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardFlipped(!cardFlipped)}
                    className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Flip Card
                  </button>
                </div>
              </div>
            </div>

            {/* Pane 2: Knowledge Check (Assessment Drill) */}
            <div className={`finder-pane ${tabIndex === 2 ? 'finder-pane-active' : 'finder-pane-inactive'}`}>
              <div className="p-5 sm:p-6 flex flex-col justify-between text-left rounded-2xl bg-white/70 dark:bg-[#111622]/80 backdrop-blur-xl min-h-[360px] space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    Practice Drill &bull; Question 1 of 5
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">Untimed Self-Assessment</span>
                </div>

                <div className="space-y-3 my-auto">
                  <h4 className="text-sm sm:text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    In a cluster of 5 nodes running Raft, what is the maximum number of simultaneous node failures tolerated while preserving consensus safety and liveness?
                  </h4>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {[
                      { index: 0, label: 'A', text: '1 node', correct: false },
                      { index: 1, label: 'B', text: '2 nodes (Majority Quorum = 3 nodes remain)', correct: true },
                      { index: 2, label: 'C', text: '3 nodes', correct: false },
                    ].map((opt) => {
                      const isSelected = selectedQuizOption === opt.index;
                      let optionClasses = 'border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] text-[#0F172A] dark:text-[#F8FAFC]';
                      if (isSelected) {
                        if (opt.correct) {
                          optionClasses = 'border-teal-500 bg-teal-500/10 text-teal-800 dark:text-teal-200 font-medium';
                        } else {
                          optionClasses = 'border-orange-500 bg-orange-500/10 text-orange-800 dark:text-orange-200 font-medium';
                        }
                      }
                      return (
                        <button
                          key={opt.index}
                          type="button"
                          onClick={() => setSelectedQuizOption(opt.index)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center gap-3 ${optionClasses}`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            isSelected && opt.correct
                              ? 'bg-teal-600 text-white'
                              : isSelected && !opt.correct
                              ? 'bg-orange-600 text-white'
                              : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#64748B]'
                          }`}>
                            {opt.label}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedQuizOption !== null && (
                    <div className={`p-2.5 rounded-xl text-xs ${
                      selectedQuizOption === 1
                        ? 'bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200'
                        : 'bg-orange-500/10 border border-orange-500/30 text-orange-800 dark:text-orange-200'
                    }`}>
                      {selectedQuizOption === 1 ? (
                        <span>Correct. A 5-node cluster requires floor(5/2) + 1 = 3 nodes for quorum; thus at most 2 nodes can fail.</span>
                      ) : (
                        <span>Incorrect. A strict majority requires 3 nodes to agree, so losing more than 2 nodes breaks availability.</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setSelectedQuizOption(null)}
                    className="text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition"
                  >
                    Reset Drill
                  </button>
                  <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                    Instant Graded Telemetry
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Syllabus Preview Pane */}
        <div className="lg:col-span-4 flex flex-col justify-between liquid-glass-subtle rounded-2xl p-4 sm:p-5 text-left space-y-4 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Course Syllabus
              </span>
              <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                75% Complete
              </span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="h-1.5 w-full bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-teal-500 to-orange-500 rounded-full w-3/4" />
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-[#141926] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">1. Distributed Architecture</span>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono">18m</span>
              </div>

              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <span className="font-bold text-teal-700 dark:text-teal-300">2. Consensus Protocols</span>
                </div>
                <span className="text-[11px] text-teal-700 dark:text-teal-300 font-mono font-bold">24m</span>
              </div>

              <div className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs opacity-75">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                  <span className="text-[#64748B] dark:text-[#94A3B8]">3. Sharding &amp; Partitioning</span>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono">31m</span>
              </div>
            </div>
          </div>

          {/* Bottom Quick Action Card */}
          <div className="p-3.5 bg-white/90 dark:bg-[#141926]/90 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
              <Award className="w-4 h-4 text-orange-500" />
              <span>Academic Mastery Telemetry</span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Verify your comprehension with structured assessment questions and active recall flashcards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="landing-ambient-canvas min-h-screen relative overflow-hidden">
      {/* Luminous Light Shafts & Stage Spotlight with Teal & Orange Mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-teal-500/20 via-orange-500/10 to-transparent blur-[140px] rounded-full opacity-70 dark:opacity-50"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24 relative z-10 page-transition-enter">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Cognify LMS &bull; Academic Learning Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] heading-display leading-[1.05]">
            Master every concept with <span className="text-teal-600 dark:text-teal-400">precision</span> and <span className="text-orange-600 dark:text-orange-400">rigor</span>.
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Cognify unifies structured curriculum delivery with synchronized lecture transcripts, interactive assessments, verifiable certificates, and detailed mastery telemetry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-primary px-7 py-3 text-sm font-semibold rounded-full gap-2 shadow-md shadow-teal-600/20"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn-primary px-7 py-3 text-sm font-semibold rounded-full gap-2 shadow-md shadow-teal-600/20"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/courses"
              className="btn-secondary px-7 py-3 text-sm font-medium rounded-full shadow-2xs"
            >
              Explore Catalogue
            </Link>
          </div>
        </div>

        {/* Interactive Showcase Preview */}
        <InteractiveShowcase />

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="lms-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(13,148,136,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Structured Courses</h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Curated modules, rich lesson notes, and synchronized lecture transcripts built for methodical, deep comprehension.
              </p>
            </div>
          </div>

          <div className="lms-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(249,115,22,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Concept Synthesis &amp; Practice</h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Topic summaries, flashcard review decks, and targeted MCQ drills indexed directly from lesson transcripts.
              </p>
            </div>
          </div>

          <div className="lms-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(13,148,136,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Verifiable Credentials</h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Real-time progress telemetry, timed graded assessments, and cryptographically verifiable certificates upon completion.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Rigor Banner */}
        <div className="lms-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-[#111622] dark:via-[#0F131D] dark:to-[#0B0E15] text-left">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Academic Platform</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Engineered for authentic mastery.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-xl">
              Equipping learners and educators with structured curriculum management, robust assessment engines, and verified milestone tracking.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/courses"
              className="btn-primary px-6 py-3 text-sm font-semibold rounded-full shadow-sm"
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
  <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#08090C] transition-colors duration-200">
    <Navbar />
    <main className="flex-1 page-transition-enter">
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

        {/* Quizzes & Study Centre */}
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
