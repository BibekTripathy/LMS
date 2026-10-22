import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useStudentAnalytics } from './hooks';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

import { getErrorMessage } from '../../lib/errors';

export const StudentAnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const analyticsQuery = useStudentAnalytics();

  const data = analyticsQuery.data;
  const isLoading = analyticsQuery.isLoading;
  const error = analyticsQuery.error
    ? getErrorMessage(analyticsQuery.error, 'Failed to fetch your learning analytics.')
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile & Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-frappe-blue text-white flex items-center justify-center text-2xl font-black uppercase shadow-md shadow-frappe-blue/20">
            {user?.first_name ? user.first_name[0] : user?.email ? user.email[0] : 'S'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email?.split('@')[0]}
              </h1>
              <Badge variant="default" size="sm">
                {user?.role || 'STUDENT'}
              </Badge>
            </div>
            <p className="text-xs text-latte-subtext1 dark:text-frappe-subtext1">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-frappe-blue/10 hover:bg-frappe-blue/20 text-frappe-blue dark:bg-frappe-blue/15 dark:hover:bg-frappe-blue/25 dark:text-frappe-lavender text-xs font-bold rounded-xl transition"
          >
            My Learning Dashboard
          </Link>
          <Link
            to="/courses"
            className="px-4 py-2 bg-frappe-sapphire hover:bg-frappe-blue text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            Browse Courses
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Analytics Unavailable"
          message={error}
          onRetry={() => analyticsQuery.refetch()}
        />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Enrolled */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-frappe-blue/10 dark:bg-frappe-blue/20 text-frappe-blue dark:text-frappe-blue flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Enrolled</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white" data-testid="stat-enrolled">
                  {data.total_enrolled}
                </h3>
              </div>
            </div>

            {/* Completed Courses */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-frappe-teal dark:text-frappe-teal flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Courses</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white" data-testid="stat-completed">
                  {data.completed_courses}
                </h3>
              </div>
            </div>

            {/* Quizzes Taken */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quizzes Completed</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white" data-testid="stat-quizzes">
                  {data.total_quizzes_taken}
                </h3>
              </div>
            </div>

            {/* Average Quiz Percentage */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Quiz Score</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white" data-testid="stat-avg-score">
                  {data.average_quiz_percentage}%
                </h3>
              </div>
            </div>
          </div>

          {/* Performance Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score & Completion Rate Card */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Proficiency Summary</h2>
                <p className="text-xs text-slate-500">Live breakdown calculated across all assessments.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-latte-subtext1 dark:text-frappe-subtext1">Average Quiz Accuracy</span>
                    <span className="text-frappe-blue dark:text-frappe-blue">{data.average_quiz_percentage}%</span>
                  </div>
                  <ProgressBar
                    value={data.average_quiz_percentage}
                    variant={data.average_quiz_percentage >= 70 ? 'emerald' : data.average_quiz_percentage >= 50 ? 'amber' : 'purple'}
                    size="md"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-latte-subtext1 dark:text-frappe-subtext1">Course Completion Rate</span>
                    <span className="text-frappe-teal dark:text-frappe-teal">
                      {data.total_enrolled > 0
                        ? Math.round((data.completed_courses / data.total_enrolled) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <ProgressBar
                    value={
                      data.total_enrolled > 0
                        ? (data.completed_courses / data.total_enrolled) * 100
                        : 0
                    }
                    variant="emerald"
                    size="md"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <Link
                  to="/study-centre"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-xs rounded-xl transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Explore AI Study Center
                </Link>
              </div>
            </div>

            {/* Recent Assessment Attempts Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Quiz Attempts</h2>
                  <p className="text-xs text-slate-500">Persisted submission results and evaluation history.</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {data.recent_attempts?.length || 0} recent
                </span>
              </div>

              <div className="flex-1 overflow-x-auto">
                {!data.recent_attempts || data.recent_attempts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    No quiz attempts submitted yet. Complete quizzes to view evaluation metrics.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs" data-testid="recent-attempts-table">
                    <thead className="bg-latte-mantle dark:bg-frappe-surface0/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-6">Quiz Title</th>
                        <th className="py-3 px-6">Course</th>
                        <th className="py-3 px-6">Score</th>
                        <th className="py-3 px-6">Result</th>
                        <th className="py-3 px-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {data.recent_attempts.map((attempt, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                            <Link to={`/quizzes/${attempt.quiz_id}/results`} className="hover:text-frappe-blue">
                              {attempt.quiz_title}
                            </Link>
                          </td>
                          <td className="py-3.5 px-6 text-slate-500 truncate max-w-[150px]">
                            {attempt.course_title}
                          </td>
                          <td className="py-3.5 px-6 font-bold">
                            {attempt.score_percentage}%
                          </td>
                          <td className="py-3.5 px-6">
                            {attempt.passed ? (
                              <Badge variant="success" size="sm">Passed</Badge>
                            ) : (
                              <Badge variant="danger" size="sm">Needs Review</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-slate-400">
                            {new Date(attempt.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
