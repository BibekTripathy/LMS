import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Search, ShieldX } from 'lucide-react';
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
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verify a Certificate</h1>
        <p className="text-sm text-slate-500">Enter the verification code printed on the certificate.</p>
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
          className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
        >
          <Search className="w-4 h-4" /> Verify
        </button>
      </form>

      {verifyQuery.isLoading && <p className="text-center text-sm text-slate-500">Checking…</p>}

      {result && (
        <div
          className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-2"
          data-testid="verify-valid"
        >
          <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
            <BadgeCheck className="w-5 h-5" /> Valid certificate
          </p>
          <dl className="text-sm grid grid-cols-3 gap-y-1">
            <dt className="text-slate-500">Awarded to</dt>
            <dd className="col-span-2 font-semibold text-slate-900 dark:text-white">{result.student_name}</dd>
            <dt className="text-slate-500">Course</dt>
            <dd className="col-span-2 font-semibold text-slate-900 dark:text-white">{result.course_title}</dd>
            <dt className="text-slate-500">Instructor</dt>
            <dd className="col-span-2 text-slate-800 dark:text-slate-200">{result.instructor_name || '—'}</dd>
            <dt className="text-slate-500">Issued</dt>
            <dd className="col-span-2 text-slate-800 dark:text-slate-200">{new Date(result.issued_at).toLocaleDateString()}</dd>
            <dt className="text-slate-500">Code</dt>
            <dd className="col-span-2 font-mono text-xs break-all">{result.verification_code}</dd>
          </dl>
        </div>
      )}

      {verifyQuery.error && (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-center space-y-1">
          <ShieldX className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="font-bold text-rose-700 dark:text-rose-300">
            {notFound ? 'No certificate matches this code' : 'Verification failed'}
          </p>
          {!notFound && <p className="text-sm text-slate-500">{getErrorMessage(verifyQuery.error)}</p>}
        </div>
      )}
    </div>
  );
};
