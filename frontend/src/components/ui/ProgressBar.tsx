import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'emerald' | 'amber' | 'purple';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  variant = 'indigo',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  // Map legacy indigo/emerald/purple to Catppuccin equivalents
  const variantClasses = {
    indigo: 'bg-frappe-blue',
    emerald: 'bg-frappe-teal',
    amber: 'bg-frappe-peach',
    purple: 'bg-frappe-mauve',
  }[variant];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1 text-xs font-medium text-latte-subtext1 dark:text-frappe-subtext1">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold">{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-latte-surface0 dark:bg-frappe-surface1 rounded-full overflow-hidden ${sizeClasses}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${sizeClasses} ${variantClasses} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
