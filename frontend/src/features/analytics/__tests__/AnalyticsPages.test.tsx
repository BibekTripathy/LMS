import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CourseAnalyticsPage } from '../CourseAnalyticsPage';
import { AdminAnalyticsPage } from '../AdminAnalyticsPage';
import { QuizLeaderboardPage } from '../QuizLeaderboardPage';
import { analyticsApi } from '../../../api/analytics';
import { apiError, instructor, renderWithProviders, student } from '../../../test/render';
import type { AdminAnalytics, CourseAnalytics, QuizLeaderboard } from '../../../types';

vi.mock('../../../api/analytics', () => ({
  analyticsApi: { getCourseAnalytics: vi.fn(), getAdminAnalytics: vi.fn(), getQuizLeaderboard: vi.fn() },
}));
const api = vi.mocked(analyticsApi);

const courseAnalytics: CourseAnalytics = {
  course_id: 'c1', course_title: 'Distributed Systems', status: 'PUBLISHED',
  total_enrollments: 3, active_enrollments: 2, completed_enrollments: 1, dropped_enrollments: 0,
  completion_rate: 33.33, average_course_progress: 55.5, total_lessons: 2, total_quizzes: 1,
  total_quiz_attempts: 4, average_quiz_score: 72.5, quiz_pass_rate: 50,
  lessons_breakdown: [
    { lesson_id: 'l1', title: 'Paxos', module_id: 'm1', module_title: 'Consensus', order: 1, completed_count: 2, completion_rate: 66.7 },
  ],
  quizzes_breakdown: [
    { quiz_id: 'q1', title: 'Consensus Quiz', status: 'PUBLISHED', pass_percentage: 70, total_attempts: 4,
      unique_students_attempted: 2, average_score: 72.5, pass_rate: 50, highest_score: 100 },
  ],
  students: [
    { student_id: 's1', student_name: 'Alice Smith', student_email: 'alice@example.com', enrolled_at: '2026-10-01T00:00:00Z',
      status: 'ACTIVE', completed_lessons_count: 1, total_lessons_count: 2, progress_percentage: 50, is_completed: false,
      quiz_attempts_count: 2, average_quiz_score: 80, quizzes_passed_count: 1, last_active: '2026-10-20T00:00:00Z' },
  ],
};

const leaderboard: QuizLeaderboard = {
  quiz_id: 'q1', quiz_title: 'Consensus Quiz', course_id: 'c1', course_title: 'Distributed Systems',
  pass_percentage: 70, total_participants: 2,
  leaderboard: [
    { rank: 1, student_id: 'other', student_name: 'Learner', student_email: null, best_score: 10,
      highest_percentage: 100, total_attempts: 1, passed: true, submitted_at: '2026-10-20T00:00:00Z' },
    { rank: 2, student_id: student.id, student_name: 'S T', student_email: null, best_score: 5,
      highest_percentage: 50, total_attempts: 2, passed: false, submitted_at: '2026-10-20T00:00:00Z' },
  ],
  my_entry: null,
};

describe('CourseAnalyticsPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders enrollment, lesson, quiz and student statistics from the API', async () => {
    api.getCourseAnalytics.mockResolvedValue(courseAnalytics);
    renderWithProviders(<CourseAnalyticsPage />, {
      route: '/instructor/courses/c1/analytics', path: '/instructor/courses/:id/analytics', user: instructor,
    });

    expect(await screen.findByTestId('stat-enrollments')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-completion')).toHaveTextContent('33.33%');
    expect(screen.getByTestId('quiz-stats-table')).toHaveTextContent('Consensus Quiz');
    expect(screen.getByTestId('student-stats-table')).toHaveTextContent('alice@example.com');
    expect(api.getCourseAnalytics).toHaveBeenCalledWith('c1');
  });

  it('shows the API error for a course the instructor does not own', async () => {
    api.getCourseAnalytics.mockRejectedValue(apiError(403, 'You do not have permission to view analytics for this course.'));
    renderWithProviders(<CourseAnalyticsPage />, {
      route: '/instructor/courses/c1/analytics', path: '/instructor/courses/:id/analytics', user: instructor,
    });
    expect(await screen.findByText('You do not have permission to view analytics for this course.')).toBeInTheDocument();
  });
});

describe('AdminAnalyticsPage', () => {
  it('renders platform totals', async () => {
    api.getAdminAnalytics.mockResolvedValue({
      users: { total_users: 12, total_students: 9, total_instructors: 2, total_admins: 1, active_users: 11 },
      courses: { total_courses: 4, published_courses: 3, draft_courses: 1, archived_courses: 0, total_modules: 6, total_lessons: 20 },
      enrollments: { total_enrollments: 15, active_enrollments: 10, completed_enrollments: 5, dropped_enrollments: 0, completion_rate: 33.3 },
      progress: { total_progress_records: 40, total_completed_lessons: 30 },
      assessments: {
        total_quizzes: 5, published_quizzes: 4, total_questions: 25, total_quiz_attempts: 18, submitted_quiz_attempts: 16,
        in_progress_quiz_attempts: 1, expired_quiz_attempts: 1, passed_quiz_attempts: 12, average_quiz_score: 74, overall_quiz_pass_rate: 75,
      },
    } as AdminAnalytics);
    renderWithProviders(<AdminAnalyticsPage />, { route: '/admin/analytics', path: '/admin/analytics' });
    expect(await screen.findByTestId('stat-users')).toHaveTextContent('12');
    expect(screen.getByTestId('stat-courses')).toHaveTextContent('4');
    expect(screen.getByText('75% pass rate')).toBeInTheDocument();
  });
});

describe('QuizLeaderboardPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('ranks learners and highlights the current student without showing emails', async () => {
    api.getQuizLeaderboard.mockResolvedValue(leaderboard);
    renderWithProviders(<QuizLeaderboardPage />, { route: '/quizzes/q1/leaderboard', path: '/quizzes/:id/leaderboard' });

    const table = await screen.findByTestId('leaderboard-table');
    expect(table).toHaveTextContent('S T (you)');
    expect(table).toHaveTextContent('100%');
    expect(table).not.toHaveTextContent('@');
  });

  it('explains when the instructor has turned the leaderboard off', async () => {
    api.getQuizLeaderboard.mockRejectedValue(apiError(403, 'The leaderboard is turned off for this quiz.', 'LEADERBOARD_DISABLED'));
    renderWithProviders(<QuizLeaderboardPage />, { route: '/quizzes/q1/leaderboard', path: '/quizzes/:id/leaderboard' });
    expect(await screen.findByText('Leaderboard turned off')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });
});
