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
  Code2,
  FlaskConical,
  Calculator,
  Globe,
  Music,
  Palette,
  Cpu,
  Dumbbell,
  HeartPulse,
  Landmark,
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

/** Maps a course category keyword to a Catppuccin-themed banner style + icon */
function getCategoryBanner(category?: string | null): {
  bg: string;
  iconColor: string;
  Icon: React.FC<{ className?: string }>;
} {
  const cat = (category ?? '').toLowerCase();
  if (/code|program|develop|web|software|javascript|python|react/.test(cat))
    return { bg: 'bg-frappe-blue/10 dark:bg-frappe-blue/20', iconColor: 'text-frappe-blue', Icon: Code2 };
  if (/science|physics|chemistry|biology|lab/.test(cat))
    return { bg: 'bg-frappe-teal/10 dark:bg-frappe-teal/20', iconColor: 'text-frappe-teal', Icon: FlaskConical };
  if (/math|calculus|algebra|statistic/.test(cat))
    return { bg: 'bg-frappe-mauve/10 dark:bg-frappe-mauve/20', iconColor: 'text-frappe-mauve', Icon: Calculator };
  if (/language|english|french|spanish|literature|history|social/.test(cat))
    return { bg: 'bg-frappe-peach/10 dark:bg-frappe-peach/20', iconColor: 'text-frappe-peach', Icon: Globe };
  if (/music|audio|sound/.test(cat))
    return { bg: 'bg-frappe-yellow/10 dark:bg-frappe-yellow/20', iconColor: 'text-frappe-yellow', Icon: Music };
  if (/art|design|graphic|ui|ux|creative/.test(cat))
    return { bg: 'bg-frappe-pink/10 dark:bg-frappe-pink/20', iconColor: 'text-frappe-pink', Icon: Palette };
  if (/tech|ai|machine|data|cyber/.test(cat))
    return { bg: 'bg-frappe-sapphire/10 dark:bg-frappe-sapphire/20', iconColor: 'text-frappe-sapphire', Icon: Cpu };
  if (/sport|fitness|gym|exercise/.test(cat))
    return { bg: 'bg-frappe-green/10 dark:bg-frappe-green/20', iconColor: 'text-frappe-green', Icon: Dumbbell };
  if (/medical|nursing|anatomy/.test(cat))
    return { bg: 'bg-frappe-maroon/10 dark:bg-frappe-maroon/20', iconColor: 'text-frappe-maroon', Icon: HeartPulse };
  if (/business|economics|finance|law|politic/.test(cat))
    return { bg: 'bg-frappe-rosewater/10 dark:bg-frappe-rosewater/20', iconColor: 'text-frappe-rosewater', Icon: Landmark };
  return { bg: 'bg-frappe-flamingo/10 dark:bg-frappe-flamingo/20', iconColor: 'text-frappe-flamingo', Icon: BookOpen };
}

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
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
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
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back breadcrumb */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
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

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {course.description}
          </p>

          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {course.instructor_name || 'Instructor'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>{course.modules?.length ?? course.modules_count ?? 0} modules</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>{course.lessons_count ?? 0} lessons</span>
            </div>
          </div>
        </div>

        {/* Enrollment / Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-latte-mantle dark:bg-frappe-surface0 rounded-2xl border border-latte-surface1 dark:border-frappe-surface1 p-5 shadow-sm space-y-5">
            {(() => { const { bg, iconColor, Icon } = getCategoryBanner(course.category); return (
            <div className={`relative h-40 rounded-xl overflow-hidden border border-latte-surface0 dark:border-frappe-surface1 ${bg} flex items-center justify-center`}>
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <Icon className={`w-16 h-16 ${iconColor} opacity-50`} />
              )}
            </div>
            ); })()}

            <div className="space-y-4">
              <EnrollmentButton
                courseId={course.id}
                isAlreadyEnrolled={isEnrolled}
                onEnrollSuccess={() => {
                  courseQuery.refetch();
                  enrollmentsQuery.refetch();
                }}
              />

              <p className="text-center text-xs text-latte-subtext0 dark:text-frappe-subtext0">
                Full lifetime access to all modules, quizzes, and AI study resources.
              </p>
            </div>

            <div className="pt-4 border-t border-latte-surface0 dark:border-frappe-surface1 space-y-2.5 text-xs text-latte-subtext1 dark:text-frappe-subtext1">
              <div className="flex items-center justify-between">
                <span>Self-paced learning</span>
                <span className="font-semibold">Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quizzes & Assessments</span>
                <span className="font-semibold">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completion Certificate</span>
                <span className="font-semibold">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Syllabus Preview */}
      <div className="space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Course Curriculum</h2>
            <p className="text-sm text-slate-500">
              Explore the structured modules and interactive video lessons included in this course.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {course.modules?.length ?? 0} modules
          </span>
        </div>

        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-4">
            {course.modules.map((module, moduleIdx) => {
              const isExpanded = expandedModules[module.id] ?? true;
              return (
                <div
                  key={module.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                        {moduleIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{module.lessons?.length || 0} lessons</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && module.lessons && module.lessons.length > 0 && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
                      {module.lessons.map((lesson, lessonIdx) => (
                        <div
                          key={lesson.id}
                          className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-800/80 transition"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.video_url ? (
                              <PlayCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {moduleIdx + 1}.{lessonIdx + 1} {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-400">
                            {lesson.is_required && (
                              <Badge variant="slate" size="sm">
                                Required
                              </Badge>
                            )}
                            {isEnrolled && completedLessonIds.has(lesson.id) ? (
                              <Link
                                to={`/courses/${course.id}/learn/${lesson.id}`}
                                className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Review
                              </Link>
                            ) : isEnrolled ? (
                              <Link
                                to={`/courses/${course.id}/learn/${lesson.id}`}
                                className="font-semibold text-indigo-600 hover:text-indigo-700"
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
          <div className="p-8 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
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
