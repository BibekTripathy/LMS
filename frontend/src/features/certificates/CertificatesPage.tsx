import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Award, BadgeCheck, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useMyCertificates, useClaimCertificate } from './hooks';
import { useMyEnrollments } from '../enrollments/hooks';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorCode, getErrorMessage } from '../../lib/errors';
import type { CertificateCriteria } from '../../types';

function criteriaFromError(err: unknown): CertificateCriteria | null {
  if (getErrorCode(err) !== 'CRITERIA_NOT_MET' || !isAxiosError(err)) return null;
  const details = (err.response?.data as { details?: CertificateCriteria } | undefined)?.details;
  return details ?? null;
}

const CriteriaSummary: React.FC<{ criteria: CertificateCriteria }> = ({ criteria }) => (
  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
    <p className="font-bold">Not eligible yet</p>
    {criteria.reason && <p>{criteria.reason}</p>}
    {criteria.total_lessons !== undefined && (
      <p>
        Lessons completed: {criteria.completed_lessons ?? 0} / {criteria.total_lessons}
      </p>
    )}
    {criteria.total_quizzes !== undefined && criteria.total_quizzes > 0 && (
      <p>
        Quizzes passed: {criteria.quizzes_passed ?? 0} / {criteria.total_quizzes}
      </p>
    )}
    {criteria.missing_quizzes && criteria.missing_quizzes.length > 0 && (
      <ul className="list-disc pl-4">
        {criteria.missing_quizzes.map((q) => (
          <li key={q.quiz_id}>
            <Link to={`/quizzes/${q.quiz_id}`} className="underline">
              {q.title}
            </Link>{' '}
            (pass mark {q.pass_percentage}%)
          </li>
        ))}
      </ul>
    )}
  </div>
);

/** Student certificates: earned certificates plus a per-course eligibility check / claim. */
export const CertificatesPage: React.FC = () => {
  const certificatesQuery = useMyCertificates();
  const enrollmentsQuery = useMyEnrollments();
  const claim = useClaimCertificate();
  const [claimResults, setClaimResults] = useState<Record<string, { criteria?: CertificateCriteria; error?: string }>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const certificates = certificatesQuery.data ?? [];
  const certifiedCourseIds = new Set(certificates.map((c) => c.course));
  const claimable = (enrollmentsQuery.data ?? []).filter(
    (e) => e.status !== 'DROPPED' && !certifiedCourseIds.has(e.course)
  );

  const handleClaim = (courseId: string) => {
    setClaimResults((prev) => ({ ...prev, [courseId]: {} }));
    claim.mutate(courseId, {
      onError: (err) => {
        const criteria = criteriaFromError(err);
        setClaimResults((prev) => ({
          ...prev,
          [courseId]: criteria ? { criteria } : { error: getErrorMessage(err, 'Could not check eligibility.') },
        }));
      },
    });
  };

  const verifyUrl = (code: string) => `${window.location.origin}/verify/${encodeURIComponent(code)}`;

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(verifyUrl(code));
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" /> My Certificates
          </h1>
          <p className="text-sm text-slate-500">
            Certificates are issued when you complete every required lesson and pass every published quiz in a course.
          </p>
        </div>
        <Link
          to="/verify"
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 text-xs font-bold rounded-xl transition self-start"
        >
          Verify a certificate
        </Link>
      </div>

      {/* Earned certificates */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Earned</h2>
        {certificatesQuery.isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : certificatesQuery.error ? (
          <ErrorState
            title="Certificates unavailable"
            message={getErrorMessage(certificatesQuery.error)}
            onRetry={() => certificatesQuery.refetch()}
          />
        ) : certificates.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" description="Finish a course to earn your first certificate." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4" data-testid="certificate-list">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <BadgeCheck className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white">{cert.course_title}</h3>
                    <p className="text-xs text-slate-500">
                      Issued {new Date(cert.issued_at).toLocaleDateString()} • Instructor {cert.instructor_name || '—'}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-mono bg-white/70 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 break-all">
                  {cert.verification_code}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(cert.verification_code)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copied === cert.verification_code ? 'Copied!' : 'Copy verify link'}
                  </button>
                  <Link
                    to={`/verify/${encodeURIComponent(cert.verification_code)}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Claim */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Check eligibility</h2>
        {enrollmentsQuery.isLoading ? (
          <Skeleton className="h-20 rounded-2xl" />
        ) : enrollmentsQuery.error ? (
          <ErrorState message={getErrorMessage(enrollmentsQuery.error)} onRetry={() => enrollmentsQuery.refetch()} />
        ) : claimable.length === 0 ? (
          <p className="text-sm text-slate-500">
            {certificates.length > 0 ? 'Every enrolled course already has a certificate.' : 'Enroll in a course to start working towards a certificate.'}
          </p>
        ) : (
          <div className="space-y-3">
            {claimable.map((enrollment) => {
              const result = claimResults[enrollment.course];
              const pending = claim.isPending && claim.variables === enrollment.course;
              return (
                <div
                  key={enrollment.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                      {enrollment.course_detail?.title ?? 'Course'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClaim(enrollment.course)}
                      disabled={pending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Claim certificate
                    </button>
                  </div>
                  {result?.criteria && <CriteriaSummary criteria={result.criteria} />}
                  {result?.error && <p className="mt-2 text-xs text-rose-600">{result.error}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
