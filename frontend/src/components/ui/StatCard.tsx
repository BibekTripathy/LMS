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
  <div className="p-5 apple-card flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] flex items-center justify-center flex-shrink-0">
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]" data-testid={testId}>
        {value}
      </h3>
      {hint && <p className="text-[11px] text-[#86868B] mt-0.5">{hint}</p>}
    </div>
  </div>
);
