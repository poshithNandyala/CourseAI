import { useAuthStore } from "../store/authStore.js";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const createCourse = async (courseData) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to create courses");
  }

  console.log("📝 Creating course with data:", {
    title: courseData.title,
    lessonsCount: courseData.lessons.length,
    isPublished: courseData.is_published,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(courseData),
    });

    const data = await response.json();
    console.log("📡 Course creation response:", {
      status: response.status,
      success: response.ok,
    });

    if (!response.ok) {
      console.error("❌ Course creation failed:", data.message);
      throw new Error(data.message || "Failed to create course");
    }

    if (data.success && data.data.course) {
      const course = {
        id: data.data.course._id,
        title: data.data.course.title,
        description: data.data.course.description,
        creator_id: data.data.course.owner_id,
        creator: {
          name: data.data.course.owner?.name,
          avatar_url: data.data.course.owner?.avatar_url,
        },
        is_published: data.data.course.is_published,
        difficulty: data.data.course.difficulty,
        estimated_duration: data.data.course.estimated_duration,
        tags: data.data.course.tags,
        likes_count: data.data.course.likes_count || 0,
        rating: data.data.course.rating || 0,
        ratings_count: data.data.course.ratings_count || 0,
        created_at: data.data.course.createdAt,
        updated_at: data.data.course.updatedAt,
      };

      console.log("✅ Course created successfully:", course.title);
      toast.success(`Course "${course.title}" created successfully`);
      return course;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error creating course:", error);
    toast.error(error.message || "Failed to create course");
    throw error;
  }
};

export const fetchPublishedCourses = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.difficulty && params.difficulty !== "all") {
      searchParams.append("difficulty", params.difficulty);
    }

    const response = await fetch(
      `${API_BASE_URL}/courses/published?${searchParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch courses");
    }

    if (data.success && data.data.courses) {
      const courses = data.data.courses.map((course) => ({
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        creator_id: course.owner_id,
        creator: {
          name: course.owner?.fullname || "Unknown",
          avatar_url: course.owner?.avatar_url,
        },
        is_published: course.is_published,
        difficulty: course.difficulty,
        estimated_duration: course.estimated_duration,
        tags: course.tags,
        likes_count: course.likes_count || 0,
        rating: course.rating || 0,
        ratings_count: course.ratings_count || 0,
        created_at: course.createdAt,
        updated_at: course.updatedAt,
      }));

      return {
        courses,
        pagination: data.data.pagination || {},
      };
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error fetching published courses:", error);
    throw error;
  }
};

export const fetchUserCourses = async () => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to fetch courses");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user courses");
    }

    if (data.success && data.data.courses) {
      const courses = data.data.courses.map((course) => ({
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        creator_id: course.owner_id,
        creator: {
          name: course.owner?.name,
          avatar_url: course.owner?.avatar_url,
        },
        is_published: course.is_published,
        difficulty: course.difficulty,
        estimated_duration: course.estimated_duration,
        tags: course.tags,
        likes_count: course.likes_count || 0,
        rating: course.rating || 0,
        ratings_count: course.ratings_count || 0,
        created_at: course.createdAt,
        updated_at: course.updatedAt,
      }));

      return courses;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error fetching user courses:", error);
    throw error;
  }
};

export const fetchCourseById = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch course");
    }

    if (data.success && data.data.course) {
      const course = data.data.course;
      return {
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        creator_id: course.owner_id,
        creator: {
          name: course.owner?.fullname || "Unknown",
          avatar_url: course.owner?.avatar_url,
        },
        is_published: course.is_published,
        difficulty: course.difficulty,
        estimated_duration: course.estimated_duration,
        tags: course.tags,
        likes_count: course.likes_count || 0,
        rating: course.rating || 0,
        ratings_count: course.ratings_count || 0,
        created_at: course.createdAt,
        updated_at: course.updatedAt,
      };
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    throw error;
  }
};

export const fetchCourseLessons = async (courseId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/lessons`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch lessons");
    }

    if (data.success && data.data.lessons) {
      const lessons = data.data.lessons.map((lesson) => ({
        id: lesson._id,
        course_id: lesson.course_id,
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        order: lesson.order,
        video_url: lesson.video_url,
        videos: lesson.videos,
        quiz_questions: lesson.quiz_questions,
        resources: lesson.resources,
        created_at: lesson.createdAt,
      }));

      return lessons;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error fetching lessons:", error);
    throw error;
  }
};

export const updateCourse = async (courseId, updateData) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to update courses");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update course");
    }

    if (data.success && data.data.course) {
      const course = {
        id: data.data.course._id,
        title: data.data.course.title,
        description: data.data.course.description,
        creator_id: data.data.course.owner_id,
        creator: {
          name: data.data.course.owner?.name,
          avatar_url: data.data.course.owner?.avatar_url,
        },
        is_published: data.data.course.is_published,
        difficulty: data.data.course.difficulty,
        estimated_duration: data.data.course.estimated_duration,
        tags: data.data.course.tags,
        likes_count: data.data.course.likes_count || 0,
        rating: data.data.course.rating || 0,
        ratings_count: data.data.course.ratings_count || 0,
        created_at: data.data.course.createdAt,
        updated_at: data.data.course.updatedAt,
      };

      toast.success("Course updated successfully");
      return course;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error updating course:", error);
    toast.error(error.message || "Failed to update course");
    throw error;
  }
};

export const deleteCourse = async (courseId) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to delete courses");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete course");
    }

    if (data.success) {
      toast.success("Course deleted successfully");
      return true;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    toast.error(error.message || "Failed to delete course");
    throw error;
  }
};

export const publishCourse = async (courseId) => {
  return updateCourse(courseId, { is_published: true });
};

export const unpublishCourse = async (courseId) => {
  return updateCourse(courseId, { is_published: false });
};

export const likeCourse = async (courseId) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to like courses");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/like`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to like course");
    }

    if (data.success) {
      return data.data;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error liking course:", error);
    throw error;
  }
};

export const rateCourse = async (courseId, rating) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to rate courses");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/rate`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to rate course");
    }

    if (data.success) {
      return data.data;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error rating course:", error);
    throw error;
  }
};

export const addComment = async (courseId, content) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to add comments");
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/comments`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ content }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add comment");
    }

    if (data.success && data.data.comment) {
      return {
        id: data.data.comment._id,
        course_id: data.data.comment.course_id,
        user_id: data.data.comment.user_id,
        user: {
          name: data.data.comment.user?.name,
          avatar_url: data.data.comment.user?.avatar_url,
        },
        content: data.data.comment.content,
        created_at: data.data.comment.createdAt,
      };
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw error;
  }
};

export const fetchCourseComments = async (courseId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/comments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch comments");
    }

    if (data.success && data.data.comments) {
      const comments = data.data.comments.map((comment) => ({
        id: comment._id,
        course_id: comment.course_id,
        user_id: comment.user_id,
        user: {
          name: comment.user?.fullname || "Unknown",
          avatar_url: comment.user?.avatar_url,
        },
        content: comment.content,
        created_at: comment.createdAt,
      }));

      return comments;
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    throw error;
  }
};

// Export alias for addCourseComment
export const addCourseComment = addComment;

// Export alias for toggleCourseLike
export const toggleCourseLike = likeCourse;

// Export function for fetching user courses from user route
export const fetchUserCoursesFromUserRoute = fetchUserCourses;

// Export function for fetching published courses likes
export const fetchMyPublishedCoursesLikes = async () => {
  try {
    const courses = await fetchUserCourses();
    const publishedCourses = courses.filter(course => course.is_published);
    return publishedCourses.map(course => ({
      ...course,
      likes: course.likes_count || 0
    }));
  } catch (error) {
    console.error("❌ Error fetching published courses likes:", error);
    throw error;
  }
};
