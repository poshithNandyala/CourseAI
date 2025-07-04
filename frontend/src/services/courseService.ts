import { Course, Lesson } from "../types";
import { useAuthStore } from "../store/authStore";
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

export const createCourse = async (courseData: {
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: number;
  tags: string[];
  lessons: any[];
  is_published?: boolean;
}): Promise<Course> => {
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
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(courseData),
    });

    const data = await response.json();
    console.log("📡 Course creation response:", {
      status: response.status,
      success: data.success,
    });

    if (!response.ok) {
      console.error("❌ Course creation failed:", data.message);
      throw new Error(data.message || "Failed to create course");
    }

    if (data.success && data.data.course) {
      const course: Course = {
        id: data.data.course._id,
        title: data.data.course.title,
        description: data.data.course.description,
        creator_id: data.data.course.owner_id,
        creator: {
          name: user.name,
          avatar_url: user.avatar_url,
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
      toast.success(`Course "${course.title}" created successfully!`);
      return course;
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("❌ Error creating course:", error);
    toast.error(error.message || "Failed to create course");
    throw error;
  }
};

export const fetchPublishedCourses = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
}): Promise<{ courses: Course[]; pagination: any }> => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.difficulty && params.difficulty !== "all") {
      searchParams.append("difficulty", params.difficulty);
    }

    console.log(
      "🔍 Fetching published courses with params:",
      Object.fromEntries(searchParams)
    );

    const response = await fetch(
      `${API_BASE_URL}/courses/published?${searchParams}`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to fetch courses:", data.message);
      throw new Error(data.message || "Failed to fetch courses");
    }

    if (data.success && data.data) {
      const courses = data.data.courses.map((course: any) => ({
        id: course._id,
        title: course.title,
        description: course.description,
        creator_id: course.owner_id || course.creator?.id,
        creator: course.creator,
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

      console.log(`✅ Fetched ${courses.length} published courses`);
      return {
        courses,
        pagination: data.data.pagination,
      };
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error fetching published courses:", error);
    return { courses: [], pagination: null };
  }
};

export const fetchCourseById = async (
  courseId: string
): Promise<{ course: Course; lessons: Lesson[] } | null> => {
  try {
    console.log(`🔍 Fetching course details for ID: ${courseId}`);

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to fetch course:", data.message);
      throw new Error(data.message || "Failed to fetch course");
    }

    if (data.success && data.data) {
      const course: Course = {
        id: data.data.course._id,
        title: data.data.course.title,
        description: data.data.course.description,
        creator_id: data.data.course.creator?.id || "unknown",
        creator: data.data.course.creator,
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

      const lessons: Lesson[] = data.data.lessons.map((lesson: any) => ({
        id: lesson._id,
        course_id: lesson.course_id,
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        order: lesson.order,
        video_url: lesson.video_url,
        video_data: lesson.video_data || [],
        quiz_questions: lesson.quiz_questions || [],
        resources: lesson.resources || [],
      }));

      console.log(
        `✅ Fetched course with ${lessons.length} lessons and ${lessons.reduce(
          (sum, lesson) => sum + (lesson.video_data?.length || 0),
          0
        )} videos`
      );
      return { course, lessons };
    }

    return null;
  } catch (error: any) {
    console.error("Error fetching course:", error);
    return null;
  }
};

export const fetchUserCourses = async (): Promise<Course[]> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.log("❌ No user found, cannot fetch courses");
    return [];
  }

  try {
    console.log("📚 Fetching courses for user:", user.email);

    const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();
    console.log("📡 Raw response from /courses/my-courses:", data);

    if (!response.ok) {
      console.error("❌ Failed to fetch user courses:", data.message);
      throw new Error(data.message || "Failed to fetch user courses");
    }

    if (data.success && data.data && data.data.courses) {
      console.log("📚 Processing courses data:", data.data.courses);

      const courses = data.data.courses.map((course: any) => {
        console.log("🔍 Processing course:", {
          id: course.id,
          title: course.title,
          creator_id: course.creator_id,
          creator: course.creator,
        });

        return {
          id: course.id, // Backend is now sending 'id' field
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          creator_id: course.creator_id,
          creator: course.creator,
          is_published: course.is_published,
          difficulty: course.difficulty,
          estimated_duration: course.estimated_duration,
          tags: course.tags || [],
          likes_count: course.likes_count || 0,
          rating: course.rating || 0,
          ratings_count: course.ratings_count || 0,
          created_at: course.created_at,
          updated_at: course.updated_at,
        };
      });

      console.log(`✅ Processed ${courses.length} courses for user:`, courses);
      return courses;
    }

    console.log("❌ Invalid response format or no courses found");
    return [];
  } catch (error: any) {
    console.error("❌ Error fetching user courses:", error);
    return [];
  }
};

export const fetchUserCoursesFromUserRoute = async (): Promise<Course[]> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.log("❌ No user found, cannot fetch courses");
    return [];
  }

  try {
    console.log("📚 Fetching courses from user route for user:", user.email);

    const response = await fetch(`${API_BASE_URL}/users/my-courses`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();
    console.log("📡 Raw response from /users/my-courses:", data);

    if (!response.ok) {
      console.error(
        "❌ Failed to fetch user courses (user route):",
        data.message
      );
      throw new Error(data.message || "Failed to fetch user courses");
    }

    if (data.success && data.data && data.data.courses) {
      const courses = data.data.courses.map((course: any) => ({
        id: course._id || course.id,
        title: course.title,
        description: course.description,
        creator_id: course.owner_id,
        creator: course.creator,
        is_published: course.is_published,
        difficulty: course.difficulty,
        estimated_duration: course.estimated_duration,
        tags: course.tags || [],
        likes_count: course.likes_count || 0,
        rating: course.rating || 0,
        ratings_count: course.ratings_count || 0,
        created_at: course.createdAt,
        updated_at: course.updatedAt,
      }));

      console.log(`✅ Fetched ${courses.length} courses from user route`);
      return courses;
    }

    return [];
  } catch (error: any) {
    console.error("❌ Error fetching user courses (user route):", error);
    return [];
  }
};

export const toggleCourseLike = async (
  courseId: string
): Promise<{ isLiked: boolean }> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to like courses");
  }

  try {
    console.log(`❤️ Toggling like for course: ${courseId}`);

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/like`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to toggle like:", data.message);
      throw new Error(data.message || "Failed to toggle like");
    }

    if (data.success) {
      console.log(
        `✅ Course ${data.data.isLiked ? "liked" : "unliked"} successfully`
      );
      return { isLiked: data.data.isLiked };
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error toggling course like:", error);
    toast.error(error.message || "Failed to toggle like");
    throw error;
  }
};

export const rateCourse = async (
  courseId: string,
  rating: number
): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to rate courses");
  }

  try {
    console.log(`⭐ Rating course ${courseId} with ${rating} stars`);

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/rate`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to rate course:", data.message);
      throw new Error(data.message || "Failed to rate course");
    }

    if (data.success) {
      console.log("✅ Rating submitted successfully");
      toast.success("Rating submitted successfully!");
      return;
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error rating course:", error);
    toast.error(error.message || "Failed to rate course");
    throw error;
  }
};

export const addCourseComment = async (
  courseId: string,
  content: string
): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to comment");
  }

  try {
    console.log(`💬 Adding comment to course ${courseId}`);

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
      console.error("❌ Failed to add comment:", data.message);
      throw new Error(data.message || "Failed to add comment");
    }

    if (data.success) {
      console.log("✅ Comment added successfully");
      toast.success("Comment added successfully!");
      return;
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error adding comment:", error);
    toast.error(error.message || "Failed to add comment");
    throw error;
  }
};

export const fetchCourseComments = async (courseId: string): Promise<any[]> => {
  try {
    console.log(`💬 Fetching comments for course ${courseId}`);

    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/comments`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to fetch comments:", data.message);
      throw new Error(data.message || "Failed to fetch comments");
    }

    if (data.success && data.data) {
      console.log(`✅ Fetched ${data.data.length} comments`);
      return data.data;
    }

    return [];
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const publishCourse = async (courseId: string): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to publish courses");
  }

  try {
    console.log(`📢 Publishing course ${courseId}`);

    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/publish`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ is_published: true }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to publish course:", data.message);
      throw new Error(data.message || "Failed to publish course");
    }

    if (data.success) {
      console.log("✅ Course published successfully");
      toast.success("Course published successfully!");
      return;
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error publishing course:", error);
    toast.error(error.message || "Failed to publish course");
    throw error;
  }
};

export const unpublishCourse = async (courseId: string): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to unpublish courses");
  }

  try {
    console.log(`📝 Unpublishing course ${courseId}`);

    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/publish`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ is_published: false }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to unpublish course:", data.message);
      throw new Error(data.message || "Failed to unpublish course");
    }

    if (data.success) {
      console.log("✅ Course unpublished successfully");
      toast.success("Course unpublished successfully!");
      return;
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error unpublishing course:", error);
    toast.error(error.message || "Failed to unpublish course");
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User must be authenticated to delete courses");
  }

  try {
    console.log(`🗑️ Deleting course ${courseId}`);

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to delete course:", data.message);
      throw new Error(data.message || "Failed to delete course");
    }

    if (data.success) {
      console.log("✅ Course deleted successfully");
      toast.success("Course deleted successfully!");
      return;
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Error deleting course:", error);
    toast.error(error.message || "Failed to delete course");
    throw error;
  }
};

export const fetchMyPublishedCoursesLikes = async (): Promise<number> => {
  const user = useAuthStore.getState().user;
  if (!user) return 0;
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/my-published-courses-likes`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch likes");
    }
    return data.data?.totalLikes || 0;
  } catch (error) {
    console.error("Error fetching published courses likes:", error);
    return 0;
  }
};
