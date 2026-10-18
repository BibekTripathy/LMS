import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, type AuthContextType } from '../context/auth';
import type { User } from '../types';

export const student: User = { id: 'u1', email: 's@x.test', first_name: 'S', last_name: 'T', role: 'STUDENT' };
export const instructor: User = { id: 'u2', email: 'i@x.test', first_name: 'I', last_name: 'N', role: 'INSTRUCTOR' };

function authValue(user: User | null, loading = false): AuthContextType {
  const noop = async () => {};
  return {
    user, loading, login: noop, register: noop, logout: noop, refreshUser: noop,
    isInstructor: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    isStudent: user?.role === 'STUDENT',
    isAdmin: user?.role === 'ADMIN',
  };
}

/** Render `ui` at `route` (matched against `path`) with a fresh query client and a fake auth context. */
export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', path = '*', user = student as User | null, authLoading = false, extraRoutes = [] as React.ReactElement[] } = {}
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={authValue(user, authLoading)}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            {extraRoutes}
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

/** Shape of an Axios error carrying a backend `{error, code}` body. */
export function apiError(status: number, error: string, code = 'ERROR') {
  return Object.assign(new Error(error), {
    isAxiosError: true,
    response: { status, data: { error, code } },
  });
}
