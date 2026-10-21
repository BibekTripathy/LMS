import { describe, it, expect, vi, beforeEach } from 'vitest';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, apiError } from '../../../test/render';
import { CourseDetails } from '../CourseDetails';
import { courseApi } from '../../../api/courses';
import { enrollmentApi } from '../../../api/enrollments';
import type { CourseDetail, Enrollment } from '../../../types';

vi.mock('../../../api/courses');
vi.mock('../../../api/enrollments');

const mockDetail: CourseDetail = {
  id: 'c10',
  title: 'Cloud Architecture & DevOps',
  description: 'Master Docker, Kubernetes, CI/CD pipelines, and cloud systems.',
  instructor: 'inst-10',
  instructor_name: 'Alex Cloud',
  category: 'Computer Science',
  difficulty: 'INTERMEDIATE',
  thumbnail_url: null,
  is_published: true,
  status: 'PUBLISHED',
  modules_count: 2,
  lessons_count: 3,
  is_enrolled: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-02',
  modules: [
    {
      id: 'm1',
      course: 'c10',
      title: 'Module 1: Docker Basics',
      description: 'Understanding containers and images.',
      order: 1,
      position: 1,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      lessons: [
        {
          id: 'l1',
          title: 'Introduction to Containers',
          video_url: 'https://cdn.example.com/l1.mp4',
          order: 1,
          position: 1,
          is_required: true,
        },
        {
          id: 'l2',
          title: 'Writing Dockerfiles',
          video_url: 'https://cdn.example.com/l2.mp4',
          order: 2,
          position: 2,
          is_required: true,
        },
      ],
    },
    {
      id: 'm2',
      course: 'c10',
      title: 'Module 2: Kubernetes Orchestration',
      description: 'Deploying pods and services.',
      order: 2,
      position: 2,
      created_at: '2026-01-02',
      updated_at: '2026-01-02',
      lessons: [
        {
          id: 'l3',
          title: 'Pods & Services',
          video_url: 'https://cdn.example.com/l3.mp4',
          order: 1,
          position: 1,
          is_required: true,
        },
      ],
    },
  ],
};

describe('CourseDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseApi.getCourseById).mockResolvedValue(mockDetail);
    vi.mocked(enrollmentApi.getMyEnrollments).mockResolvedValue([]);
  });

  it('renders detailed course information, curriculum syllabus, and enroll button', async () => {
    renderWithProviders(<CourseDetails />, {
      route: '/courses/c10',
      path: '/courses/:id',
    });

    expect(await screen.findByText('Cloud Architecture & DevOps')).toBeInTheDocument();
    expect(screen.getByText('Alex Cloud')).toBeInTheDocument();
    expect(screen.getByText('Module 1: Docker Basics')).toBeInTheDocument();
    expect(screen.getByText('Module 2: Kubernetes Orchestration')).toBeInTheDocument();
    expect(screen.getByText(/1.1 Introduction to Containers/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enroll in course/i })).toBeInTheDocument();
  });

  it('handles enrollment click and enrolls user in course', async () => {
    const user = userEvent.setup();
    const createdEnrollment: Enrollment = {
      id: 'new-e1',
      student: 'u1',
      student_email: 's@x.test',
      student_name: 'Saanvi',
      course: 'c10',
      enrolled_at: '2026-01-01',
      status: 'ACTIVE',
    };
    vi.mocked(enrollmentApi.enrollInCourse).mockResolvedValue(createdEnrollment);

    renderWithProviders(<CourseDetails />, {
      route: '/courses/c10',
      path: '/courses/:id',
    });

    const enrollBtn = await screen.findByRole('button', { name: /enroll in course/i });
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(enrollmentApi.enrollInCourse).toHaveBeenCalledWith('c10');
    });
  });

  it('shows Enrolled state and prevents duplicate enrollments when already enrolled', async () => {
    vi.mocked(enrollmentApi.getMyEnrollments).mockResolvedValue([
      {
        id: 'e10',
        student: 'u1',
        student_email: 's@x.test',
        student_name: 'Saanvi',
        course: 'c10',
        enrolled_at: '2026-01-01',
        status: 'ACTIVE',
      },
    ]);

    renderWithProviders(<CourseDetails />, {
      route: '/courses/c10',
      path: '/courses/:id',
    });

    expect(await screen.findByText(/enrolled • continue learning/i)).toBeInTheDocument();
  });

  it('renders not found error state if course does not exist', async () => {
    vi.mocked(courseApi.getCourseById).mockRejectedValueOnce(apiError(404, 'Course not found'));

    renderWithProviders(<CourseDetails />, {
      route: '/courses/c999',
      path: '/courses/:id',
    });

    expect(await screen.findByText('Course Not Found')).toBeInTheDocument();
    expect(screen.getByText('Course not found')).toBeInTheDocument();
  });
});
