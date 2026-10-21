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
      className={`text-center py-12 px-6 rounded-3xl apple-card border-dashed border-black/[0.12] dark:border-white/[0.15] bg-white/40 dark:bg-[#1C1C1E]/40 backdrop-blur-md flex flex-col items-center justify-center space-y-3.5 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">{title}</h3>
        <p className="text-sm text-[#86868B] dark:text-[#98989D] leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 apple-btn-primary px-5 py-2.5 text-xs font-semibold rounded-full shadow-sm"
        >
          {actionText}
        </button>
      )}
      {actionText && actionHref && !onAction && (
        <a
          href={actionHref}
          className="mt-2 apple-btn-primary px-5 py-2.5 text-xs font-semibold rounded-full shadow-sm"
        >
          {actionText}
        </a>
      )}
    </div>
  );
};
