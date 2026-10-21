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
    <form onSubmit={handleGenerate} className="p-5 lms-card space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#0066FF]" />
        <h2 className="text-sm font-bold text-[#121316] dark:text-[#F3F4F6]">
          Generate a draft from this lesson
        </h2>
      </div>

      {!hasMaterial && (
        <p className="text-xs text-[#92400E] bg-[#D97706]/10 border border-[#D97706]/20 rounded-xl p-3">
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
              resourceType === t.value
                ? 'border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF]'
                : 'border-black/[0.08] dark:border-white/[0.08] text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {counted && (
        <label className="text-xs font-semibold text-[#868E96] flex items-center gap-3">
          Number of items:
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            className="w-16 px-2.5 py-1 text-xs rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#131418] text-[#121316] dark:text-[#F3F4F6] font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
          />
        </label>
      )}

      {generate.isError && (
        <div role="alert" className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl text-[#DC2626] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{getErrorMessage(generate.error, 'Could not generate draft.')}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!hasMaterial || generate.isPending}
        className="btn-primary px-5 py-2 text-xs font-semibold rounded-full disabled:opacity-50"
      >
        {generate.isPending ? 'Generating with AI…' : 'Generate draft'}
      </button>
    </form>
  );
};
