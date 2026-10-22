import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-latte-base dark:bg-frappe-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-frappe-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-latte-subtext1 dark:text-frappe-subtext1">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-latte-mantle dark:bg-frappe-surface0 rounded-xl shadow-sm border border-latte-surface1 dark:border-frappe-surface1 p-8 text-center">
          <div className="w-12 h-12 bg-frappe-peach/20 text-frappe-peach rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-latte-text dark:text-frappe-text mb-2">Access Restricted</h2>
          <p className="text-latte-subtext1 dark:text-frappe-subtext1 text-sm mb-6">
            Your account ({user.role}) does not have permission to access this page. Please log in with an authorized account or return home.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-frappe-sapphire hover:bg-frappe-blue text-frappe-base font-medium text-sm rounded-lg transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
