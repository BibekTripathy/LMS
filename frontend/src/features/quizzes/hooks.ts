import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../../api/quizzes';
import type { Quiz, QuestionInput } from '../../types';

export const quizKeys = {
  course: (courseId: string) => ['quizzes', 'course', courseId] as const,
  manage: (quizId: string) => ['quizzes', 'manage', quizId] as const,
  detail: (quizId: string) => ['quizzes', 'detail', quizId] as const,
  results: (quizId: string) => ['quizzes', 'results', quizId] as const,
  attempt: (attemptId: string) => ['attempts', attemptId] as const,
};

export function useCourseQuizzes(courseId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.course(courseId ?? ''),
    queryFn: () => quizApi.getCourseQuizzes(courseId!),
    enabled: !!courseId,
  });
}

export function useQuizManage(quizId: string | null | undefined) {
  return useQuery({
    queryKey: quizKeys.manage(quizId ?? ''),
    queryFn: () => quizApi.getQuizManage(quizId!),
    enabled: !!quizId,
  });
}

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.detail(quizId ?? ''),
    queryFn: () => quizApi.getQuizById(quizId!),
    enabled: !!quizId,
  });
}

export function useMyQuizResults(quizId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.results(quizId ?? ''),
    queryFn: () => quizApi.getMyResults(quizId!),
    enabled: !!quizId,
  });
}

export function useAttempt(attemptId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.attempt(attemptId ?? ''),
    queryFn: () => quizApi.getAttempt(attemptId!),
    enabled: !!attemptId,
  });
}

/** Instructor authoring mutations. Every success refreshes the affected quiz queries. */
export function useQuizAuthoring(courseId: string | undefined) {
  const qc = useQueryClient();
  const refresh = (quizId?: string) => {
    if (courseId) qc.invalidateQueries({ queryKey: quizKeys.course(courseId) });
    if (quizId) qc.invalidateQueries({ queryKey: quizKeys.manage(quizId) });
  };

  return {
    createQuiz: useMutation({
      mutationFn: (data: Partial<Quiz>) => quizApi.createQuiz(courseId!, data),
      onSuccess: (quiz) => refresh(quiz.id),
    }),
    updateQuiz: useMutation({
      mutationFn: ({ quizId, data }: { quizId: string; data: Partial<Quiz> }) => quizApi.updateQuiz(quizId, data),
      onSuccess: (quiz) => refresh(quiz.id),
    }),
    deleteQuiz: useMutation({
      mutationFn: (quizId: string) => quizApi.deleteQuiz(quizId),
      onSuccess: () => refresh(),
    }),
    saveQuestion: useMutation({
      mutationFn: ({ quizId, questionId, data }: { quizId: string; questionId?: string; data: QuestionInput }) =>
        questionId ? quizApi.updateQuestion(questionId, data) : quizApi.createQuestion(quizId, data),
      onSuccess: (_q, vars) => refresh(vars.quizId),
    }),
    deleteQuestion: useMutation({
      mutationFn: ({ questionId }: { quizId: string; questionId: string }) => quizApi.deleteQuestion(questionId),
      onSuccess: (_r, vars) => refresh(vars.quizId),
    }),
  };
}

/** Student attempt lifecycle. */
export function useAttemptMutations(quizId: string | undefined) {
  const qc = useQueryClient();
  return {
    start: useMutation({ mutationFn: () => quizApi.startQuiz(quizId!) }),
    save: useMutation({
      mutationFn: ({ attemptId, answers }: { attemptId: string; answers: { question_id: string; selected_option_id: string }[] }) =>
        quizApi.saveAnswers(attemptId, answers),
    }),
    submit: useMutation({
      mutationFn: ({ attemptId, answers }: { attemptId: string; answers?: { question_id: string; selected_option_id: string }[] }) =>
        quizApi.submitAttempt(attemptId, answers),
      onSuccess: (attempt) => {
        qc.setQueryData(quizKeys.attempt(attempt.id), attempt);
        if (quizId) qc.invalidateQueries({ queryKey: quizKeys.results(quizId) });
      },
    }),
  };
}
