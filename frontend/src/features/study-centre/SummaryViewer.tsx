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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] bg-[#0066FF]/10 px-2.5 py-0.5 rounded-full">
            Lesson Summary &amp; Key Concepts
          </span>
          <h2 className="text-xl font-bold text-[#121316] dark:text-[#F3F4F6] mt-1">
            {lessonTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[#121316] dark:text-[#F3F4F6] text-xs font-semibold rounded-full transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Notes'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[#121316] dark:text-[#F3F4F6] text-xs font-semibold rounded-full transition"
            title="Print Summary"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Summary Document Card */}
      <article className="lms-card p-6 sm:p-8 space-y-6">
        {/* Overview section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#868E96] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0066FF]" />
            Executive Synthesis
          </h3>
          <p className="text-sm leading-relaxed text-[#121316] dark:text-[#F3F4F6] whitespace-pre-line">
            {content.summary}
          </p>
        </div>

        {/* Key Takeaways */}
        {content.key_points && content.key_points.length > 0 && (
          <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#868E96] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              Core Takeaways
            </h3>
            <ul className="grid grid-cols-1 gap-2.5">
              {content.key_points.map((pt, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-xs flex items-start gap-2.5 text-[#121316] dark:text-[#F3F4F6]"
                >
                  <span className="w-4 h-4 rounded-full bg-[#059669]/10 text-[#059669] text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Revision Topics tags */}
        {content.revision_topics && content.revision_topics.length > 0 && (
          <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#868E96] block">
              Related Assessment Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {content.revision_topics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#64666E] dark:text-[#94969E]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
