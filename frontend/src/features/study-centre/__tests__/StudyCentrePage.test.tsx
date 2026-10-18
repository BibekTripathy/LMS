import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyCentrePage } from '../StudyCentrePage';
import { aiApi } from '../../../api/ai';
import { courseApi } from '../../../api/courses';
import { apiError, renderWithProviders } from '../../../test/render';
import type { AIResource, Course, CourseDetail, Lesson } from '../../../types';

vi.mock('../../../api/ai', () => ({
  aiApi: { getAIResources: vi.fn(), generateFlashcards: vi.fn(), generateSummary: vi.fn(), generateMCQs: vi.fn() },
}));
vi.mock('../../../api/courses', () => ({
  courseApi: { getCourses: vi.fn(), getCourseById: vi.fn(), getLessonById: vi.fn() },
}));
const ai = vi.mocked(aiApi);
const courses = vi.mocked(courseApi);

const summaryResource = {
  id: 'r1', lesson: 'l1', lesson_title: 'Network layer', resource_type: 'SUMMARY', generated_at: '2026-10-18T00:00:00Z',
  content: { summary: 'Routing is performed by the network layer.', key_takeaways: ['Routers forward packets.'] },
} as unknown as AIResource;

describe('StudyCentrePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    courses.getCourses.mockResolvedValue([{ id: 'c1', title: 'Networks' } as Course]);
    courses.getCourseById.mockResolvedValue({ id: 'c1', modules: [{ id: 'm1', lessons: [{ id: 'l1', title: 'Network layer' }] }] } as unknown as CourseDetail);
    courses.getLessonById.mockResolvedValue({ id: 'l1', title: 'Network layer', transcript: 'Routing text.' } as Lesson);
  });

  it('shows loading, then the empty state', async () => {
    ai.getAIResources.mockResolvedValue([]);
    renderWithProviders(<StudyCentrePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('No study resources yet')).toBeInTheDocument();
  });

  it('shows the API error state', async () => {
    ai.getAIResources.mockRejectedValue(apiError(500, 'Server exploded.'));
    renderWithProviders(<StudyCentrePage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded.');
  });

  it('renders stored resources from the API', async () => {
    ai.getAIResources.mockResolvedValue([summaryResource]);
    renderWithProviders(<StudyCentrePage />);
    expect(await screen.findByText('Routing is performed by the network layer.')).toBeInTheDocument();
  });

  it('shows AI provider failures from the backend and stays usable', async () => {
    ai.getAIResources.mockResolvedValue([]);
    ai.generateFlashcards.mockRejectedValue(apiError(504, 'The AI provider did not respond in time.', 'AI_TIMEOUT'));
    const user = userEvent.setup();
    renderWithProviders(<StudyCentrePage />);
    await user.click(await screen.findByRole('button', { name: /Generate resource/ }));
    await screen.findByRole('option', { name: /Network layer/ });
    const generateButtons = screen.getAllByRole('button', { name: /Generate/ });
    await user.click(generateButtons[generateButtons.length - 1]);
    expect(await screen.findByText('The AI provider did not respond in time.')).toBeInTheDocument();
    expect(ai.generateFlashcards).toHaveBeenCalledWith('l1');
  });
});
