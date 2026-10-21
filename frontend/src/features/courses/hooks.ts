import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, type CourseFilterParams } from '../../api/courses';
import { enrollmentApi } from '../../api/enrollments';

import type { Course, CourseDetail, Enrollment } from '../../types';
import { useAuth } from '../../context/auth';

export const courseQueryKeys = {
  all: ['courses'] as const,
  list: (params?: CourseFilterParams) => ['courses', 'list', params] as const,
  detail: (id: string) => ['courses', 'detail', id] as const,
  modules: (id: string) => ['courses', 'modules', id] as const,
  enrollments: ['enrollments', 'me'] as const,
};

export function useCourses(params?: CourseFilterParams) {
  return useQuery<Course[], Error>({
    queryKey: courseQueryKeys.list(params),
    queryFn: () => courseApi.getCourses(params),
  });
}

export function useCourseDetail(id: string | undefined) {
  return useQuery<CourseDetail, Error>({
    queryKey: courseQueryKeys.detail(id ?? ''),
    queryFn: () => courseApi.getCourseById(id!),
    enabled: !!id,
  });
}

/** The signed-in user's enrollments; never requested for anonymous visitors (it would 401). */
export function useMyEnrollments() {
  const { user } = useAuth();
  return useQuery<Enrollment[], Error>({
    queryKey: courseQueryKeys.enrollments,
    queryFn: () => enrollmentApi.getMyEnrollments(),
    enabled: !!user,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation<Enrollment, Error, string>({
    mutationFn: (courseId: string) => enrollmentApi.enrollInCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
