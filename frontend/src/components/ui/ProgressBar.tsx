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
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const variantClasses = {
    indigo: 'bg-[#0071E3]',
    emerald: 'bg-[#34C759]',
    amber: 'bg-[#FF9500]',
    purple: 'bg-[#AF52DE]',
  }[variant];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold font-mono">{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-black/[0.06] dark:bg-white/[0.12] rounded-full overflow-hidden ${sizeClasses}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${sizeClasses} ${variantClasses} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
