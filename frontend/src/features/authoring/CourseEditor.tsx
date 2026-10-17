import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseApi } from '../../api/courses';
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
  Sparkles,
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

  // Modules & lessons state
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const loadCourseData = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await courseApi.getCourseById(id!);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category || '');
      setDifficulty(data.difficulty || 'BEGINNER');
      setThumbnailUrl(data.thumbnail_url || '');
      setModules(data.modules || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a course title.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      title,
      description,
      category,
      difficulty,
      thumbnail_url: thumbnailUrl || null,
    };

    try {
      if (isNew) {
        const created = await courseApi.createCourse(payload);
        setSuccessMsg('Course created successfully!');
        navigate(`/instructor/courses/${created.id}/edit`, { replace: true });
      } else {
        const updated = await courseApi.updateCourse(id!, payload);
        setTitle(updated.title);
        setSuccessMsg('Course settings updated!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !id) return;

    try {
      const created = await courseApi.createModule(id, {
        title: newModuleTitle,
        description: newModuleDesc,
      });
      setModules((prev) => [...prev, { ...created, lessons: [] }]);
      setNewModuleTitle('');
      setNewModuleDesc('');
      setAddingModule(false);
    } catch (err: any) {
      alert('Failed to add module: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      await courseApi.deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    } catch (err: any) {
      alert('Failed to delete module: ' + err.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await courseApi.deleteLesson(lessonId);
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
            : m
        )
      );
    } catch (err: any) {
      alert('Failed to delete lesson: ' + err.message);
    }
  };

  const handleLessonSaved = () => {
    // Reload full course to get consistent state
    loadCourseData();
    setActiveLessonModal(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
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
            <p className="text-xs text-slate-500">
              {isNew ? 'Fill in core course details to begin authoring' : 'Manage curriculum, lessons, and course publication'}
            </p>
          </div>
        </div>

        {!isNew && (
          <div className="flex items-center gap-3">
            <Link
              to={`/instructor/courses/${id}/quizzes`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl transition"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              Manage Quizzes
            </Link>

            <Link
              to={`/instructor/courses/${id}/analytics`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 rounded-xl transition"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              Course Analytics
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left is Course Metadata Form, Right is Curriculum Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Course Details Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
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
                placeholder="e.g. Master React & Modern Web Architecture"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                placeholder="e.g. Computer Science, Web Development"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description & Syllabus Overview
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of what students will learn, prerequisites, and expected outcomes..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Create Course & Continue' : 'Save Course Settings'}</span>
            </button>
          </form>
        </div>

        {/* Curriculum Hierarchy (Modules & Lessons) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold text-xs rounded-lg transition"
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
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto">
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
                    className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl space-y-3 animate-in fade-in"
                  >
                    <h3 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                      New Module
                    </h3>
                    <input
                      type="text"
                      required
                      placeholder="Module Title (e.g. Chapter 1: Core Concepts)"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Short description (optional)"
                      value={newModuleDesc}
                      onChange={(e) => setNewModuleDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingModule(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm"
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
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-800/30"
                  >
                    <div className="p-4 bg-slate-100/70 dark:bg-slate-800/70 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
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
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 rounded-md transition"
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
                            className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-indigo-300 transition"
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
                                    <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium">
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
                                onClick={async () => {
                                  try {
                                    const fullLesson = await courseApi.getLessonById(les.id);
                                    setActiveLessonModal({
                                      moduleId: mod.id,
                                      moduleTitle: mod.title,
                                      lesson: fullLesson,
                                    });
                                  } catch (err: any) {
                                    alert('Failed to load lesson details: ' + err.message);
                                  }
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                                title="Edit Lesson"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(les.id, mod.id)}
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
