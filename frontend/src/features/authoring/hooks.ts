import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courses';
import type { Course, Lesson } from '../../types';

export const courseKeys = {
  mine: ['courses', 'mine'] as const,
  all: ['courses', 'list'] as const,
  detail: (id: string) => ['courses', 'detail', id] as const,
  lesson: (id: string) => ['lessons', id] as const,
};

export function useMyCourses() {
  return useQuery({ queryKey: courseKeys.mine, queryFn: () => courseApi.getCourses({ my_courses: true }) });
}

export function useCourses() {
  return useQuery({ queryKey: courseKeys.all, queryFn: () => courseApi.getCourses() });
}

export function useCourseDetail(id: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(id ?? ''),
    queryFn: () => courseApi.getCourseById(id!),
    enabled: !!id,
  });
}

export function useLesson(id: string | undefined) {
  return useQuery({
    queryKey: courseKeys.lesson(id ?? ''),
    queryFn: () => courseApi.getLessonById(id!),
    enabled: !!id,
  });
}

/** Mutations that change course structure; each refreshes the affected queries. */
export function useCourseMutations(courseId?: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['courses'] });
  };

  return {
    publish: useMutation({ mutationFn: (id: string) => courseApi.publishCourse(id), onSuccess: refresh }),
    archive: useMutation({ mutationFn: (id: string) => courseApi.archiveCourse(id), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => courseApi.deleteCourse(id), onSuccess: refresh }),
    create: useMutation({ mutationFn: (data: Partial<Course>) => courseApi.createCourse(data), onSuccess: refresh }),
    update: useMutation({
      mutationFn: (data: Partial<Course>) => courseApi.updateCourse(courseId!, data),
      onSuccess: refresh,
    }),
    createModule: useMutation({
      mutationFn: (data: { title: string; description?: string }) => courseApi.createModule(courseId!, data),
      onSuccess: refresh,
    }),
    deleteModule: useMutation({ mutationFn: (moduleId: string) => courseApi.deleteModule(moduleId), onSuccess: refresh }),
    deleteLesson: useMutation({ mutationFn: (lessonId: string) => courseApi.deleteLesson(lessonId), onSuccess: refresh }),
    saveLesson: useMutation({
      mutationFn: ({ moduleId, lessonId, data }: { moduleId: string; lessonId?: string; data: Partial<Lesson> }) =>
        lessonId ? courseApi.updateLesson(lessonId, data) : courseApi.createLesson(moduleId, data),
      onSuccess: (lesson) => {
        refresh();
        qc.invalidateQueries({ queryKey: courseKeys.lesson(lesson.id) });
      },
    }),
  };
}
