import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';
import type { StudentAnalytics } from '../../types';

export const analyticsQueryKeys = {
  student: ['analytics', 'student'] as const,
  course: (courseId: string) => ['analytics', 'course', courseId] as const,
  admin: ['analytics', 'admin'] as const,
  leaderboard: (quizId: string) => ['analytics', 'leaderboard', quizId] as const,
};

export function useStudentAnalytics() {
  return useQuery<StudentAnalytics, Error>({
    queryKey: analyticsQueryKeys.student,
    queryFn: () => analyticsApi.getStudentAnalytics(),
  });
}

export function useCourseAnalytics(courseId: string | undefined) {
  return useQuery({
    queryKey: analyticsQueryKeys.course(courseId ?? ''),
    queryFn: () => analyticsApi.getCourseAnalytics(courseId!),
    enabled: !!courseId,
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: analyticsQueryKeys.admin,
    queryFn: () => analyticsApi.getAdminAnalytics(),
  });
}

export function useQuizLeaderboard(quizId: string | undefined) {
  return useQuery({
    queryKey: analyticsQueryKeys.leaderboard(quizId ?? ''),
    queryFn: () => analyticsApi.getQuizLeaderboard(quizId!),
    enabled: !!quizId,
  });
}
