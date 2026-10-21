import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle2, User as UserIcon } from 'lucide-react';

import type { Enrollment } from '../../types';
import { useCourseProgress } from '../enrollments/hooks';
import { Skeleton } from '../../components/ui/Skeleton';
import { CoursePlaceholderImage } from '../../components/ui/CoursePlaceholderImage';

export interface EnrolledCourseCardProps {
  enrollment: Enrollment;
}

// Accent palette cycling — one per card, Catppuccin Frappé hues
const BANNER_ACCENTS = [
  { border: 'border-t-frappe-blue',   hex: '#8caaee' },
  { border: 'border-t-frappe-mauve',  hex: '#ca9ee6' },
  { border: 'border-t-frappe-teal',   hex: '#81c8be' },
  { border: 'border-t-frappe-green',  hex: '#a6d189' },
  { border: 'border-t-frappe-peach',  hex: '#ef9f76' },
  { border: 'border-t-frappe-yellow', hex: '#e5c890' },
];

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

  // Pick a stable accent from course id
  const accentIdx = courseId ? courseId.charCodeAt(0) % BANNER_ACCENTS.length : 0;
  const accent = BANNER_ACCENTS[accentIdx];

  const handleResume = () => {
    if (targetLessonId) {
      navigate(`/courses/${courseId}/learn/${targetLessonId}`);
    } else {
      navigate(`/courses/${courseId}/learn`);
    }
  };

  return (
    <div className={`bg-latte-mantle dark:bg-frappe-surface0 rounded-xl border-t-4 ${accent.border} border border-latte-surface0 dark:border-frappe-surface1 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden`}>

      {/* Thumbnail banner */}
      <div className="relative h-36 overflow-hidden flex items-center justify-center bg-latte-surface0 dark:bg-frappe-surface1">
        {course?.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <CoursePlaceholderImage
            category={course?.category}
            accentColor={accent.hex}
            className="w-full h-full object-cover"
          />
        )}

        {/* Category pill */}
        <div className="absolute top-3 left-3">
          {course?.category && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-frappe-base/70 backdrop-blur-md text-frappe-text shadow-sm">
              {course.category}
            </span>
          )}
        </div>

        {/* Status pill */}
        <div className="absolute top-3 right-3">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-frappe-green/20 text-frappe-green border border-frappe-green/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-frappe-blue/20 text-frappe-blue border border-frappe-blue/40">
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Course info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-latte-subtext0 dark:text-frappe-subtext0">
            <UserIcon className="w-3.5 h-3.5" />
            <span>{course?.instructor_name || 'Instructor'}</span>
          </div>

          <h3 className="font-notebook text-lg font-bold text-latte-text dark:text-frappe-text line-clamp-1 hover:text-frappe-blue transition-colors">
            <Link to={`/courses/${courseId}`}>{course?.title || 'Enrolled Course'}</Link>
          </h3>

          <p className="text-xs text-latte-subtext0 dark:text-frappe-subtext0 line-clamp-2">
            {course?.description || 'Continue your learning journey for this course.'}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          {isLoadingProgress ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1">
                <span>Progress</span>
                <span className={`font-bold ${isCompleted ? 'text-frappe-green' : 'text-frappe-blue'}`}>
                  {Math.round(percentage)}%
                </span>
              </div>
              {/* Custom progress track in theme colours */}
              <div className="w-full h-1.5 bg-latte-surface0 dark:bg-frappe-surface1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-frappe-green' : 'bg-frappe-blue'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-latte-subtext0 dark:text-frappe-subtext0">
                <span>
                  {progress?.completed_lessons ?? 0} of{' '}
                  {progress?.total_lessons ?? course?.lessons_count ?? 0} lessons
                </span>
                {isCompleted && (
                  <span className="text-frappe-green font-semibold">✓ Complete</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        <div className="pt-1 border-t border-latte-surface0 dark:border-frappe-surface1">
          <button
            onClick={handleResume}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl transition-colors ${
              isCompleted
                ? 'bg-latte-surface0 dark:bg-frappe-surface1 hover:bg-latte-surface1 dark:hover:bg-frappe-surface2 text-latte-text dark:text-frappe-text'
                : 'bg-frappe-blue hover:bg-frappe-sapphire text-white'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Review Material' : 'Resume Learning'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
