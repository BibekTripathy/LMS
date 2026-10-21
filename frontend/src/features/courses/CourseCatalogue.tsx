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
      {/* Hero Header — Apple Surface */}
      <div className="relative rounded-3xl overflow-hidden apple-card p-8 sm:p-12 bg-gradient-to-br from-white via-[#FAFAFC] to-[#F2F2F7] dark:from-[#1C1C1E] dark:via-[#161618] dark:to-[#0D0D0E]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cognify LMS Course Catalogue</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] apple-title-large">
            Explore Expert-Led Curricula
          </h1>
          <p className="text-[#86868B] dark:text-[#98989D] text-sm sm:text-base leading-relaxed">
            Gain mastery in modern software engineering, data systems, and artificial intelligence. Track your progress with automated AI study tools.
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
