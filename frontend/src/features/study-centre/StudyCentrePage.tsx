import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../../api/ai';
import { getErrorMessage } from '../../lib/errors';
import type { AIResource, FlashcardContent, MCQContent, SummaryContent } from '../../types';
import { AIResourceGenerator } from './AIResourceGenerator';
import { FlashcardViewer } from './FlashcardViewer';
import { MCQPracticeViewer } from './MCQPracticeViewer';
import { SummaryViewer } from './SummaryViewer';
import { AlertCircle, Brain, Sparkles } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  FLASHCARDS: 'Flashcards',
  SUMMARY: 'Summary',
  MCQ_REVISION: 'Practice MCQs',
};

export const StudyCentrePage: React.FC = () => {
  const resourcesQuery = useQuery({ queryKey: ['ai-resources'], queryFn: () => aiApi.getAIResources() });
  const resources = resourcesQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const selected: AIResource | undefined = resources.find((r) => r.id === selectedId) ?? resources[0];

  const renderViewer = (resource: AIResource) => {
    const close = () => setSelectedId(null);
    if (resource.resource_type === 'FLASHCARDS') {
      return <FlashcardViewer key={resource.id} content={resource.content as FlashcardContent} lessonTitle={resource.lesson_title} onClose={close} />;
    }
    if (resource.resource_type === 'SUMMARY') {
      return <SummaryViewer key={resource.id} content={resource.content as SummaryContent} lessonTitle={resource.lesson_title} onClose={close} />;
    }
    return <MCQPracticeViewer key={resource.id} content={resource.content as MCQContent} lessonTitle={resource.lesson_title} onClose={close} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-500" />
            AI Study Centre
          </h1>
          <p className="text-sm text-slate-500 mt-1">Flashcards, summaries and practice questions generated from your lessons.</p>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Generate resource
        </button>
      </div>

      {resourcesQuery.isLoading ? (
        <div role="status" className="py-16 flex justify-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="sr-only">Loading study resources…</span>
        </div>
      ) : resourcesQuery.isError ? (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{getErrorMessage(resourcesQuery.error, 'Failed to load study resources.')}</span>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No study resources yet</h3>
          <p className="text-sm text-slate-500">Generate flashcards, a summary or practice questions from one of your lessons.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <ul className="lg:col-span-4 space-y-2" aria-label="Your study resources">
            {resources.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  aria-current={selected?.id === r.id}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selected?.id === r.id
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{r.lesson_title}</span>
                  <span className="block text-xs text-slate-500">
                    {TYPE_LABELS[r.resource_type] ?? r.resource_type} · {new Date(r.generated_at).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="lg:col-span-8">{selected && renderViewer(selected)}</div>
        </div>
      )}

      {showGenerator && (
        <AIResourceGenerator
          onClose={() => setShowGenerator(false)}
          onGenerated={(created) => {
            setShowGenerator(false);
            setSelectedId(created.id);
          }}
        />
      )}
    </div>
  );
};
