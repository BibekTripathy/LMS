import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Search, ShieldX, ShieldCheck } from 'lucide-react';
import { useVerifyCertificate } from './hooks';
import { getErrorCode, getErrorMessage } from '../../lib/errors';

/** Public page: anyone with a verification code can confirm a certificate is genuine. */
export const VerifyCertificatePage: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const verifyQuery = useVerifyCertificate(code);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) navigate(`/verify/${encodeURIComponent(trimmed)}`);
  };

  const result = verifyQuery.data;
  const notFound = getErrorCode(verifyQuery.error) === 'CERTIFICATE_NOT_FOUND';

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#32ADE6] flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          Verify a Certificate
        </h1>
        <p className="text-xs sm:text-sm text-[#86868B]">
          Enter the cryptographically signed verification code printed on the credential.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="verification-code" className="sr-only">
          Verification code
        </label>
        <input
          id="verification-code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="CERT-XXXXXXXXXXXX"
          className="flex-1 px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-xs sm:text-sm font-mono text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
        />
        <button
          type="submit"
          className="apple-btn-primary px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full gap-1.5 shadow-sm"
        >
          <Search className="w-4 h-4" /> Verify
        </button>
      </form>

      {verifyQuery.isLoading && <p className="text-center text-xs text-[#86868B]">Checking authenticity…</p>}

      {result && (
        <div
          className="apple-card p-6 border-l-4 border-l-[#34C759] space-y-4 shadow-sm"
          data-testid="verify-valid"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-[#34C759]">
            <BadgeCheck className="w-5 h-5 flex-shrink-0" />
            <span>Valid certificate</span>
          </div>
          <dl className="text-xs sm:text-sm grid grid-cols-3 gap-y-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
            <dt className="text-[#86868B]">Awarded to</dt>
            <dd className="col-span-2 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{result.student_name}</dd>
            <dt className="text-[#86868B]">Course</dt>
            <dd className="col-span-2 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{result.course_title}</dd>
            <dt className="text-[#86868B]">Instructor</dt>
            <dd className="col-span-2 text-[#6E6E73] dark:text-[#98989D]">{result.instructor_name || '—'}</dd>
            <dt className="text-[#86868B]">Issued</dt>
            <dd className="col-span-2 text-[#6E6E73] dark:text-[#98989D]">{new Date(result.issued_at).toLocaleDateString()}</dd>
            <dt className="text-[#86868B]">Code</dt>
            <dd className="col-span-2 font-mono text-xs text-[#0071E3] dark:text-[#32ADE6] break-all">{result.verification_code}</dd>
          </dl>
        </div>
      )}

      {verifyQuery.error && (
        <div className="apple-card p-6 border border-[#FF3B30]/20 bg-[#FF3B30]/5 text-center space-y-1.5">
          <ShieldX className="w-7 h-7 text-[#FF3B30] mx-auto" />
          <p className="font-bold text-sm text-[#FF3B30]">
            {notFound ? 'No certificate matches this code' : 'Verification failed'}
          </p>
          {!notFound && <p className="text-xs text-[#86868B]">{getErrorMessage(verifyQuery.error)}</p>}
        </div>
      )}
    </div>
  );
};
