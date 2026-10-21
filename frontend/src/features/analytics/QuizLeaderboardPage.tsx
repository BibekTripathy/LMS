import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Medal } from 'lucide-react';
import { useQuizLeaderboard } from './hooks';
import { useAuth } from '../../context/auth';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorCode, getErrorMessage } from '../../lib/errors';

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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6] transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to results
      </Link>

      <div className="lms-card p-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#121316] dark:text-[#F3F4F6] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D97706]" /> {data.quiz_title}
          </h1>
          <p className="text-xs text-[#868E96] mt-1">
            Top scores achieved on this assessment across all student submissions.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-xs font-mono font-medium text-[#868E96]">
          <Users className="w-3.5 h-3.5" />
          <span>{data.leaderboard.length} ranked</span>
        </div>
      </div>

      {data.leaderboard.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No submissions yet"
          description="Be the first student to complete this quiz and claim the top ranking."
        />
      ) : (
        <div className="lms-card overflow-hidden">
          <table className="w-full text-left text-xs" data-testid="leaderboard-table">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#868E96] uppercase font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Student</th>
                {showEmails && <th className="py-3 px-4">Email</th>}
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-right">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-[#121316] dark:text-[#F3F4F6]">
              {data.leaderboard.map((entry, index) => {
                const isCurrentUser = user && (entry.student_id === user.id || entry.student_email === user.email);
                return (
                  <tr
                    key={index}
                    className={`transition ${
                      isCurrentUser
                        ? 'bg-[#0066FF]/5 font-semibold'
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {index === 0 ? (
                        <span className="text-[#D97706] inline-flex items-center gap-1 justify-center">
                          <Medal className="w-4 h-4" /> 1
                        </span>
                      ) : index === 1 ? (
                        <span className="text-[#868E96] inline-flex items-center gap-1 justify-center">
                          <Medal className="w-4 h-4" /> 2
                        </span>
                      ) : index === 2 ? (
                        <span className="text-[#B45309] inline-flex items-center gap-1 justify-center">
                          <Medal className="w-4 h-4" /> 3
                        </span>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {entry.student_name}
                      {isCurrentUser && ' (you)'}
                    </td>
                    {showEmails && (
                      <td className="py-3.5 px-4 text-[#868E96] font-mono text-[11px]">
                        {entry.student_email || '—'}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0066FF]">
                      {entry.highest_percentage}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#868E96]">
                      {entry.total_attempts}
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
