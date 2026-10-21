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
      case 'BEGINNER': return 'success';
      case 'INTERMEDIATE': return 'warning';
      case 'ADVANCED': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="group apple-card hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-44 w-full bg-gradient-to-tr from-[#0071E3]/15 via-black/[0.03] to-[#5856D6]/15 dark:from-[#0071E3]/20 dark:to-[#AF52DE]/20 overflow-hidden flex items-center justify-center">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-[#86868B] dark:text-[#636366] flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-300">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        {course.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-black/60 dark:bg-black/70 backdrop-blur-md text-white shadow-sm">
              {course.category}
            </span>
          </div>
        )}
        {enrolled && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#34C759] text-white shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Enrolled</span>
          </div>
        )}
      </div>

      {/* Course info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Badge variant={getDifficultyVariant(course.difficulty)} size="sm">
            {course.difficulty || 'All Levels'}
          </Badge>
          <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight line-clamp-2 group-hover:text-[#0071E3] dark:group-hover:text-[#32ADE6] transition-colors">
            <Link to={`/courses/${course.id}`} className="focus:outline-none">
              {course.title}
            </Link>
          </h3>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] line-clamp-2 leading-relaxed">
            {course.description || 'No description provided.'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#86868B]">
            <div className="flex items-center gap-1.5 truncate max-w-[130px]">
              <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{course.instructor_name || 'Instructor'}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {course.modules_count ?? 0} modules
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {course.lessons_count ?? 0} lessons
              </span>
            </div>
          </div>

          <Link
            to={`/courses/${course.id}`}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-full bg-black/[0.04] hover:bg-[#0071E3] hover:text-white dark:bg-white/[0.08] dark:hover:bg-[#0071E3] dark:hover:text-white text-[#1D1D1F] dark:text-[#F5F5F7] active:scale-[0.98] transition-all duration-150"
          >
            {enrolled ? 'Continue Learning →' : 'View Course →'}
          </Link>
        </div>
      </div>
    </div>
  );
};
