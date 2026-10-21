import React from 'react';
import { BookOpen, ClipboardCheck, GraduationCap, Users } from 'lucide-react';
import { useAdminAnalytics } from './hooks';
import { StatCard } from '../../components/ui/StatCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorMessage } from '../../lib/errors';

const Breakdown: React.FC<{ title: string; rows: [string, React.ReactNode][] }> = ({ title, rows }) => (
  <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
    <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
    <dl className="space-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-slate-500">{label}</dt>
          <dd className="font-semibold text-slate-900 dark:text-white">{value}</dd>
        </div>
      ))}
    </dl>
  </section>
);

/** Platform-wide statistics (ADMIN only; the API returns 403 to everyone else). */
export const AdminAnalyticsPage: React.FC = () => {
  const analyticsQuery = useAdminAnalytics();
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
          title="Platform analytics unavailable"
          message={getErrorMessage(analyticsQuery.error, 'Could not load platform statistics.')}
          onRetry={() => analyticsQuery.refetch()}
        />
      </div>
    );
  }

  const { users, courses, enrollments, progress, assessments } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Platform Analytics</h1>
        <p className="text-sm text-slate-500">Live totals across every course and user.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Users" value={users.total_users} testId="stat-users"
          hint={`${users.active_users} active`} />
        <StatCard icon={BookOpen} label="Courses" value={courses.total_courses} testId="stat-courses"
          hint={`${courses.published_courses} published`} />
        <StatCard icon={GraduationCap} label="Enrollments" value={enrollments.total_enrollments}
          hint={`${enrollments.completion_rate}% completed`} />
        <StatCard icon={ClipboardCheck} label="Quiz attempts" value={assessments.total_quiz_attempts}
          hint={`${assessments.overall_quiz_pass_rate}% pass rate`} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Breakdown
          title="Users by role"
          rows={[
            ['Students', users.total_students],
            ['Instructors', users.total_instructors],
            ['Admins', users.total_admins],
          ]}
        />
        <Breakdown
          title="Courses"
          rows={[
            ['Published', courses.published_courses],
            ['Draft', courses.draft_courses],
            ['Archived', courses.archived_courses],
            ['Modules', courses.total_modules],
            ['Lessons', courses.total_lessons],
          ]}
        />
        <Breakdown
          title="Enrollments & progress"
          rows={[
            ['Active', enrollments.active_enrollments],
            ['Completed', enrollments.completed_enrollments],
            ['Dropped', enrollments.dropped_enrollments],
            ['Lessons completed', progress.total_completed_lessons],
          ]}
        />
        <Breakdown
          title="Assessments"
          rows={[
            ['Quizzes (published)', `${assessments.total_quizzes} (${assessments.published_quizzes})`],
            ['Questions', assessments.total_questions],
            ['Submitted / in progress', `${assessments.submitted_quiz_attempts} / ${assessments.in_progress_quiz_attempts}`],
            ['Expired', assessments.expired_quiz_attempts],
            ['Average score', `${assessments.average_quiz_score}%`],
          ]}
        />
      </div>
    </div>
  );
};
