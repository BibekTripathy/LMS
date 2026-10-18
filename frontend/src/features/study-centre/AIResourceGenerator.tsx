import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../../lib/errors';
import { useCourseDetail, useCourses, useLesson } from '../authoring/hooks';
import { aiApi } from '../../api/ai';
import type { Course, CourseDetail, Lesson, AIResource, AIResourceType } from '../../types';
import { Sparkles, Brain, Layers, BookOpen, AlertCircle, Check, X } from 'lucide-react';

interface AIResourceGeneratorProps {
  onClose: () => void;
  onGenerated: (resource: AIResource) => void;
}

export const AIResourceGenerator: React.FC<AIResourceGeneratorProps> = ({
  onClose,
  onGenerated,
}) => {
  const coursesQuery = useCourses();
  const courses: Course[] = coursesQuery.data ?? [];
  const [chosenCourseId, setSelectedCourseId] = useState<string>('');
  const selectedCourseId = chosenCourseId || courses[0]?.id || '';

  const courseDetailQuery = useCourseDetail(selectedCourseId || undefined);
  const selectedCourseDetail: CourseDetail | null = courseDetailQuery.data ?? null;
  const allLessons = selectedCourseDetail?.modules?.flatMap((m) => m.lessons ?? []) ?? [];
  const [chosenLessonId, setSelectedLessonId] = useState<string>('');
  const selectedLessonId = allLessons.some((l) => l.id === chosenLessonId) ? chosenLessonId : allLessons[0]?.id ?? '';

  // Full lesson (with transcript) to show whether there is material to generate from
  const selectedLesson: Lesson | null = useLesson(selectedLessonId || undefined).data ?? null;
  const [resourceType, setResourceType] = useState<AIResourceType>('FLASHCARDS');

  const queryClient = useQueryClient();
  const generate = useMutation({
    mutationFn: (lessonId: string): Promise<AIResource> => {
      if (resourceType === 'FLASHCARDS') return aiApi.generateFlashcards(lessonId);
      if (resourceType === 'SUMMARY') return aiApi.generateSummary(lessonId);
      return aiApi.generateMCQs(lessonId);
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['ai-resources'] });
      onGenerated(created);
    },
  });

  const loadingCourses = coursesQuery.isLoading;
  const loadingCourseDetail = courseDetailQuery.isLoading;
  const generating = generate.isPending;
  const [formError, setError] = useState<string | null>(null);
  const loadError = coursesQuery.error ?? courseDetailQuery.error;
  const error =
    formError ??
    (generate.error ? getErrorMessage(generate.error, 'AI generation failed. Please try again.') : null) ??
    (loadError ? getErrorMessage(loadError, 'Failed to load courses.') : null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) {
      setError('Please select a lesson to generate study resources.');
      return;
    }
    setError(null);
    generate.mutate(selectedLessonId);
  };

  const hasTranscript = !!(selectedLesson?.transcript && selectedLesson.transcript.trim().length > 0);
  const hasContent = !!(
    (selectedLesson?.content && selectedLesson.content.trim().length > 0) ||
    (selectedLesson?.reading_content && selectedLesson.reading_content.trim().length > 0)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate AI Study Resource
              </h3>
              <p className="text-xs text-slate-500">Powered by Google Gemini Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Generation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {/* Course Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Select Course
            </label>
            {loadingCourses ? (
              <div className="text-xs text-slate-400">Loading courses...</div>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lesson Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Select Lesson
            </label>
            {loadingCourseDetail ? (
              <div className="text-xs text-slate-400">Loading lessons...</div>
            ) : (
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {selectedCourseDetail?.modules?.flatMap((m) =>
                  (m.lessons || []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {m.title} — {l.title}
                    </option>
                  ))
                )}
              </select>
            )}

            {/* Context Quality Badge */}
            {selectedLesson && (
              <div className="mt-2 text-xs flex items-center gap-2">
                {hasTranscript ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Full video transcript available
                  </span>
                ) : hasContent ? (
                  <span className="flex items-center gap-1 text-indigo-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Reading content available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> No transcript provided (AI will synthesize from title)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Resource Type Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Resource Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setResourceType('FLASHCARDS')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  resourceType === 'FLASHCARDS'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Flashcards</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceType('SUMMARY')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  resourceType === 'SUMMARY'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceType('MCQ_REVISION')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  resourceType === 'MCQ_REVISION'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Layers className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Practice MCQs</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || !selectedLessonId}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
