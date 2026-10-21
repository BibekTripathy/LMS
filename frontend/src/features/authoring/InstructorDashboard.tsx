import React from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../lib/errors';
import { useCourseMutations, useMyCourses } from './hooks';
import {
  BookOpen,
  PlusCircle,
  Edit,
  BarChart2,
  HelpCircle,
  Archive,
  CheckCircle,
  Trash2,
  Layers,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const InstructorDashboard: React.FC = () => {
  const coursesQuery = useMyCourses();
  const { publish, archive, remove } = useCourseMutations();
  const courses = coursesQuery.data ?? [];
  const loading = coursesQuery.isLoading;
  const error = coursesQuery.isError ? getErrorMessage(coursesQuery.error, 'Failed to load courses.') : null;

  const pendingId = [publish, archive, remove].find((m) => m.isPending)?.variables ?? null;
  const actionLoading = typeof pendingId === 'string' ? pendingId : null;

  const onError = (label: string) => (err: Error) => alert(`Failed to ${label} course: ${getErrorMessage(err)}`);

  const handlePublish = (courseId: string) => publish.mutate(courseId, { onError: onError('publish') });
  const handleArchive = (courseId: string) => archive.mutate(courseId, { onError: onError('archive') });
  const handleDelete = (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    remove.mutate(courseId, { onError: onError('delete') });
  };

  const totalLessons = courses.reduce((acc, c) => acc + (c.lessons_count || 0), 0);
  const publishedCourses = courses.filter((c) => c.is_published).length;
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Instructor Studio
            </h1>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Curriculum Hub
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author and orchestrate curriculum modules, lessons, assessments, and syllabus milestones.
          </p>
        </div>

        <Link
          to="/instructor/courses/new"
          className="btn-primary self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Course
        </Link>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lms-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold border border-brand-100 dark:border-brand-900/40">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{courses.length}</h3>
          </div>
        </div>

        <div className="lms-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Published</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{publishedCourses}</h3>
          </div>
        </div>

        <div className="lms-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold border border-slate-200 dark:border-slate-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Lessons</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{totalLessons}</h3>
          </div>
        </div>

        <div className="lms-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-100 dark:border-amber-900/40">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Draft</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{draftCourses}</h3>
          </div>
        </div>
      </div>

      {/* Courses List Section */}
      <div className="lms-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Your Authored Courses</h2>
          <span className="text-xs text-slate-500 font-mono">{courses.length} courses</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading your courses...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses created yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Start by creating your first course, organize curriculum modules, add video lessons, and author quizzes.
              </p>
            </div>
            <Link
              to="/instructor/courses/new"
              className="btn-primary"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Course Metadata */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition">
                      <Link to={`/instructor/courses/${course.id}/edit`}>{course.title}</Link>
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        course.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : course.status === 'ARCHIVED'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {course.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {course.difficulty}
                    </span>
                    {course.category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 rounded border border-brand-100 dark:border-brand-900/40">
                        {course.category}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {course.modules_count || 0} Modules
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {course.lessons_count || 0} Lessons
                    </span>
                    <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Course Actions Group */}
                <div className="flex items-center flex-wrap gap-2">
                  <Link
                    to={`/instructor/courses/${course.id}/edit`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    Edit Content
                  </Link>

                  <Link
                    to={`/instructor/courses/${course.id}/quizzes`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-xl border border-brand-200/60 dark:border-brand-900/60 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
                    Quizzes
                  </Link>

                  <Link
                    to={`/instructor/courses/${course.id}/analytics`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                    Analytics
                  </Link>

                  {course.status !== 'PUBLISHED' ? (
                    <button
                      onClick={() => handlePublish(course.id)}
                      disabled={actionLoading === course.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(course.id)}
                      disabled={actionLoading === course.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={actionLoading === course.id}
                    title="Delete Course"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
