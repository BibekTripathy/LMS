import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

import { useAuth } from '../../context/auth';
import { useMyEnrollments } from '../enrollments/hooks';
import { EnrolledCourseCard } from './EnrolledCourseCard';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { getErrorMessage } from '../../lib/errors';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const enrollmentsQuery = useMyEnrollments();

  const enrollments = enrollmentsQuery.data ?? [];
  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE' || e.status === 'COMPLETED');
  const isLoading = enrollmentsQuery.isLoading;
  const error = enrollmentsQuery.error
    ? getErrorMessage(enrollmentsQuery.error, 'Failed to load your enrolled courses.')
    : null;

  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner — notebook paper style */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-latte-surface0 dark:border-frappe-surface1 bg-latte-mantle dark:bg-frappe-mantle shadow-sm p-6 sm:p-10">
        {/* Red margin line */}
        <div className="absolute left-16 top-0 bottom-0 w-px bg-frappe-red/30" />
        {/* Notebook holes */}
        <div className="absolute left-6 top-6 flex flex-col gap-6">
          {[0,1,2].map(i => (
            <div key={i} className="w-4 h-4 rounded-full border-2 border-latte-surface1 dark:border-frappe-surface1 bg-latte-base dark:bg-frappe-base" />
          ))}
        </div>
        <div className="ml-14 relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-latte-surface0 dark:bg-frappe-surface0 text-latte-subtext1 dark:text-frappe-subtext1 text-xs font-semibold border border-latte-surface1 dark:border-frappe-surface1">
            <GraduationCap className="w-4 h-4 text-frappe-blue" />
            <span>Student Learning Hub</span>
          </div>
          <h1 className="font-notebook text-3xl sm:text-5xl font-bold text-latte-text dark:text-frappe-text">
            Welcome back, <span className="text-frappe-blue">{user?.first_name || user?.email?.split('@')[0] || 'Learner'}!</span>
          </h1>
          <p className="text-latte-subtext1 dark:text-frappe-subtext1 text-sm sm:text-base">
            Pick up right where you left off, or explore new courses.
          </p>
        </div>
      </div>

      {/* Stat sticky notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sticky-yellow rounded-xl p-5 shadow-sm rotate-[-0.3deg] border border-latte-yellow/30 dark:border-frappe-yellow/30">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-5 h-5 text-latte-yellow dark:text-frappe-yellow" />
            <p className="text-xs font-bold uppercase tracking-wider text-latte-subtext0 dark:text-frappe-subtext0">Active Courses</p>
          </div>
          <h3 className="font-notebook text-4xl font-bold text-latte-text">
            {isLoading ? '...' : activeEnrollments.length}
          </h3>
        </div>

        <div className="sticky-green rounded-xl p-5 shadow-sm rotate-[0.2deg] border border-latte-green/30 dark:border-frappe-green/30">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-latte-green dark:text-frappe-green" />
            <p className="text-xs font-bold uppercase tracking-wider text-latte-subtext0 dark:text-frappe-subtext0">Completed</p>
          </div>
          <h3 className="font-notebook text-4xl font-bold text-latte-text">
            {isLoading ? '...' : completedCount}
          </h3>
        </div>

        <div className="sticky-blue rounded-xl p-5 shadow-sm rotate-[-0.1deg] border border-latte-blue/30 dark:border-frappe-blue/30">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-frappe-blue" />
            <p className="text-xs font-bold uppercase tracking-wider text-latte-subtext0 dark:text-frappe-subtext0">AI Resources</p>
          </div>
          <Link
            to="/study-centre"
            className="text-xs font-bold text-frappe-blue hover:text-frappe-sapphire flex items-center gap-1 mt-2"
          >
            Open Study Centre →
          </Link>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-notebook text-2xl sm:text-3xl font-bold text-latte-text dark:text-frappe-text">
              Your Enrolled Courses overview
            </h2>
            <p className="text-xs sm:text-sm text-latte-subtext1 dark:text-frappe-subtext1">
              Resume any lesson or track your completion progress.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-latte-surface0 dark:bg-frappe-surface0 hover:bg-latte-surface1 dark:hover:bg-frappe-surface1 text-latte-blue dark:text-frappe-blue text-xs font-bold rounded-xl border border-latte-surface1 dark:border-frappe-surface1 transition self-start sm:self-auto"
          >
            <Compass className="w-4 h-4" />
            Browse More Courses
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load your dashboard"
            message={error}
            onRetry={() => enrollmentsQuery.refetch()}
          />
        ) : activeEnrollments.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="You haven't enrolled in any courses yet"
            description="Explore our interactive course catalogue and start your first learning module today."
            actionText="Explore Course Catalogue"
            actionHref="/courses"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEnrollments.map((enrollment) => (
              <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
