import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  testId?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, hint, testId }) => (
  <div className="p-5 bg-latte-base dark:bg-frappe-base rounded-2xl border border-latte-surface0 dark:border-frappe-surface1 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-frappe-blue/10 dark:bg-frappe-blue/20 text-frappe-blue dark:text-frappe-blue flex items-center justify-center">
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-latte-subtext0 uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-extrabold text-latte-text dark:text-frappe-text" data-testid={testId}>
        {value}
      </h3>
      {hint && <p className="text-[11px] text-latte-overlay0">{hint}</p>}
    </div>
  </div>
);
