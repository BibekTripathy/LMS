import React, { useState } from 'react';
import type { MCQContent } from '../../types';
import { CheckCircle, XCircle, HelpCircle, Check, RotateCcw } from 'lucide-react';

interface MCQPracticeViewerProps {
  content: MCQContent;
  lessonTitle: string;
  onClose?: () => void;
}

export const MCQPracticeViewer: React.FC<MCQPracticeViewerProps> = ({
  content,
  lessonTitle,
  onClose,
}) => {
  const mcqs = content.mcqs || [];
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (userAnswers[questionIndex] !== undefined) return; // Prevent changing answer after reveal
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleReset = () => {
    setUserAnswers({});
  };

  if (!mcqs || mcqs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No revision MCQs found in this resource.
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.entries(userAnswers).filter(
    ([qIdx, optIdx]) => optIdx === mcqs[parseInt(qIdx)].correct_index
  ).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
            Interactive Self-Check Practice
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {lessonTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">
              Score: <span className="font-bold text-slate-900 dark:text-white">{correctCount}</span> /{' '}
              {answeredCount} answered
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Reset practice"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* MCQs List */}
      <div className="space-y-6">
        {mcqs.map((mcq, qIdx) => {
          const selectedOption = userAnswers[qIdx];
          const isAnswered = selectedOption !== undefined;
          const isCorrect = isAnswered && selectedOption === mcq.correct_index;

          return (
            <div
              key={qIdx}
              className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border transition shadow-sm space-y-4 ${
                !isAnswered
                  ? 'border-slate-200 dark:border-slate-800'
                  : isCorrect
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/10'
                  : 'border-rose-300 dark:border-rose-800 bg-rose-50/10'
              }`}
            >
              {/* Question Prompt */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {mcq.question}
                  </h3>
                </div>

                {isAnswered && (
                  <span
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>

              {/* Choices */}
              <div className="space-y-2.5 pt-1">
                {mcq.options.map((optionText, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isRightChoice = optIdx === mcq.correct_index;

                  let optionStyles =
                    'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';

                  if (isAnswered) {
                    if (isRightChoice) {
                      optionStyles =
                        'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold';
                    } else if (isSelected && !isRightChoice) {
                      optionStyles =
                        'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 font-semibold';
                    } else {
                      optionStyles = 'opacity-50 border-slate-200 dark:border-slate-800';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition text-xs sm:text-sm flex items-center justify-between gap-3 ${optionStyles}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isSelected
                              ? isRightChoice
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-rose-600 bg-rose-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{optionText}</span>
                      </div>

                      {isAnswered && isRightChoice && (
                        <span className="text-[11px] font-bold text-emerald-600">Correct Answer</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {isAnswered && mcq.explanation && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1 animate-in fade-in">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Explanation
                  </p>
                  <p>{mcq.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
