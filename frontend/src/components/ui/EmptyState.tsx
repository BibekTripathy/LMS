import React from 'react';
import { Search, type LucideIcon } from 'lucide-react';


export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionText,
  onAction,
  actionHref,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {(actionText && onAction) && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
        >
          {actionText}
        </button>
      )}
      {(actionText && actionHref && !onAction) && (
        <a
          href={actionHref}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
        >
          {actionText}
        </a>
      )}
    </div>
  );
};
