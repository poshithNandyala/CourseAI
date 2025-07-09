import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface CourseRating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface RatingResponse {
  success: boolean;
  data: {
    rating: CourseRating;
    courseStats: {
      averageRating: number;
      totalRatings: number;
    };
  };
  message: string;
}

/**
 * Submit or update a course rating
 */
export const submitCourseRating = async (courseId: string, rating: number): Promise<RatingResponse> => {
  try {
    console.log(`📊 Submitting rating ${rating} for course ${courseId}`);
    
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/rating`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit rating");
    }

    console.log("✅ Rating submitted successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error submitting rating:", error);
    throw error;
  }
};

/**
 * Get user's rating for a specific course
 */
export const getUserCourseRating = async (courseId: string): Promise<number | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/rating/user`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (response.status === 404) {
      return null; // User hasn't rated this course
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get user rating");
    }

    return data.success ? data.data.rating : null;
  } catch (error) {
    console.error("❌ Error getting user rating:", error);
    return null;
  }
};

/**
 * Get all ratings for a course
 */
export const getCourseRatings = async (courseId: string): Promise<{
  ratings: CourseRating[];
  stats: {
    averageRating: number;
    totalRatings: number;
    distribution: { [key: number]: number };
  };
} | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/ratings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get course ratings");
    }

    return data.success ? data.data : null;
  } catch (error) {
    console.error("❌ Error getting course ratings:", error);
    return null;
  }
};

/**
 * Delete a user's rating for a course
 */
export const deleteCourseRating = async (courseId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting rating for course ${courseId}`);
    
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/rating`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete rating");
    }

    console.log("✅ Rating deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting rating:", error);
    throw error;
  }
};
