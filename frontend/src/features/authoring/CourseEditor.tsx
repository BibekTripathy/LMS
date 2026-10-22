import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../../lib/errors';
import { useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courses';
import { courseKeys, useCourseDetail, useCourseMutations } from './hooks';
import type { Module, Lesson, CourseDifficulty } from '../../types';
import { LessonEditorModal } from './LessonEditorModal';
import {
  BookOpen,
  Layers,
  PlusCircle,
  Video,
  Save,
  ArrowLeft,
  CheckCircle,
  Trash2,
  Edit,
  BarChart2,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

export const CourseEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  // Course form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('BEGINNER');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Modules & lessons come straight from the course query
  const courseQuery = useCourseDetail(isNew ? undefined : id);
  const mutations = useCourseMutations(isNew ? undefined : id);
  const queryClient = useQueryClient();
  const modules: Module[] = courseQuery.data?.modules ?? [];
  const loading = !isNew && courseQuery.isLoading;
  const saving = mutations.create.isPending || mutations.update.isPending;
  const [actionError, setError] = useState<string | null>(null);
  const error = actionError ?? (courseQuery.isError ? getErrorMessage(courseQuery.error, 'Failed to load course details.') : null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Module creation modal / inline state
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  // Lesson modal state
  const [activeLessonModal, setActiveLessonModal] = useState<{
    moduleId: string;
    moduleTitle: string;
    lesson: Lesson | null;
  } | null>(null);

  // Copy loaded course data into the form once per server version
  const loadedVersion = courseQuery.data ? `${courseQuery.data.id}:${courseQuery.data.updated_at ?? ''}` : null;
  const [formVersion, setFormVersion] = useState<string | null>(null);
  if (courseQuery.data && loadedVersion !== formVersion) {
    const data = courseQuery.data;
    setFormVersion(loadedVersion);
    setTitle(data.title);
    setDescription(data.description || '');
    setCategory(data.category || '');
    setDifficulty(data.difficulty || 'BEGINNER');
    setThumbnailUrl(data.thumbnail_url || '');
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const payload = {
      title,
      description,
      category,
      difficulty,
      thumbnail_url: thumbnailUrl || null,
    };

    if (isNew) {
      mutations.create.mutate(payload, {
        onSuccess: (newCourse) => {
          navigate(`/instructor/courses/${newCourse.id}/edit`, { replace: true });
        },
        onError: (err) => setError(getErrorMessage(err, 'Failed to create course.')),
      });
    } else {
      mutations.update.mutate(payload, {
        onSuccess: () => {
          setSuccessMsg('Course details successfully saved.');
          setTimeout(() => setSuccessMsg(null), 3500);
        },
        onError: (err) => setError(getErrorMessage(err, 'Failed to update course.')),
      });
    }
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !id) return;

    mutations.createModule.mutate(
      { title: newModuleTitle, description: newModuleDesc },
      {
        onSuccess: () => {
          setNewModuleTitle('');
          setNewModuleDesc('');
          setAddingModule(false);
        },
        onError: (err) => alert('Failed to add module: ' + getErrorMessage(err)),
      }
    );
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!window.confirm('Delete this entire module and all lessons in it?')) return;
    mutations.deleteModule.mutate(moduleId, {
      onError: (err) => alert('Failed to delete module: ' + getErrorMessage(err)),
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    mutations.deleteLesson.mutate(lessonId, {
      onError: (err) => alert('Failed to delete lesson: ' + getErrorMessage(err)),
    });
  };

  const handleLessonSaved = () => {
    setActiveLessonModal(null);
  };

  const openLessonEditor = async (mod: Module, lessonId: string) => {
    try {
      const fullLesson = await queryClient.fetchQuery({
        queryKey: courseKeys.lesson(lessonId),
        queryFn: () => courseApi.getLessonById(lessonId),
      });
      setActiveLessonModal({
        moduleId: mod.id,
        moduleTitle: mod.title,
        lesson: fullLesson,
      });
    } catch (err) {
      alert('Failed to load lesson details: ' + getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-mono">Loading course details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-transition-enter">
      {/* Top Bar Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/instructor"
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isNew ? 'Create New Course' : `Edit Course: ${title || 'Untitled'}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isNew ? 'Fill in core course details to begin authoring' : 'Manage curriculum, lessons, and course publication'}
            </p>
          </div>
        </div>

        {!isNew && (
          <div className="flex items-center gap-3">
            <Link
              to={`/instructor/courses/${id}/quizzes`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-xl border border-brand-200/60 dark:border-brand-900/60 transition"
            >
              <HelpCircle className="w-4 h-4 text-brand-500" />
              Manage Quizzes
            </Link>

            <Link
              to={`/instructor/courses/${id}/analytics`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            >
              <BarChart2 className="w-4 h-4 text-slate-500" />
              Course Analytics
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left is Course Metadata Form, Right is Curriculum Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Course Details Form */}
        <div className="lg:col-span-5 lms-card p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-500" />
            Course Settings
          </h2>

          <form onSubmit={handleSaveCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Relational Database Architecture"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Database Systems, Web Architecture"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Thumbnail Image URL
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description &amp; Syllabus Overview
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of what students will learn, prerequisites, and expected outcomes..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full justify-center"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Create Course & Continue' : 'Save Course Settings'}</span>
            </button>
          </form>
        </div>

        {/* Curriculum Hierarchy (Modules & Lessons) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="lms-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  Curriculum Builder
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize chapters into ordered modules and multimedia lessons
                </p>
              </div>

              {!isNew && (
                <button
                  type="button"
                  onClick={() => setAddingModule(true)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Module
                </button>
              )}
            </div>

            {isNew ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Save the course details first to start adding modules and lessons.
              </div>
            ) : modules.length === 0 && !addingModule ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No modules created yet
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click 'Add Module' above to create your first curriculum module.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {/* Inline Add Module Form */}
                {addingModule && (
                  <form
                    onSubmit={handleCreateModule}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in"
                  >
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                      New Module
                    </h3>
                    <input
                      type="text"
                      required
                      placeholder="Module Title (e.g. Chapter 1: Relational Algebra & Calculus)"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Short description (optional)"
                      value={newModuleDesc}
                      onChange={(e) => setNewModuleDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingModule(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Add Module
                      </button>
                    </div>
                  </form>
                )}

                {/* Modules and Nested Lessons */}
                {modules.map((mod, index) => (
                  <div
                    key={mod.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-850/50"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                            MODULE {index + 1}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{mod.title}</h3>
                        </div>
                        {mod.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveLessonModal({
                              moduleId: mod.id,
                              moduleTitle: mod.title,
                              lesson: null,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-lg border border-brand-200/60 dark:border-brand-900/60 transition"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Add Lesson
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons list inside module */}
                    <div className="p-3 space-y-2">
                      {mod.lessons && mod.lessons.length > 0 ? (
                        mod.lessons.map((les, lesIndex) => (
                          <div
                            key={les.id}
                            className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-brand-300 dark:hover:border-brand-800 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-mono text-slate-400">
                                {index + 1}.{lesIndex + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                  {les.title}
                                </h4>
                                <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-0.5">
                                  {les.video_url && (
                                    <span className="flex items-center gap-0.5 text-brand-600 dark:text-brand-400 font-medium">
                                      <Video className="w-3 h-3" /> Video Attached
                                    </span>
                                  )}
                                  {les.is_required && (
                                    <span className="text-emerald-600 font-medium">Required</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openLessonEditor(mod, les.id)}
                                className="p-1 text-slate-500 hover:text-brand-600 rounded"
                                title="Edit Lesson"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(les.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400 italic">
                          No lessons added to this module yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Modal */}
      {activeLessonModal && (
        <LessonEditorModal
          moduleId={activeLessonModal.moduleId}
          moduleTitle={activeLessonModal.moduleTitle}
          lesson={activeLessonModal.lesson}
          onClose={() => setActiveLessonModal(null)}
          onSaved={handleLessonSaved}
        />
      )}
    </div>
  );
};
