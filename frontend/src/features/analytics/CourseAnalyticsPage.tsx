import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, TrendingUp, Trophy, Users } from 'lucide-react';
import { useCourseAnalytics } from './hooks';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorMessage } from '../../lib/errors';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="lms-card p-6 space-y-4">
    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
    {children}
  </section>
);

/** Instructor (course owner) / admin analytics for one course. */
export const CourseAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const analyticsQuery = useCourseAnalytics(id);
  const data = analyticsQuery.data;

  if (analyticsQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (analyticsQuery.error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ErrorState
          title="Course analytics unavailable"
          message={getErrorMessage(analyticsQuery.error, 'Could not load analytics for this course.')}
          onRetry={() => analyticsQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to={`/instructor/courses/${id}/edit`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to course editor
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{data.course_title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Course analytics &bull; {data.status.toLowerCase()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Enrollments" value={data.total_enrollments} testId="stat-enrollments"
          hint={`${data.active_enrollments} active • ${data.dropped_enrollments} dropped`} />
        <StatCard icon={CheckCircle2} label="Completion rate" value={`${data.completion_rate}%`} testId="stat-completion"
          hint={`${data.completed_enrollments} completed`} />
        <StatCard icon={TrendingUp} label="Avg. progress" value={`${data.average_course_progress}%`} />
        <StatCard icon={Trophy} label="Avg. quiz score" value={`${data.average_quiz_score}%`} testId="stat-quiz-score"
          hint={`${data.total_quiz_attempts} attempts • ${data.quiz_pass_rate}% pass rate`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Lesson completion">
          {data.lessons_breakdown.length === 0 ? (
            <p className="text-sm text-slate-500">This course has no lessons yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.lessons_breakdown.map((lesson) => (
                <li key={lesson.lesson_id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {lesson.module_title} › {lesson.title}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">{lesson.completed_count} done</span>
                  </div>
                  <ProgressBar value={lesson.completion_rate} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Quiz performance">
          {data.quizzes_breakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No quizzes in this course yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="quiz-stats-table">
                <thead className="text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="text-left py-2.5 font-semibold">Quiz</th>
                    <th className="text-right py-2.5 font-semibold">Students</th>
                    <th className="text-right py-2.5 font-semibold">Avg</th>
                    <th className="text-right py-2.5 font-semibold">Pass rate</th>
                    <th className="text-right py-2.5 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.quizzes_breakdown.map((quiz) => (
                    <tr key={quiz.quiz_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        {quiz.title}
                        {quiz.status !== 'PUBLISHED' && <span className="ml-1 text-slate-400 text-[11px]">({quiz.status.toLowerCase()})</span>}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">{quiz.unique_students_attempted}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-slate-800 dark:text-slate-200">{quiz.average_score}%</td>
                      <td className="py-2.5 text-right font-mono font-medium text-slate-800 dark:text-slate-200">{quiz.pass_rate}%</td>
                      <td className="py-2.5 text-right">
                        <Link to={`/quizzes/${quiz.quiz_id}/leaderboard`} className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
                          Leaderboard
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      <Section title="Students">
        {data.students.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No students yet" description="Students appear here once they enroll." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="student-stats-table">
              <thead className="text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="text-left py-2.5 font-semibold">Student</th>
                  <th className="text-left py-2.5 font-semibold w-44">Progress</th>
                  <th className="text-right py-2.5 font-semibold">Quiz avg</th>
                  <th className="text-right py-2.5 font-semibold">Passed</th>
                  <th className="text-right py-2.5 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.students.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{s.student_name}</span>
                      <span className="block text-slate-400 text-[11px] font-mono">{s.student_email}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <ProgressBar value={s.progress_percentage} size="sm" variant={s.is_completed ? 'emerald' : 'indigo'} />
                      <span className="text-slate-400 text-[11px] mt-0.5 block font-mono">
                        {s.completed_lessons_count}/{s.total_lessons_count} lessons
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {s.quiz_attempts_count ? `${s.average_quiz_score}%` : '—'}
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                      {s.quizzes_passed_count}
                    </td>
                    <td className="py-2.5 text-right text-slate-500 font-mono text-[11px]">
                      {s.last_active ? new Date(s.last_active).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};
