import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { CourseQuizList } from '../CourseQuizList';
import { quizApi } from '../../../api/quizzes';
import { renderWithProviders } from '../../../test/render';
import type { Quiz, QuizResultsMe } from '../../../types';

vi.mock('../../../api/quizzes', () => ({ quizApi: { getCourseQuizzes: vi.fn(), getMyResults: vi.fn() } }));
const api = vi.mocked(quizApi);

const quiz = (id: string, extra: Partial<Quiz> = {}) =>
  ({ id, title: `Quiz ${id}`, status: 'PUBLISHED', total_questions: 3, pass_percentage: 60, time_limit_seconds: 600,
     max_attempts: null, leaderboard_enabled: true, ...extra }) as Quiz;
const results = (extra: Partial<QuizResultsMe>) =>
  ({ total_attempts: 0, attempts_remaining: null, max_attempts: null, highest_percentage: null, has_passed: false,
     attempts: [], ...extra }) as QuizResultsMe;

describe('CourseQuizList', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lets a student take, review and rank each published quiz', async () => {
    api.getCourseQuizzes.mockResolvedValue([quiz('new'), quiz('done', { max_attempts: 2, leaderboard_enabled: false })]);
    api.getMyResults.mockImplementation(async (id: string) =>
      id === 'done'
        ? results({ total_attempts: 2, attempts_remaining: 0, max_attempts: 2, highest_percentage: 80, has_passed: true })
        : results({}));
    renderWithProviders(<CourseQuizList courseId="c1" />);

    const fresh = await screen.findByTestId('course-quiz-new');
    expect(within(fresh).getByRole('link', { name: /take quiz/i })).toHaveAttribute('href', '/quizzes/new');
    expect(within(fresh).queryByRole('link', { name: 'Results' })).not.toBeInTheDocument();
    expect(within(fresh).getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();

    const finished = screen.getByTestId('course-quiz-done');
    expect(await within(finished).findByText('Best 80%')).toBeInTheDocument();
    expect(within(finished).getByText('No attempts left')).toBeInTheDocument();
    expect(within(finished).getByRole('link', { name: 'Results' })).toHaveAttribute('href', '/quizzes/done/results');
    expect(within(finished).queryByRole('link', { name: /leaderboard/i })).not.toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    api.getCourseQuizzes.mockResolvedValue([]);
    renderWithProviders(<CourseQuizList courseId="c1" />);
    expect(await screen.findByText('No quizzes in this course yet.')).toBeInTheDocument();
  });
});
