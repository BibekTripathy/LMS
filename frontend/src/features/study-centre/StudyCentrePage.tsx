import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { getErrorMessage } from '../../lib/errors';
import type { AIResource, Course, FlashcardContent, MCQContent, SummaryContent } from '../../types';
import { useCourseDetail, useLesson, useMyCourses } from '../authoring/hooks';
import { AIResourceGenerator } from './AIResourceGenerator';
import { FlashcardViewer } from './FlashcardViewer';
import { MCQPracticeViewer } from './MCQPracticeViewer';
import { ResourceEditor } from './ResourceEditor';
import { RevisionPanel } from './RevisionPanel';
import { SummaryViewer } from './SummaryViewer';
import { useLessonResources, useMyEnrollments, useStudyResourceMutations } from './hooks';
import { AlertCircle, Brain } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  FLASHCARDS: 'Flashcards',
  SUMMARY: 'Summary',
  MCQ: 'Practice MCQs',
};

const selectClass = 'px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900';

export const StudyCentrePage: React.FC = () => {
  const { isInstructor } = useAuth();

  // Instructors work on their own courses; students on the courses they are enrolled in.
  const myCourses = useMyCourses();
  const enrollments = useMyEnrollments(!isInstructor);
  const courses: Course[] = isInstructor
    ? myCourses.data ?? []
    : (enrollments.data ?? []).filter((e) => e.status === 'ACTIVE' && e.course_detail).map((e) => e.course_detail as Course);
  const coursesLoading = isInstructor ? myCourses.isLoading : enrollments.isLoading;
  const coursesError = isInstructor ? myCourses.error : enrollments.error;

  const [chosenCourseId, setCourseId] = useState('');
  const courseId = courses.some((c) => c.id === chosenCourseId) ? chosenCourseId : courses[0]?.id ?? '';
  const courseDetail = useCourseDetail(courseId || undefined);
  const lessons = courseDetail.data?.modules?.flatMap((m) => m.lessons ?? []) ?? [];
  const [chosenLessonId, setLessonId] = useState('');
  const lessonId = lessons.some((l) => l.id === chosenLessonId) ? chosenLessonId : lessons[0]?.id ?? '';
  const lesson = useLesson(isInstructor && lessonId ? lessonId : undefined).data;

  const resourcesQuery = useLessonResources(lessonId || undefined);
  const resources = resourcesQuery.data?.results ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: AIResource | undefined = resources.find((r) => r.id === selectedId) ?? resources[0];
  const [editing, setEditing] = useState(false);
  const { publish, convert } = useStudyResourceMutations(lessonId || undefined);
  const hasMaterial = !!(lesson?.transcript?.trim() || lesson?.reading_content?.trim() || lesson?.content?.trim());

  const renderViewer = (resource: AIResource) => {
    const title = resource.lesson_title ?? '';
    if (resource.resource_type === 'FLASHCARDS') {
      return <FlashcardViewer key={resource.id} content={resource.content as FlashcardContent} lessonTitle={title} />;
    }
    if (resource.resource_type === 'SUMMARY') {
      return <SummaryViewer key={resource.id} content={resource.content as SummaryContent} lessonTitle={title} />;
    }
    return <MCQPracticeViewer key={resource.id} content={resource.content as MCQContent} lessonTitle={title} />;
  };

  const actionError = publish.error ?? convert.error;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Brain className="w-7 h-7 text-purple-500" />
          AI Study Centre
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isInstructor
            ? 'Generate study resources from your lessons, review the drafts, then publish them to your students.'
            : 'Flashcards, summaries and practice questions published by your instructors, plus a revision plan built from your quiz results.'}
        </p>
      </div>

      {coursesLoading ? (
        <p role="status" className="text-sm text-slate-500">Loading courses…</p>
      ) : coursesError ? (
        <p role="alert" className="text-sm text-rose-600">{getErrorMessage(coursesError, 'Failed to load courses.')}</p>
      ) : courses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isInstructor ? 'You have no courses yet' : 'You are not enrolled in any course yet'}
          </h3>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1 flex flex-col gap-1">
              Course
              <select className={selectClass} value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelectedId(null); }}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-latte-subtext1 dark:text-frappe-subtext1 flex flex-col gap-1">
              Lesson
              <select className={selectClass} value={lessonId} onChange={(e) => { setLessonId(e.target.value); setSelectedId(null); setEditing(false); }}>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </label>
          </div>

          {!isInstructor && courseId && <RevisionPanel courseId={courseId} />}
          {isInstructor && lessonId && (
            <AIResourceGenerator lessonId={lessonId} hasMaterial={hasMaterial} onGenerated={(r) => { setSelectedId(r.id); setEditing(false); }} />
          )}

          {resourcesQuery.isLoading ? (
            <div role="status" className="py-10 flex justify-center">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="sr-only">Loading study resources…</span>
            </div>
          ) : resourcesQuery.isError ? (
            <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{getErrorMessage(resourcesQuery.error, 'Failed to load study resources.')}</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No study resources for this lesson yet</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <ul className="lg:col-span-4 space-y-2" aria-label="Study resources">
                {resources.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => { setSelectedId(r.id); setEditing(false); }}
                      aria-current={selected?.id === r.id}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        selected?.id === r.id
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/40'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {(r.content as { title?: string }).title || TYPE_LABELS[r.resource_type]}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {TYPE_LABELS[r.resource_type] ?? r.resource_type}
                        {isInstructor && ` · ${r.status === 'DRAFT' ? 'Draft' : 'Published'}`}
                        {r.converted_quiz && ' · converted to quiz'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="lg:col-span-8 space-y-3">
                {selected && isInstructor && selected.status === 'DRAFT' && !editing && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">
                      Edit draft
                    </button>
                    {!selected.converted_quiz && (
                      <button
                        onClick={() => publish.mutate(selected.id)}
                        disabled={publish.isPending}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-frappe-teal text-frappe-base disabled:opacity-50"
                      >
                        Publish to students
                      </button>
                    )}
                    {selected.resource_type === 'MCQ' && !selected.converted_quiz && (
                      <button
                        onClick={() => convert.mutate(selected.id)}
                        disabled={convert.isPending}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-frappe-blue text-white disabled:opacity-50"
                      >
                        Convert to graded quiz
                      </button>
                    )}
                    {selected.converted_quiz && (
                      <Link to={`/instructor/courses/${courseId}/quizzes`} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-frappe-blue/10 text-frappe-blue">
                        Open in quiz builder
                      </Link>
                    )}
                  </div>
                )}
                {actionError && (
                  <p role="alert" className="text-xs text-rose-600">{getErrorMessage(actionError)}</p>
                )}
                {convert.isSuccess && (
                  <p className="text-xs text-frappe-teal">
                    Draft quiz “{convert.data.title}” created with {convert.data.total_questions} questions. Review and publish it in the quiz builder.
                  </p>
                )}
                {selected && (editing ? <ResourceEditor resource={selected} onDone={() => setEditing(false)} /> : renderViewer(selected))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
