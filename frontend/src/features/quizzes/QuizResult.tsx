import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../lib/errors';
import { useAttempt, useMyQuizResults, useQuiz } from './hooks';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Calendar,
  AlertCircle,
  HelpCircle,
  Award,
  Trophy,
} from 'lucide-react';

export const QuizResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const resultsQuery = useMyQuizResults(id);
  const courseId = useQuiz(id).data?.course;
  const backTo = courseId ? `/courses/${courseId}` : '/courses';
  const resultsSummary = resultsQuery.data ?? null;

  // Review the most recent *submitted* attempt; in-progress attempts have nothing to grade yet.
  const latestSubmittedId = [...(resultsSummary?.attempts ?? [])]
    .filter((a) => a.status === 'SUBMITTED')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]?.id;
  const attemptQuery = useAttempt(latestSubmittedId);
  const latestAttempt = attemptQuery.data ?? null;

  const loading = resultsQuery.isLoading || (!!latestSubmittedId && attemptQuery.isLoading);
  const loadError = resultsQuery.error ?? attemptQuery.error;
  const error = loadError ? getErrorMessage(loadError, 'Failed to load quiz results.') : null;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Calculating score and feedback...
          </p>
        </div>
      </div>
    );
  }

  if (error || !resultsSummary) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Results Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'No attempt history found for this quiz.'}</p>
        <Link
          to="/courses"
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl transition"
        >
          Return to Courses
        </Link>
      </div>
    );
  }

  const passed = latestAttempt?.passed ?? resultsSummary.has_passed;
  const remaining = resultsSummary.attempts_remaining ?? null;
  const canRetake = remaining === null || remaining > 0;
  const retakePolicy =
    remaining === null
      ? 'Unlimited retakes permitted.'
      : `${remaining} of ${resultsSummary.max_attempts} attempt${resultsSummary.max_attempts === 1 ? '' : 's'} remaining.`;
  const scorePercent = latestAttempt?.percentage ?? resultsSummary.highest_percentage ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {courseId ? 'Back to Course' : 'Back to Courses'}
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/study-centre"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-semibold rounded-xl transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            Study with AI
          </Link>

          <Link
            to={`/quizzes/${id}/leaderboard`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-semibold rounded-xl transition"
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </Link>

          {canRetake ? (
            <Link
              to={`/quizzes/${id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Quiz
            </Link>
          ) : (
            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold rounded-xl">
              No attempts left
            </span>
          )}
        </div>
      </div>

      {/* Hero Score Badge Card */}
      <div
        className={`rounded-3xl border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          passed
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200 dark:border-emerald-800'
            : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-200 dark:border-rose-800'
        }`}
      >
        <div className="flex items-start gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              passed
                ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                : 'bg-rose-500 text-white shadow-rose-500/25'
            }`}
          >
            {passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <span
              className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
                passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {passed ? 'Assessment Passed' : 'Needs Revision'}
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {resultsSummary.quiz_title}
            </h1>
            <p className="text-xs text-slate-500">
              Pass requirement: {resultsSummary.pass_percentage}% • {retakePolicy}
            </p>
          </div>
        </div>

        {/* Score KPIs */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score</p>
            <h2
              className={`text-3xl font-black ${
                passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {scorePercent}%
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {latestAttempt?.marks_obtained ?? 0} / {latestAttempt?.total_marks_possible ?? 0} marks
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attempts</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {resultsSummary.total_attempts}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Best: {resultsSummary.highest_percentage ?? scorePercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      {latestAttempt?.questions && latestAttempt.questions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              <span>Submission Answer Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Explanations revealed</span>
          </div>

          <div className="space-y-6">
            {latestAttempt.questions.map((q, idx) => {
              const studentAnswer = latestAttempt.answers?.find((a) => a.question_id === q.id);
              const selectedOptId = studentAnswer?.selected_option_id || studentAnswer?.choice_id;
              const isCorrect = !!studentAnswer?.is_correct;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20'
                      : 'border-rose-200 dark:border-rose-900 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {q.prompt || q.text}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {/* Options review */}
                  <div className="space-y-2 pt-1">
                    {q.options &&
                      q.options.map((opt) => {
                        const wasSelected = selectedOptId === opt.id;
                        const isTheCorrectOption = !!opt.is_correct;

                        let optClasses =
                          'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300';

                        if (isTheCorrectOption) {
                          optClasses =
                            'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                        } else if (wasSelected && !isTheCorrectOption) {
                          optClasses =
                            'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optClasses}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {wasSelected && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                                  Your Choice
                                </span>
                              )}
                              <span>{opt.text}</span>
                            </div>

                            {isTheCorrectOption && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <CheckCircle className="w-3.5 h-3.5" /> Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {q.explanation && (
                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900">
                      <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">Explanation</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Attempts Table */}
      {resultsSummary.attempts && resultsSummary.attempts.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Attempt History</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {resultsSummary.attempts.map((att, i) => (
              <div key={att.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-white">
                    Attempt #{resultsSummary.attempts.length - i}
                  </span>
                  <span className="text-slate-400 ml-2">
                    {new Date(att.started_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-white">{att.percentage ?? 0}%</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                      att.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {att.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
