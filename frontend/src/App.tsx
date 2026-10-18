import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/shared/Navbar';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { NotBuiltYet } from './components/shared/NotBuiltYet';
import { AuthPage } from './features/auth/AuthPage';
import { InstructorDashboard } from './features/authoring/InstructorDashboard';
import { CourseEditor } from './features/authoring/CourseEditor';
import { QuizBuilder } from './features/quizzes/QuizBuilder';
import { QuizPlayer } from './features/quizzes/QuizPlayer';
import { QuizResult } from './features/quizzes/QuizResult';
import { StudyCentrePage } from './features/study-centre/StudyCentrePage';
import type { UserRole } from './types';

const INSTRUCTOR_ROLES: UserRole[] = ['INSTRUCTOR', 'ADMIN'];

const Home = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
    <h1 className="text-3xl font-bold text-indigo-600">LMS Platform</h1>
    <p className="text-gray-700">Learn with courses, quizzes and AI-generated study resources.</p>
    <Link to="/login" className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl">
      Get started
    </Link>
  </div>
);

const instructorOnly = (element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={INSTRUCTOR_ROLES}>{element}</ProtectedRoute>
);
const signedIn = (element: React.ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;

/** Route table. Frontend guards are for usability only; the API enforces every permission. */
export const AppRoutes: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />

        <Route path="/instructor" element={instructorOnly(<InstructorDashboard />)} />
        <Route path="/instructor/courses/new" element={instructorOnly(<CourseEditor />)} />
        <Route path="/instructor/courses/:id/edit" element={instructorOnly(<CourseEditor />)} />
        <Route path="/instructor/courses/:courseId/quizzes" element={instructorOnly(<QuizBuilder />)} />
        <Route
          path="/instructor/courses/:id/analytics"
          element={instructorOnly(<NotBuiltYet title="Course analytics" owner="analytics module" />)}
        />

        <Route path="/quizzes/:id" element={signedIn(<QuizPlayer />)} />
        <Route path="/quizzes/:id/results" element={signedIn(<QuizResult />)} />
        <Route path="/study-centre" element={signedIn(<StudyCentrePage />)} />

        <Route path="/courses" element={<NotBuiltYet title="Course catalogue" owner="student experience" />} />
        <Route path="/analytics" element={signedIn(<NotBuiltYet title="My analytics" owner="analytics module" />)} />
        <Route path="*" element={<NotBuiltYet title="Page not found" owner="unknown route" />} />
      </Routes>
    </main>
  </div>
);

function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
