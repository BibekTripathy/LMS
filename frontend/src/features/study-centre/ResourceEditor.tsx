import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import { getErrorMessage } from '../../lib/errors';
import type { AIResource, AIResourceContent, FlashcardContent, MCQContent, SummaryContent } from '../../types';
import { useStudyResourceMutations } from './hooks';
import { Plus, Trash2 } from 'lucide-react';

interface ResourceEditorProps {
  resource: AIResource;
  onDone: () => void;
}

const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950';
const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/** Edit a DRAFT resource. The backend re-validates the content and returns per-field problems. */
export const ResourceEditor: React.FC<ResourceEditorProps> = ({ resource, onDone }) => {
  const { update } = useStudyResourceMutations(resource.lesson ?? undefined);
  const [content, setContent] = useState<AIResourceContent>(() => structuredClone(resource.content));

  const serverProblems: string[] =
    update.error && isAxiosError(update.error) ? (update.error.response?.data?.details?.content ?? []) : [];

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ id: resource.id, content }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={save} className="space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1">
        Title
        <input
          className={inputClass}
          value={(content as { title: string }).title}
          onChange={(e) => setContent({ ...content, title: e.target.value } as AIResourceContent)}
        />
      </label>

      {resource.resource_type === 'FLASHCARDS' && (
        <FlashcardsFields value={content as FlashcardContent} onChange={setContent} />
      )}
      {resource.resource_type === 'SUMMARY' && <SummaryFields value={content as SummaryContent} onChange={setContent} />}
      {resource.resource_type === 'MCQ' && <MCQFields value={content as MCQContent} onChange={setContent} />}

      {update.isError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs space-y-1">
          <p className="font-semibold">{getErrorMessage(update.error, 'Could not save the changes.')}</p>
          {serverProblems.length > 0 && (
            <ul className="list-disc pl-4">
              {serverProblems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={update.isPending} className="px-4 py-2 bg-frappe-blue text-white text-xs font-semibold rounded-xl disabled:opacity-50">
          {update.isPending ? 'Saving…' : 'Save draft'}
        </button>
        <button type="button" onClick={onDone} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700">
          Cancel
        </button>
      </div>
    </form>
  );
};

const FlashcardsFields: React.FC<{ value: FlashcardContent; onChange: (c: FlashcardContent) => void }> = ({ value, onChange }) => {
  const setCard = (i: number, field: 'front' | 'back', text: string) =>
    onChange({ ...value, cards: value.cards.map((c, j) => (j === i ? { ...c, [field]: text } : c)) });
  return (
    <div className="space-y-3">
      {value.cards.map((card, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
          <input aria-label={`Card ${i + 1} front`} className={inputClass} value={card.front} onChange={(e) => setCard(i, 'front', e.target.value)} />
          <textarea aria-label={`Card ${i + 1} back`} className={inputClass} rows={2} value={card.back} onChange={(e) => setCard(i, 'back', e.target.value)} />
          <button type="button" aria-label={`Remove card ${i + 1}`} onClick={() => onChange({ ...value, cards: value.cards.filter((_, j) => j !== i) })} className="p-2 text-rose-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...value, cards: [...value.cards, { front: '', back: '' }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-frappe-blue">
        <Plus className="w-4 h-4" /> Add card
      </button>
    </div>
  );
};

const SummaryFields: React.FC<{ value: SummaryContent; onChange: (c: SummaryContent) => void }> = ({ value, onChange }) => (
  <div className="space-y-3">
    <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1">
      Summary
      <textarea className={inputClass} rows={5} value={value.summary} onChange={(e) => onChange({ ...value, summary: e.target.value })} />
    </label>
    <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1">
      Key points (one per line)
      <textarea className={inputClass} rows={4} defaultValue={value.key_points.join('\n')} onChange={(e) => onChange({ ...value, key_points: lines(e.target.value) })} />
    </label>
    <label className="block text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1">
      Revision topics (one per line)
      <textarea className={inputClass} rows={3} defaultValue={value.revision_topics.join('\n')} onChange={(e) => onChange({ ...value, revision_topics: lines(e.target.value) })} />
    </label>
  </div>
);

const MCQFields: React.FC<{ value: MCQContent; onChange: (c: MCQContent) => void }> = ({ value, onChange }) => {
  const setQuestion = (i: number, patch: Partial<MCQContent['questions'][number]>) =>
    onChange({ ...value, questions: value.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  return (
    <div className="space-y-5">
      {value.questions.map((q, i) => (
        <fieldset key={i} className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <legend className="text-xs font-bold text-slate-500 px-1">Question {i + 1}</legend>
          <input aria-label={`Question ${i + 1} prompt`} className={inputClass} value={q.prompt} onChange={(e) => setQuestion(i, { prompt: e.target.value })} />
          {q.options.map((opt, o) => (
            <div key={o} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${i}`}
                aria-label={`Option ${o + 1} is correct`}
                checked={q.correct_option_index === o}
                onChange={() => setQuestion(i, { correct_option_index: o })}
              />
              <input
                aria-label={`Question ${i + 1} option ${o + 1}`}
                className={inputClass}
                value={opt}
                onChange={(e) => setQuestion(i, { options: q.options.map((x, k) => (k === o ? e.target.value : x)) })}
              />
            </div>
          ))}
          <textarea aria-label={`Question ${i + 1} explanation`} className={inputClass} rows={2} value={q.explanation} onChange={(e) => setQuestion(i, { explanation: e.target.value })} />
          <button type="button" onClick={() => onChange({ ...value, questions: value.questions.filter((_, j) => j !== i) })} className="text-xs text-rose-600 font-semibold">
            Remove question
          </button>
        </fieldset>
      ))}
    </div>
  );
};
