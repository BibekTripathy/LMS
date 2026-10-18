import { describe, expect, it } from 'vitest';
import { Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { renderWithProviders, student, instructor } from '../../../test/render';

const page = (
  <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
    <p>Instructor studio</p>
  </ProtectedRoute>
);

describe('ProtectedRoute', () => {
  it('redirects anonymous users to login', () => {
    renderWithProviders(page, { user: null, extraRoutes: [<Route key="l" path="/login" element={<p>Login page</p>} />], path: '/instructor', route: '/instructor' });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('blocks the wrong role', () => {
    renderWithProviders(page, { user: student });
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Instructor studio')).not.toBeInTheDocument();
  });

  it('shows a loading state while the session loads, then the page for allowed roles', () => {
    const { unmount } = renderWithProviders(page, { user: null, authLoading: true });
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
    unmount();
    renderWithProviders(page, { user: instructor });
    expect(screen.getByText('Instructor studio')).toBeInTheDocument();
  });
});
