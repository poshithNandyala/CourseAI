import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './components/Home/HomePage';
import { AuthPage } from './components/Auth/AuthPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CourseBuilder } from './components/Course/CourseBuilder';
import { initializeAuth } from './services/authService';
import { useAuthStore } from './store/authStore';

function App() {
  const { loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CourseBuilder />} />
          <Route path="/explore" element={<div className="p-8 text-center">Explore page coming soon!</div>} />
          <Route path="/course/:id" element={<div className="p-8 text-center">Course view coming soon!</div>} />
          <Route path="/course/:id/edit" element={<div className="p-8 text-center">Course editor coming soon!</div>} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />
    </Router>
  );
}

export default App;