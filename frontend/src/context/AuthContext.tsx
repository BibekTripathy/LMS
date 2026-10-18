import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import type { LoginPayload, RegisterPayload } from '../types';
import { AuthContext } from './auth';

const ME_KEY = ['auth', 'me'] as const;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  // Tracks whether we hold a token; the profile itself comes from GET /auth/me/.
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem('access_token'));

  const meQuery = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch (err) {
        // An invalid/expired session: drop the tokens so we show the logged-out UI.
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setHasToken(false);
        throw err;
      }
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const user = hasToken ? meQuery.data ?? null : null;
  const loading = hasToken && meQuery.isLoading;

  const refreshUser = async () => {
    setHasToken(!!localStorage.getItem('access_token'));
    await queryClient.invalidateQueries({ queryKey: ME_KEY });
  };

  const login = async (payload: LoginPayload) => {
    await authApi.login(payload);
    setHasToken(true);
    await queryClient.fetchQuery({ queryKey: ME_KEY, queryFn: authApi.getMe });
  };

  const register = async (payload: RegisterPayload) => {
    await authApi.register(payload);
    // After registration, automatically log in
    await login({ email: payload.email, password: payload.password });
  };

  const logout = async () => {
    await authApi.logout();
    setHasToken(false);
    // Never show one user's cached data to the next user of this browser.
    queryClient.clear();
  };

  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isInstructor,
        isStudent,
        isAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
