import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentApi } from '../../api/enrollments';
import { progressApi } from '../../api/progress';
import type { Enrollment, CourseProgress } from '../../types';

export const enrollmentQueryKeys = {
  myEnrollments: ['enrollments', 'me'] as const,
  courseProgress: (courseId: string) => ['progress', 'course', courseId] as const,
};

export function useMyEnrollments() {
  return useQuery<Enrollment[], Error>({
    queryKey: enrollmentQueryKeys.myEnrollments,
    queryFn: () => enrollmentApi.getMyEnrollments(),
  });
}

export function useCourseProgress(courseId: string | undefined) {
  return useQuery<CourseProgress, Error>({
    queryKey: enrollmentQueryKeys.courseProgress(courseId ?? ''),
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: !!courseId,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation<Enrollment, Error, string>({
    mutationFn: (courseId: string) => enrollmentApi.enrollInCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: enrollmentQueryKeys.courseProgress(courseId) });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
