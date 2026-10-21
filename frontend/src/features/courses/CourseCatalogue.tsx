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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Curated Courses & Learning Pathways
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Explore Courses & Elevate Your Skills
          </h1>
          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
            Discover expertly crafted courses, practice with AI study flashcards and quizzes, and track your verified progress.
          </p>
        </div>

        {/* Decorative circle accents */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
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
