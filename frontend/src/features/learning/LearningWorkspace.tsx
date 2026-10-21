import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  AlignLeft,
  FileText,
  Sparkles,
  Menu,
  X,
  AlertCircle,
  Award,
} from 'lucide-react';

import {
  useCourseDetail,
  useCourseProgress,
  useLesson,
  useLessonProgress,
} from './hooks';
import { VideoPlayer } from './VideoPlayer';
import { LessonSidebar } from './LessonSidebar';
import { CourseQuizList } from '../quizzes/CourseQuizList';
import { LessonNavigation } from './LessonNavigation';
import { LessonCompletionButton } from './LessonCompletionButton';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { getErrorMessage, getErrorCode } from '../../lib/errors';
import type { LessonSummary } from '../../types';

export const LearningWorkspace: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reading' | 'transcript' | 'overview'>('reading');

  const courseQuery = useCourseDetail(courseId);
  const courseProgressQuery = useCourseProgress(courseId);

  const course = courseQuery.data;
  const courseProgress = courseProgressQuery.data;

  // Flatten lessons from course modules into an ordered sequence
  const allLessons = useMemo(() => {
    if (!course?.modules) return [];
    const sortedModules = [...course.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    const flat: (LessonSummary & { moduleTitle: string })[] = [];
    sortedModules.forEach((m) => {
      const sortedLessons = [...(m.lessons || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedLessons.forEach((l) => {
        flat.push({ ...l, moduleTitle: m.title });
      });
    });
    return flat;
  }, [course]);

  // Determine current active lesson ID
  const activeLessonId = useMemo(() => {
    if (lessonId) return lessonId;
    // Fallback to last_accessed_lesson_id or the very first lesson
    if (courseProgress?.last_accessed_lesson_id) {
      return courseProgress.last_accessed_lesson_id;
    }
    if (allLessons.length > 0) {
      return allLessons[0].id;
    }
    return undefined;
  }, [lessonId, courseProgress, allLessons]);

  // Sync route URL if no lessonId was in URL
  useEffect(() => {
    if (!lessonId && activeLessonId && courseId) {
      navigate(`/courses/${courseId}/learn/${activeLessonId}`, { replace: true });
    }
  }, [lessonId, activeLessonId, courseId, navigate]);

  // Query current lesson details and its saved progress
  const lessonQuery = useLesson(activeLessonId);
  const lessonProgressQuery = useLessonProgress(activeLessonId);

  const lesson = lessonQuery.data;
  const lessonProgress = lessonProgressQuery.data;

  // Find previous and next lessons
  const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Determine lesson completion status
  const isLessonCompleted = useMemo(() => {
    if (lessonProgress?.completed || lessonProgress?.is_completed) return true;
    if (courseProgress?.lessons) {
      const p = courseProgress.lessons.find((l) => l.lesson_id === activeLessonId);
      if (p?.completed) return true;
    }
    return false;
  }, [lessonProgress, courseProgress, activeLessonId]);

  // Handle errors
  const courseError = courseQuery.error
    ? getErrorMessage(courseQuery.error, 'Failed to load course information.')
    : null;
  const lessonError = lessonQuery.error
    ? getErrorMessage(lessonQuery.error, 'Failed to load lesson content.')
    : null;

  // Check 403 / un-enrolled error
  const isUnauthorized =
    getErrorCode(courseQuery.error) === '403' ||
    getErrorCode(lessonQuery.error) === '403';

  if (isUnauthorized) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Enrollment Required</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You must have an active enrollment in this course to access lessons, stream videos, and track your progress.
        </p>
        <Link
          to={`/courses/${courseId}`}
          className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition"
        >
          View Course & Enroll
        </Link>
      </div>
    );
  }

  if (courseQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="hidden md:block w-80 p-4 border-r border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Could Not Open Workspace"
          message={courseError || 'Course not found.'}
          onRetry={() => courseQuery.refetch()}
        />
      </div>
    );
  }

  const sidebarFooter = (
    <div className="space-y-4">
      {courseProgress?.is_completed && (
        <Link
          to="/certificates"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
        >
          <Award className="w-4 h-4" /> Course complete: claim your certificate
        </Link>
      )}
      <CourseQuizList courseId={course.id} compact />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile Sidebar Backdrop & Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 w-80 max-w-[85%] bg-white dark:bg-slate-900 h-full shadow-2xl">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Curriculum Modules</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <LessonSidebar
              course={course}
              currentLessonId={activeLessonId}
              courseProgress={courseProgress}
              onSelectLesson={(id) => {
                navigate(`/courses/${course.id}/learn/${id}`);
                setSidebarOpen(false);
              }}
              className="h-[calc(100%-49px)] border-r-0"
              footer={sidebarFooter}
            />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block">
        <LessonSidebar
          course={course}
          currentLessonId={activeLessonId}
          courseProgress={courseProgress}
          onSelectLesson={(id) => navigate(`/courses/${course.id}/learn/${id}`)}
          footer={sidebarFooter}
        />
      </div>

      {/* Main Workspace Stage */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Control Bar for Mobile / Quick Navigation */}
        <div className="md:hidden p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <Menu className="w-4 h-4" />
            Curriculum
          </button>
          <span className="text-xs font-bold text-slate-500">
            {courseProgress?.progress_percentage ?? 0}% completed
          </span>
        </div>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
          {lessonQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="w-full aspect-video rounded-2xl" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : lessonError || !lesson ? (
            <ErrorState
              title="Lesson Failed to Load"
              message={lessonError || 'This lesson could not be found.'}
              onRetry={() => lessonQuery.refetch()}
            />
          ) : (
            <>
              {/* Video Player */}
              <VideoPlayer
                lessonId={lesson.id}
                courseId={course.id}
                videoUrl={lesson.video_url}
                initialPositionSeconds={lessonProgress?.last_position_seconds ?? lessonProgress?.timestamp ?? 0}
                onPositionUpdate={() => {
                  // Optional callback
                }}
              />

              {/* Lesson Title & Completion Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {lesson.title}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Part of {allLessons.find((l) => l.id === lesson.id)?.moduleTitle || 'Curriculum'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <LessonCompletionButton
                    lessonId={lesson.id}
                    courseId={course.id}
                    isCompleted={isLessonCompleted}
                    onCompleted={() => {
                      lessonProgressQuery.refetch();
                      courseProgressQuery.refetch();
                    }}
                  />
                </div>
              </div>

              {/* Tabs for Reading Content & Transcript */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('reading')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                      activeTab === 'reading'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Reading Material
                  </button>

                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                      activeTab === 'transcript'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    Transcript
                  </button>

                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                      activeTab === 'overview'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Overview & Notes
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 min-h-[220px] shadow-sm">
                  {activeTab === 'reading' && (
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {lesson.reading_content || lesson.content ? (
                        lesson.reading_content || lesson.content
                      ) : (
                        <p className="text-slate-400 italic">No reading material provided for this lesson.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'transcript' && (
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs">
                      {lesson.transcript ? (
                        lesson.transcript
                      ) : (
                        <p className="text-slate-400 italic font-sans text-sm">
                          No audio/video transcript available for this lesson.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'overview' && (
                    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Lesson Summary</h4>
                        <p className="mt-1">
                          {lesson.content || 'Study the lecture video and attached reading material.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <Link
                          to="/study-centre"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          Generate AI Practice Flashcards
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Lesson Navigation */}
              <LessonNavigation
                previousLesson={previousLesson}
                nextLesson={nextLesson}
                onNavigate={(nextId) => navigate(`/courses/${course.id}/learn/${nextId}`)}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

