import { apiClient } from './client';
import type {
  AIResource,
  AIResourceType,
  FlashcardContent,
  SummaryContent,
  MCQContent,
} from '../types';

/**
 * API client service for AI Study Resources.
 * All generation endpoints require active enrollment in the parent course.
 */
export const aiApi = {
  /**
   * Generates, stores, and returns structured flashcards for a specific lesson.
   */
  generateFlashcards: async (lessonId: string): Promise<AIResource<FlashcardContent>> => {
    const response = await apiClient.post<AIResource<FlashcardContent>>('/ai/generate-flashcards/', {
      lesson_id: lessonId,
    });
    return response.data;
  },

  /**
   * Generates, stores, and returns an executive summary with key takeaways.
   */
  generateSummary: async (lessonId: string): Promise<AIResource<SummaryContent>> => {
    const response = await apiClient.post<AIResource<SummaryContent>>('/ai/generate-summary/', {
      lesson_id: lessonId,
    });
    return response.data;
  },

  /**
   * Generates, stores, and returns structured revision MCQs.
   */
  generateMCQs: async (lessonId: string): Promise<AIResource<MCQContent>> => {
    const response = await apiClient.post<AIResource<MCQContent>>('/ai/generate-mcq/', {
      lesson_id: lessonId,
    });
    return response.data;
  },

  /**
   * Retrieves previously generated study resources for the authenticated student.
   * Can be filtered by lesson_id and resource_type.
   */
  getAIResources: async (params?: {
    lesson_id?: string;
    resource_type?: AIResourceType;
  }): Promise<AIResource[]> => {
    const response = await apiClient.get<AIResource[]>('/ai/resources/', { params });
    return response.data;
  },

  /**
   * Fetches a single AI resource by ID.
   */
  getAIResource: async (id: string): Promise<AIResource> => {
    const response = await apiClient.get<AIResource>(`/ai/resources/${id}/`);
    return response.data;
  },

  /**
   * Deletes a specific AI resource owned by the student.
   */
  deleteAIResource: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/resources/${id}/`);
  },
};
