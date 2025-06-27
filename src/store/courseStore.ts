import { create } from 'zustand';
import { Course, Lesson } from '../types';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  lessons: Lesson[];
  loading: boolean;
  setCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  setLessons: (lessons: Lesson[]) => void;
  setLoading: (loading: boolean) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  currentCourse: null,
  lessons: [],
  loading: false,
  setCourses: (courses) => set({ courses }),
  setCurrentCourse: (currentCourse) => set({ currentCourse }),
  setLessons: (lessons) => set({ lessons }),
  setLoading: (loading) => set({ loading }),
  addCourse: (course) => set((state) => ({ courses: [course, ...state.courses] })),
  updateCourse: (id, updates) =>
    set((state) => ({
      courses: state.courses.map((course) =>
        course.id === id ? { ...course, ...updates } : course
      ),
    })),
}));