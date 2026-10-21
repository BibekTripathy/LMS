import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Medal, Trophy, Users } from 'lucide-react';
import { useQuizLeaderboard } from './hooks';
import { useAuth } from '../../context/auth';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorCode, getErrorMessage } from '../../lib/errors';

const medalColour = ['text-amber-500', 'text-slate-400', 'text-orange-600'];

/** Best score per student for one quiz. Emails only come back for the course instructor/admins. */
export const QuizLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const leaderboardQuery = useQuizLeaderboard(id);
  const data = leaderboardQuery.data;

  if (leaderboardQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (leaderboardQuery.error || !data) {
    const disabled = getErrorCode(leaderboardQuery.error) === 'LEADERBOARD_DISABLED';
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ErrorState
          title={disabled ? 'Leaderboard turned off' : 'Leaderboard unavailable'}
          message={
            disabled
              ? 'The instructor has turned off the leaderboard for this quiz.'
              : getErrorMessage(leaderboardQuery.error, 'Could not load the leaderboard.')
          }
          onRetry={disabled ? undefined : () => leaderboardQuery.refetch()}
        />
      </div>
    );
  }

  const showEmails = data.leaderboard.some((e) => e.student_email);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to={`/quizzes/${id}/results`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> {data.quiz_title}
          </h1>
          <p className="text-sm text-slate-500">
            {data.course_title} • Pass mark {data.pass_percentage}% • Ranked by best score; ties go to the earlier submission
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Users className="w-4 h-4" /> {data.total_participants}
        </span>
      </div>

      {data.my_entry && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-sm">
          Your rank: <strong>#{data.my_entry.rank}</strong> with {data.my_entry.highest_percentage}% (
          {data.my_entry.total_attempts} attempt{data.my_entry.total_attempts === 1 ? '' : 's'})
        </div>
      )}

      {data.leaderboard.length === 0 ? (
        <EmptyState icon={Trophy} title="No submissions yet" description="Be the first to complete this quiz." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-sm" data-testid="leaderboard-table">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Learner</th>
                <th className="px-4 py-3 text-right">Best</th>
                <th className="px-4 py-3 text-right">Attempts</th>
                <th className="px-4 py-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.leaderboard.map((entry) => {
                const isMe = entry.student_id === user?.id;
                return (
                  <tr key={entry.student_id} className={isMe ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}>
                    <td className="px-4 py-3 font-bold">
                      <span className="inline-flex items-center gap-1">
                        {entry.rank <= 3 && <Medal className={`w-4 h-4 ${medalColour[entry.rank - 1]}`} />}#{entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {entry.student_name}
                        {isMe && ' (you)'}
                      </span>
                      {showEmails && entry.student_email && (
                        <span className="block text-xs text-slate-400">{entry.student_email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{entry.highest_percentage}%</td>
                    <td className="px-4 py-3 text-right">{entry.total_attempts}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          entry.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {entry.passed ? 'Passed' : 'Not yet'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
