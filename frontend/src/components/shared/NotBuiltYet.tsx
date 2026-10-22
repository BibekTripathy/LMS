import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Honest placeholder for routes whose feature has not been built yet.
 * It shows no data, so nothing on it can be mistaken for real metrics.
 */
export const NotBuiltYet: React.FC<{ title: string; owner: string }> = ({ title, owner }) => (
  <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
    <h1 className="text-2xl font-bold text-latte-text dark:text-frappe-text">{title}</h1>
    <p className="text-sm text-latte-subtext1 dark:text-frappe-subtext1">This page is not available yet ({owner}).</p>
    <Link to="/" className="inline-block px-5 py-2.5 bg-frappe-sapphire hover:bg-frappe-blue text-frappe-base font-medium text-sm rounded-xl transition">
      Back to home
    </Link>
  </div>
);
