import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../../api/courses';
import type { Course } from '../../types';
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
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const InstructorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseApi.getCourses({ my_courses: true });
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handlePublish = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await courseApi.publishCourse(courseId);
      await loadCourses();
    } catch (err: any) {
      alert('Failed to publish course: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await courseApi.archiveCourse(courseId);
      await loadCourses();
    } catch (err: any) {
      alert('Failed to archive course: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    setActionLoading(courseId);
    try {
      await courseApi.deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err: any) {
      alert('Failed to delete course: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const totalLessons = courses.reduce((acc, c) => acc + (c.lessons_count || 0), 0);
  const publishedCourses = courses.filter((c) => c.is_published).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Instructor Studio</span>
            <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold rounded-full uppercase">
              Authoring
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author and orchestrate courses, interactive lessons, quizzes, and AI study resources.
          </p>
        </div>

        <Link
          to="/instructor/courses/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-indigo-500/20 transition self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Course
        </Link>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{courses.length}</h3>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{publishedCourses}</h3>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Lessons</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalLessons}</h3>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Enabled</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Active</h3>
          </div>
        </div>
      </div>

      {/* Courses List Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Authored Courses</h2>
          <span className="text-xs text-slate-500">{courses.length} courses found</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading your courses...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses created yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Start by creating your first course, organize curriculum modules, add video lessons, and author quizzes.
              </p>
            </div>
            <Link
              to="/instructor/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Course Metadata */}
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition">
                      <Link to={`/instructor/courses/${course.id}/edit`}>{course.title}</Link>
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        course.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : course.status === 'ARCHIVED'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {course.status}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded">
                      {course.difficulty}
                    </span>
                    {course.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 rounded">
                        {course.category}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {course.modules_count || 0} Modules
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.lessons_count || 0} Lessons
                    </span>
                    <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Course Actions Group */}
                <div className="flex items-center flex-wrap gap-2">
                  <Link
                    to={`/instructor/courses/${course.id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    Edit Content
                  </Link>

                  <Link
                    to={`/instructor/courses/${course.id}/quizzes`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    Quizzes
                  </Link>

                  <Link
                    to={`/instructor/courses/${course.id}/analytics`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
                    Analytics
                  </Link>

                  {course.status !== 'PUBLISHED' ? (
                    <button
                      onClick={() => handlePublish(course.id)}
                      disabled={actionLoading === course.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(course.id)}
                      disabled={actionLoading === course.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={actionLoading === course.id}
                    title="Delete Course"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition disabled:opacity-50"
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
