import { apiClient } from './client';
import type { Enrollment } from '../types';

export const enrollmentApi = {
  enrollInCourse: async (courseId: string): Promise<Enrollment> => {
    const response = await apiClient.post(`/courses/${courseId}/enroll/`);
    return response.data;
  },

  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const response = await apiClient.get('/enrollments/me/');
    return response.data;
  },

  getCourseStudents: async (courseId: string): Promise<Enrollment[]> => {
    const response = await apiClient.get(`/courses/${courseId}/students/`);
    return response.data;
  },
};
