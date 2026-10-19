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
      {/* Welcome & Motivational Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
            <GraduationCap className="w-4 h-4 text-indigo-200" />
            <span>Student Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.first_name || user?.email?.split('@')[0] || 'Learner'}!
          </h1>
          <p className="text-indigo-100/90 text-sm sm:text-base">
            Keep up the momentum. Pick up right where you left off or explore new courses to expand your mastery.
          </p>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Enrolled</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isLoading ? '...' : activeEnrollments.length}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isLoading ? '...' : completedCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Study Resources</p>
            <Link
              to="/study-centre"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-1"
            >
              Access Study Centre →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content: Enrolled Courses */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Your Enrolled Courses
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Track course completion progress and resume active video lessons anytime.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition self-start sm:self-auto"
          >
            <Compass className="w-4 h-4" />
            Browse More Courses
          </Link>
        </div>

        {/* Content States */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEnrollments.map((enrollment) => (
              <EnrolledCourseCard
                key={enrollment.id}
                enrollment={enrollment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
