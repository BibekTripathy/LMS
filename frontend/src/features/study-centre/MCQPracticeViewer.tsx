import React, { useState } from 'react';
import type { MCQContent } from '../../types';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

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
  const mcqs = content.questions || [];
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
      <div className="p-8 text-center text-[#868E96]">
        No revision MCQs found in this resource.
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.entries(userAnswers).filter(
    ([qIdx, optIdx]) => optIdx === mcqs[parseInt(qIdx)].correct_option_index
  ).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669] bg-[#059669]/10 px-2.5 py-0.5 rounded-full">
            Interactive Practice
          </span>
          <h2 className="text-xl font-bold text-[#121316] dark:text-[#F3F4F6] mt-1">
            {lessonTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-[#868E96]">
              Score: <span className="font-bold text-[#121316] dark:text-[#F3F4F6] font-mono">{correctCount}</span> /{' '}
              {answeredCount} answered
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6] rounded-full transition"
            title="Reset practice"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {mcqs.map((q, qIdx) => {
          const selectedOption = userAnswers[qIdx];
          const hasAnswered = selectedOption !== undefined;
          const isCorrect = selectedOption === q.correct_option_index;

          return (
            <div
              key={qIdx}
              className="lms-card p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-bold font-mono flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#121316] dark:text-[#F3F4F6]">
                    {q.prompt}
                  </h3>
                </div>

                {hasAnswered && (
                  <span className={`text-xs font-semibold flex items-center gap-1 ${
                    isCorrect ? 'text-[#059669]' : 'text-[#DC2626]'
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Incorrect
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selectedOption === optIdx;
                  const isThisCorrect = optIdx === q.correct_option_index;

                  let optionStyles = 'border-black/[0.08] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-[#121316] dark:text-[#F3F4F6]';

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      optionStyles = 'border-[#059669] bg-[#059669]/10 text-[#059669] font-medium';
                    } else if (isThisSelected) {
                      optionStyles = 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]';
                    } else {
                      optionStyles = 'border-black/[0.04] dark:border-white/[0.04] opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between text-xs ${optionStyles}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Disclosure */}
              {hasAnswered && q.explanation && (
                <div className="p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs space-y-1">
                  <span className="font-semibold text-[#868E96] uppercase text-[10px] tracking-wider block">
                    Explanation
                  </span>
                  <p className="text-[#64666E] dark:text-[#94969E] leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
