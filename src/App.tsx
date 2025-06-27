import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './components/Home/HomePage';
import { SignInPage } from './components/Auth/SignInPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CourseBuilder } from './components/Course/CourseBuilder';
import { initializeAuth } from './services/authService';
import { useAuthStore } from './store/authStore';
import { useTheme } from './hooks/useTheme';
import { LoadingSpinner } from './components/UI/LoadingSpinner';

function App() {
  const { loading } = useAuthStore();
  const { isDark } = useTheme();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading CourseAI...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
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
            background: isDark ? 'rgba(38, 38, 38, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: isDark ? '1px solid rgba(115, 115, 115, 0.2)' : '1px solid rgba(229, 229, 229, 0.2)',
            color: isDark ? '#f5f5f5' : '#171717',
          },
        }}
      />
    </Router>
  );
}

export default App;