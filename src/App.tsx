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
    
    // Fallback timeout to ensure loading doesn't get stuck
    const timeout = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.warn('Auth initialization timeout - forcing loading to false');
        useAuthStore.getState().setLoading(false);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading CourseAI...</p>
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
            background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: isDark ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.3)',
            color: isDark ? '#f9fafb' : '#111827',
            borderRadius: '12px',
          },
        }}
      />
    </Router>
  );
}

export default App;