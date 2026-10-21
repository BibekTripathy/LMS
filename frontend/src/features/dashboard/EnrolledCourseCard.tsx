import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle2, BookOpen, User as UserIcon } from 'lucide-react';

import type { Enrollment } from '../../types';
import { useCourseProgress } from '../enrollments/hooks';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

export interface EnrolledCourseCardProps {
  enrollment: Enrollment;
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

  const handleResume = () => {
    if (targetLessonId) {
      navigate(`/courses/${courseId}/learn/${targetLessonId}`);
    } else {
      navigate(`/courses/${courseId}/learn`);
    }
  };

  return (
    <div className="apple-card hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Media & Banner */}
      <div className="relative h-44 bg-gradient-to-tr from-[#0071E3]/20 via-[#5856D6]/20 to-[#AF52DE]/20 dark:from-[#0071E3]/30 dark:to-[#AF52DE]/30 flex items-center justify-center overflow-hidden">
        {course?.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="w-12 h-12 text-[#86868B] dark:text-[#636366]" />
        )}

        <div className="absolute top-3 left-3">
          {course?.category && (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-black/60 dark:bg-black/70 backdrop-blur-md text-white shadow-sm">
              {course.category}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          {isCompleted ? (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              In Progress
            </Badge>
          )}
        </div>
      </div>

      {/* Course Details & Progress */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
            <UserIcon className="w-3.5 h-3.5" />
            <span>{course?.instructor_name || 'Instructor'}</span>
          </div>

          <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] line-clamp-1 hover:text-[#0071E3] dark:hover:text-[#32ADE6] transition-colors">
            <Link to={`/courses/${courseId}`}>{course?.title || 'Enrolled Course'}</Link>
          </h3>

          <p className="text-xs text-[#86868B] dark:text-[#98989D] line-clamp-2 leading-relaxed">
            {course?.description || 'Continue your learning journey for this course.'}
          </p>
        </div>

        {/* Progress bar container */}
        <div className="pt-2 space-y-2">
          {isLoadingProgress ? (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                <span>Course Progress</span>
                <span className="text-[#0071E3] dark:text-[#32ADE6] font-mono">{Math.round(percentage)}%</span>
              </div>
              <ProgressBar
                value={percentage}
                variant={isCompleted ? 'emerald' : 'indigo'}
                size="sm"
              />
              <div className="flex justify-between items-center text-[11px] text-[#86868B]">
                <span>
                  {progress?.completed_lessons ?? 0} of {progress?.total_lessons ?? course?.lessons_count ?? 0} lessons
                </span>
                {isCompleted && <span className="text-[#34C759] font-semibold">100% Complete</span>}
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={handleResume}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-xs rounded-full active:scale-[0.98] transition-all duration-150 ${
              isCompleted
                ? 'bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7]'
                : 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm shadow-[#0071E3]/25'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Review Course Material' : 'Resume Learning'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
