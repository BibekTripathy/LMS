import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Home = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-blue-600 mb-4">LMS Platform</h1>
    <p className="text-gray-700">Welcome to the Learning Management System.</p>
  </div>
);

const Login = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-800">Login</h1>
    <p className="text-gray-600 mt-2">Authentication feature coming soon.</p>
  </div>
);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <nav className="bg-white shadow px-8 py-4 flex space-x-6">
      <Link to="/" className="text-gray-800 font-semibold hover:text-blue-600">Home</Link>
      <Link to="/login" className="text-gray-800 font-semibold hover:text-blue-600">Login</Link>
    </nav>
    <main className="flex-1">{children}</main>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
