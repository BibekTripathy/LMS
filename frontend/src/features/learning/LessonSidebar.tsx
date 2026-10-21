import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import type { CourseDetail, CourseProgress } from '../../types';

import { ProgressBar } from '../../components/ui/ProgressBar';

export interface LessonSidebarProps {
  course: CourseDetail;
  currentLessonId?: string;
  courseProgress?: CourseProgress;
  onSelectLesson?: (lessonId: string) => void;
  className?: string;
  /** Rendered under the curriculum, e.g. the course's quizzes. */
  footer?: React.ReactNode;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  course,
  currentLessonId,
  courseProgress,
  onSelectLesson,
  className = '',
  footer,
}) => {
  const navigate = useNavigate();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLessonClick = (lessonId: string) => {
    if (onSelectLesson) {
      onSelectLesson(lessonId);
    } else {
      navigate(`/courses/${course.id}/learn/${lessonId}`);
    }
  };

  // Build map of lesson completion status from CourseProgress
  const completedLessonsMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    if (courseProgress?.lessons) {
      courseProgress.lessons.forEach((l) => {
        map.set(l.lesson_id, l.completed);
      });
    }
    return map;
  }, [courseProgress]);

  const percentage = courseProgress?.progress_percentage ?? 0;

  // Sort modules
  const sortedModules = React.useMemo(() => {
    return [...(course.modules || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [course.modules]);

  return (
    <aside
      className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-[#131418] border-r border-black/[0.08] dark:border-white/[0.08] h-full overflow-hidden flex-shrink-0 ${className}`}
      data-testid="lesson-sidebar"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] space-y-3">
        <Link
          to={`/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Course Overview
        </Link>

        <div>
          <h2 className="text-sm font-bold text-[#121316] dark:text-[#F3F4F6] line-clamp-2">
            {course.title}
          </h2>
          <p className="text-[11px] text-[#868E96] mt-0.5">
            {course.instructor_name || 'Instructor'}
          </p>
        </div>

        {/* Course Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-semibold text-[#121316] dark:text-[#F3F4F6]">
            <span>Overall Progress</span>
            <span className="text-[#0066FF] font-mono">{Math.round(percentage)}%</span>
          </div>
          <ProgressBar
            value={percentage}
            variant={percentage === 100 ? 'emerald' : 'indigo'}
            size="sm"
          />
          <div className="text-[11px] text-[#868E96] text-right font-mono">
            {courseProgress?.completed_lessons ?? 0} of {courseProgress?.total_lessons ?? course.lessons_count ?? 0} completed
          </div>
        </div>
      </div>

      {/* Modules & Lessons Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06]">
        {sortedModules.map((module, mIdx) => {
          const isExpanded = expandedModules[module.id] ?? true;
          const sortedLessons = [...(module.lessons || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div key={module.id} className="text-sm">
              {/* Module Header Toggle */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition"
              >
                <div className="flex items-center gap-2 max-w-[80%]">
                  <span className="text-xs font-mono font-bold text-[#868E96]">M{mIdx + 1}</span>
                  <span className="text-xs font-semibold text-[#121316] dark:text-[#F3F4F6] truncate">
                    {module.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#868E96] text-xs">
                  <span className="font-mono">{sortedLessons.length}</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Lessons List */}
              {isExpanded && (
                <div className="divide-y divide-black/[0.02] dark:divide-white/[0.03]">
                  {sortedLessons.map((lesson, lIdx) => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = completedLessonsMap.get(lesson.id) ?? false;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson.id)}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition ${
                          isActive
                            ? 'bg-[#0066FF]/10 border-l-4 border-[#0066FF] text-[#0066FF] font-semibold'
                            : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03] text-[#64666E] dark:text-[#94969E]'
                        }`}
                        data-testid={`sidebar-lesson-${lesson.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          {/* Completion Status Badge */}
                          {isCompleted ? (
                            <CheckCircle2
                              className="w-4 h-4 text-[#059669] flex-shrink-0"
                              data-testid={`lesson-completed-${lesson.id}`}
                            />
                          ) : isActive ? (
                            <PlayCircle className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#868E96]/40 flex-shrink-0" />
                          )}

                          <span className="text-xs truncate">
                            {mIdx + 1}.{lIdx + 1} {lesson.title}
                          </span>
                        </div>

                        {lesson.is_required && !isCompleted && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[#868E96] flex-shrink-0 font-mono">
                            Req
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {footer && <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08]">{footer}</div>}
    </aside>
  );
};
