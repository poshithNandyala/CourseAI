import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout/Layout";
import { HomePage } from "./components/Home/HomePage";
import { CourseBuilder } from "./components/Course/CourseBuilder";
import { CourseViewer } from "./components/Course/CourseViewer";
import { PublicCourseViewer } from "./components/Course/PublicCourseViewer";
import { ExplorePage } from "./components/Explore/ExplorePage";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { SignInPage } from "./components/Auth/SignInPage";
import { VerificationPage } from "./components/Auth/VerificationPage";
import { OAuthCallbackPage } from "./components/Auth/OAuthCallbackPage";
import ProfessionalSettings from "./components/Settings/ProfessionalSettings";
import { useTheme } from "./hooks/useTheme";
import { useAuthStore } from "./store/authStore";
import { initializeAuth } from "./services/authService";
import { GlobalGenerationIndicator } from "./components/Course/GlobalGenerationIndicator";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
    initializeAuth();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
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
      <GlobalGenerationIndicator />
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
