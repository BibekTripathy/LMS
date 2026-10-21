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
  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white" data-testid={testId}>
        {value}
      </h3>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  </div>
);
