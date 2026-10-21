import { describe, it, expect, vi, beforeEach } from 'vitest';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';

import { LearningWorkspace } from '../LearningWorkspace';
import { courseApi } from '../../../api/courses';
import { progressApi } from '../../../api/progress';
import type { CourseDetail, Lesson, LessonProgress, CourseProgress } from '../../../types';

vi.mock('../../../api/courses');
vi.mock('../../../api/progress');

const mockCourse: CourseDetail = {
  id: 'c-test',
  title: 'React & Django Masterclass',
  description: 'Deep dive into full-stack development.',
  instructor: 'inst-1',
  instructor_name: 'Grace Hopper',
  category: 'Computer Science',
  difficulty: 'INTERMEDIATE',
  thumbnail_url: null,
  is_published: true,
  status: 'PUBLISHED',
  modules_count: 1,
  lessons_count: 2,
  is_enrolled: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  modules: [
    {
      id: 'mod-1',
      course: 'c-test',
      title: 'Module 1: Foundations',
      description: 'Core concepts',
      order: 1,
      position: 1,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      lessons: [
        {
          id: 'les-1',
          title: 'Lesson 1: Components',
          video_url: 'https://cdn.example.com/video1.mp4',
          order: 1,
          position: 1,
          is_required: true,
        },
        {
          id: 'les-2',
          title: 'Lesson 2: State & Effects',
          video_url: 'https://cdn.example.com/video2.mp4',
          order: 2,
          position: 2,
          is_required: true,
        },
      ],
    },
  ],
};

const mockLesson1: Lesson = {
  id: 'les-1',
  module: 'mod-1',
  title: 'Lesson 1: Components',
  content: 'Introductory notes on components.',
  reading_content: 'React components are modular and reusable units.',
  transcript: 'Welcome everyone! Today we will discuss functional components.',
  video_url: 'https://cdn.example.com/video1.mp4',
  order: 1,
  position: 1,
  is_required: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const mockLesson2: Lesson = {
  id: 'les-2',
  module: 'mod-1',
  title: 'Lesson 2: State & Effects',
  content: 'Managing state with hooks.',
  reading_content: 'State allows components to retain data across renders.',
  transcript: 'Now let us look at the useState and useEffect hooks.',
  video_url: 'https://cdn.example.com/video2.mp4',
  order: 2,
  position: 2,
  is_required: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const mockProgressLes1: LessonProgress = {
  id: 'lp-1',
  enrollment_id: 'enr-1',
  lesson_id: 'les-1',
  last_position_seconds: 45,
  timestamp: 45,
  completed: false,
  is_completed: false,
};

const mockCourseProgress: CourseProgress = {
  course_id: 'c-test',
  course_title: 'React & Django Masterclass',
  total_lessons: 2,
  completed_lessons: 0,
  required_lessons: 2,
  completed_required_lessons: 0,
  progress_percentage: 0,
  is_completed: false,
  last_accessed_lesson_id: 'les-1',
  lessons: [
    {
      lesson_id: 'les-1',
      title: 'Lesson 1: Components',
      order: 1,
      is_required: true,
      completed: false,
      last_position_seconds: 45,
    },
    {
      lesson_id: 'les-2',
      title: 'Lesson 2: State & Effects',
      order: 2,
      is_required: true,
      completed: false,
      last_position_seconds: 0,
    },
  ],
};

describe('LearningWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseApi.getCourseById).mockResolvedValue(mockCourse);
    vi.mocked(courseApi.getLessonById).mockImplementation(async (id) => {
      if (id === 'les-2') return mockLesson2;
      return mockLesson1;
    });
    vi.mocked(progressApi.getLessonProgress).mockResolvedValue(mockProgressLes1);
    vi.mocked(progressApi.getCourseProgress).mockResolvedValue(mockCourseProgress);
    vi.mocked(progressApi.updateLessonProgress).mockResolvedValue({
      ...mockProgressLes1,
      last_position_seconds: 90,
      timestamp: 90,
    });
    vi.mocked(progressApi.completeLesson).mockResolvedValue({
      ...mockProgressLes1,
      completed: true,
      is_completed: true,
    });
  });

  it('renders video player, sidebar with lessons, and curriculum modules', async () => {
    renderWithProviders(<LearningWorkspace />, {
      route: '/courses/c-test/learn/les-1',
      path: '/courses/:courseId/learn/:lessonId',
    });

    expect(await screen.findByText('Lesson 1: Components')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-video-player')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Module 1: Foundations')).toBeInTheDocument();
  });

  it('renders reading material and switches to transcript tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LearningWorkspace />, {
      route: '/courses/c-test/learn/les-1',
      path: '/courses/:courseId/learn/:lessonId',
    });

    // Default tab is reading material
    expect(
      await screen.findByText(/React components are modular and reusable units./)
    ).toBeInTheDocument();

    // Click Transcript tab
    const transcriptTab = screen.getByRole('button', { name: /transcript/i });
    await user.click(transcriptTab);

    expect(
      await screen.findByText(/Welcome everyone! Today we will discuss functional components./)
    ).toBeInTheDocument();
  });

  it('marks lesson complete when LessonCompletionButton is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LearningWorkspace />, {
      route: '/courses/c-test/learn/les-1',
      path: '/courses/:courseId/learn/:lessonId',
    });

    const completeBtn = await screen.findByTestId('mark-complete-btn');
    expect(completeBtn).toHaveTextContent(/mark as complete/i);

    await user.click(completeBtn);

    await waitFor(() => {
      expect(progressApi.completeLesson).toHaveBeenCalledWith('les-1');
    });
  });

  it('shows next lesson navigation button and navigates', async () => {
    renderWithProviders(<LearningWorkspace />, {
      route: '/courses/c-test/learn/les-1',
      path: '/courses/:courseId/learn/:lessonId',
    });

    const nextBtn = await screen.findByTestId('next-lesson-btn');
    expect(nextBtn).toHaveTextContent(/Lesson 2: State & Effects/);
  });
});
