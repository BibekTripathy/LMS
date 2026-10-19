import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load the requested information. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-10 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 rounded-xl shadow-sm transition"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};
