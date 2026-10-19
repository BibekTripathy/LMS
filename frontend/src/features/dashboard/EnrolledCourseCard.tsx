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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
      {/* Top Media & Banner */}
      <div className="relative h-40 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center overflow-hidden">
        {course?.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="w-14 h-14 text-white/30" />
        )}

        <div className="absolute top-3 left-3">
          {course?.category && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-black/40 backdrop-blur-md text-white shadow-sm">
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
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <UserIcon className="w-3.5 h-3.5" />
            <span>{course?.instructor_name || 'Instructor'}</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            <Link to={`/courses/${courseId}`}>{course?.title || 'Enrolled Course'}</Link>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {course?.description || 'Continue your learning journey for this course.'}
          </p>
        </div>

        {/* Progress bar container */}
        <div className="pt-2 space-y-1.5">
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
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Course Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400">{Math.round(percentage)}%</span>
              </div>
              <ProgressBar
                value={percentage}
                variant={isCompleted ? 'emerald' : 'indigo'}
                size="sm"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>
                  {progress?.completed_lessons ?? 0} of {progress?.total_lessons ?? course?.lessons_count ?? 0} lessons
                </span>
                {isCompleted && <span className="text-emerald-600 font-semibold">100% Complete</span>}
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleResume}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl shadow-sm transition ${
              isCompleted
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
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
