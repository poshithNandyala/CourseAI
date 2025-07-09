import { create } from 'zustand';

export const useCourseStore = create((set) => ({
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

