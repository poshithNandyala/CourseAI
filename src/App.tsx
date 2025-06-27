import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './components/Home/HomePage';
import { SignInPage } from './components/Auth/SignInPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CourseBuilder } from './components/Course/CourseBuilder';
import { ExplorePage } from './components/Explore/ExplorePage';
import { initializeAuth } from './services/authService';
import { useAuthStore } from './store/authStore';
import { useTheme } from './hooks/useTheme';
import { LoadingScreen } from './components/UI/LoadingScreen';

function App() {
  const { loading } = useAuthStore();
  const { isDark } = useTheme();

  useEffect(() => {
    console.log('🚀 App initializing...');
    
    // Initialize authentication
    const unsubscribe = initializeAuth();
    
    // Force loading to false after maximum 3 seconds
    const timeout = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.warn('⚠️ Forcing loading to false after timeout');
        useAuthStore.getState().setLoading(false);
      }
    }, 3000);

    return () => {
      console.log('🧹 App cleanup');
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Show loading screen only briefly
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CourseBuilder />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/course/:id" element={<div className="p-8 text-center">Course view coming soon!</div>} />
          <Route path="/course/:id/edit" element={<div className="p-8 text-center">Course editor coming soon!</div>} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f9fafb' : '#111827',
            border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
    </Router>
  );
}

export default App;