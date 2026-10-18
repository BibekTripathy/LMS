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
  Sparkles,
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
    authoring.updateQuiz.mutate(
      {
        quizId: activeQuizId,
        data: {
          title: quizTitle,
          description: quizDesc,
          pass_percentage: passPercentage,
          time_limit_seconds: timeLimitMinutes * 60,
          status: quizStatus,
        },
      },
      {
        onSuccess: () => {
          setSuccessMsg('Quiz settings saved successfully!');
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err) => setError(getErrorMessage(err, 'Failed to update quiz.')),
      }
    );
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (!window.confirm('Delete this entire quiz and all questions?')) return;
    authoring.deleteQuiz.mutate(quizId, {
      onSuccess: () => setActiveQuizId(null),
      onError: (err) => alert('Failed to delete quiz: ' + getErrorMessage(err)),
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    if (!activeQuizId) return;
    authoring.deleteQuestion.mutate(
      { quizId: activeQuizId, questionId },
      { onError: (err) => alert('Failed to delete question: ' + getErrorMessage(err)) }
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
              <HelpCircle className="w-6 h-6 text-indigo-500" />
              <span>Quiz & Assessment Studio</span>
            </h1>
            <p className="text-xs text-slate-500">
              Course: <span className="font-semibold text-slate-700 dark:text-slate-300">{course?.title}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNewQuiz}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quiz
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No quizzes in this course</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Create your first quiz or import AI-generated questions from lesson transcripts.
            </p>
          </div>
          <button
            onClick={handleCreateNewQuiz}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Quiz Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quizzes Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
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
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-sm truncate">{q.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {q.total_questions || (q.questions?.length || 0)} Questions • Pass: {q.pass_percentage}%
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      q.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-500" />
                      Quiz Settings
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(activeQuiz.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
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
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">0 minutes indicates untimed quiz.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={quizStatus}
                        onChange={(e) => setQuizStatus(e.target.value as QuizStatus)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="PUBLISHED">Published (Available to students)</option>
                        <option value="DRAFT">Draft (Hidden)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={savingQuiz}
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Question Manager Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Questions</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                          {activeQuiz.questions?.length || 0} questions
                        </span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/study-centre"
                        title="Generate MCQs from a lesson, review them, then use “Convert to graded quiz”"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 rounded-lg transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        Create from AI Study
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion(null);
                          setShowQuestionModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Question
                      </button>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  {(!activeQuiz.questions || activeQuiz.questions.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No questions in this quiz yet. Click 'Add Question' or import from the AI Study Centre.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeQuiz.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-indigo-300 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                                  {q.prompt || q.text}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium">
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
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition"
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
                            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
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
              <div className="p-8 text-center text-slate-400">Select a quiz from the left to configure.</div>
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
