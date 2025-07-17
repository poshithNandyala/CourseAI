import { create } from 'zustand';
import { Course, Lesson } from '../types';

interface CourseState {
  courses: Course[];
  publishedCourses: Course[];
  currentCourse: Course | null;
  lessons: Lesson[];
  loading: boolean;
  lastPublishUpdate: number;
  setCourses: (courses: Course[]) => void;
  setPublishedCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  setLessons: (lessons: Lesson[]) => void;
  setLoading: (loading: boolean) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  triggerPublishUpdate: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  publishedCourses: [],
  currentCourse: null,
  lessons: [],
  loading: false,
  lastPublishUpdate: 0,
  setCourses: (courses) => set({ courses }),
  setPublishedCourses: (publishedCourses) => set({ publishedCourses }),
  setCurrentCourse: (currentCourse) => set({ currentCourse }),
  setLessons: (lessons) => set({ lessons }),
  setLoading: (loading) => set({ loading }),
  addCourse: (course) => set((state) => ({ courses: [course, ...state.courses] })),
  updateCourse: (id, updates) =>
    set((state) => ({
      courses: state.courses.map((course) =>
        course.id === id ? { ...course, ...updates } : course
      ),
      publishedCourses: state.publishedCourses.map((course) =>
        course.id === id ? { ...course, ...updates } : course
      ),
    })),
  triggerPublishUpdate: () => set({ lastPublishUpdate: Date.now() }),
}));