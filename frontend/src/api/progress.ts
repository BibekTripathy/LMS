import { apiClient } from './client';
import type { LessonProgress, CourseProgress } from '../types';

export const progressApi = {
  getLessonProgress: async (lessonId: string): Promise<LessonProgress> => {
    const response = await apiClient.get<LessonProgress>(`/lessons/${lessonId}/progress/`);
    return response.data;
  },

  updateLessonProgress: async (
    lessonId: string,
    data: { last_position_seconds?: number; timestamp?: number; completed?: boolean; is_completed?: boolean }
  ): Promise<LessonProgress> => {
    const response = await apiClient.patch<LessonProgress>(`/lessons/${lessonId}/progress/`, data);
    return response.data;
  },

  completeLesson: async (lessonId: string): Promise<LessonProgress> => {
    const response = await apiClient.post<LessonProgress>(`/lessons/${lessonId}/complete/`);
    return response.data;
  },

  getCourseProgress: async (courseId: string): Promise<CourseProgress> => {
    const response = await apiClient.get<CourseProgress>(`/courses/${courseId}/progress/`);
    return response.data;
  },
};
