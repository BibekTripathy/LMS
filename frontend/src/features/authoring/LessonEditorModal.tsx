import React, { useState } from 'react';
import { getErrorMessage } from '../../lib/errors';
import { useCourseMutations } from './hooks';
import type { Lesson } from '../../types';
import { Video, FileText, AlignLeft, X, Check, AlertCircle, Play } from 'lucide-react';

interface LessonEditorModalProps {
  moduleId: string;
  moduleTitle: string;
  lesson?: Lesson | null;
  onClose: () => void;
  onSaved: (lesson: Lesson) => void;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  moduleId,
  moduleTitle,
  lesson,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [transcript, setTranscript] = useState(lesson?.transcript || '');
  const [content, setContent] = useState(lesson?.content || lesson?.reading_content || '');
  const [isRequired, setIsRequired] = useState(lesson?.is_required !== false);
  const { saveLesson } = useCourseMutations();
  const saving = saveLesson.isPending;
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a lesson title.');
      return;
    }

    setError(null);
    const payload = {
      title,
      video_url: videoUrl || null,
      transcript,
      content,
      reading_content: content,
      is_required: isRequired,
    };

    saveLesson.mutate(
      { moduleId, lessonId: lesson?.id, data: payload },
      {
        onSuccess: (result) => onSaved(result),
        onError: (err) => setError(getErrorMessage(err, 'Failed to save lesson.')),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="lms-card max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Module: {moduleTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Lesson Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Database Normalization"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Video URL (Optional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/lecture.mp4 or YouTube / Vimeo link"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {videoUrl && (
              <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                <Play className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">URL preview: {videoUrl}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Lesson Transcript (For Study Tools &amp; Synthesis)
            </label>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste video transcript or lecture script here. Used to generate revision aids, summaries, and flashcards for students."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              {transcript.split(/\s+/).filter(Boolean).length} words entered.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Reading &amp; Study Notes
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write Markdown or lecture notes for this lesson..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 dark:border-slate-700 focus:ring-brand-500"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Required for course completion &amp; certificate
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{lesson ? 'Save Changes' : 'Create Lesson'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
