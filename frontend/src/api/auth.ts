import { apiClient } from './client';
import type { User, LoginPayload, RegisterPayload, AuthTokens } from '../types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/login/', payload);
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register/', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh });
      }
    } catch {
      // Ignore failure during logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me/', data);
    return response.data;
  },
};
