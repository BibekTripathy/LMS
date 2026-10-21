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
    <div className="apple-card p-4 sm:p-5 space-y-4">
      {/* Top search & quick stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by course title, topic, or instructor..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] transition"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: undefined })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear filters & count */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {totalResults !== undefined && (
            <span className="text-xs font-semibold text-[#86868B]">
              {totalResults} {totalResults === 1 ? 'course' : 'courses'} found
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full active:scale-95 transition"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#86868B] uppercase tracking-wider mr-1">
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
            className="px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
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
            className="px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
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
