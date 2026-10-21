import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courses';
import { progressApi } from '../../api/progress';
import type { Lesson, LessonProgress, CourseProgress, CourseDetail } from '../../types';

export const learningQueryKeys = {
  lesson: (id: string) => ['lessons', 'detail', id] as const,
  progress: (lessonId: string) => ['lessons', 'progress', lessonId] as const,
  courseProgress: (courseId: string) => ['progress', 'course', courseId] as const,
  courseDetail: (courseId: string) => ['courses', 'detail', courseId] as const,
};

export function useLesson(id: string | undefined) {
  return useQuery<Lesson, Error>({
    queryKey: learningQueryKeys.lesson(id ?? ''),
    queryFn: () => courseApi.getLessonById(id!),
    enabled: !!id,
  });
}

export function useLessonProgress(lessonId: string | undefined) {
  return useQuery<LessonProgress, Error>({
    queryKey: learningQueryKeys.progress(lessonId ?? ''),
    queryFn: () => progressApi.getLessonProgress(lessonId!),
    enabled: !!lessonId,
  });
}

export function useCourseProgress(courseId: string | undefined) {
  return useQuery<CourseProgress, Error>({
    queryKey: learningQueryKeys.courseProgress(courseId ?? ''),
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: !!courseId,
  });
}

export function useCourseDetail(courseId: string | undefined) {
  return useQuery<CourseDetail, Error>({
    queryKey: learningQueryKeys.courseDetail(courseId ?? ''),
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
  });
}

export function useUpdateLessonProgress(lessonId: string | undefined, courseId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    LessonProgress,
    Error,
    { last_position_seconds?: number; timestamp?: number; completed?: boolean; is_completed?: boolean }
  >({
    mutationFn: (data) => progressApi.updateLessonProgress(lessonId!, data),
    onSuccess: (updated) => {
      if (lessonId) {
        queryClient.setQueryData(learningQueryKeys.progress(lessonId), updated);
      }
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: learningQueryKeys.courseProgress(courseId) });
      }
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useCompleteLesson(lessonId: string | undefined, courseId?: string) {
  const queryClient = useQueryClient();

  return useMutation<LessonProgress, Error, void>({
    mutationFn: () => progressApi.completeLesson(lessonId!),
    onSuccess: (updated) => {
      if (lessonId) {
        queryClient.setQueryData(learningQueryKeys.progress(lessonId), updated);
      }
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: learningQueryKeys.courseProgress(courseId) });
      }
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
