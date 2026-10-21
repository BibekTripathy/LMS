import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  AlignLeft,
  FileText,
  Sparkles,
  Menu,
  X,
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
    ? getErrorMessage(courseQuery.error, 'Failed to load course details.')
    : null;
  const lessonError = lessonQuery.error
    ? getErrorMessage(lessonQuery.error, 'Failed to load lesson.')
    : null;

  // Check enrollment permissions
  const isEnrollmentError =
    getErrorCode(courseQuery.error) === 'ENROLLMENT_REQUIRED' ||
    getErrorCode(lessonQuery.error) === 'ENROLLMENT_REQUIRED';

  if (isEnrollmentError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ErrorState
          title="Enrollment Required"
          message="You must be actively enrolled in this course to access its learning workspace."
        />
        <div>
          <Link
            to={courseId ? `/courses/${courseId}` : '/courses'}
            className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-full"
          >
            Go to Course Page to Enroll
          </Link>
        </div>
      </div>
    );
  }

  if (courseQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="hidden md:block w-80 lg:w-96 border-r border-black/[0.08] dark:border-white/[0.08] p-4 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState
          title="Course Not Found"
          message={courseError || 'Could not find this course.'}
          onRetry={() => courseQuery.refetch()}
        />
      </div>
    );
  }

  const sidebarFooter = (
    <div className="space-y-3">
      {courseProgress?.is_completed && (
        <Link
          to="/certificates"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#059669]/10 text-[#059669] border border-[#059669]/20"
        >
          View Course Certificate
        </Link>
      )}
      <CourseQuizList courseId={course.id} compact />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#FBFBFC] dark:bg-[#0A0B0D]">
      {/* Mobile Sidebar Backdrop & Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 w-80 max-w-[85%] bg-white dark:bg-[#131418] h-full shadow-2xl">
            <div className="p-3 border-b border-black/[0.08] dark:border-white/[0.08] flex justify-between items-center">
              <span className="text-xs font-bold text-[#868E96] uppercase font-mono">Curriculum Modules</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-[#868E96] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg"
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
        <div className="md:hidden p-3 bg-white dark:bg-[#131418] border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Menu className="w-4 h-4" />
            Curriculum
          </button>
          <span className="text-xs font-mono font-semibold text-[#868E96]">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#121316] dark:text-[#F3F4F6] tracking-tight">
                    {lesson.title}
                  </h1>
                  <p className="text-xs text-[#868E96]">
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
                <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <button
                    onClick={() => setActiveTab('reading')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                      activeTab === 'reading'
                        ? 'border-[#0066FF] text-[#0066FF]'
                        : 'border-transparent text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Reading Material
                  </button>

                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                      activeTab === 'transcript'
                        ? 'border-[#0066FF] text-[#0066FF]'
                        : 'border-transparent text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    Transcript
                  </button>

                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                      activeTab === 'overview'
                        ? 'border-[#0066FF] text-[#0066FF]'
                        : 'border-transparent text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Overview &amp; Notes
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="lms-card p-6 min-h-[220px]">
                  {activeTab === 'reading' && (
                    <div className="text-sm leading-relaxed text-[#121316] dark:text-[#F3F4F6] whitespace-pre-line">
                      {lesson.reading_content || lesson.content ? (
                        lesson.reading_content || lesson.content
                      ) : (
                        <p className="text-[#868E96] italic text-xs">No reading material provided for this lesson.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'transcript' && (
                    <div className="text-xs leading-relaxed text-[#121316] dark:text-[#F3F4F6] whitespace-pre-line bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.06] font-mono">
                      {lesson.transcript ? (
                        lesson.transcript
                      ) : (
                        <p className="text-[#868E96] italic font-sans text-xs">
                          No audio/video transcript available for this lesson.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'overview' && (
                    <div className="space-y-4 text-xs text-[#64666E] dark:text-[#94969E]">
                      <div>
                        <h4 className="font-bold text-[#121316] dark:text-[#F3F4F6] text-sm">Lesson Summary</h4>
                        <p className="mt-1 leading-relaxed">
                          {lesson.content || 'Study the lecture video and attached reading material.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                        <Link
                          to="/study-centre"
                          className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 inline-flex"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                          Open AI Study Tools
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
