import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, User as UserIcon, BookOpen } from 'lucide-react';
import type { Course } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { CoursePlaceholderImage } from '../../components/ui/CoursePlaceholderImage';

export interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
}

// Catppuccin Frappé accent set — used for the top border + thumbnail bg
const CARD_ACCENTS = [
  { border: 'border-t-frappe-blue',   hex: '#8caaee' },
  { border: 'border-t-frappe-mauve',  hex: '#ca9ee6' },
  { border: 'border-t-frappe-teal',   hex: '#81c8be' },
  { border: 'border-t-frappe-green',  hex: '#a6d189' },
  { border: 'border-t-frappe-peach',  hex: '#ef9f76' },
  { border: 'border-t-frappe-yellow', hex: '#e5c890' },
];

export const CourseCard: React.FC<CourseCardProps> = ({ course, isEnrolled }) => {
  const enrolled = isEnrolled ?? course.is_enrolled;

  const accentIdx = course.id ? course.id.charCodeAt(0) % CARD_ACCENTS.length : 0;
  const accent = CARD_ACCENTS[accentIdx];

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'BEGINNER':     return 'success';
      case 'INTERMEDIATE': return 'warning';
      case 'ADVANCED':     return 'danger';
      default:             return 'default';
    }
  };

  return (
    <div className={`group bg-latte-mantle dark:bg-frappe-surface0 rounded-xl border-t-4 ${accent.border} border border-latte-surface0 dark:border-frappe-surface1 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden`}>

      {/* Thumbnail */}
      <div className="relative h-40 w-full overflow-hidden flex items-center justify-center bg-latte-surface0 dark:bg-frappe-surface1">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <CoursePlaceholderImage
            category={course.category}
            accentColor={accent.hex}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Category badge */}
        {course.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-latte-base/80 dark:bg-frappe-base/80 backdrop-blur-md text-latte-text dark:text-frappe-text shadow-sm">
              {course.category}
            </span>
          </div>
        )}

        {/* Enrolled indicator */}
        {enrolled && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-frappe-green/20 text-frappe-green border border-frappe-green/40">
            <span>Enrolled</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <Badge variant={getDifficultyVariant(course.difficulty)} size="sm">
            {course.difficulty || 'All Levels'}
          </Badge>

          <h3 className="font-notebook text-lg font-bold text-latte-text dark:text-frappe-text line-clamp-2 group-hover:text-frappe-blue transition-colors">
            <Link to={`/courses/${course.id}`} className="focus:outline-none">
              {course.title}
            </Link>
          </h3>

          <p className="text-xs text-latte-subtext0 dark:text-frappe-subtext0 line-clamp-2">
            {course.description || 'No description provided.'}
          </p>
        </div>

        {/* Meta row */}
        <div className="pt-3 border-t border-latte-surface0 dark:border-frappe-surface1 flex items-center justify-between text-xs text-latte-subtext0 dark:text-frappe-subtext0">
          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
            <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{course.instructor_name || 'Instructor'}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {course.modules_count ?? 0}m
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {course.lessons_count ?? 0}l
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-1">
          <Link
            to={`/courses/${course.id}`}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-sm font-semibold rounded-xl border border-latte-surface1 dark:border-frappe-surface1 bg-latte-surface0 dark:bg-frappe-surface1 text-latte-text dark:text-frappe-text hover:bg-frappe-blue hover:text-white hover:border-frappe-blue dark:hover:bg-frappe-blue dark:hover:border-frappe-blue transition-colors"
          >
            {enrolled ? 'Continue Learning →' : 'View Course →'}
          </Link>
        </div>
      </div>
    </div>
  );
};
