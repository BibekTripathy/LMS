import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Navbar } from '../Navbar';
import { instructor, renderWithProviders, student } from '../../../test/render';
import type { User } from '../../../types';

const linkNames = () => screen.getAllByRole('link').map((a) => a.textContent?.trim());

describe('Navbar', () => {
  it('shows learner links to students', () => {
    renderWithProviders(<Navbar />, { user: student });
    expect(linkNames()).toEqual(expect.arrayContaining(['Dashboard', 'Analytics', 'Certificates']));
    expect(linkNames()).not.toContain('Studio');
  });

  it('hides student-only pages from instructors', () => {
    renderWithProviders(<Navbar />, { user: instructor });
    expect(linkNames()).toContain('Studio');
    expect(linkNames()).not.toContain('Certificates');
    expect(linkNames()).not.toContain('Analytics');
  });

  it('adds platform analytics for admins', () => {
    const admin: User = { ...instructor, id: 'a1', role: 'ADMIN' };
    renderWithProviders(<Navbar />, { user: admin });
    expect(linkNames()).toContain('Platform');
  });

  it('offers sign-in and certificate verification when logged out', () => {
    renderWithProviders(<Navbar />, { user: null });
    expect(linkNames()).toEqual(expect.arrayContaining(['Courses', 'Verify Certificate', 'Sign in']));
  });
});
