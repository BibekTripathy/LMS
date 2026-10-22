import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { CourseFilterParams } from '../../api/courses';

export interface CourseFiltersProps {
  filters: CourseFilterParams;
  onChange: (filters: CourseFilterParams) => void;
  categories?: string[];
  totalResults?: number;
}

const DEFAULT_CATEGORIES = [
  'All Categories',
  'Computer Science',
  'Web Development',
  'Data Science',
  'AI & Machine Learning',
  'Design',
  'Business',
];

const DIFFICULTIES = [
  { label: 'All Levels', value: '' },
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  onChange,
  categories = DEFAULT_CATEGORIES,
  totalResults,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (cat: string) => {
    const category = cat === 'All Categories' ? undefined : cat;
    onChange({ ...filters, category });
  };

  const handleDifficultyChange = (diff: string) => {
    const difficulty = diff === '' ? undefined : diff;
    onChange({ ...filters, difficulty });
  };

  const handleClear = () => {
    onChange({ search: undefined, category: undefined, difficulty: undefined });
  };

  const hasActiveFilters = Boolean(filters.search || filters.category || filters.difficulty);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Top search & quick stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by course title, topic, or instructor..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: undefined })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear filters & count */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {totalResults !== undefined && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {totalResults} {totalResults === 1 ? 'course' : 'courses'} found
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filters:
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-select" className="sr-only">
            Category
          </label>
          <select
            id="category-select"
            value={filters.category || 'All Categories'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="difficulty-select" className="sr-only">
            Difficulty
          </label>
          <select
            id="difficulty-select"
            value={filters.difficulty || ''}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff.label} value={diff.value}>
                {diff.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
