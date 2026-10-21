import { describe, it, expect } from 'vitest';
import { toStudentAnalytics } from '../analytics';

describe('toStudentAnalytics', () => {
  it('maps the analytics API response onto the student dashboard shape', () => {
    const result = toStudentAnalytics({
      total_enrolled_courses: 3,
      completed_courses: 1,
      total_quizzes_taken: 2,
      average_quiz_score: 77.777,
      recent_quiz_attempts: [
        {
          quiz_id: 'q1',
          quiz_title: 'Quiz 1',
          course_title: 'Course A',
          percentage: 80,
          passed: true,
          submitted_at: '2026-10-19T10:00:00Z',
        },
      ],
    });

    expect(result).toEqual({
      total_enrolled: 3,
      completed_courses: 1,
      total_quizzes_taken: 2,
      average_quiz_percentage: 77.8,
      recent_attempts: [
        {
          quiz_id: 'q1',
          quiz_title: 'Quiz 1',
          course_title: 'Course A',
          score_percentage: 80,
          passed: true,
          date: '2026-10-19T10:00:00Z',
        },
      ],
    });
  });
});
