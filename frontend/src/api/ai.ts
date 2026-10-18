import { apiClient } from './client';
import type {
  AIGeneratableType,
  AIResource,
  AIResourceContent,
  AIResourceType,
  ConvertedQuiz,
  PaginatedResponse,
  RevisionContent,
} from '../types';

/**
 * API client for AI study resources (see docs/api-contract.md §7).
 * The LLM is only ever called by the backend; this client never talks to a provider.
 */
export const aiApi = {
  /** Course instructor: generate a DRAFT resource from a lesson's transcript/reading material. */
  generate: async <T = AIResourceContent>(
    lessonId: string,
    resourceType: AIGeneratableType,
    count?: number
  ): Promise<AIResource<T>> => {
    const response = await apiClient.post<AIResource<T>>(`/lessons/${lessonId}/ai/generate/`, {
      resource_type: resourceType,
      ...(count !== undefined ? { count } : {}),
    });
    return response.data;
  },

  /** Instructor: all resources for the lesson. Enrolled student: published resources only. */
  listLessonResources: async (
    lessonId: string,
    params?: { resource_type?: AIResourceType; page?: number }
  ): Promise<PaginatedResponse<AIResource>> => {
    const response = await apiClient.get<PaginatedResponse<AIResource>>(`/lessons/${lessonId}/resources/`, { params });
    return response.data;
  },

  getResource: async <T = AIResourceContent>(id: string): Promise<AIResource<T>> => {
    const response = await apiClient.get<AIResource<T>>(`/resources/${id}/`);
    return response.data;
  },

  /** Instructor: replace a draft's content. The backend re-validates it (400 with details on failure). */
  updateResource: async <T = AIResourceContent>(id: string, content: T): Promise<AIResource<T>> => {
    const response = await apiClient.patch<AIResource<T>>(`/resources/${id}/`, { content });
    return response.data;
  },

  publishResource: async (id: string): Promise<AIResource> => {
    const response = await apiClient.post<AIResource>(`/resources/${id}/publish/`);
    return response.data;
  },

  /** Instructor: turn an MCQ draft into a regular DRAFT quiz, then edit it in the quiz builder. */
  convertToQuiz: async (id: string): Promise<ConvertedQuiz> => {
    const response = await apiClient.post<ConvertedQuiz>(`/resources/${id}/convert-to-quiz/`);
    return response.data;
  },

  /** Enrolled student: personalised revision built from their submitted quiz attempts. */
  generateRevision: async (courseId: string): Promise<AIResource<RevisionContent>> => {
    const response = await apiClient.post<AIResource<RevisionContent>>(`/courses/${courseId}/ai/revisions/`);
    return response.data;
  },

  listRevisions: async (courseId: string): Promise<PaginatedResponse<AIResource<RevisionContent>>> => {
    const response = await apiClient.get<PaginatedResponse<AIResource<RevisionContent>>>(`/courses/${courseId}/ai/revisions/`);
    return response.data;
  },
};
