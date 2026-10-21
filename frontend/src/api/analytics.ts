import { apiClient } from './client';
import type { AdminAnalytics, CourseAnalytics, QuizLeaderboard, StudentAnalytics } from '../types';

/** Subset of `GET /analytics/student/` (backend `analytics` app) used by the student UI. */
export interface StudentAnalyticsResponse {
  total_enrolled_courses: number;
  completed_courses: number;
  total_quizzes_taken: number;
  average_quiz_score: number;
  recent_quiz_attempts: {
    quiz_id: string;
    quiz_title: string;
    course_title: string;
    percentage: number;
    passed: boolean;
    submitted_at: string;
  }[];
}

export function toStudentAnalytics(data: StudentAnalyticsResponse): StudentAnalytics {
  return {
    total_enrolled: data.total_enrolled_courses,
    completed_courses: data.completed_courses,
    total_quizzes_taken: data.total_quizzes_taken,
    average_quiz_percentage: Math.round(data.average_quiz_score * 10) / 10,
    recent_attempts: data.recent_quiz_attempts.slice(0, 5).map((a) => ({
      quiz_id: a.quiz_id,
      quiz_title: a.quiz_title,
      course_title: a.course_title,
      score_percentage: a.percentage,
      passed: a.passed,
      date: a.submitted_at,
    })),
  };
}

export const analyticsApi = {
  getStudentAnalytics: async (): Promise<StudentAnalytics> => {
    const response = await apiClient.get<StudentAnalyticsResponse>('/analytics/student/');
    return toStudentAnalytics(response.data);
  },

  getCourseAnalytics: async (courseId: string): Promise<CourseAnalytics> => {
    const response = await apiClient.get<CourseAnalytics>(`/courses/${courseId}/analytics/`);
    return response.data;
  },

  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    const response = await apiClient.get<AdminAnalytics>('/analytics/admin/');
    return response.data;
  },

  getQuizLeaderboard: async (quizId: string): Promise<QuizLeaderboard> => {
    const response = await apiClient.get<QuizLeaderboard>(`/quizzes/${quizId}/leaderboard/`);
    return response.data;
  },
};
