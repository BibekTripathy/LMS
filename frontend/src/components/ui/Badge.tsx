import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'slate' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] border-[#0071E3]/20',
    success: 'bg-[#34C759]/10 text-[#248A3D] dark:text-[#34C759] border-[#34C759]/20',
    warning: 'bg-[#FF9500]/10 text-[#B25000] dark:text-[#FF9F0A] border-[#FF9500]/20',
    danger: 'bg-[#FF3B30]/10 text-[#D70015] dark:text-[#FF453A] border-[#FF3B30]/20',
    purple: 'bg-[#AF52DE]/10 text-[#8944AB] dark:text-[#BF5AF2] border-[#AF52DE]/20',
    slate: 'bg-black/[0.04] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] border-black/[0.06] dark:border-white/[0.08]',
    info: 'bg-[#32ADE6]/10 text-[#0071A4] dark:text-[#70D7FF] border-[#32ADE6]/20',
  }[variant];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variantClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
