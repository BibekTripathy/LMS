import React from 'react';
import type { Course } from '../../types';
import { CourseCard } from './CourseCard';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export interface CourseGridProps {
  courses?: Course[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  enrolledCourseIds?: Set<string>;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  isLoading,
  error,
  onRetry,
  enrolledCourseIds,
  emptyTitle = 'No courses found',
  emptyDescription = 'Try adjusting your search query, difficulty, or category filter to find what you are looking for.',
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="course-grid-loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load courses"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="course-grid">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isEnrolled={enrolledCourseIds ? enrolledCourseIds.has(course.id) : undefined}
        />
      ))}
    </div>
  );
};
