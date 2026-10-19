import React, { useState } from 'react';
import { CheckCircle2, Check, Loader2, AlertCircle } from 'lucide-react';
import { useCompleteLesson } from './hooks';
import { getErrorMessage } from '../../lib/errors';

export interface LessonCompletionButtonProps {
  lessonId: string;
  courseId?: string;
  isCompleted?: boolean;
  onCompleted?: () => void;
  className?: string;
}

export const LessonCompletionButton: React.FC<LessonCompletionButtonProps> = ({
  lessonId,
  courseId,
  isCompleted = false,
  onCompleted,
  className = '',
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const completeMutation = useCompleteLesson(lessonId, courseId);

  const handleComplete = () => {
    setErrorMessage(null);
    completeMutation.mutate(undefined, {
      onSuccess: () => {
        onCompleted?.();
      },
      onError: (err) => {
        setErrorMessage(getErrorMessage(err, 'Failed to mark lesson as completed.'));
      },
    });
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-end">
        <button
          disabled
          className={`inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl cursor-default shadow-sm ${className}`}
          data-testid="lesson-completed-badge"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Completed</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-1">
      <button
        onClick={handleComplete}
        disabled={completeMutation.isPending}
        className={`inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition ${className}`}
        data-testid="mark-complete-btn"
      >
        {completeMutation.isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Marking complete...</span>
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            <span>Mark as Complete</span>
          </>
        )}
      </button>

      {errorMessage && (
        <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {errorMessage}
        </span>
      )}
    </div>
  );
};
