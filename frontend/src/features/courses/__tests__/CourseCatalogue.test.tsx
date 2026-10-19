import { describe, it, expect, vi, beforeEach } from 'vitest';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, apiError } from '../../../test/render';
import { CourseCatalogue } from '../CourseCatalogue';
import { courseApi } from '../../../api/courses';
import { enrollmentApi } from '../../../api/enrollments';
import type { Course, Enrollment } from '../../../types';

vi.mock('../../../api/courses');
vi.mock('../../../api/enrollments');

const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'Python for Beginners',
    description: 'Learn Python programming from scratch with hands-on labs.',
    instructor: 'inst-1',
    instructor_name: 'Dr. Jane Python',
    category: 'Computer Science',
    difficulty: 'BEGINNER',
    thumbnail_url: null,
    is_published: true,
    status: 'PUBLISHED',
    modules_count: 3,
    lessons_count: 10,
    is_enrolled: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-02',
  },
  {
    id: 'c2',
    title: 'Full Stack React & DRF',
    description: 'Build production web applications with React and Django.',
    instructor: 'inst-2',
    instructor_name: 'Prof. Mark Stack',
    category: 'Web Development',
    difficulty: 'ADVANCED',
    thumbnail_url: null,
    is_published: true,
    status: 'PUBLISHED',
    modules_count: 5,
    lessons_count: 20,
    is_enrolled: true,
    created_at: '2026-01-03',
    updated_at: '2026-01-04',
  },
];

const mockEnrollments: Enrollment[] = [
  {
    id: 'e1',
    student: 'u1',
    student_email: 's@x.test',
    student_name: 'Saanvi',
    course: 'c2',
    enrolled_at: '2026-01-05',
    status: 'ACTIVE',
  },
];

describe('CourseCatalogue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseApi.getCourses).mockResolvedValue(mockCourses);
    vi.mocked(enrollmentApi.getMyEnrollments).mockResolvedValue(mockEnrollments);
  });

  it('renders published courses from the backend with enrolled badge', async () => {
    renderWithProviders(<CourseCatalogue />, { route: '/courses', path: '/courses' });

    expect(await screen.findByText('Python for Beginners')).toBeInTheDocument();
    expect(screen.getByText('Full Stack React & DRF')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jane Python')).toBeInTheDocument();
    expect(screen.getByText('Prof. Mark Stack')).toBeInTheDocument();

    // Verify enrolled badge appears for c2
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
  });

  it('filters courses when user changes search query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CourseCatalogue />, { route: '/courses', path: '/courses' });

    await screen.findByText('Python for Beginners');

    const searchInput = screen.getByPlaceholderText(/search by course title/i);
    await user.type(searchInput, 'React');

    await waitFor(() => {
      expect(courseApi.getCourses).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'React' })
      );
    });
  });

  it('renders empty state when no courses match', async () => {
    vi.mocked(courseApi.getCourses).mockResolvedValue([]);

    renderWithProviders(<CourseCatalogue />, { route: '/courses', path: '/courses' });

    expect(await screen.findByText(/no courses match your criteria/i)).toBeInTheDocument();
  });

  it('renders error state and retries on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(courseApi.getCourses).mockRejectedValueOnce(apiError(500, 'Server offline'));

    renderWithProviders(<CourseCatalogue />, { route: '/courses', path: '/courses' });

    expect(await screen.findByText('Failed to load courses')).toBeInTheDocument();
    expect(screen.getByText('Server offline')).toBeInTheDocument();

    vi.mocked(courseApi.getCourses).mockResolvedValue(mockCourses);
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    expect(await screen.findByText('Python for Beginners')).toBeInTheDocument();
  });
});
