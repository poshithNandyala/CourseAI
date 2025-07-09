import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout/Layout.jsx";
import { HomePage } from "./components/Home/HomePage.jsx";
import { CourseBuilder } from "./components/Course/CourseBuilder.jsx";
import { CourseViewer } from "./components/Course/CourseViewer.jsx";
import { PublicCourseViewer } from "./components/Course/PublicCourseViewer.jsx";
import { ExplorePage } from "./components/Explore/ExplorePage.jsx";
import { Dashboard } from "./components/Dashboard/Dashboard.jsx";
import { SignInPage } from "./components/Auth/SignInPage.jsx";
import { VerificationPage } from "./components/Auth/VerificationPage.jsx";
import ProfessionalSettings from "./components/Settings/ProfessionalSettings.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useAuthStore } from "./store/authStore.js";
import { initializeAuth } from "./services/authService.js";
import ErrorBoundary from "./components/Common/ErrorBoundary.jsx";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Initialize authentication on app load
    try {
      initializeAuth();
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/course/:id" element={<PublicCourseViewer />} />

          {/* Protected routes */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CourseBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-course/"
            element={
              <ProtectedRoute>
                <CourseViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-course/:id"
            element={
              <ProtectedRoute>
                <CourseViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProfessionalSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Layout>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? "#1f2937" : "#ffffff",
            color: isDark ? "#f9fafb" : "#111827",
            border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
        }}
      />
    </Router>
  );
}

export default App;




