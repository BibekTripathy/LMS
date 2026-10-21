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
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${compact ? 'p-3' : 'p-4'}`}
      data-testid={`course-quiz-${quiz.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{quiz.title}</p>
          <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
            <span>{quiz.total_questions} questions</span>
            <span>Pass {quiz.pass_percentage}%</span>
            {minutes > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {minutes} min
              </span>
            )}
            {quiz.max_attempts ? <span>{remaining ?? quiz.max_attempts} of {quiz.max_attempts} attempts left</span> : null}
          </p>
        </div>
        {attempted && best !== null && best !== undefined && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              results?.has_passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            Best {best}%
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-semibold">
        {canStart ? (
          <Link
            to={`/quizzes/${quiz.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <PlayCircle className="w-3.5 h-3.5" /> {attempted ? 'Retake' : 'Take quiz'}
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">No attempts left</span>
        )}
        {attempted && (
          <Link
            to={`/quizzes/${quiz.id}/results`}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            Results
          </Link>
        )}
        {quiz.leaderboard_enabled && (
          <Link
            to={`/quizzes/${quiz.id}/leaderboard`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-amber-700 hover:bg-amber-50 dark:text-amber-300"
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
        className={`font-bold text-slate-900 dark:text-white flex items-center gap-2 ${
          compact ? 'text-xs uppercase tracking-wider text-slate-500' : 'text-2xl'
        }`}
      >
        {!compact && <ClipboardList className="w-6 h-6 text-indigo-500" />}
        Assessments
      </h3>
      {quizzesQuery.isLoading ? (
        <p className="text-xs text-slate-500">Loading quizzes…</p>
      ) : quizzesQuery.error ? (
        <p className="text-xs text-rose-600">{getErrorMessage(quizzesQuery.error, 'Could not load quizzes.')}</p>
      ) : quizzes.length === 0 ? (
        <p className="text-xs text-slate-500">No quizzes in this course yet.</p>
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
