import React, { useState } from 'react';
import { getErrorMessage } from '../../lib/errors';
import { useQuizAuthoring } from './hooks';
import type { Question, QuestionInput, QuestionOptionInput } from '../../types';
import { X, Check, Plus, Trash2, HelpCircle, AlertCircle } from 'lucide-react';

interface QuestionEditorModalProps {
  quizId: string;
  question?: Question | null;
  onClose: () => void;
  onSaved: (question: Question) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  quizId,
  question,
  onClose,
  onSaved,
}) => {
  const [prompt, setPrompt] = useState(question?.prompt || question?.text || '');
  const [marks, setMarks] = useState<number>(question?.marks || 1);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [options, setOptions] = useState<QuestionOptionInput[]>(
    question?.options && question.options.length > 0
      ? question.options.map((o) => ({
          id: o.id,
          text: o.text,
          is_correct: !!o.is_correct,
          position: o.position,
        }))
      : [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ]
  );
  const { saveQuestion } = useQuizAuthoring(undefined);
  const saving = saveQuestion.isPending;
  const [error, setError] = useState<string | null>(null);

  const handleOptionTextChange = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text } : opt))
    );
  };

  const handleSetCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, is_correct: i === index }))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      alert('Maximum 6 options allowed per question.');
      return;
    }
    setOptions((prev) => [...prev, { text: '', is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert('A question must have at least 2 options.');
      return;
    }
    const wasCorrect = options[index].is_correct;
    const filtered = options.filter((_, i) => i !== index);
    if (wasCorrect && filtered.length > 0) {
      filtered[0].is_correct = true;
    }
    setOptions(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please provide a question prompt.');
      return;
    }

    const filledOptions = options.filter((o) => o.text.trim().length > 0);
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 valid options.');
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.is_correct);
    if (!hasCorrect) {
      setError('Please designate one option as the correct answer.');
      return;
    }

    setError(null);
    const payload: QuestionInput = {
      prompt,
      marks,
      explanation,
      options: filledOptions,
    };
    saveQuestion.mutate(
      { quizId, questionId: question?.id, data: payload },
      {
        onSuccess: (result) => onSaved(result),
        onError: (err) => setError(getErrorMessage(err, 'Failed to save question.')),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            <span>{question ? 'Edit Question' : 'Add MCQ Question'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Question Prompt *
            </label>
            <textarea
              rows={3}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Which algorithm computes the gradient of weights using calculus chain rule?"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Marks / Points
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={marks}
                onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Type
              </label>
              <input
                type="text"
                disabled
                value="Multiple Choice (Single Answer)"
                className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Options with radio button for correct answer */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Choices (Select radio for correct answer)
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Choice
              </button>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                    opt.is_correct
                      ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="correct-answer-group"
                    checked={opt.is_correct}
                    onChange={() => handleSetCorrect(idx)}
                    title="Mark as correct answer"
                    className="w-4 h-4 text-green-200 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    className="flex-1 bg-transparent border-0 text-sm focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Explanation (Displayed after submission)
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this choice is correct and clarify common misconceptions..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{question ? 'Update Question' : 'Save Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
