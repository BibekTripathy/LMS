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
import { AlertCircle, Sparkles } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  FLASHCARDS: 'Flashcards',
  SUMMARY: 'Summary',
  MCQ: 'Practice MCQs',
};

const selectClass = 'px-3.5 py-2 text-xs sm:text-sm rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30';

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
      {/* Header Banner */}
      <div className="apple-card p-6 sm:p-8 bg-gradient-to-br from-white via-[#FAFAFC] to-[#F2F2F7] dark:from-[#1C1C1E] dark:via-[#161618] dark:to-[#0D0D0E] space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#AF52DE]/10 text-[#AF52DE] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cognify Intelligence Suite</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
          AI Study Centre
        </h1>
        <p className="text-xs sm:text-sm text-[#86868B] max-w-2xl leading-relaxed">
          {isInstructor
            ? 'Generate study resources from your lessons, review the drafts, then publish them to your students.'
            : 'Flashcards, summaries and practice questions published by your instructors, plus a revision plan built from your quiz results.'}
        </p>
      </div>

      {coursesLoading ? (
        <p role="status" className="text-xs font-medium text-[#86868B]">Loading courses…</p>
      ) : coursesError ? (
        <p role="alert" className="text-xs text-[#FF3B30]">{getErrorMessage(coursesError, 'Failed to load courses.')}</p>
      ) : courses.length === 0 ? (
        <div className="apple-card p-12 text-center">
          <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            {isInstructor ? 'You have no courses yet' : 'You are not enrolled in any course yet'}
          </h3>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-semibold text-[#86868B] flex flex-col gap-1.5">
              Course
              <select className={selectClass} value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelectedId(null); }}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#86868B] flex flex-col gap-1.5">
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
              <div className="w-8 h-8 border-2 border-[#AF52DE] border-t-transparent rounded-full animate-spin" />
              <span className="sr-only">Loading study resources…</span>
            </div>
          ) : resourcesQuery.isError ? (
            <div role="alert" className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl text-[#FF3B30] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{getErrorMessage(resourcesQuery.error, 'Failed to load study resources.')}</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="apple-card p-10 text-center">
              <h3 className="text-sm font-semibold text-[#86868B]">No study resources for this lesson yet</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <ul className="lg:col-span-4 space-y-2" aria-label="Study resources">
                {resources.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => { setSelectedId(r.id); setEditing(false); }}
                      aria-current={selected?.id === r.id}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        selected?.id === r.id
                          ? 'border-[#AF52DE] bg-[#AF52DE]/10 shadow-xs'
                          : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] hover:border-[#AF52DE]/40'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {(r.content as { title?: string }).title || TYPE_LABELS[r.resource_type]}
                      </span>
                      <span className="block text-xs text-[#86868B] mt-0.5">
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
                    <button
                      onClick={() => setEditing(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] active:scale-[0.98] transition"
                    >
                      Edit draft
                    </button>
                    {!selected.converted_quiz && (
                      <button
                        onClick={() => publish.mutate(selected.id)}
                        disabled={publish.isPending}
                        className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#34C759] hover:bg-[#2FB350] text-white active:scale-[0.98] transition disabled:opacity-50 shadow-xs"
                      >
                        Publish to students
                      </button>
                    )}
                    {selected.resource_type === 'MCQ' && !selected.converted_quiz && (
                      <button
                        onClick={() => convert.mutate(selected.id)}
                        disabled={convert.isPending}
                        className="apple-btn-primary px-4 py-1.5 text-xs font-semibold rounded-full disabled:opacity-50 shadow-xs"
                      >
                        Convert to graded quiz
                      </button>
                    )}
                    {selected.converted_quiz && (
                      <Link
                        to={`/instructor/courses/${courseId}/quizzes`}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-[#0071E3] hover:underline"
                      >
                        View converted quiz
                      </Link>
                    )}
                  </div>
                )}

                {actionError && (
                  <p role="alert" className="text-xs text-[#FF3B30] font-semibold">
                    {getErrorMessage(actionError, 'Action failed.')}
                  </p>
                )}

                {convert.isSuccess && (
                  <p className="text-xs text-[#34C759] font-medium">
                    Draft quiz “{convert.data.title}” created with {convert.data.total_questions} questions. Review and publish it in the quiz builder.
                  </p>
                )}

                {selected && editing && (
                  <ResourceEditor resource={selected} onDone={() => setEditing(false)} />
                )}

                {selected && !editing && renderViewer(selected)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
