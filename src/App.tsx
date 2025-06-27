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
    console.log('App mounting, initializing auth...');
    const unsubscribe = initializeAuth();
    
    // Fallback timeout to ensure loading doesn't get stuck
    const timeout = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.warn('Auth initialization timeout - forcing loading to false');
        useAuthStore.getState().setLoading(false);
      }
    }, 5000); // Increased timeout to 5 seconds

    return () => {
      console.log('App unmounting, cleaning up auth...');
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-brand-500 to-accent-500 p-3 rounded-xl">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              CourseAI
            </h1>
          </div>
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Initializing your learning platform...</p>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            This should only take a moment
          </div>
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