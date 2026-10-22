import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  BookOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
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

const TRANSCRIPT_SEGMENTS = [
  { time: 2, label: '00:02', text: 'Welcome to Distributed Consensus Protocols. In this lecture, we examine state machine replication.' },
  { time: 7, label: '00:07', text: 'When cluster nodes exchange AppendEntries RPCs, term numbers are strictly verified prior to persistent write commit.' },
  { time: 14, label: '00:14', text: 'Leader election triggers deterministically whenever randomized heartbeat timeouts expire without coordinator acknowledgement.' },
  { time: 20, label: '00:20', text: 'Quorum safety requires a strict majority floor(n/2) + 1 to prevent split-brain partitions across distributed boundaries.' },
];

const InteractiveShowcase: React.FC = () => {
  const [activeMockTab, setActiveMockTab] = useState<'video' | 'transcript' | 'flashcard'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(4.2);
  const [duration, setDuration] = useState(25);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [flashcardMastered, setFlashcardMastered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(true));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find active transcript line
  const activeTranscriptIndex = TRANSCRIPT_SEGMENTS.reduce((activeIdx, seg, idx) => {
    return currentTime >= seg.time ? idx : activeIdx;
  }, 0);

  // Tab indices for sliding track
  const tabIndex = activeMockTab === 'video' ? 0 : activeMockTab === 'transcript' ? 1 : 2;

  return (
    <div className="liquid-glass rounded-3xl p-3 sm:p-5 shadow-[0_24px_70px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.65)] relative z-20">
      {/* macOS Window Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.08] mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 inline-block shadow-2xs" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 inline-block shadow-2xs" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 inline-block shadow-2xs" />
          <span className="ml-2.5 text-xs font-mono text-[#868E96] dark:text-[#A1A1AA]">
            cognify-lms // workspace-v1.0
          </span>
        </div>

        {/* Finder Sliding Segmented Control */}
        <div className="relative inline-flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.08] self-start sm:self-auto">
          {/* Animated Liquid Indicator Pill */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-[#2A2B32] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: 'calc(33.333% - 4px)',
              left: `calc(${tabIndex * 33.333}% + 2px)`,
            }}
          />

          <button
            type="button"
            onClick={() => setActiveMockTab('video')}
            className={`relative z-10 px-3.5 py-1 text-xs font-medium rounded-full transition-colors ${
              activeMockTab === 'video'
                ? 'text-[#0066FF] dark:text-[#38BDF8] font-semibold'
                : 'text-[#868E96] dark:text-[#94A3B8] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
            }`}
          >
            Video Player
          </button>
          <button
            type="button"
            onClick={() => setActiveMockTab('transcript')}
            className={`relative z-10 px-3.5 py-1 text-xs font-medium rounded-full transition-colors ${
              activeMockTab === 'transcript'
                ? 'text-[#0066FF] dark:text-[#38BDF8] font-semibold'
                : 'text-[#868E96] dark:text-[#94A3B8] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
            }`}
          >
            Synced Transcript
          </button>
          <button
            type="button"
            onClick={() => setActiveMockTab('flashcard')}
            className={`relative z-10 px-3.5 py-1 text-xs font-medium rounded-full transition-colors ${
              activeMockTab === 'flashcard'
                ? 'text-[#0066FF] dark:text-[#38BDF8] font-semibold'
                : 'text-[#868E96] dark:text-[#94A3B8] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
            }`}
          >
            Concept Flashcard
          </button>
        </div>
      </div>

      {/* Interactive Workspace Body Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1 sm:p-2 items-start">
        {/* Finder-Style Horizontal Sliding Viewport */}
        <div className="lg:col-span-8 finder-viewport rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 shadow-inner overflow-hidden">
          <div
            className="finder-track"
            style={{
              transform: `translateX(-${tabIndex * 33.333333}%)`,
            }}
          >
            {/* Pane 0: Live Video Player */}
            <div className={`finder-pane ${tabIndex === 0 ? 'finder-pane-active' : 'finder-pane-inactive'}`}>
              <div className="relative aspect-video bg-[#0A0D14] flex flex-col justify-between overflow-hidden text-white rounded-2xl group">
                {/* Real HTML5 Video Stream */}
                <video
                  ref={videoRef}
                  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                  playsInline
                  loop
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration || 25);
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                />

                {/* Video Architectural Canvas & Telemetry Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-[#08090C]/60 pointer-events-none" />

                {/* Top Video Header */}
                <div className="relative z-10 flex items-center justify-between p-4 pointer-events-auto">
                  <span className="px-3 py-1 text-[11px] font-medium rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/90">
                    Module 2 &bull; Lesson 4: Distributed Consensus Protocols
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE TELEMETRY
                    </span>
                  </div>
                </div>

                {/* Central Play/Pause Trigger */}
                <div className="relative z-10 my-auto flex items-center justify-center pointer-events-auto">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/25 backdrop-blur-lg flex items-center justify-center cursor-pointer transition transform hover:scale-108 active:scale-95 shadow-xl border border-white/20"
                    title={isPlaying ? 'Pause Lecture' : 'Play Lecture'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1 fill-white" />
                    )}
                  </button>
                </div>

                {/* Bottom Control Bar & Live Subtitle Pill */}
                <div className="relative z-10 p-4 space-y-2 pointer-events-auto bg-gradient-to-t from-black/80 to-transparent">
                  {/* Active Subtitle Pill */}
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-lg bg-black/60 backdrop-blur-md text-white/95 border border-white/10 shadow-sm max-w-lg truncate">
                      {TRANSCRIPT_SEGMENTS[activeTranscriptIndex]?.text || 'Distributed consensus guarantees consistency across node failure domains.'}
                    </span>
                  </div>

                  {/* Scrubber Progress Bar */}
                  <div
                    className="h-1.5 w-full bg-white/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      seekTo(ratio * duration);
                    }}
                  >
                    <div
                      className="h-full bg-[#0066FF] rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / (duration || 25)) * 100}%` }}
                    />
                  </div>

                  {/* Timecode & Controls Row */}
                  <div className="flex items-center justify-between text-xs font-mono text-white/80 pt-1">
                    <div className="flex items-center gap-3">
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="hover:text-white transition p-1"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-white/60" /> : <Volume2 className="w-4 h-4 text-[#38BDF8]" />}
                      </button>
                    </div>
                    <span className="text-[#38BDF8] text-[11px] font-sans font-medium">
                      Synced with State Machine Telemetry
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pane 1: Synced Transcript */}
            <div className={`finder-pane ${tabIndex === 1 ? 'finder-pane-active' : 'finder-pane-inactive'}`}>
              <div className="aspect-video p-5 sm:p-6 flex flex-col justify-between overflow-y-auto text-left rounded-2xl bg-white/70 dark:bg-[#13151D]/80 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0066FF] dark:text-[#38BDF8]">
                    <FileText className="w-4 h-4" />
                    <span>Synchronized Lecture Transcript &amp; Architecture Notes</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#868E96]">Click timestamp to seek video</span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed overflow-y-auto pr-1">
                  {TRANSCRIPT_SEGMENTS.map((seg, idx) => {
                    const isActive = idx === activeTranscriptIndex;
                    return (
                      <div
                        key={seg.label}
                        onClick={() => seekTo(seg.time)}
                        className={`p-3 rounded-xl transition-all cursor-pointer border flex items-start gap-3 ${
                          isActive
                            ? 'bg-[#0066FF]/10 dark:bg-[#0066FF]/15 border-[#0066FF]/30 text-[#121316] dark:text-white font-medium shadow-2xs'
                            : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-[#6E6E73] dark:text-[#94A3B8]'
                        }`}
                      >
                        <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          isActive ? 'bg-[#0066FF] text-white' : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#868E96]'
                        }`}>
                          {seg.label}
                        </span>
                        <p className="flex-1">{seg.text}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-[11px] text-[#868E96] font-mono flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.06]">
                  <span>Module 2: Raft Consensus Invariants</span>
                  <span className="text-[#0066FF] dark:text-[#38BDF8]">4 timestamps indexed</span>
                </div>
              </div>
            </div>

            {/* Pane 2: Concept Flashcard with 3D Flip */}
            <div className={`finder-pane ${tabIndex === 2 ? 'finder-pane-active' : 'finder-pane-inactive'}`}>
              <div className="aspect-video p-5 sm:p-6 flex flex-col justify-between text-left rounded-2xl bg-white/70 dark:bg-[#13151D]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:text-[#38BDF8] border border-[#0066FF]/20">
                    Syllabus Flashcard &bull; Card 3 of 12
                  </span>
                  <span className="text-[11px] font-mono text-[#868E96]">Click card to flip</span>
                </div>

                {/* 3D Flip Card Container */}
                <div
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="perspective-1000 my-auto cursor-pointer"
                >
                  <div
                    className={`relative w-full min-h-[160px] rounded-2xl p-6 text-center flex flex-col justify-center border transition-transform duration-500 transform-style-3d ${
                      cardFlipped ? 'rotate-y-180 bg-emerald-500/10 border-emerald-500/30' : 'bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.1]'
                    }`}
                  >
                    {!cardFlipped ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#38BDF8]">
                          Core Distributed Invariant
                        </span>
                        <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-[#121316] dark:text-[#F3F4F6]">
                          Split-Brain Partition Prevention
                        </h4>
                        <p className="text-xs text-[#868E96]">Click to reveal mathematical proof &amp; quorum rule</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Consensus Quorum Rule
                        </span>
                        <p className="text-sm sm:text-base font-semibold text-[#121316] dark:text-white leading-relaxed max-w-lg mx-auto font-mono">
                          Q = floor(n / 2) + 1
                        </p>
                        <p className="text-xs text-[#6E6E73] dark:text-[#94A3B8] max-w-md mx-auto">
                          Any two majority quorums must overlap by at least one common server, guaranteeing exactly one valid leader term.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setFlashcardMastered(!flashcardMastered)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                      flashcardMastered
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#868E96] hover:text-[#121316] dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{flashcardMastered ? 'Mastered Concept' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardFlipped(!cardFlipped)}
                    className="text-xs text-[#0066FF] dark:text-[#38BDF8] font-medium flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Flip Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Syllabus Preview Pane */}
        <div className="lg:col-span-4 flex flex-col justify-between liquid-glass-subtle rounded-2xl p-4 sm:p-5 text-left space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#868E96]">
                Course Syllabus
              </span>
              <span className="text-xs font-mono font-bold text-[#0066FF] dark:text-[#38BDF8]">
                75% Completed
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-[#1C1E26] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold text-[#121316] dark:text-[#F3F4F6]">1. Distributed Architecture</span>
                </div>
                <span className="text-[11px] text-[#868E96] font-mono">18m</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/25 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-[#0066FF] fill-[#0066FF] flex-shrink-0" />
                  <span className="font-bold text-[#0066FF] dark:text-[#38BDF8]">2. Consensus Protocols</span>
                </div>
                <span className="text-[11px] text-[#0066FF] dark:text-[#38BDF8] font-mono font-bold">24m</span>
              </div>

              <div className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs opacity-75">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#868E96] flex-shrink-0" />
                  <span className="text-[#6E6E73] dark:text-[#94A3B8]">3. Sharding &amp; Partitioning</span>
                </div>
                <span className="text-[11px] text-[#868E96] font-mono">31m</span>
              </div>
            </div>
          </div>

          {/* Bottom Quick Action Card */}
          <div className="p-3.5 bg-white/90 dark:bg-[#1C1E26]/90 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0066FF] dark:text-[#38BDF8]">
              <Award className="w-4 h-4 text-[#0066FF]" />
              <span>Knowledge Check</span>
            </div>
            <p className="text-[11px] text-[#868E96] leading-relaxed">
              Verify your comprehension with structured assessment questions drawn from this lecture.
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
      {/* Luminous Light Shafts & Stage Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-[#0066FF]/25 via-[#0EA5E9]/15 to-transparent blur-[140px] rounded-full opacity-70 dark:opacity-50"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24 relative z-10 page-transition-enter">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
            <span>Cognify LMS &bull; Institutional Learning Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#121316] dark:text-[#F3F4F6] heading-display leading-[1.05]">
            Master every concept with <span className="text-[#0066FF] dark:text-[#38BDF8]">precision</span> and rigor.
          </h1>

          <p className="text-base sm:text-lg text-[#6E6E73] dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Cognify unifies structured curriculum delivery with synchronized lecture transcripts, interactive assessments, verifiable certificates, and detailed mastery telemetry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-primary px-7 py-3 text-sm font-semibold rounded-full gap-2 shadow-md shadow-[#0066FF]/20"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn-primary px-7 py-3 text-sm font-semibold rounded-full gap-2 shadow-md shadow-[#0066FF]/20"
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
          <div className="lms-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(0,102,255,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center font-bold border border-[#0066FF]/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#121316] dark:text-[#F3F4F6] tracking-tight">Structured Courses</h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#94A3B8] leading-relaxed">
                Curated modules, rich lesson notes, and synchronized lecture transcripts built for methodical, deep comprehension.
              </p>
            </div>
          </div>

          <div className="lms-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(0,102,255,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#121316] dark:text-[#F3F4F6] tracking-tight">Concept Synthesis &amp; Practice</h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#94A3B8] leading-relaxed">
                Topic summaries, flashcard review decks, and targeted MCQ drills indexed directly from lesson transcripts.
              </p>
            </div>
          </div>

          <div className="lms-card p-6 sm:p-8 space-y-4 hover:shadow-[0_16px_40px_rgba(0,102,255,0.08)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#121316] dark:text-[#F3F4F6] tracking-tight">Verifiable Credentials</h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#94A3B8] leading-relaxed">
                Real-time progress telemetry, timed graded assessments, and cryptographically verifiable certificates upon completion.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Rigor Banner */}
        <div className="lms-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-[#13151D] dark:via-[#111319] dark:to-[#0D0F14] text-left">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#38BDF8]">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Academic Platform</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#121316] dark:text-[#F3F4F6]">
              Engineered for authentic mastery.
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#94A3B8] max-w-xl">
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
