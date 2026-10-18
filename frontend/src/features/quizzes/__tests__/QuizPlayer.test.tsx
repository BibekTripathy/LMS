import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizPlayer } from '../QuizPlayer';
import { quizApi } from '../../../api/quizzes';
import { apiError, renderWithProviders } from '../../../test/render';
import type { Quiz, QuizAttempt } from '../../../types';

vi.mock('../../../api/quizzes', () => ({
  quizApi: { getQuizById: vi.fn(), startQuiz: vi.fn(), getAttempt: vi.fn(), saveAnswers: vi.fn(), submitAttempt: vi.fn() },
}));
const api = vi.mocked(quizApi);

const question = {
  id: 'q1', prompt: 'Which layer routes packets?', text: 'Which layer routes packets?', question_type: 'MCQ' as const,
  marks: 1, position: 1, order: 1,
  options: [
    { id: 'o1', text: 'Network', position: 1, order: 1 },
    { id: 'o2', text: 'Physical', position: 2, order: 2 },
  ],
};
const quiz = { id: 'quiz1', title: 'Networking quiz', pass_percentage: 70, time_limit_seconds: 0, status: 'PUBLISHED', questions: [question] } as unknown as Quiz;
const attempt = { id: 'a1', quiz_id: 'quiz1', status: 'IN_PROGRESS', deadline_at: null, answers: [], questions: [question] } as unknown as QuizAttempt;

const renderPlayer = () =>
  renderWithProviders(<QuizPlayer />, {
    route: '/quizzes/quiz1', path: '/quizzes/:id',
    extraRoutes: [<Route key="r" path="/quizzes/:id/results" element={<p>Results page</p>} />],
  });

describe('QuizPlayer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.getQuizById.mockResolvedValue(quiz);
    api.startQuiz.mockResolvedValue(attempt);
    api.getAttempt.mockResolvedValue(attempt);
    api.saveAnswers.mockResolvedValue();
  });

  it('shows a loading state, then the question from the server', async () => {
    renderPlayer();
    expect(screen.getByText('Initializing assessment session...')).toBeInTheDocument();
    expect(await screen.findByText('Which layer routes packets?')).toBeInTheDocument();
    expect(api.startQuiz).toHaveBeenCalledTimes(1);
  });

  it('shows the server error when the quiz cannot start', async () => {
    api.startQuiz.mockRejectedValue(apiError(404, 'Quiz not found.'));
    renderPlayer();
    expect(await screen.findByText('Quiz not found.')).toBeInTheDocument();
  });

  it('saves the selection and submits the chosen answer, then opens results', async () => {
    api.submitAttempt.mockResolvedValue({ ...attempt, status: 'SUBMITTED', percentage: 100 } as QuizAttempt);
    const user = userEvent.setup();
    renderPlayer();
    await user.click(await screen.findByText('Network'));
    expect(api.saveAnswers).toHaveBeenCalledWith('a1', [{ question_id: 'q1', selected_option_id: 'o1' }]);

    await user.click(screen.getByRole('button', { name: /Finish & Submit/ }));
    await user.click(screen.getByRole('button', { name: /Submit & View Results/ }));
    await waitFor(() => expect(api.submitAttempt).toHaveBeenCalledWith('a1', [{ question_id: 'q1', selected_option_id: 'o1' }]));
    expect(await screen.findByText('Results page')).toBeInTheDocument();
  });

  it('restores answers already saved on the server', async () => {
    api.getAttempt.mockResolvedValue({ ...attempt, answers: [{ id: 'x', question_id: 'q1', selected_option_id: 'o2' }] } as QuizAttempt);
    api.submitAttempt.mockResolvedValue({ ...attempt, status: 'SUBMITTED' } as QuizAttempt);
    const user = userEvent.setup();
    renderPlayer();
    await screen.findByText('Which layer routes packets?');
    await user.click(screen.getByRole('button', { name: /Finish & Submit/ }));
    await user.click(screen.getByRole('button', { name: /Submit & View Results/ }));
    await waitFor(() => expect(api.submitAttempt).toHaveBeenCalledWith('a1', [{ question_id: 'q1', selected_option_id: 'o2' }]));
  });

  it('shows a submission failure from the server', async () => {
    api.submitAttempt.mockRejectedValue(apiError(400, 'The quiz deadline has expired.'));
    const user = userEvent.setup();
    renderPlayer();
    await screen.findByText('Which layer routes packets?');
    await user.click(screen.getByRole('button', { name: /Finish & Submit/ }));
    await user.click(screen.getByRole('button', { name: /Submit & View Results/ }));
    expect(await screen.findByText('The quiz deadline has expired.')).toBeInTheDocument();
  });
});
