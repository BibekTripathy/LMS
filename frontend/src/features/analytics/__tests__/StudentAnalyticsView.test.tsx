import { describe, it, expect, vi, beforeEach } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, apiError } from '../../../test/render';
import { StudentAnalyticsView } from '../StudentAnalyticsView';
import { analyticsApi } from '../../../api/analytics';
import type { StudentAnalytics } from '../../../types';

vi.mock('../../../api/analytics');

const mockAnalytics: StudentAnalytics = {
  total_enrolled: 4,
  completed_courses: 2,
  total_quizzes_taken: 8,
  average_quiz_percentage: 88.5,
  study_resources_count: 14,
  recent_attempts: [
    {
      quiz_id: 'q1',
      quiz_title: 'Docker Fundamentals Quiz',
      course_title: 'Cloud Architecture & DevOps',
      score_percentage: 92.0,
      passed: true,
      date: '2026-01-10T14:30:00Z',
    },
    {
      quiz_id: 'q2',
      quiz_title: 'React Hooks Assessment',
      course_title: 'Modern Frontend Engineering',
      score_percentage: 85.0,
      passed: true,
      date: '2026-01-08T10:15:00Z',
    },
  ],
};

describe('StudentAnalyticsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getStudentAnalytics).mockResolvedValue(mockAnalytics);
  });

  it('renders student profile and KPI analytics metrics from the real backend API', async () => {
    renderWithProviders(<StudentAnalyticsView />, {
      route: '/analytics',
      path: '/analytics',
    });

    // Verify KPI statistics
    expect(await screen.findByTestId('stat-enrolled')).toHaveTextContent('4');
    expect(screen.getByTestId('stat-completed')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-quizzes')).toHaveTextContent('8');
    expect(screen.getByTestId('stat-avg-score')).toHaveTextContent('88.5%');

    // Verify recent quiz attempts table
    expect(screen.getByTestId('recent-attempts-table')).toBeInTheDocument();
    expect(screen.getByText('Docker Fundamentals Quiz')).toBeInTheDocument();
    expect(screen.getByText('Cloud Architecture & DevOps')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getAllByText('Passed').length).toBeGreaterThan(0);
  });

  it('handles error state when analytics endpoint fails', async () => {
    const user = userEvent.setup();
    vi.mocked(analyticsApi.getStudentAnalytics).mockRejectedValueOnce(
      apiError(500, 'Analytics service error')
    );

    renderWithProviders(<StudentAnalyticsView />, {
      route: '/analytics',
      path: '/analytics',
    });

    expect(await screen.findByText('Analytics Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Analytics service error')).toBeInTheDocument();

    // Verify retry
    vi.mocked(analyticsApi.getStudentAnalytics).mockResolvedValue(mockAnalytics);
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    expect(await screen.findByTestId('stat-enrolled')).toHaveTextContent('4');
  });
});
