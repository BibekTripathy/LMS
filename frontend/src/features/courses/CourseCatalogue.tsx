import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { useCourses, useMyEnrollments } from './hooks';
import { CourseFilters } from './CourseFilters';
import { CourseGrid } from './CourseGrid';
import type { CourseFilterParams } from '../../api/courses';
import { getErrorMessage } from '../../lib/errors';
import { useAuth } from '../../context/auth';

export const CourseCatalogue: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CourseFilterParams>({});

  const coursesQuery = useCourses(filters);
  const enrollmentsQuery = useMyEnrollments();

  const courses = coursesQuery.data ?? [];
  const isLoading = coursesQuery.isLoading;
  const error = coursesQuery.error
    ? getErrorMessage(coursesQuery.error, 'Failed to fetch course catalogue.')
    : null;

  // Build enrolled IDs set
  const enrolledIds = React.useMemo(() => {
    if (!user || !enrollmentsQuery.data) return new Set<string>();
    return new Set<string>(
      enrollmentsQuery.data
        .filter((e) => e.status === 'ACTIVE')
        .map((e) => e.course || (e.course_detail ? e.course_detail.id : ''))
        .filter(Boolean)
    );
  }, [user, enrollmentsQuery.data]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Section — notebook style */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-latte-surface0 dark:border-frappe-surface1 bg-latte-mantle dark:bg-frappe-mantle p-8 sm:p-12 shadow-sm">
        {/* notebook holes */}
        <div className="absolute left-6 top-6 flex flex-col gap-6">
          {[0,1,2].map(i => (
            <div key={i} className="w-4 h-4 rounded-full border-2 border-latte-surface1 dark:border-frappe-surface1 bg-latte-base dark:bg-frappe-base" />
          ))}
        </div>
        {/* margin line */}
        <div className="absolute left-16 top-0 bottom-0 w-px bg-frappe-red/25" />
        <div className="ml-14 relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-latte-surface0 dark:bg-frappe-surface0 text-latte-subtext1 dark:text-frappe-subtext1 text-xs font-semibold border border-latte-surface1 dark:border-frappe-surface1">
            <Sparkles className="w-3.5 h-3.5 text-frappe-mauve" />
            NoteBox Course Catalogue
          </div>
          <h1 className="font-notebook text-3xl sm:text-5xl font-bold text-latte-text dark:text-frappe-text tracking-tight leading-tight">
            📚 Find Your Next Chapter
          </h1>
          <p className="text-latte-subtext1 dark:text-frappe-subtext1 text-sm sm:text-base leading-relaxed">
            Explore our library of expertly crafted courses. Use AI study tools to reinforce what you learn.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <CourseFilters
        filters={filters}
        onChange={setFilters}
        totalResults={courses.length}
      />

      {/* Course Grid Results */}
      <CourseGrid
        courses={courses}
        isLoading={isLoading}
        error={error}
        onRetry={() => coursesQuery.refetch()}
        enrolledCourseIds={enrolledIds}
        emptyTitle="No courses match your criteria"
        emptyDescription="Try clearing your search terms or picking another category."
      />
    </div>
  );
};
