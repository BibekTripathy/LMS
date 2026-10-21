import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../lib/errors';
import { useCourseDetail } from '../authoring/hooks';
import { quizKeys, useCourseQuizzes, useQuizAuthoring, useQuizManage } from './hooks';
import type { Quiz, Question, QuizStatus } from '../../types';
import { QuestionEditorModal } from './QuestionEditorModal';
import {
  HelpCircle,
  PlusCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';

export const QuizBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const courseQuery = useCourseDetail(courseId);
  const quizzesQuery = useCourseQuizzes(courseId);
  const authoring = useQuizAuthoring(courseId);
  const queryClient = useQueryClient();
  const course = courseQuery.data ?? null;
  const quizzes: Quiz[] = quizzesQuery.data ?? [];

  // The selected quiz defaults to the first one; it is derived, not synced in an effect.
  const [selectedQuizId, setActiveQuizId] = useState<string | null>(null);
  const activeQuizId = quizzes.some((q) => q.id === selectedQuizId) ? selectedQuizId : quizzes[0]?.id ?? null;
  const activeQuizQuery = useQuizManage(activeQuizId);
  const activeQuiz = activeQuizQuery.data ?? null;

  // Quiz Form Settings
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [passPercentage, setPassPercentage] = useState<number>(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);
  const [maxAttempts, setMaxAttempts] = useState<string>(''); // '' = unlimited
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('DRAFT');

  // Copy the loaded quiz into the form once per server version.
  const loadedVersion = activeQuiz ? `${activeQuiz.id}:${activeQuiz.updated_at}` : null;
  const [formVersion, setFormVersion] = useState<string | null>(null);
  if (activeQuiz && loadedVersion !== formVersion) {
    setFormVersion(loadedVersion);
    setQuizTitle(activeQuiz.title);
    setQuizDesc(activeQuiz.description || '');
    setPassPercentage(activeQuiz.pass_percentage);
    setTimeLimitMinutes(Math.round((activeQuiz.time_limit_seconds || 1800) / 60));
    setMaxAttempts(activeQuiz.max_attempts ? String(activeQuiz.max_attempts) : '');
    setLeaderboardEnabled(activeQuiz.leaderboard_enabled ?? true);
    setQuizStatus(activeQuiz.status);
  }

  const loading = courseQuery.isLoading || quizzesQuery.isLoading;
  const savingQuiz = authoring.updateQuiz.isPending;
  const [actionError, setError] = useState<string | null>(null);
  const loadError = courseQuery.error ?? quizzesQuery.error ?? activeQuizQuery.error;
  const error = actionError ?? (loadError ? getErrorMessage(loadError, 'Failed to load quizzes for course.') : null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Question Modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  /** Kept for the sidebar/modal callers: selecting a quiz is enough, the query loads it. */
  const loadActiveQuiz = (quizId: string) => {
    queryClient.invalidateQueries({ queryKey: quizKeys.manage(quizId) });
  };

  const handleCreateNewQuiz = () => {
    if (!courseId) return;
    const title = prompt('Enter a title for the new quiz:', 'Course Assessment Quiz');
    if (!title) return;

    authoring.createQuiz.mutate(
      {
        title,
        description: 'Test your understanding of the course materials.',
        pass_percentage: 70,
        time_limit_seconds: 1800,
        status: 'DRAFT',
      },
      {
        onSuccess: (created) => setActiveQuizId(created.id),
        onError: (err) => alert('Failed to create quiz: ' + getErrorMessage(err)),
      }
    );
  };

  const handleSaveQuizSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizId) return;

    setError(null);
    setSuccessMsg(null);

    const parsedAttempts = maxAttempts.trim() === '' ? null : parseInt(maxAttempts, 10);
    const payload = {
      title: quizTitle,
      description: quizDesc,
      pass_percentage: passPercentage,
      time_limit_seconds: timeLimitMinutes * 60,
      max_attempts: parsedAttempts && parsedAttempts > 0 ? parsedAttempts : null,
      leaderboard_enabled: leaderboardEnabled,
      status: quizStatus,
    };

    authoring.updateQuiz.mutate(
      { quizId: activeQuizId, data: payload },
      {
        onSuccess: () => {
          setSuccessMsg('Quiz settings saved successfully.');
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err) => setError(getErrorMessage(err, 'Failed to save quiz settings.')),
      }
    );
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this entire quiz?')) return;
    authoring.deleteQuiz.mutate(quizId, {
      onSuccess: () => {
        setActiveQuizId(null);
      },
      onError: (err) => alert('Failed to delete quiz: ' + getErrorMessage(err)),
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!window.confirm('Delete this question?')) return;
    authoring.deleteQuestion.mutate(
      { quizId: activeQuizId!, questionId },
      {
        onSuccess: () => loadActiveQuiz(activeQuizId!),
        onError: (err) => alert('Failed to delete question: ' + getErrorMessage(err)),
      }
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-mono">Loading assessment studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            to={courseId ? `/instructor/courses/${courseId}/edit` : '/instructor'}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              <span>Quiz &amp; Assessment Studio</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Course: <span className="font-semibold text-slate-700 dark:text-slate-300">{course?.title}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNewQuiz}
          className="btn-primary self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quiz
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="lms-card p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No quizzes in this course</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Create your first quiz or convert practice questions from the Study Centre into a graded assessment.
            </p>
          </div>
          <button
            onClick={handleCreateNewQuiz}
            className="btn-primary"
          >
            <PlusCircle className="w-4 h-4" />
            Create Quiz Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quizzes Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block px-1">
              Course Quizzes ({quizzes.length})
            </span>
            <div className="space-y-1.5">
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setActiveQuizId(q.id);
                    loadActiveQuiz(q.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                    activeQuizId === q.id
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-950 dark:text-brand-200 shadow-sm'
                      : 'bg-white dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-sm truncate">{q.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {q.total_questions || (q.questions?.length || 0)} Questions • Pass: {q.pass_percentage}%
                      {q.max_attempts ? ` • ${q.max_attempts} attempt${q.max_attempts === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      q.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {q.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Quiz Content & Questions */}
          <div className="lg:col-span-9 space-y-6">
            {activeQuiz ? (
              <>
                {/* Quiz Configuration Panel */}
                <div className="lms-card p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit className="w-4 h-4 text-brand-500" />
                      Quiz Settings
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(activeQuiz.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Delete entire quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveQuizSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Quiz Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Instructions / Description
                      </label>
                      <textarea
                        rows={2}
                        value={quizDesc}
                        onChange={(e) => setQuizDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Pass Percentage Threshold (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={passPercentage}
                        onChange={(e) => setPassPercentage(parseInt(e.target.value) || 70)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Time Limit (Minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="240"
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">0 minutes indicates untimed quiz.</span>
                    </div>

                    <div>
                      <label
                        htmlFor="quiz-max-attempts"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                      >
                        Max Attempts per Student
                      </label>
                      <input
                        id="quiz-max-attempts"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, ''))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">Leave empty for unlimited retakes.</span>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={leaderboardEnabled}
                          onChange={(e) => setLeaderboardEnabled(e.target.checked)}
                          className="w-4 h-4 accent-brand-600 rounded"
                        />
                        Show leaderboard to students
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={quizStatus}
                        onChange={(e) => setQuizStatus(e.target.value as QuizStatus)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="PUBLISHED">Published (Available to students)</option>
                        <option value="DRAFT">Draft (Hidden)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={savingQuiz}
                        className="btn-primary w-full justify-center text-xs py-2"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Question Manager Section */}
                <div className="lms-card p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Questions</span>
                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {activeQuiz.questions?.length || 0} questions
                        </span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/study-centre"
                        title="Review study centre resources and convert questions to graded quiz"
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        Study Centre Drafts
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion(null);
                          setShowQuestionModal(true);
                        }}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Question
                      </button>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  {(!activeQuiz.questions || activeQuiz.questions.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No questions in this quiz yet. Click 'Add Question' or import from the Study Centre.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeQuiz.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-4 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-brand-300 dark:hover:border-brand-800 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-200 dark:border-brand-800">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                                  {q.prompt || q.text}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono font-medium">
                                  {q.marks || 1} mark(s)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setShowQuestionModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-brand-600 rounded transition"
                                title="Edit Question"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Options pills preview */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {q.options &&
                              q.options.map((opt, optIdx) => (
                                <div
                                  key={opt.id || optIdx}
                                  className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                                    opt.is_correct
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  {opt.is_correct ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{opt.text}</span>
                                </div>
                              ))}
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/50 dark:border-slate-800">
                              Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">Select a quiz from the left to configure.</div>
            )}
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && activeQuizId && (
        <QuestionEditorModal
          quizId={activeQuizId}
          question={editingQuestion}
          onClose={() => setShowQuestionModal(false)}
          onSaved={() => {
            setShowQuestionModal(false);
            loadActiveQuiz(activeQuizId);
          }}
        />
      )}
    </div>
  );
};
