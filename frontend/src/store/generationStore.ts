import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GenerationStep {
  id: string;
  title: string;
  type: 'extracting' | 'structure' | 'lesson' | 'quiz' | 'videos';
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  subtopicIndex?: number;
  error?: string;
}

interface GenerationState {
  // Generation progress
  isGenerating: boolean;
  generationProgress: string;
  currentStep: number;
  currentStepId: string;
  generationSteps: GenerationStep[];
  
  // UI state
  showGenerationSidebar: boolean;
  isGenerationMinimized: boolean;
  
  // Course completion state
  isGenerationComplete: boolean;
  shouldRedirectToCourseBuilder: boolean;
  
  // Generated course data
  generatedCourse: any | null;
  savedCourse: any | null;
  
  // Course data during generation
  courseSubtopics: any[];
  userPrompt: string;
  courseSettings: {
    maxVideosPerSubtopic: number;
    includeQuizzes: boolean;
    questionsPerLesson: number;
  };
  
  // Actions
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: string) => void;
  setCurrentStep: (step: number) => void;
  setCurrentStepId: (stepId: string) => void;
  setGenerationSteps: (steps: GenerationStep[]) => void;
  updateStepStatus: (stepId: string, status: GenerationStep['status'], error?: string) => void;
  
  setShowGenerationSidebar: (show: boolean) => void;
  setIsGenerationMinimized: (minimized: boolean) => void;
  
  setIsGenerationComplete: (complete: boolean) => void;
  setShouldRedirectToCourseBuilder: (shouldRedirect: boolean) => void;
  
  setGeneratedCourse: (course: any | null) => void;
  setSavedCourse: (course: any | null) => void;
  
  setCourseSubtopics: (subtopics: any[]) => void;
  setUserPrompt: (prompt: string) => void;
  setCourseSettings: (settings: any) => void;
  
  // Reset generation state
  resetGenerationState: () => void;
  clearAllState: () => void;
}

const initialCourseSettings = {
  maxVideosPerSubtopic: 3,
  includeQuizzes: true,
  questionsPerLesson: 10,
};

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      // Initial state
      isGenerating: false,
      generationProgress: '',
      currentStep: 0,
      currentStepId: '',
      generationSteps: [],
      
      showGenerationSidebar: false,
      isGenerationMinimized: false,
      
      isGenerationComplete: false,
      shouldRedirectToCourseBuilder: false,
      
      generatedCourse: null,
      savedCourse: null,
      
      courseSubtopics: [],
      userPrompt: '',
      courseSettings: initialCourseSettings,
      
      // Actions
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setGenerationProgress: (generationProgress) => set({ generationProgress }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setCurrentStepId: (currentStepId) => set({ currentStepId }),
      setGenerationSteps: (generationSteps) => set({ generationSteps }),
      
      updateStepStatus: (stepId, status, error) => {
        set((state) => ({
          generationSteps: state.generationSteps.map((step) =>
            step.id === stepId ? { ...step, status, error } : step
          ),
        }));
      },
      
      setShowGenerationSidebar: (showGenerationSidebar) => set({ showGenerationSidebar }),
      setIsGenerationMinimized: (isGenerationMinimized) => set({ isGenerationMinimized }),
      
      setIsGenerationComplete: (isGenerationComplete) => set({ isGenerationComplete }),
      setShouldRedirectToCourseBuilder: (shouldRedirectToCourseBuilder) => set({ shouldRedirectToCourseBuilder }),
      
      setGeneratedCourse: (generatedCourse) => set({ generatedCourse }),
      setSavedCourse: (savedCourse) => set({ savedCourse }),
      
      setCourseSubtopics: (courseSubtopics) => set({ courseSubtopics }),
      setUserPrompt: (userPrompt) => set({ userPrompt }),
      setCourseSettings: (courseSettings) => set({ courseSettings }),
      
      resetGenerationState: () => set({
        isGenerating: false,
        generationProgress: '',
        currentStep: 0,
        currentStepId: '',
        generationSteps: [],
        showGenerationSidebar: false,
        isGenerationMinimized: false,
        isGenerationComplete: false,
        shouldRedirectToCourseBuilder: false,
        generatedCourse: null,
        savedCourse: null,
        courseSubtopics: [],
        userPrompt: '',
        courseSettings: initialCourseSettings,
      }),
      
      // Force clear any persistent state
      clearAllState: () => {
        localStorage.removeItem('generation-store');
        set({
          isGenerating: false,
          generationProgress: '',
          currentStep: 0,
          currentStepId: '',
          generationSteps: [],
          showGenerationSidebar: false,
          isGenerationMinimized: false,
          isGenerationComplete: false,
          shouldRedirectToCourseBuilder: false,
          generatedCourse: null,
          savedCourse: null,
          courseSubtopics: [],
          userPrompt: '',
          courseSettings: initialCourseSettings,
        });
      },
    }),
    {
      name: 'generation-store',
      // Only persist generation progress, not UI state
      partialize: (state) => ({
        isGenerating: state.isGenerating,
        generationProgress: state.generationProgress,
        currentStep: state.currentStep,
        currentStepId: state.currentStepId,
        generationSteps: state.generationSteps,
        isGenerationComplete: state.isGenerationComplete,
        shouldRedirectToCourseBuilder: state.shouldRedirectToCourseBuilder,
        generatedCourse: state.generatedCourse,
        savedCourse: state.savedCourse,
        courseSubtopics: state.courseSubtopics,
        userPrompt: state.userPrompt,
        courseSettings: state.courseSettings,
      }),
    }
  )
);
