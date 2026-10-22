import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Award, BadgeCheck, Copy, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
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
  <div className="mt-3 p-3.5 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/20 text-xs text-[#B25000] dark:text-[#FF9F0A] space-y-1.5">
    <p className="font-bold flex items-center gap-1.5">
      <span>Not eligible yet</span>
    </p>
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
      <ul className="list-disc pl-4 space-y-0.5">
        {criteria.missing_quizzes.map((q) => (
          <li key={q.quiz_id}>
            <Link to={`/quizzes/${q.quiz_id}`} className="font-semibold underline">
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-transition-enter">
      {/* Header Banner */}
      <div className="apple-card p-6 sm:p-8 bg-gradient-to-br from-white via-[#FAFAFC] to-[#F2F2F7] dark:from-[#1C1C1E] dark:via-[#161618] dark:to-[#0D0D0E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9500]/10 text-[#FF9500] text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Academic Credentials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight flex items-center gap-2">
            My Certificates
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] max-w-xl">
            Certificates are issued when you complete every required lesson and pass every published quiz in a course.
          </p>
        </div>
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-[#0071E3] dark:text-[#32ADE6] text-xs font-semibold rounded-full border border-black/[0.04] dark:border-white/[0.08] active:scale-[0.98] transition self-start sm:self-auto"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Verify a certificate
        </Link>
      </div>

      {/* Earned certificates */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">Earned</h2>
        {certificatesQuery.isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
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
                className="apple-card p-6 border-l-4 border-l-[#FF9500] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center flex-shrink-0">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">{cert.course_title}</h3>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Issued {new Date(cert.issued_at).toLocaleDateString()} • Instructor {cert.instructor_name || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.04] px-3 py-2 rounded-xl border border-black/[0.05] dark:border-white/[0.07]">
                  <span className="text-[10px] text-[#86868B] uppercase font-mono tracking-wider">Verification Hash</span>
                  <span className="text-xs font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] break-all">
                    {cert.verification_code}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyLink(cert.verification_code)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] active:scale-[0.98] transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#86868B]" /> {copied === cert.verification_code ? 'Copied!' : 'Copy verify link'}
                  </button>
                  <Link
                    to={`/verify/${encodeURIComponent(cert.verification_code)}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white active:scale-[0.98] transition shadow-xs"
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
        <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">Check eligibility</h2>
        {enrollmentsQuery.isLoading ? (
          <Skeleton className="h-20 rounded-2xl" />
        ) : enrollmentsQuery.error ? (
          <ErrorState message={getErrorMessage(enrollmentsQuery.error)} onRetry={() => enrollmentsQuery.refetch()} />
        ) : claimable.length === 0 ? (
          <p className="text-sm text-[#86868B]">
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
                  className="apple-card p-5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {enrollment.course_detail?.title ?? 'Course'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClaim(enrollment.course)}
                      disabled={pending}
                      className="apple-btn-primary px-4 py-2 text-xs font-semibold rounded-full"
                    >
                      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      Claim certificate
                    </button>
                  </div>
                  {result?.criteria && <CriteriaSummary criteria={result.criteria} />}
                  {result?.error && <p className="mt-2 text-xs text-[#FF3B30] font-semibold">{result.error}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
