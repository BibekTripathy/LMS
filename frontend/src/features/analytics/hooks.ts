import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';
import type { StudentAnalytics } from '../../types';

export const analyticsQueryKeys = {
  student: ['analytics', 'student'] as const,
};

export function useStudentAnalytics() {
  return useQuery<StudentAnalytics, Error>({
    queryKey: analyticsQueryKeys.student,
    queryFn: () => analyticsApi.getStudentAnalytics(),
  });
}
