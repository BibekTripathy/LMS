import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, PlayCircle, Trophy } from 'lucide-react';
import { useCourseQuizzes, useMyQuizResults } from './hooks';
import { getErrorMessage } from '../../lib/errors';
import type { Quiz } from '../../types';

const QuizRow: React.FC<{ quiz: Quiz; compact: boolean }> = ({ quiz, compact }) => {
  const results = useMyQuizResults(quiz.id).data;
  const attempted = (results?.total_attempts ?? 0) > 0;
  const remaining = results?.attempts_remaining ?? null;
  const canStart = remaining === null || remaining > 0;
  const best = results?.highest_percentage;
  const minutes = Math.round(quiz.time_limit_seconds / 60);

  return (
    <li
      className={`rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#131418] shadow-xs ${compact ? 'p-3.5' : 'p-5'}`}
      data-testid={`course-quiz-${quiz.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#121316] dark:text-[#F3F4F6] truncate">{quiz.title}</p>
          <p className="text-[11px] text-[#868E96] flex flex-wrap items-center gap-x-2.5 mt-0.5">
            <span>{quiz.total_questions} questions</span>
            <span>Pass {quiz.pass_percentage}%</span>
            {minutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {minutes} min
              </span>
            )}
            {quiz.max_attempts ? <span>{remaining ?? quiz.max_attempts} of {quiz.max_attempts} attempts left</span> : null}
          </p>
        </div>
        {attempted && best !== null && best !== undefined && (
          <span
            className={`text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full flex-shrink-0 ${
              results?.has_passed ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#D97706]/10 text-[#D97706]'
            }`}
          >
            Best {best}%
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {canStart ? (
          <Link
            to={`/quizzes/${quiz.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white active:scale-[0.98] transition shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5" /> {attempted ? 'Retake' : 'Take quiz'}
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#868E96]">No attempts left</span>
        )}
        {attempted && (
          <Link
            to={`/quizzes/${quiz.id}/results`}
            className="px-3.5 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[#121316] dark:text-[#F3F4F6] transition"
          >
            Results
          </Link>
        )}
        {quiz.leaderboard_enabled && (
          <Link
            to={`/quizzes/${quiz.id}/leaderboard`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[#D97706] hover:bg-[#D97706]/10 transition"
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </Link>
        )}
      </div>
    </li>
  );
};

/** Published quizzes of a course for an enrolled student, with their own progress on each. */
export const CourseQuizList: React.FC<{ courseId: string; compact?: boolean }> = ({ courseId, compact = false }) => {
  const quizzesQuery = useCourseQuizzes(courseId);
  const quizzes = (quizzesQuery.data ?? []).filter((q) => q.status === 'PUBLISHED');

  return (
    <section className="space-y-3" aria-label="Course assessments">
      <h3
        className={`font-bold text-[#121316] dark:text-[#F3F4F6] flex items-center gap-2 ${
          compact ? 'text-xs uppercase tracking-wider text-[#868E96] font-mono' : 'text-xl'
        }`}
      >
        {!compact && <ClipboardList className="w-5 h-5 text-[#0066FF]" />}
        Assessments
      </h3>
      {quizzesQuery.isLoading ? (
        <p className="text-xs text-[#868E96]">Loading quizzes…</p>
      ) : quizzesQuery.error ? (
        <p className="text-xs text-[#DC2626]">{getErrorMessage(quizzesQuery.error, 'Could not load quizzes.')}</p>
      ) : quizzes.length === 0 ? (
        <p className="text-xs text-[#868E96]">No quizzes in this course yet.</p>
      ) : (
        <ul className={compact ? 'space-y-2' : 'grid sm:grid-cols-2 gap-3'}>
          {quizzes.map((quiz) => (
            <QuizRow key={quiz.id} quiz={quiz} compact={compact} />
          ))}
        </ul>
      )}
    </section>
  );
};
