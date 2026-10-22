import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, BookOpen, AlertCircle } from 'lucide-react';
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

  // Already enrolled → continue learning
  if (isAlreadyEnrolled) {
    return (
      <button
        onClick={() => navigate(`/courses/${courseId}/learn`)}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-frappe-teal hover:bg-frappe-sapphire text-frappe-base font-bold text-sm rounded-xl shadow-sm transition-all ${className}`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Enrolled • Continue Learning</span>
      </button>
    );
  }

  const handleEnroll = async () => {
    setErrorMessage(null);
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
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-frappe-blue hover:bg-frappe-sapphire disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition-all ${className}`}
      >
        {enrollMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enrolling you now...</span>
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4" />
            <span>{user ? 'Enroll in Course' : 'Sign In to Enroll'}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-frappe-red/10 text-frappe-red text-xs font-medium border border-frappe-red/30">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
