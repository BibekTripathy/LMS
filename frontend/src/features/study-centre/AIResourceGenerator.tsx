import React, { useState } from 'react';
import { getErrorMessage } from '../../lib/errors';
import type { AIGeneratableType, AIResource } from '../../types';
import { useStudyResourceMutations } from './hooks';
import { AlertCircle, BookOpen, Brain, Layers, Sparkles } from 'lucide-react';

interface AIResourceGeneratorProps {
  lessonId: string;
  /** False when the lesson has no transcript or reading material to generate from. */
  hasMaterial: boolean;
  onGenerated: (resource: AIResource) => void;
}

const TYPES: { value: AIGeneratableType; label: string; icon: React.ReactNode; counted: boolean }[] = [
  { value: 'FLASHCARDS', label: 'Flashcards', icon: <Layers className="w-4 h-4" />, counted: true },
  { value: 'SUMMARY', label: 'Summary', icon: <BookOpen className="w-4 h-4" />, counted: false },
  { value: 'MCQ', label: 'Multiple-choice questions', icon: <Brain className="w-4 h-4" />, counted: true },
];

/** Instructor-only: generates a DRAFT resource from the lesson's own material via the backend. */
export const AIResourceGenerator: React.FC<AIResourceGeneratorProps> = ({ lessonId, hasMaterial, onGenerated }) => {
  const [resourceType, setResourceType] = useState<AIGeneratableType>('FLASHCARDS');
  const [count, setCount] = useState(5);
  const { generate } = useStudyResourceMutations(lessonId);
  const counted = TYPES.find((t) => t.value === resourceType)?.counted;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generate.mutate(
      { type: resourceType, count: counted ? count : undefined },
      { onSuccess: (created) => onGenerated(created) }
    );
  };

  return (
    <form onSubmit={handleGenerate} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        Generate a draft from this lesson
      </h2>

      {!hasMaterial && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          This lesson has no transcript or reading material yet. Add some in the course editor first.
        </p>
      )}

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Resource type">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={resourceType === t.value}
            onClick={() => setResourceType(t.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              resourceType === t.value
                ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {counted && (
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          How many
          <input
            type="number"
            min={1}
            max={resourceType === 'MCQ' ? 20 : 40}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
          />
        </label>
      )}

      {generate.isError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{getErrorMessage(generate.error, 'AI generation failed. Please try again.')}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={generate.isPending || !hasMaterial}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        {generate.isPending ? 'Generating… this can take a few seconds' : 'Generate draft'}
      </button>
      <p className="text-[11px] text-slate-400">
        Output is grounded in the lesson material and saved as a draft. Review it before publishing; AI can make mistakes.
      </p>
    </form>
  );
};
