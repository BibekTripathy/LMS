import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  ChevronDown,
  ChevronRight,
  Clock,
  User as UserIcon,
  PlayCircle,
  FileText,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { useCourseDetail, useMyEnrollments } from './hooks';
import { useCourseProgress } from '../enrollments/hooks';
import { CourseQuizList } from '../quizzes/CourseQuizList';
import { EnrollmentButton } from './EnrollmentButton';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { getErrorMessage } from '../../lib/errors';
import { useAuth } from '../../context/auth';

export const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const courseQuery = useCourseDetail(id);
  const enrollmentsQuery = useMyEnrollments();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const course = courseQuery.data;
  const isLoading = courseQuery.isLoading;
  const error = courseQuery.error
    ? getErrorMessage(courseQuery.error, 'Failed to load course details.')
    : null;

  // Check enrollment from active enrollments or course flag
  const isEnrolled = React.useMemo(() => {
    if (!user) return false;
    if (course?.is_enrolled) return true;
    if (enrollmentsQuery.data && id) {
      return enrollmentsQuery.data.some(
        (e) => (e.course === id || (e.course_detail && e.course_detail.id === id)) && e.status === 'ACTIVE'
      );
    }
    return false;
  }, [user, course, enrollmentsQuery.data, id]);

  const progressQuery = useCourseProgress(isEnrolled ? id : undefined);
  const completedLessonIds = new Set(
    (progressQuery.data?.lessons ?? []).filter((l) => l.completed).map((l) => l.lesson_id)
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Course Not Found"
          message={error || 'The requested course does not exist or has not been published.'}
          onRetry={() => courseQuery.refetch()}
        />
        <div className="text-center mt-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0071E3] dark:text-[#32ADE6] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-transition-enter">
      {/* Back link */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Catalogue
        </Link>
      </div>

      {/* Hero / Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            {course.category && (
              <Badge variant="purple" size="md">
                {course.category}
              </Badge>
            )}
            <Badge variant="default" size="md">
              {course.difficulty || 'All Levels'}
            </Badge>
            {isEnrolled && (
              <Badge variant="success" size="md">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Active Enrollment
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D] leading-relaxed whitespace-pre-line">
            {course.description}
          </p>

          <div className="flex items-center gap-6 text-xs text-[#86868B] pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#0071E3]" />
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {course.instructor_name || 'Instructor'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>{course.modules?.length ?? course.modules_count ?? 0} modules</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessons_count ?? 0} lessons</span>
            </div>
          </div>
        </div>

        {/* Enrollment / Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 apple-card p-6 shadow-sm space-y-6">
            <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#0071E3]/20 via-[#5856D6]/20 to-[#AF52DE]/20 flex items-center justify-center">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="w-14 h-14 text-[#86868B]" />
              )}
            </div>

            <div className="space-y-3">
              <EnrollmentButton
                courseId={course.id}
                isAlreadyEnrolled={isEnrolled}
                onEnrollSuccess={() => {
                  courseQuery.refetch();
                  enrollmentsQuery.refetch();
                }}
              />

              <p className="text-center text-xs text-[#86868B]">
                Full lifetime access to all modules, quizzes, and AI study resources.
              </p>
            </div>

            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2.5 text-xs text-[#6E6E73] dark:text-[#98989D]">
              <div className="flex items-center justify-between">
                <span>Self-paced learning</span>
                <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quizzes & Assessments</span>
                <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completion Certificate</span>
                <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Syllabus Preview */}
      <div className="space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">Course Curriculum</h2>
            <p className="text-xs sm:text-sm text-[#86868B] mt-0.5">
              Explore the structured modules and interactive video lessons included in this course.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#86868B]">
            {course.modules?.length ?? 0} modules
          </span>
        </div>

        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-3">
            {course.modules.map((module, moduleIdx) => {
              const isExpanded = expandedModules[module.id] ?? true;
              return (
                <div
                  key={module.id}
                  className="apple-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] text-xs font-bold flex items-center justify-center">
                        {moduleIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-xs text-[#86868B] line-clamp-1 mt-0.5">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#86868B]">
                      <span>{module.lessons?.length || 0} lessons</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && module.lessons && module.lessons.length > 0 && (
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08]">
                      {module.lessons.map((lesson, lessonIdx) => (
                        <div
                          key={lesson.id}
                          className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.video_url ? (
                              <PlayCircle className="w-4 h-4 text-[#0071E3] flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#86868B] flex-shrink-0" />
                            )}
                            <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {moduleIdx + 1}.{lessonIdx + 1} {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[#86868B]">
                            {lesson.is_required && (
                              <Badge variant="slate" size="sm">
                                Required
                              </Badge>
                            )}
                            {isEnrolled && completedLessonIds.has(lesson.id) ? (
                              <Link
                                to={`/courses/${course.id}/learn/${lesson.id}`}
                                className="flex items-center gap-1 font-semibold text-[#34C759] hover:underline"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Review
                              </Link>
                            ) : isEnrolled ? (
                              <Link
                                to={`/courses/${course.id}/learn/${lesson.id}`}
                                className="font-semibold text-[#0071E3] dark:text-[#32ADE6] hover:underline"
                              >
                                Start
                              </Link>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3" /> Preview
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#86868B] apple-card">
            No modules have been added to this course yet.
          </div>
        )}
      </div>

      {isEnrolled && (
        <div className="pt-4">
          <CourseQuizList courseId={course.id} />
        </div>
      )}
    </div>
  );
};
