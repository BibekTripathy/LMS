import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-transition-enter">
      {/* Profile & Header Card */}
      <div className="lms-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center text-xl font-bold uppercase shadow-sm">
            {user?.first_name ? user.first_name[0] : user?.email ? user.email[0] : 'S'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#121316] dark:text-[#F3F4F6] tracking-tight">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email?.split('@')[0]}
              </h1>
              <Badge variant="default" size="sm">
                {user?.role || 'STUDENT'}
              </Badge>
            </div>
            <p className="text-xs text-[#868E96] dark:text-[#94969E]">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
          >
            My Learning Dashboard
          </Link>
          <Link
            to="/courses"
            className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
          >
            Browse Courses
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 lms-card space-y-2">
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
            <div className="p-5 lms-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider">Courses Enrolled</p>
                <h3 className="text-2xl font-bold text-[#121316] dark:text-[#F3F4F6] font-mono" data-testid="stat-enrolled">
                  {data.total_enrolled}
                </h3>
              </div>
            </div>

            {/* Completed Courses */}
            <div className="p-5 lms-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#059669]/10 text-[#059669] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider">Completed Courses</p>
                <h3 className="text-2xl font-bold text-[#121316] dark:text-[#F3F4F6] font-mono" data-testid="stat-completed">
                  {data.completed_courses}
                </h3>
              </div>
            </div>

            {/* Quizzes Taken */}
            <div className="p-5 lms-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider">Quizzes Completed</p>
                <h3 className="text-2xl font-bold text-[#121316] dark:text-[#F3F4F6] font-mono" data-testid="stat-quizzes">
                  {data.total_quizzes_taken}
                </h3>
              </div>
            </div>

            {/* Average Quiz Score */}
            <div className="p-5 lms-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider">Avg Quiz Score</p>
                <h3 className="text-2xl font-bold text-[#121316] dark:text-[#F3F4F6] font-mono" data-testid="stat-avg-score">
                  {data.average_quiz_percentage}%
                </h3>
              </div>
            </div>
          </div>

          {/* Detailed Performance Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Completion & Accuracy Summary */}
            <div className="lg:col-span-1 lms-card p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-[#121316] dark:text-[#F3F4F6] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0066FF]" />
                  Proficiency Summary
                </h2>
                <p className="text-xs text-[#868E96] mt-0.5">Live breakdown calculated across all assessments.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#64666E] dark:text-[#94969E]">Average Quiz Accuracy</span>
                    <span className="text-[#0066FF] font-mono">{data.average_quiz_percentage}%</span>
                  </div>
                  <ProgressBar
                    value={data.average_quiz_percentage}
                    variant={data.average_quiz_percentage >= 70 ? 'emerald' : data.average_quiz_percentage >= 50 ? 'amber' : 'indigo'}
                    size="md"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#64666E] dark:text-[#94969E]">Course Completion Rate</span>
                    <span className="text-[#059669] font-mono">
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

              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                <Link
                  to="/study-centre"
                  className="w-full btn-secondary py-2.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Open Study Centre</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Recent Assessment Attempts Table */}
            <div className="lg:col-span-2 lms-card overflow-hidden flex flex-col justify-between">
              <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#121316] dark:text-[#F3F4F6]">Recent Quiz Attempts</h2>
                  <p className="text-xs text-[#868E96]">Persisted submission results and evaluation history.</p>
                </div>
                <span className="text-xs text-[#868E96] font-mono">
                  {data.recent_attempts?.length || 0} recent
                </span>
              </div>

              <div className="flex-1 overflow-x-auto">
                {!data.recent_attempts || data.recent_attempts.length === 0 ? (
                  <div className="p-12 text-center text-[#868E96] text-xs">
                    No quiz attempts submitted yet. Complete quizzes to view evaluation metrics.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs" data-testid="recent-attempts-table">
                    <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#868E96] uppercase tracking-wider font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                      <tr>
                        <th className="py-3 px-6">Quiz Title</th>
                        <th className="py-3 px-6">Course</th>
                        <th className="py-3 px-6">Score</th>
                        <th className="py-3 px-6">Result</th>
                        <th className="py-3 px-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-[#121316] dark:text-[#F3F4F6]">
                      {data.recent_attempts.map((attempt, idx) => (
                        <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition">
                          <td className="py-3.5 px-6 font-semibold">
                            <Link to={`/quizzes/${attempt.quiz_id}/results`} className="hover:text-[#0066FF] transition-colors">
                              {attempt.quiz_title}
                            </Link>
                          </td>
                          <td className="py-3.5 px-6 text-[#868E96] truncate max-w-[150px]">
                            {attempt.course_title}
                          </td>
                          <td className="py-3.5 px-6 font-mono font-bold">
                            {attempt.score_percentage}%
                          </td>
                          <td className="py-3.5 px-6">
                            {attempt.passed ? (
                              <Badge variant="success" size="sm">Passed</Badge>
                            ) : (
                              <Badge variant="danger" size="sm">Needs Review</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-[#868E96] font-mono text-[11px]">
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
