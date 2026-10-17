import React, { useState } from 'react';
import type { SummaryContent } from '../../types';
import { Copy, Check, FileText, CheckCircle2, Printer } from 'lucide-react';

interface SummaryViewerProps {
  content: SummaryContent;
  lessonTitle: string;
  onClose?: () => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  content,
  lessonTitle,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `Lesson: ${lessonTitle}\n\nSummary:\n${content.summary}\n\nKey Takeaways:\n${(
      content.key_takeaways || []
    )
      .map((k) => `• ${k}`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
            AI Executive Summary
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {lessonTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Notes'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
            title="Print Summary"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Key Takeaways Callout Card */}
      {content.key_takeaways && content.key_takeaways.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Core Key Takeaways
          </h3>
          <ul className="space-y-2">
            {content.key_takeaways.map((point, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Structured Summary Body */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-slate-400" />
          Full Topic Overview
        </h3>

        <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed space-y-4 whitespace-pre-line">
          {content.summary}
        </div>
      </div>
    </div>
  );
};
