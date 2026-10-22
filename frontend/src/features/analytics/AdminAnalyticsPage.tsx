import React from 'react';
import { BookOpen, ClipboardCheck, GraduationCap, Users } from 'lucide-react';
import { useAdminAnalytics } from './hooks';
import { StatCard } from '../../components/ui/StatCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorMessage } from '../../lib/errors';

const Breakdown: React.FC<{ title: string; rows: [string, React.ReactNode][] }> = ({ title, rows }) => (
  <section className="lms-card p-5 space-y-3">
    <h2 className="text-xs font-bold text-[#121316] dark:text-[#F3F4F6] uppercase tracking-wider">{title}</h2>
    <dl className="space-y-1.5 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between items-center py-1 border-b border-black/[0.03] dark:border-white/[0.04] last:border-0">
          <dt className="text-[#868E96]">{label}</dt>
          <dd className="font-semibold font-mono text-[#121316] dark:text-[#F3F4F6]">{value}</dd>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 page-transition-enter">
      <div className="lms-card p-6 sm:p-8 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#121316] dark:text-[#F3F4F6] tracking-tight">Platform Analytics</h1>
        <p className="text-xs sm:text-sm text-[#868E96]">Live totals calculated across every course, enrollment, and user.</p>
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
