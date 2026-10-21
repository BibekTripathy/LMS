import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-black/[0.06] dark:bg-white/[0.08] rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="lms-card p-5 space-y-4">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>
      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
};
