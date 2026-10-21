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
      {/* Welcome Banner — Apple Surface Style */}
      <div className="relative rounded-3xl overflow-hidden apple-card p-6 sm:p-10 bg-gradient-to-br from-white via-[#FAFAFC] to-[#F2F2F7] dark:from-[#1C1C1E] dark:via-[#161618] dark:to-[#0D0D0E]">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Learning Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Welcome back, <span className="text-[#0071E3] dark:text-[#32ADE6]">{user?.first_name || user?.email?.split('@')[0] || 'Learner'}</span>
          </h1>
          <p className="text-[#86868B] dark:text-[#98989D] text-sm sm:text-base max-w-2xl leading-relaxed">
            Pick up right where you left off, reinforce concepts with AI flashcards, or discover new course topics.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">Active Courses</span>
            <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            {isLoading ? '...' : activeEnrollments.length}
          </div>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">Completed</span>
            <div className="w-8 h-8 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            {isLoading ? '...' : completedCount}
          </div>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">AI Study Centre</span>
            <div className="w-8 h-8 rounded-full bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <Link
              to="/study-centre"
              className="text-xs font-semibold text-[#0071E3] dark:text-[#32ADE6] hover:underline flex items-center gap-1 mt-3"
            >
              Open Study Centre →
            </Link>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Enrolled Courses
            </h2>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#98989D] mt-0.5">
              Resume any lesson or track your completion progress.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold rounded-full border border-black/[0.04] dark:border-white/[0.08] active:scale-[0.98] transition-all duration-150 self-start sm:self-auto"
          >
            <Compass className="w-3.5 h-3.5" />
            Browse More Courses
          </Link>
        </div>

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
            title="You haven't enrolled in any courses yet."
            description="Explore our course catalogue and start your learning journey today."
            actionText="Explore Course Catalogue"
            actionHref="/courses"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEnrollments.map((enrollment) => (
              <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
