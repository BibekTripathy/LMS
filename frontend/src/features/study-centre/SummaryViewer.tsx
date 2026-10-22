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
      content.key_points || []
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-frappe-blue bg-frappe-blue/10 dark:bg-frappe-blue/20 px-2 py-0.5 rounded">
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
            {copied ? <Check className="w-3.5 h-3.5 text-frappe-teal" /> : <Copy className="w-3.5 h-3.5" />}
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
      {content.key_points && content.key_points.length > 0 && (
        <div className="bg-frappe-blue/5 dark:bg-frappe-blue/10 border border-frappe-blue/20 dark:border-frappe-blue/30 rounded-2xl p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-frappe-blue dark:text-frappe-lavender flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-frappe-blue" />
            Core Key Takeaways
          </h3>
          <ul className="space-y-2">
            {content.key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-frappe-blue/100 mt-2 flex-shrink-0" />
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

        {content.revision_topics && content.revision_topics.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Topics to revise</h4>
            <div className="flex flex-wrap gap-2">
              {content.revision_topics.map((topic) => (
                <span key={topic} className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
