import { Course, Lesson } from "../types";

interface CourseCache {
  [courseId: string]: {
    course: Course;
    lessons: Lesson[];
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

class CourseCacheManager {
  private cache: CourseCache = {};

  getCachedCourse(courseId: string): { course: Course; lessons: Lesson[] } | null {
    const cached = this.cache[courseId];
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      delete this.cache[courseId];
      return null;
    }
    
    console.log(`📱 Using cached course data for ${courseId}`);
    return { course: cached.course, lessons: cached.lessons };
  }

  setCachedCourse(courseId: string, course: Course, lessons: Lesson[]): void {
    this.cache[courseId] = {
      course,
      lessons,
      timestamp: Date.now()
    };
    console.log(`💾 Cached course data for ${courseId}`);
  }

  clearCache(): void {
    this.cache = {};
    console.log(`🧹 Course cache cleared`);
  }

  clearCourseCache(courseId: string): void {
    delete this.cache[courseId];
    console.log(`🧹 Cache cleared for course ${courseId}`);
  }
}

export const courseCacheManager = new CourseCacheManager();
