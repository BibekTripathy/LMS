import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quizApi } from '../../api/quizzes';
import type { Question } from '../../types';
import { getErrorMessage } from '../../lib/errors';
import { useAttempt, useAttemptMutations, useQuiz } from './hooks';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
} from 'lucide-react';

export const QuizPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const quizQuery = useQuiz(id);
  // Starting is idempotent on the server (an unexpired attempt is resumed), so it is
  // modelled as a query keyed by quiz: it runs once per visit and never retries.
  const startQuery = useQuery({
    queryKey: ['quizzes', 'start', id],
    queryFn: () => quizApi.startQuiz(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  const attemptQuery = useAttempt(startQuery.data?.id);
  const { save, submit } = useAttemptMutations(id);

  const quiz = quizQuery.data ?? null;
  const attempt = attemptQuery.data ?? startQuery.data ?? null;
  const questions: Question[] = attemptQuery.data?.questions ?? quiz?.questions ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loading = quizQuery.isLoading || startQuery.isLoading || attemptQuery.isLoading;
  const submitting = submit.isPending;
  const loadError = quizQuery.error ?? startQuery.error ?? attemptQuery.error;
  const error = submitError ?? (loadError ? getErrorMessage(loadError, 'Failed to start quiz.') : null);

  // Pre-fill answers already saved on the server, once per attempt.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (attemptQuery.data && prefilledFor !== attemptQuery.data.id) {
    setPrefilledFor(attemptQuery.data.id);
    const prefill: Record<string, string> = {};
    (attemptQuery.data.answers ?? []).forEach((ans) => {
      const optId = ans.selected_option_id || ans.choice_id || ans.selected_choice_id;
      if (optId) prefill[ans.question_id] = optId;
    });
    setSelectedAnswers(prefill);
  }

  const submitQuiz = useCallback(() => {
    if (!attempt || submit.isPending) return;
    setSubmitError(null);
    const answersPayload = Object.entries(selectedAnswers).map(([question_id, selected_option_id]) => ({
      question_id,
      selected_option_id,
    }));
    submit.mutate(
      { attemptId: attempt.id, answers: answersPayload },
      {
        onSuccess: () => navigate(`/quizzes/${id}/results`, { replace: true }),
        onError: (err) => setSubmitError(getErrorMessage(err, 'Failed to submit quiz.')),
      }
    );
  }, [attempt, submit, selectedAnswers, id, navigate]);

  // The countdown is derived from the server deadline; the server stays authoritative.
  const deadlineMs = attempt?.deadline_at ? new Date(attempt.deadline_at).getTime() : null;
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (deadlineMs === null) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadlineMs]);
  const timeLeftSeconds = deadlineMs === null ? null : Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));

  // Auto-submit once when time runs out.
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (timeLeftSeconds === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submitQuiz();
    }
  }, [timeLeftSeconds, submitQuiz]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    // Save in the background; local state is kept if the network drops.
    if (attempt) {
      save.mutate({ attemptId: attempt.id, answers: [{ question_id: questionId, selected_option_id: optionId }] });
    }
  };

  const formatTimer = (totalSecs: number) => {
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Initializing assessment session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Start Quiz</h2>
        <p className="text-sm text-slate-500">{error || 'Quiz not found.'}</p>
        <Link
          to="/courses"
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition"
        >
          Return to Courses
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Questions Ready</h2>
        <p className="text-sm text-slate-500">
          This quiz is currently being authored by the instructor and does not have active questions yet.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Test Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded uppercase">
              Official Assessment
            </span>
            <span className="text-xs text-slate-500">Pass threshold: {quiz.pass_percentage}%</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{quiz.title}</h1>
        </div>

        {/* Timer & Submit Trigger */}
        <div className="flex items-center gap-4">
          {timeLeftSeconds !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold border ${
                timeLeftSeconds <= 120
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Finish & Submit
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-2 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Question Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">{currentQ.marks || 1} mark(s)</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.prompt || currentQ.text}
          </h3>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options &&
              currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </button>
                );
              })}
          </div>

          {/* Stepper Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
              >
                Review & Submit <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Question Navigator
            </h4>
            <span className="text-xs text-slate-500">
              {answeredCount}/{questions.length} answered
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition border ${
                    isCurrent
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'border-transparent'
                  } ${
                    isAnswered
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to submit?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You have answered <span className="font-bold text-indigo-600">{answeredCount}</span> of{' '}
              <span className="font-bold">{questions.length}</span> questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-600 font-semibold text-xs">
                  Warning: You have {questions.length - answeredCount} unanswered question(s).
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitQuiz}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Submit & View Results</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
