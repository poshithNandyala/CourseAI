import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './components/Home/HomePage';
import { CourseBuilder } from './components/Course/CourseBuilder';
import { CourseViewer } from './components/Course/CourseViewer';
import { PublicCourseViewer } from './components/Course/PublicCourseViewer';
import { ExplorePage } from './components/Explore/ExplorePage';
import { useTheme } from './hooks/useTheme';

function App() {
  const { isDark } = useTheme();

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CourseBuilder />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/course/:id" element={<PublicCourseViewer />} />
          <Route path="/my-course/:id" element={<CourseViewer />} />
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