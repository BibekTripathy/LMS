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
    // All variants now use Catppuccin Frappé tokens
    default:  'bg-frappe-blue/10 text-frappe-blue border-frappe-blue/30 dark:bg-frappe-blue/20 dark:text-frappe-blue dark:border-frappe-blue/40',
    success:  'bg-frappe-green/10 text-frappe-green border-frappe-green/30 dark:bg-frappe-green/20 dark:text-frappe-green dark:border-frappe-green/40',
    warning:  'bg-frappe-yellow/10 text-latte-yellow border-frappe-yellow/30 dark:bg-frappe-yellow/15 dark:text-frappe-yellow dark:border-frappe-yellow/40',
    danger:   'bg-frappe-red/10 text-frappe-red border-frappe-red/30 dark:bg-frappe-red/15 dark:text-frappe-red dark:border-frappe-red/40',
    purple:   'bg-frappe-mauve/10 text-frappe-mauve border-frappe-mauve/30 dark:bg-frappe-mauve/15 dark:text-frappe-mauve dark:border-frappe-mauve/40',
    slate:    'bg-latte-surface0 text-latte-subtext1 border-latte-surface1 dark:bg-frappe-surface1 dark:text-frappe-subtext1 dark:border-frappe-surface2',
    info:     'bg-frappe-sky/10 text-frappe-sky border-frappe-sky/30 dark:bg-frappe-sky/15 dark:text-frappe-sky dark:border-frappe-sky/40',
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
