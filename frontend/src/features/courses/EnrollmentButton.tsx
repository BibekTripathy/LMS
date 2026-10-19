import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useEnrollCourse } from './hooks';
import { getErrorMessage, getErrorCode } from '../../lib/errors';

export interface EnrollmentButtonProps {
  courseId: string;
  isAlreadyEnrolled?: boolean;
  className?: string;
  onEnrollSuccess?: () => void;
}

export const EnrollmentButton: React.FC<EnrollmentButtonProps> = ({
  courseId,
  isAlreadyEnrolled = false,
  className = '',
  onEnrollSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const enrollMutation = useEnrollCourse();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If student is already enrolled in this course, provide quick link to learning workspace
  if (isAlreadyEnrolled) {
    return (
      <button
        onClick={() => navigate(`/courses/${courseId}/learn`)}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all ${className}`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Enrolled • Continue Learning</span>
      </button>
    );
  }

  const handleEnroll = async () => {
    setErrorMessage(null);

    // If not authenticated, redirect to login
    if (!user) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    enrollMutation.mutate(courseId, {
      onSuccess: () => {
        onEnrollSuccess?.();
        navigate(`/courses/${courseId}/learn`);
      },
      onError: (err) => {
        const code = getErrorCode(err);
        if (code === 'ALREADY_ENROLLED') {
          // If already enrolled on backend, redirect to learning workspace directly
          navigate(`/courses/${courseId}/learn`);
        } else {
          setErrorMessage(getErrorMessage(err, 'Failed to enroll in this course.'));
        }
      },
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={enrollMutation.isPending}
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all ${className}`}
      >
        {enrollMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enrolling you now...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>{user ? 'Enroll in Course' : 'Sign In to Enroll'}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
