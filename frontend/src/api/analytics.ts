import { apiClient } from './client';
import type { StudentAnalytics } from '../types';

export const analyticsApi = {
  getStudentAnalytics: async (): Promise<StudentAnalytics> => {
    const response = await apiClient.get<StudentAnalytics>('/analytics/student/');
    return response.data;
  },
};
