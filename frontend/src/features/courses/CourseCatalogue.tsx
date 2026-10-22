import React, { useState } from 'react';
import { Compass } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-transition-enter">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden lms-card p-8 sm:p-12 bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-[#13151D] dark:via-[#111319] dark:to-[#0D0F14]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Course Catalogue</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121316] dark:text-[#F3F4F6] heading-display">
            Explore Expert-Led Curricula
          </h1>
          <p className="text-[#868E96] text-xs sm:text-sm leading-relaxed">
            Gain deep mastery in modern software engineering, data systems, and computer science. Track your progress with interactive concept flashcards, synchronized video transcripts, and verifiable assessments.
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
