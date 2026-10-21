import { Route } from 'react-router-dom';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { renderWithProviders, apiError } from '../../../test/render';
import { StudentDashboard } from '../StudentDashboard';
import { enrollmentApi } from '../../../api/enrollments';
import { progressApi } from '../../../api/progress';
import type { Enrollment, CourseProgress } from '../../../types';

vi.mock('../../../api/enrollments');
vi.mock('../../../api/progress');

const mockEnrollments: Enrollment[] = [
  {
    id: 'e1',
    student: 'u1',
    student_email: 's@x.test',
    student_name: 'Saanvi',
    course: 'course-123',
    enrolled_at: '2026-01-01',
    status: 'ACTIVE',
    course_detail: {
      id: 'course-123',
      title: 'Full Stack Web Engineering',
      description: 'Comprehensive course on React, TypeScript, and Django.',
      instructor: 'inst-1',
      instructor_name: 'Prof. Ada',
      category: 'Computer Science',
      difficulty: 'INTERMEDIATE',
      thumbnail_url: null,
      is_published: true,
      status: 'PUBLISHED',
      modules_count: 4,
      lessons_count: 12,
      is_enrolled: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  },
];

const mockProgress: CourseProgress = {
  course_id: 'course-123',
  course_title: 'Full Stack Web Engineering',
  total_lessons: 12,
  completed_lessons: 6,
  required_lessons: 10,
  completed_required_lessons: 5,
  progress_percentage: 50.0,
  is_completed: false,
  last_accessed_lesson_id: 'lesson-456',
};

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enrollmentApi.getMyEnrollments).mockResolvedValue(mockEnrollments);
    vi.mocked(progressApi.getCourseProgress).mockResolvedValue(mockProgress);
  });

  it('renders enrolled courses and shows real completion progress bar', async () => {
    renderWithProviders(<StudentDashboard />, {
      route: '/dashboard',
      path: '/dashboard',
    });

    expect(await screen.findByText('Full Stack Web Engineering')).toBeInTheDocument();
    expect(screen.getByText('Prof. Ada')).toBeInTheDocument();

    // Verify real progress percentage from API
    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/6 of 12 lessons/)).toBeInTheDocument();

    // Verify Resume Learning button is displayed
    expect(screen.getByRole('button', { name: /resume learning/i })).toBeInTheDocument();
  });

  it('resumes learning and routes to the last viewed lesson', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StudentDashboard />, {
      route: '/dashboard',
      path: '/dashboard',
      extraRoutes: [
        <Route
          key="learn"
          path="/courses/:courseId/learn/:lessonId"
          element={<div data-testid="lesson-screen">Workspace Player Screen</div>}
        />,
      ],
    });

    const resumeBtn = await screen.findByRole('button', { name: /resume learning/i });
    await user.click(resumeBtn);

    expect(await screen.findByTestId('lesson-screen')).toBeInTheDocument();
  });


  it('renders clean empty state with explore courses button when not enrolled in anything', async () => {
    vi.mocked(enrollmentApi.getMyEnrollments).mockResolvedValue([]);

    renderWithProviders(<StudentDashboard />, {
      route: '/dashboard',
      path: '/dashboard',
    });

    expect(
      await screen.findByText(/you haven't enrolled in any courses yet/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Explore Course Catalogue')).toBeInTheDocument();
  });

  it('handles error state when enrollment fetch fails', async () => {
    vi.mocked(enrollmentApi.getMyEnrollments).mockRejectedValueOnce(
      apiError(500, 'Database query failed')
    );

    renderWithProviders(<StudentDashboard />, {
      route: '/dashboard',
      path: '/dashboard',
    });

    expect(await screen.findByText('Failed to load your dashboard')).toBeInTheDocument();
    expect(screen.getByText('Database query failed')).toBeInTheDocument();
  });
});
