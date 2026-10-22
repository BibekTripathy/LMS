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
    <section aria-labelledby="revision-heading" className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="revision-heading" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-green-200" />
          My revision plan
        </h2>
        <button
          onClick={() => generateRevision.mutate()}
          disabled={generateRevision.isPending}
          className="px-4 py-2 bg-emerald-200 hover:bg-frappe-teal/30 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
        >
          {generateRevision.isPending ? 'Analysing your attempts…' : latest ? 'Refresh plan' : 'Create my plan'}
        </button>
      </div>

      {generateRevision.isError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{getErrorMessage(generateRevision.error, 'Could not create a revision plan.')}</span>
        </div>
      )}

      {revisions.isLoading ? (
        <p role="status" className="text-xs text-slate-500">Loading your revision plans…</p>
      ) : revisions.isError ? (
        <p role="alert" className="text-xs text-rose-600">{getErrorMessage(revisions.error)}</p>
      ) : !latest ? (
        <p className="text-xs text-slate-500">Submit a quiz in this course, then create a plan based on your results.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{latest.content.title}</h3>
            <p className="text-sm text-latte-subtext1 dark:text-frappe-subtext1">{latest.content.overview}</p>
          </div>

          <table className="w-full text-xs">
            <caption className="text-left text-slate-500 mb-1">
              Based on {latest.content.performance.submitted_attempts} submitted attempt(s), overall accuracy{' '}
              {latest.content.performance.overall_accuracy_percent}%
            </caption>
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Topic</th>
                <th>Your accuracy</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {latest.content.performance.topics.map((t) => (
                <tr key={t.topic} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1">{t.topic}</td>
                  <td className={t.accuracy_percent < t.target_percent ? 'text-rose-600 font-semibold' : 'text-frappe-teal'}>
                    {t.accuracy_percent}%
                  </td>
                  <td>{t.target_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {latest.content.focus_areas.map((area) => (
            <div key={area.topic} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{area.topic}</h4>
              <p className="text-xs text-latte-subtext1 dark:text-frappe-subtext1">{area.reason}</p>
              <ul className="list-disc pl-5 text-xs mt-1 space-y-0.5">
                {area.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}

          {latest.content.next_steps.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-latte-subtext1 dark:text-frappe-subtext1">
              {latest.content.next_steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
