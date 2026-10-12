import { apiClient } from './client';
import type { Course, CourseDetail, Module, Lesson } from '../types';

export interface CourseFilterParams {
  search?: string;
  category?: string;
  difficulty?: string;
  my_courses?: boolean;
  status?: string;
}

export const courseApi = {
  // Courses
  getCourses: async (params?: CourseFilterParams): Promise<Course[]> => {
    const response = await apiClient.get('/courses/', { params });
    return response.data.results || response.data;
  },

  getCourseById: async (id: string): Promise<CourseDetail> => {
    const response = await apiClient.get(`/courses/${id}/`);
    return response.data;
  },

  createCourse: async (data: Partial<Course>): Promise<Course> => {
    const response = await apiClient.post('/courses/', data);
    return response.data;
  },

  updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
    const response = await apiClient.patch(`/courses/${id}/`, data);
    return response.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}/`);
  },

  publishCourse: async (id: string): Promise<CourseDetail> => {
    const response = await apiClient.post(`/courses/${id}/publish/`);
    return response.data;
  },

  archiveCourse: async (id: string): Promise<CourseDetail> => {
    const response = await apiClient.post(`/courses/${id}/archive/`);
    return response.data;
  },

  // Modules
  getCourseModules: async (courseId: string): Promise<Module[]> => {
    const response = await apiClient.get(`/courses/${courseId}/modules/`);
    return response.data;
  },

  createModule: async (courseId: string, data: { title: string; description?: string; order?: number }): Promise<Module> => {
    const response = await apiClient.post(`/courses/${courseId}/modules/`, data);
    return response.data;
  },

  updateModule: async (moduleId: string, data: Partial<Module>): Promise<Module> => {
    const response = await apiClient.patch(`/modules/${moduleId}/`, data);
    return response.data;
  },

  deleteModule: async (moduleId: string): Promise<void> => {
    await apiClient.delete(`/modules/${moduleId}/`);
  },

  // Lessons
  createLesson: async (moduleId: string, data: Partial<Lesson>): Promise<Lesson> => {
    const response = await apiClient.post(`/modules/${moduleId}/lessons/`, data);
    return response.data;
  },

  getLessonById: async (lessonId: string): Promise<Lesson> => {
    const response = await apiClient.get(`/lessons/${lessonId}/`);
    return response.data;
  },

  updateLesson: async (lessonId: string, data: Partial<Lesson>): Promise<Lesson> => {
    const response = await apiClient.patch(`/lessons/${lessonId}/`, data);
    return response.data;
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    await apiClient.delete(`/lessons/${lessonId}/`);
  },
};
