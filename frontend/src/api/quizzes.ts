import { apiClient } from './client';
import type {
  Quiz,
  Question,
  QuestionInput,
  QuizAttempt,
  QuizResultsMe,
} from '../types';

export const quizApi = {
  // Course Quizzes
  getCourseQuizzes: async (courseId: string): Promise<Quiz[]> => {
    const response = await apiClient.get<Quiz[]>(`/courses/${courseId}/quizzes/`);
    return response.data;
  },

  getQuizById: async (quizId: string): Promise<Quiz> => {
    const response = await apiClient.get<Quiz>(`/quizzes/${quizId}/`);
    return response.data;
  },

  getQuizManage: async (quizId: string): Promise<Quiz> => {
    const response = await apiClient.get<Quiz>(`/quizzes/${quizId}/manage/`);
    return response.data;
  },

  createQuiz: async (courseId: string, data: Partial<Quiz>): Promise<Quiz> => {
    const response = await apiClient.post<Quiz>(`/courses/${courseId}/quizzes/`, data);
    return response.data;
  },

  updateQuiz: async (quizId: string, data: Partial<Quiz>): Promise<Quiz> => {
    const response = await apiClient.patch<Quiz>(`/quizzes/${quizId}/manage/`, data);
    return response.data;
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    await apiClient.delete(`/quizzes/${quizId}/manage/`);
  },

  // Question Authoring
  createQuestion: async (
    quizId: string,
    data: QuestionInput
  ): Promise<Question> => {
    const response = await apiClient.post<Question>(`/quizzes/${quizId}/questions/`, data);
    return response.data;
  },

  updateQuestion: async (
    questionId: string,
    data: QuestionInput
  ): Promise<Question> => {
    const response = await apiClient.patch<Question>(`/questions/${questionId}/`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: string): Promise<void> => {

    await apiClient.delete(`/questions/${questionId}/`);
  },

  // Student Attempt Lifecycle
  startQuiz: async (quizId: string): Promise<QuizAttempt> => {
    const response = await apiClient.post<QuizAttempt>(`/quizzes/${quizId}/start/`);
    return response.data;
  },

  getAttempt: async (attemptId: string): Promise<QuizAttempt> => {
    const response = await apiClient.get<QuizAttempt>(`/attempts/${attemptId}/`);
    return response.data;
  },

  saveAnswers: async (
    attemptId: string,
    answers: { question_id: string; selected_option_id: string }[]
  ): Promise<void> => {
    await apiClient.put(`/attempts/${attemptId}/answers/`, { answers });
  },

  submitAttempt: async (
    attemptId: string,
    answers?: { question_id: string; selected_option_id: string }[]
  ): Promise<QuizAttempt> => {
    const response = await apiClient.post<QuizAttempt>(`/attempts/${attemptId}/submit/`, {
      answers,
    });
    return response.data;
  },

  getMyResults: async (quizId: string): Promise<QuizResultsMe> => {
    const response = await apiClient.get<QuizResultsMe>(`/quizzes/${quizId}/results/me/`);
    return response.data;
  },
};
