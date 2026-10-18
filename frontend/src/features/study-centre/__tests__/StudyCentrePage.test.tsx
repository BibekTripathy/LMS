import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyCentrePage } from '../StudyCentrePage';
import { aiApi } from '../../../api/ai';
import { courseApi } from '../../../api/courses';
import { enrollmentApi } from '../../../api/enrollments';
import { apiError, instructor, renderWithProviders, student } from '../../../test/render';
import type { AIResource, Course, CourseDetail, Enrollment, Lesson, PaginatedResponse, RevisionContent } from '../../../types';

vi.mock('../../../api/ai', () => ({
  aiApi: {
    generate: vi.fn(), listLessonResources: vi.fn(), getResource: vi.fn(), updateResource: vi.fn(),
    publishResource: vi.fn(), convertToQuiz: vi.fn(), generateRevision: vi.fn(), listRevisions: vi.fn(),
  },
}));
vi.mock('../../../api/courses', () => ({
  courseApi: { getCourses: vi.fn(), getCourseById: vi.fn(), getLessonById: vi.fn() },
}));
vi.mock('../../../api/enrollments', () => ({ enrollmentApi: { getMyEnrollments: vi.fn() } }));

const ai = vi.mocked(aiApi);
const courses = vi.mocked(courseApi);
const enrollments = vi.mocked(enrollmentApi);

const course = { id: 'c1', title: 'Networks' } as Course;
const page = <T,>(results: T[]): PaginatedResponse<T> => ({ count: results.length, next: null, previous: null, results });

const draftMcq = {
  id: 'r1', lesson: 'l1', lesson_title: 'Network layer', resource_type: 'MCQ', status: 'DRAFT', converted_quiz: null,
  content: {
    title: 'Routing check',
    questions: [{ prompt: 'Which layer routes?', options: ['Network', 'Physical'], correct_option_index: 0, explanation: 'Routing.' }],
  },
} as unknown as AIResource;
const publishedSummary = {
  id: 'r2', lesson: 'l1', lesson_title: 'Network layer', resource_type: 'SUMMARY', status: 'PUBLISHED', converted_quiz: null,
  content: { title: 'Lesson summary', summary: 'Routing is performed by the network layer.', key_points: ['Routers forward packets.'], revision_topics: [] },
} as unknown as AIResource;

beforeEach(() => {
  vi.resetAllMocks();
  courses.getCourses.mockResolvedValue([course]);
  courses.getCourseById.mockResolvedValue({ id: 'c1', modules: [{ id: 'm1', lessons: [{ id: 'l1', title: 'Network layer' }] }] } as unknown as CourseDetail);
  courses.getLessonById.mockResolvedValue({ id: 'l1', title: 'Network layer', transcript: 'Routing text.' } as Lesson);
  enrollments.getMyEnrollments.mockResolvedValue([{ id: 'e1', status: 'ACTIVE', course: 'c1', course_detail: course } as Enrollment]);
  ai.listRevisions.mockResolvedValue(page([]));
});

describe('StudyCentrePage (instructor)', () => {
  it('lists drafts, publishes and converts MCQs through the backend', async () => {
    ai.listLessonResources.mockResolvedValue(page([draftMcq]));
    ai.publishResource.mockResolvedValue({ ...draftMcq, status: 'PUBLISHED' } as AIResource);
    ai.convertToQuiz.mockResolvedValue({ id: 'quiz9', course: 'c1', lesson: 'l1', title: 'Routing check', status: 'DRAFT', total_questions: 1, total_marks: 1 });
    const user = userEvent.setup();
    renderWithProviders(<StudyCentrePage />, { user: instructor });

    expect(await screen.findByText('Which layer routes?')).toBeInTheDocument();
    expect(screen.getByText(/Practice MCQs · Draft/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Convert to graded quiz' }));
    await waitFor(() => expect(ai.convertToQuiz).toHaveBeenCalledWith('r1'));
    expect(await screen.findByText(/Draft quiz “Routing check” created with 1 questions/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publish to students' }));
    await waitFor(() => expect(ai.publishResource).toHaveBeenCalledWith('r1'));
  });

  it('shows AI provider failures from the backend', async () => {
    ai.listLessonResources.mockResolvedValue(page([]));
    ai.generate.mockRejectedValue(apiError(504, 'The AI provider did not respond in time.', 'AI_TIMEOUT'));
    const user = userEvent.setup();
    renderWithProviders(<StudyCentrePage />, { user: instructor });

    await screen.findByText('No study resources for this lesson yet');
    const button = await screen.findByRole('button', { name: 'Generate draft' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent('The AI provider did not respond in time.');
    expect(ai.generate).toHaveBeenCalledWith('l1', 'FLASHCARDS', 5);
  });

  it('shows server validation problems when saving an edited draft', async () => {
    ai.listLessonResources.mockResolvedValue(page([draftMcq]));
    ai.updateResource.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { error: 'Content is invalid.', code: 'VALIDATION_ERROR', details: { content: ['questions[0].options: must not contain duplicates'] } } },
    });
    const user = userEvent.setup();
    renderWithProviders(<StudyCentrePage />, { user: instructor });

    await user.click(await screen.findByRole('button', { name: 'Edit draft' }));
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Content is invalid.');
    expect(alert).toHaveTextContent('must not contain duplicates');
  });
});

describe('StudyCentrePage (student)', () => {
  it('shows only what the API returns, with loading and empty states', async () => {
    ai.listLessonResources.mockResolvedValue(page([publishedSummary]));
    renderWithProviders(<StudyCentrePage />, { user: student });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Routing is performed by the network layer.')).toBeInTheDocument();
    expect(screen.queryByText('Generate draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Publish to students')).not.toBeInTheDocument();
    expect(await screen.findByText(/Submit a quiz in this course/)).toBeInTheDocument();
  });

  it('shows the resource list error state', async () => {
    ai.listLessonResources.mockRejectedValue(apiError(403, 'You must be enrolled in this course to view its study resources.'));
    renderWithProviders(<StudyCentrePage />, { user: student });
    expect(await screen.findByText('You must be enrolled in this course to view its study resources.')).toBeInTheDocument();
  });

  it('creates a revision plan and shows the server-computed figures', async () => {
    ai.listLessonResources.mockResolvedValue(page([]));
    const revision = {
      id: 'rev1', resource_type: 'REVISION', status: 'PUBLISHED',
      content: {
        title: 'Your revision plan', overview: 'Focus on routing.',
        focus_areas: [{ topic: 'Network layer', reason: 'Accuracy 0%.', actions: ['Re-read the lesson.'] }],
        next_steps: ['Retake the quiz.'],
        performance: {
          submitted_attempts: 2, quizzes_attempted: 2, overall_accuracy_percent: 50,
          topics: [{ topic: 'Network layer', accuracy_percent: 0, target_percent: 70, questions_answered: 2, questions_correct: 0 }],
          weak_topics: [],
        },
      } as RevisionContent,
    } as unknown as AIResource<RevisionContent>;
    ai.generateRevision.mockResolvedValue(revision);
    ai.listRevisions.mockResolvedValueOnce(page([])).mockResolvedValue(page([revision]));
    const user = userEvent.setup();
    renderWithProviders(<StudyCentrePage />, { user: student });

    await user.click(await screen.findByRole('button', { name: 'Create my plan' }));
    expect(await screen.findByText('Focus on routing.')).toBeInTheDocument();
    expect(screen.getByText(/Based on 2 submitted attempt\(s\), overall accuracy 50%/)).toBeInTheDocument();
    expect(ai.generateRevision).toHaveBeenCalledWith('c1');
  });

  it('shows the no-attempts error from the backend', async () => {
    ai.listLessonResources.mockResolvedValue(page([]));
    ai.generateRevision.mockRejectedValue(apiError(400, 'Submit at least one quiz in this course before requesting a revision summary.', 'NO_ATTEMPTS'));
    const user = userEvent.setup();
    renderWithProviders(<StudyCentrePage />, { user: student });
    await user.click(await screen.findByRole('button', { name: 'Create my plan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Submit at least one quiz');
  });
});
