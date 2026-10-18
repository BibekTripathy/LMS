import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Honest placeholder for routes whose feature has not been built yet.
 * It shows no data, so nothing on it can be mistaken for real metrics.
 */
export const NotBuiltYet: React.FC<{ title: string; owner: string }> = ({ title, owner }) => (
  <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
    <p className="text-sm text-slate-500">This page is not available yet ({owner}).</p>
    <Link to="/" className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl">
      Back to home
    </Link>
  </div>
);
