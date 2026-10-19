import React from 'react';
import { ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react';
import type { LessonSummary } from '../../types';

export interface LessonNavigationProps {
  previousLesson?: LessonSummary | null;
  nextLesson?: LessonSummary | null;
  onNavigate: (lessonId: string) => void;
  className?: string;
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  previousLesson,
  nextLesson,
  onNavigate,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 border-t border-slate-200 dark:border-slate-800 ${className}`}
      data-testid="lesson-navigation"
    >
      {/* Previous Button */}
      {previousLesson ? (
        <button
          onClick={() => onNavigate(previousLesson.id)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold shadow-sm transition max-w-[48%]"
          data-testid="prev-lesson-btn"
        >
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          <div className="text-left truncate">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Previous</span>
            <span className="truncate block">{previousLesson.title}</span>
          </div>
        </button>
      ) : (
        <div />
      )}

      {/* Next Button */}
      {nextLesson ? (
        <button
          onClick={() => onNavigate(nextLesson.id)}
          className="inline-flex items-center justify-end gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition max-w-[48%] ml-auto"
          data-testid="next-lesson-btn"
        >
          <div className="text-right truncate">
            <span className="block text-[10px] text-indigo-200 uppercase tracking-wider">Next Lesson</span>
            <span className="truncate block">{nextLesson.title}</span>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 ml-auto">
          <CheckCheck className="w-4 h-4" />
          <span>Last lesson in course</span>
        </div>
      )}
    </div>
  );
};
