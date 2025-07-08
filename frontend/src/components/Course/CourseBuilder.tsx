import React, { useEffect } from "react";
import { GeminiCourseBuilder } from "./GeminiCourseBuilder";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

export const CourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to create courses");
      navigate("/signin");
    }
  }, [user, navigate]);

  return <GeminiCourseBuilder />;
};
