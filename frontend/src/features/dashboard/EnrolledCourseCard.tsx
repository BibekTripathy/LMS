import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  CheckCircle2,
  BookOpen,
  User as UserIcon,
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
  type LucideIcon,
} from 'lucide-react';

import type { Enrollment } from '../../types';
import { useCourseProgress } from '../enrollments/hooks';
import { Skeleton } from '../../components/ui/Skeleton';

export interface EnrolledCourseCardProps {
  enrollment: Enrollment;
}

/** Catppuccin accent per subject category */
interface SubjectTheme {
  bg: string;
  iconColor: string;
  progressColor: string;
  borderColor: string;
  Icon: LucideIcon;
}

function getSubjectTheme(category?: string | null): SubjectTheme {
  const cat = (category ?? '').toLowerCase();
  if (/code|program|develop|web|software|javascript|python|react/.test(cat))
    return { bg: 'bg-frappe-blue/10 dark:bg-frappe-blue/15', iconColor: 'text-frappe-blue', progressColor: 'bg-frappe-blue', borderColor: 'border-frappe-blue/40', Icon: Code2 };
  if (/science|physics|chemistry|biology|lab/.test(cat))
    return { bg: 'bg-frappe-teal/10 dark:bg-frappe-teal/15', iconColor: 'text-frappe-teal', progressColor: 'bg-frappe-teal', borderColor: 'border-frappe-teal/40', Icon: FlaskConical };
  if (/math|calculus|algebra|statistic/.test(cat))
    return { bg: 'bg-frappe-mauve/10 dark:bg-frappe-mauve/15', iconColor: 'text-frappe-mauve', progressColor: 'bg-frappe-mauve', borderColor: 'border-frappe-mauve/40', Icon: Calculator };
  if (/language|english|french|spanish|literature|history|social/.test(cat))
    return { bg: 'bg-frappe-peach/10 dark:bg-frappe-peach/15', iconColor: 'text-frappe-peach', progressColor: 'bg-frappe-peach', borderColor: 'border-frappe-peach/40', Icon: Globe };
  if (/music|audio|sound/.test(cat))
    return { bg: 'bg-frappe-yellow/10 dark:bg-frappe-yellow/15', iconColor: 'text-frappe-yellow', progressColor: 'bg-frappe-yellow', borderColor: 'border-frappe-yellow/40', Icon: Music };
  if (/art|design|graphic|ui|ux|creative/.test(cat))
    return { bg: 'bg-frappe-pink/10 dark:bg-frappe-pink/15', iconColor: 'text-frappe-pink', progressColor: 'bg-frappe-pink', borderColor: 'border-frappe-pink/40', Icon: Palette };
  if (/tech|ai|machine|data|cyber/.test(cat))
    return { bg: 'bg-frappe-sapphire/10 dark:bg-frappe-sapphire/15', iconColor: 'text-frappe-sapphire', progressColor: 'bg-frappe-sapphire', borderColor: 'border-frappe-sapphire/40', Icon: Cpu };
  if (/sport|fitness|gym|exercise/.test(cat))
    return { bg: 'bg-frappe-green/10 dark:bg-frappe-green/15', iconColor: 'text-frappe-green', progressColor: 'bg-frappe-green', borderColor: 'border-frappe-green/40', Icon: Dumbbell };
  if (/medical|nursing|anatomy/.test(cat))
    return { bg: 'bg-frappe-maroon/10 dark:bg-frappe-maroon/15', iconColor: 'text-frappe-maroon', progressColor: 'bg-frappe-maroon', borderColor: 'border-frappe-maroon/40', Icon: HeartPulse };
  if (/business|economics|finance|law|politic/.test(cat))
    return { bg: 'bg-frappe-rosewater/10 dark:bg-frappe-rosewater/15', iconColor: 'text-frappe-rosewater', progressColor: 'bg-frappe-rosewater', borderColor: 'border-frappe-rosewater/40', Icon: Landmark };
  // default — flamingo
  return { bg: 'bg-frappe-flamingo/10 dark:bg-frappe-flamingo/15', iconColor: 'text-frappe-flamingo', progressColor: 'bg-frappe-flamingo', borderColor: 'border-frappe-flamingo/40', Icon: BookOpen };
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ enrollment }) => {
  const navigate = useNavigate();
  const course = enrollment.course_detail;
  const courseId = enrollment.course || (course ? course.id : '');

  const progressQuery = useCourseProgress(courseId);
  const progress = progressQuery.data;
  const isLoadingProgress = progressQuery.isLoading;

  const percentage = progress?.progress_percentage ?? 0;
  const isCompleted = progress?.is_completed || enrollment.status === 'COMPLETED';
  const targetLessonId = progress?.last_accessed_lesson_id;

  const theme = getSubjectTheme(course?.category);
  const { bg, iconColor, progressColor, borderColor, Icon } = theme;

  const handleResume = () => {
    if (targetLessonId) {
      navigate(`/courses/${courseId}/learn/${targetLessonId}`);
    } else {
      navigate(`/courses/${courseId}/learn`);
    }
  };

  return (
    <div className="bg-latte-base dark:bg-frappe-base rounded-2xl border border-latte-surface1 dark:border-frappe-surface1 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-row gap-0">

      {/* Subject icon panel — left vertical strip */}
      <div className={`relative w-24 flex-shrink-0 flex flex-col items-center justify-center ${bg} border-r border-latte-surface0 dark:border-frappe-surface1`}>
        {course?.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <Icon className={`w-10 h-10 ${iconColor}`} />
        )}

        {/* Status badge pinned to bottom */}
        <div className="absolute bottom-2 inset-x-1 flex justify-center">
          {isCompleted ? (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-frappe-green/20 text-frappe-green border border-frappe-green/40`}>
              <CheckCircle2 className="w-2.5 h-2.5" /> Done
            </span>
          ) : (
            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-md ${bg} ${iconColor} border ${borderColor}`}>
              Active
            </span>
          )}
        </div>
      </div>

      {/* Course details — right content area */}
      <div className="flex-1 p-4 flex flex-col justify-between gap-3 min-w-0">
        <div className="space-y-1 min-w-0">
          {/* Category + instructor row */}
          <div className="flex items-center gap-2 flex-wrap">
            {course?.category && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${bg} ${iconColor} border ${borderColor}`}>
                {course.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-latte-subtext0 dark:text-frappe-subtext0">
              <UserIcon className="w-3 h-3" />
              {course?.instructor_name || 'Instructor'}
            </span>
          </div>

          <h3 className="font-notebook text-base font-bold text-latte-text dark:text-frappe-text line-clamp-1 hover:underline transition-colors">
            <Link to={`/courses/${courseId}`}>{course?.title || 'Enrolled Course'}</Link>
          </h3>

          <p className="text-[11px] text-latte-subtext0 dark:text-frappe-subtext0 line-clamp-1">
            {course?.description || 'Continue your learning journey for this course.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          {isLoadingProgress ? (
            <Skeleton className="h-1.5 w-full rounded-full" />
          ) : (
            <>
              <div className="flex justify-between items-center text-[11px] font-semibold text-latte-subtext1 dark:text-frappe-subtext1">
                <span>{progress?.completed_lessons ?? 0} / {progress?.total_lessons ?? course?.lessons_count ?? 0} lessons</span>
                <span className={`font-bold ${isCompleted ? 'text-frappe-green' : iconColor}`}>
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-latte-surface0 dark:bg-frappe-surface1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-frappe-green' : progressColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Resume button */}
        <button
          onClick={handleResume}
          className={`inline-flex items-center gap-1.5 py-2 px-3 font-bold text-xs rounded-xl transition-colors self-start ${
            isCompleted
              ? 'bg-latte-surface0 dark:bg-frappe-surface1 hover:bg-latte-surface1 dark:hover:bg-frappe-surface2 text-latte-subtext1 dark:text-frappe-subtext1'
              : `${bg} ${iconColor} border ${borderColor} hover:opacity-80`
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          {isCompleted ? 'Review Material' : 'Resume Learning'}
        </button>
      </div>
    </div>
  );
};
