import React from 'react';
import { getErrorMessage } from '../../lib/errors';
import { useCourseRevisions, useStudyResourceMutations } from './hooks';
import { AlertCircle, Target } from 'lucide-react';

/** Student-only: personalised revision built by the server from their submitted quiz attempts. */
export const RevisionPanel: React.FC<{ courseId: string }> = ({ courseId }) => {
  const revisions = useCourseRevisions(courseId);
  const { generateRevision } = useStudyResourceMutations(undefined, courseId);
  const latest = revisions.data?.results[0];

  return (
    <section aria-labelledby="revision-heading" className="p-6 lms-card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="revision-heading" className="text-sm font-bold text-[#121316] dark:text-[#F3F4F6] flex items-center gap-2">
          <Target className="w-4 h-4 text-[#059669]" />
          My revision plan
        </h2>
        <button
          onClick={() => generateRevision.mutate()}
          disabled={generateRevision.isPending}
          className="btn-primary px-4 py-2 text-xs font-semibold rounded-full disabled:opacity-50"
        >
          {generateRevision.isPending ? 'Analysing your attempts…' : latest ? 'Refresh plan' : 'Create my plan'}
        </button>
      </div>

      {generateRevision.isError && (
        <div role="alert" className="p-3.5 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl text-[#DC2626] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{getErrorMessage(generateRevision.error, 'Could not create a revision plan.')}</span>
        </div>
      )}

      {revisions.isLoading ? (
        <p role="status" className="text-xs text-[#868E96]">Loading your revision plans…</p>
      ) : revisions.isError ? (
        <p role="alert" className="text-xs text-[#DC2626]">{getErrorMessage(revisions.error)}</p>
      ) : !latest ? (
        <p className="text-xs text-[#868E96]">Submit a quiz in this course, then create a plan based on your results.</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#121316] dark:text-[#F3F4F6]">{latest.content.title}</h3>
            <p className="text-xs text-[#64666E] dark:text-[#94969E]">{latest.content.overview}</p>
          </div>

          <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <caption className="text-left text-[#868E96] p-3 text-[11px] border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01]">
                Based on {latest.content.performance.submitted_attempts} submitted attempt(s), overall accuracy{' '}
                {latest.content.performance.overall_accuracy_percent}%
              </caption>
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#868E96]">
                <tr className="text-left">
                  <th className="py-2 px-3 font-semibold">Topic</th>
                  <th className="py-2 px-3 font-semibold">Your accuracy</th>
                  <th className="py-2 px-3 font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-[#121316] dark:text-[#F3F4F6]">
                {latest.content.performance.topics.map((t) => (
                  <tr key={t.topic} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                    <td className="py-2.5 px-3">{t.topic}</td>
                    <td className={`py-2.5 px-3 font-mono ${t.accuracy_percent < t.target_percent ? 'text-[#DC2626] font-semibold' : 'text-[#059669]'}`}>
                      {t.accuracy_percent}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#868E96]">{t.target_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            {latest.content.focus_areas.map((area) => (
              <div key={area.topic} className="p-3.5 rounded-xl bg-[#D97706]/10 border border-[#D97706]/20 space-y-1">
                <h4 className="text-xs font-bold text-[#92400E] dark:text-[#FBBF24]">{area.topic}</h4>
                <p className="text-xs text-[#78350F] dark:text-[#FDE68A]">{area.reason}</p>
                <ul className="list-disc pl-5 text-xs text-[#78350F] dark:text-[#FDE68A] mt-1 space-y-0.5">
                  {area.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {latest.content.next_steps.length > 0 && (
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[10px] font-semibold text-[#868E96] uppercase tracking-wider block mb-1">
                Recommended Next Steps
              </span>
              <ul className="list-disc pl-5 text-xs text-[#64666E] dark:text-[#94969E] space-y-1">
                {latest.content.next_steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
