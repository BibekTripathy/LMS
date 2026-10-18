import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../../api/ai';
import { enrollmentApi } from '../../api/enrollments';
import type { AIGeneratableType, AIResourceContent } from '../../types';

export const aiKeys = {
  lesson: (lessonId: string) => ['ai-resources', 'lesson', lessonId] as const,
  revisions: (courseId: string) => ['ai-resources', 'revisions', courseId] as const,
  enrollments: ['enrollments', 'me'] as const,
};

export function useMyEnrollments(enabled = true) {
  return useQuery({ queryKey: aiKeys.enrollments, queryFn: enrollmentApi.getMyEnrollments, enabled });
}

/** Instructor: every resource for the lesson. Enrolled student: published resources only. */
export function useLessonResources(lessonId: string | undefined) {
  return useQuery({
    queryKey: aiKeys.lesson(lessonId ?? ''),
    queryFn: () => aiApi.listLessonResources(lessonId!),
    enabled: !!lessonId,
  });
}

export function useCourseRevisions(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: aiKeys.revisions(courseId ?? ''),
    queryFn: () => aiApi.listRevisions(courseId!),
    enabled: enabled && !!courseId,
  });
}

export function useStudyResourceMutations(lessonId?: string, courseId?: string) {
  const qc = useQueryClient();
  const refreshLesson = () => {
    if (lessonId) qc.invalidateQueries({ queryKey: aiKeys.lesson(lessonId) });
  };

  return {
    generate: useMutation({
      mutationFn: ({ type, count }: { type: AIGeneratableType; count?: number }) => aiApi.generate(lessonId!, type, count),
      onSuccess: refreshLesson,
    }),
    update: useMutation({
      mutationFn: ({ id, content }: { id: string; content: AIResourceContent }) => aiApi.updateResource(id, content),
      onSuccess: refreshLesson,
    }),
    publish: useMutation({ mutationFn: (id: string) => aiApi.publishResource(id), onSuccess: refreshLesson }),
    convert: useMutation({
      mutationFn: (id: string) => aiApi.convertToQuiz(id),
      onSuccess: () => {
        refreshLesson();
        qc.invalidateQueries({ queryKey: ['quizzes'] });
      },
    }),
    generateRevision: useMutation({
      mutationFn: () => aiApi.generateRevision(courseId!),
      onSuccess: () => {
        if (courseId) qc.invalidateQueries({ queryKey: aiKeys.revisions(courseId) });
      },
    }),
  };
}
