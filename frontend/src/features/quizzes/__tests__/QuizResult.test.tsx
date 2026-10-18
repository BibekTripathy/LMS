import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { QuizResult } from '../QuizResult';
import { quizApi } from '../../../api/quizzes';
import { apiError, renderWithProviders } from '../../../test/render';
import type { QuizAttempt, QuizResultsMe } from '../../../types';

vi.mock('../../../api/quizzes', () => ({ quizApi: { getMyResults: vi.fn(), getAttempt: vi.fn() } }));
const api = vi.mocked(quizApi);

const submitted = {
  id: 'a1', status: 'SUBMITTED', started_at: '2026-10-17T10:00:00Z', percentage: 42.5, passed: false,
  answers: [], questions: [],
} as unknown as QuizAttempt;
const inProgress = { id: 'a2', status: 'IN_PROGRESS', started_at: '2026-10-18T10:00:00Z', percentage: null, passed: null } as unknown as QuizAttempt;
const summary = {
  quiz_id: 'quiz1', quiz_title: 'Q', pass_percentage: 70, total_attempts: 2, best_score: 1,
  highest_percentage: 42.5, has_passed: false, attempts: [inProgress, submitted],
} as QuizResultsMe;

const renderResult = () => renderWithProviders(<QuizResult />, { route: '/quizzes/quiz1/results', path: '/quizzes/:id/results' });

describe('QuizResult', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows the server-calculated score of the latest submitted attempt', async () => {
    api.getMyResults.mockResolvedValue(summary);
    api.getAttempt.mockResolvedValue(submitted);
    renderResult();
    expect(await screen.findByText('Needs Revision')).toBeInTheDocument();
    expect(screen.getAllByText('42.5%').length).toBeGreaterThan(0);
    // The in-progress attempt is never loaded for review.
    expect(api.getAttempt).toHaveBeenCalledWith('a1');
    expect(api.getAttempt).not.toHaveBeenCalledWith('a2');
  });

  it('shows the error state', async () => {
    api.getMyResults.mockRejectedValue(apiError(403, 'You must be enrolled in this course to access this quiz.'));
    renderResult();
    expect(await screen.findByText('You must be enrolled in this course to access this quiz.')).toBeInTheDocument();
  });
});
