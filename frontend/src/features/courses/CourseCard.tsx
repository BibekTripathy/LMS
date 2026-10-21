import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, CheckCircle2, User as UserIcon } from 'lucide-react';
import type { Course } from '../../types';
import { Badge } from '../../components/ui/Badge';

export interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, isEnrolled }) => {
  const enrolled = isEnrolled ?? course.is_enrolled;

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'BEGINNER':
        return 'success';
      case 'INTERMEDIATE':
        return 'warning';
      case 'ADVANCED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail or Card Header Banner */}
      <div className="relative h-44 w-full bg-gradient-to-tr from-indigo-900 via-indigo-700 to-purple-800 overflow-hidden flex items-center justify-center">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-white/30 flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-300">
            <BookOpen className="w-16 h-16" />
          </div>
        )}

        {/* Category & Status Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {course.category && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-black/40 backdrop-blur-md text-white shadow-sm">
              {course.category}
            </span>
          )}
        </div>

        {enrolled && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-white shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Enrolled</span>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getDifficultyVariant(course.difficulty)} size="sm">
              {course.difficulty || 'All Levels'}
            </Badge>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <Link to={`/courses/${course.id}`} className="focus:outline-none">
              {course.title}
            </Link>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {course.description || 'No description provided.'}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{course.instructor_name || 'Instructor'}</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.modules_count ?? 0} modules</span>
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.lessons_count ?? 0} lessons</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Link
            to={`/courses/${course.id}`}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 transition-colors"
          >
            {enrolled ? 'View Course & Learn' : 'Course Details'}
          </Link>
        </div>
      </div>
    </div>
  );
};
