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
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  course,
  currentLessonId,
  courseProgress,
  onSelectLesson,
  className = '',
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
      className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden flex-shrink-0 ${className}`}
      data-testid="lesson-sidebar"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <Link
          to={`/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Course Overview
        </Link>

        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
            {course.title}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {course.instructor_name || 'Instructor'}
          </p>
        </div>

        {/* Course Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Overall Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">{Math.round(percentage)}%</span>
          </div>
          <ProgressBar
            value={percentage}
            variant={percentage === 100 ? 'emerald' : 'indigo'}
            size="sm"
          />
          <div className="text-[11px] text-slate-400 text-right">
            {courseProgress?.completed_lessons ?? 0} of {courseProgress?.total_lessons ?? course.lessons_count ?? 0} completed
          </div>
        </div>
      </div>

      {/* Modules & Lessons Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {sortedModules.map((module, mIdx) => {
          const isExpanded = expandedModules[module.id] ?? true;
          const sortedLessons = [...(module.lessons || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div key={module.id} className="text-sm">
              {/* Module Header Toggle */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-400">M{mIdx + 1}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {module.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <span>{sortedLessons.length}</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Lessons List */}
              {isExpanded && (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {sortedLessons.map((lesson, lIdx) => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = completedLessonsMap.get(lesson.id) ?? false;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson.id)}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-l-4 border-indigo-600 text-indigo-950 dark:text-indigo-200 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                        data-testid={`sidebar-lesson-${lesson.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          {/* Completion Status Badge */}
                          {isCompleted ? (
                            <CheckCircle2
                              className="w-4 h-4 text-emerald-500 flex-shrink-0"
                              data-testid={`lesson-completed-${lesson.id}`}
                            />
                          ) : isActive ? (
                            <PlayCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                          )}

                          <span className="text-xs truncate">
                            {mIdx + 1}.{lIdx + 1} {lesson.title}
                          </span>
                        </div>

                        {lesson.is_required && !isCompleted && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0">
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
    </aside>
  );
};
