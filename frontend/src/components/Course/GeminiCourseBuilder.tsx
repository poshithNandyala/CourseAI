import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader,
  Video,
  FileText,
  HelpCircle,
  Play,
  CheckCircle,
  Settings,
  Users,
  Star,
  Youtube,
  BookOpen,
  Sparkles,
  Target,
  Save,
} from "lucide-react";
import {
  geminiCourseService,
  GeminiCourseData,
} from "../../services/geminiCourseService";
import { createCourse, publishCourse } from "../../services/courseService";
import { useCourseStore } from "../../store/courseStore";
import { useNavigate } from "react-router-dom";
import { InteractiveQuiz } from "../Quiz/InteractiveQuiz";
import { VideoPlayer } from "./VideoPlayer";
import { useAuthStore } from "../../store/authStore";
import {
  CourseGenerationSidebar,
  RealGenerationStep,
} from "./CourseGenerationSidebar";
import { useGenerationStore } from "../../store/generationStore";
import toast from "react-hot-toast";
import ApiKeyWarning from "../Common/ApiKeyWarning";

export const GeminiCourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addCourse, updateCourse } = useCourseStore();
  
  // Use global generation store
  const {
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    currentStep,
    setCurrentStep,
    currentStepId,
    setCurrentStepId,
    generationSteps,
    setGenerationSteps,
    updateStepStatus,
    showGenerationSidebar,
    setShowGenerationSidebar,
    isGenerationMinimized,
    setIsGenerationMinimized,
    isGenerationComplete,
    setIsGenerationComplete,
    shouldRedirectToCourseBuilder,
    setShouldRedirectToCourseBuilder,
    generatedCourse: globalGeneratedCourse,
    setGeneratedCourse: setGlobalGeneratedCourse,
    savedCourse: globalSavedCourse,
    setSavedCourse: setGlobalSavedCourse,
    courseSubtopics,
    setCourseSubtopics,
    userPrompt,
    setUserPrompt,
    courseSettings,
    setCourseSettings,

  } = useGenerationStore();
  
  // Local state (use global store values as default)
  const [generatedCourse, setGeneratedCourse] = useState<GeminiCourseData | null>(globalGeneratedCourse);
  const [savedCourse, setSavedCourse] = useState<any>(globalSavedCourse);
  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "quiz" | "settings"
  >("overview");
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [hasValidApiKeys, setHasValidApiKeys] = useState(false);
  const [isCheckingApiKeys, setIsCheckingApiKeys] = useState(true);
  
  // Convert generation steps to RealGenerationStep format for backwards compatibility
  const realGenerationSteps: RealGenerationStep[] = generationSteps.map(step => ({
    id: step.id,
    title: step.title,
    type: step.type,
    status: step.status,
    subtopicIndex: step.subtopicIndex,
    error: step.error,
  }));
  
  const setRealGenerationSteps = (steps: RealGenerationStep[]) => {
    setGenerationSteps(steps.map(step => ({
      id: step.id,
      title: step.title,
      type: step.type,
      status: step.status,
      subtopicIndex: step.subtopicIndex,
      error: step.error,
    })));
  };

  const createRealGenerationSteps = (
    subtopics: any[]
  ): RealGenerationStep[] => {
    const steps: RealGenerationStep[] = [];

    // Add extracting subtopics step
    steps.push({
      id: "extracting-subtopics",
      title: `Extracting subtopics`,
      type: "extracting",
      status: "completed",
    });

    // Add structure generation step
    steps.push({
      id: "course-structure",
      title: `Analyzing course structure`,
      type: "structure",
      status: "completed",
    });

    // Add steps for each lesson
    subtopics.forEach((subtopic: any, index: number) => {
      // Lesson content step
      steps.push({
        id: `lesson-${index + 1}-content`,
        title: `Lesson ${index + 1}: ${subtopic.title}`,
        type: "lesson",
        status: "pending",
        subtopicIndex: index,
      });

      // Video search step
      steps.push({
        id: `lesson-${index + 1}-videos`,
        title: `Finding videos: ${subtopic.title}`,
        type: "videos",
        status: "pending",
        subtopicIndex: index,
      });

      // Quiz generation step
      if (courseSettings.includeQuizzes) {
        steps.push({
          id: `lesson-${index + 1}-quiz`,
          title: `Creating quiz: ${subtopic.title}`,
          type: "quiz",
          status: "pending",
          subtopicIndex: index,
        });
      }
    });

    return steps;
  };

  const updateRealStepStatus = (
    stepId: string,
    status: "pending" | "in-progress" | "completed"
  ) => {
    updateStepStatus(stepId, status);
    if (status === "in-progress") {
      setCurrentStepId(stepId);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    if (!user && window.location.pathname.includes("/create")) {
      toast.error("Please sign in to create courses");
      navigate("/signin");
    }
  }, [user, navigate]);

  // Reset redirect flag when user reaches the course builder page
  useEffect(() => {
    if (shouldRedirectToCourseBuilder && window.location.pathname.includes('/create')) {
      setShouldRedirectToCourseBuilder(false);
    }
  }, [shouldRedirectToCourseBuilder, setShouldRedirectToCourseBuilder]);

  // Sync local state with global store
  useEffect(() => {
    if (globalGeneratedCourse && !generatedCourse) {
      setGeneratedCourse(globalGeneratedCourse);
    } else if (!globalGeneratedCourse && generatedCourse) {
      // Clear local state when global state is cleared
      setGeneratedCourse(null);
    }
    
    if (globalSavedCourse && !savedCourse) {
      setSavedCourse(globalSavedCourse);
    } else if (!globalSavedCourse && savedCourse) {
      // Clear local state when global state is cleared
      setSavedCourse(null);
    }
  }, [globalGeneratedCourse, globalSavedCourse, generatedCourse, savedCourse]);

  const progressSteps = [
    "Analyzing your course request with Gemini AI...",
    "Extracting main topic and subtopics...",
    "Generating detailed course structure...",
    "Searching YouTube for educational videos...",
    "Evaluating video quality and relevance...",
    "Generating quiz questions for each lesson...",
    "Creating interactive assessments...",
    "Finalizing course content and structure...",
    "Preparing to save course to database...",
  ];

  const autoSaveAndRedirect = async (courseResult: any) => {
    if (!user) {
      toast.error("Please sign in to save courses");
      navigate("/signin");
      return;
    }

    try {
      // Format course data for backend
      const courseData = {
        title: courseResult.course.title || "",
        description: courseResult.course.description || "",
        difficulty: courseResult.course.difficulty || "beginner",
        estimated_duration: courseResult.metadata.totalDuration,
        tags: courseResult.course.tags || [],
        is_published: false, // Save as draft initially
        lessons: courseResult.lessons.map((lesson: any) => ({
          title: lesson.title,
          content: lesson.content,
          type: lesson.type,
          order: lesson.order,
          video_url: lesson.video_url,
          video_data: lesson.videos, // Store complete video information
          quiz_questions: lesson.quiz_questions,
          resources: lesson.resources,
          estimated_duration: lesson.estimatedDuration,
        })),
      };

      console.log("💾 Auto-saving generated course as draft:", {
        title: courseData.title,
        lessonsCount: courseData.lessons.length,
        totalVideos: courseResult.metadata.videoCount,
        isPublished: courseData.is_published,
      });

      // Save course to database
      const savedCourseData = await createCourse(courseData);
      setSavedCourse(savedCourseData);
      setGlobalSavedCourse(savedCourseData);
      addCourse(savedCourseData);

      setGenerationProgress("");

      toast.success(
        `🎉 Course saved as draft! Found ${courseResult.metadata.videoCount} real YouTube videos across ${courseResult.metadata.subtopicsCount} topics. Review and publish when ready!`
      );

      // Don't redirect - stay on the same page to show Publish button
    } catch (error) {
      console.error("Error auto-saving course:", error);
      setGenerationProgress("");
      
      // Show the generated course for manual save if auto-save fails
      toast.error("Auto-save failed, but course was generated. Please save manually.");
      toast.success(
        `🎉 Course generated! Found ${courseResult.metadata.videoCount} real YouTube videos across ${courseResult.metadata.subtopicsCount} topics.`
      );
    }
  };

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      toast.error("Please describe the course you want to create");
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to create courses");
      navigate("/signin");
      return;
    }

    // Check API keys are configured
    if (!hasValidApiKeys) {
      console.log("🚫 Course generation blocked - API keys not configured");
      toast.error(
        "⚠️ Please configure your Gemini AI and YouTube Data API keys in Settings first!"
      );
      return;
    }

    console.log("✅ API keys validated - proceeding with course generation");

    setIsGenerating(true);
    setCurrentStep(0);
    setGenerationProgress(progressSteps[0]);

    // Show sidebar when generation starts with initial extracting step
    const initialSteps: RealGenerationStep[] = [
      {
        id: "extracting-subtopics",
        title: "Extracting subtopics",
        type: "extracting",
        status: "in-progress",
      },
    ];
    setRealGenerationSteps(initialSteps);
    setCurrentStepId("extracting-subtopics");
    setShowGenerationSidebar(true);

    try {
      // Progress simulation
      let currentStepIndex = 0;
      const progressInterval = setInterval(() => {
        currentStepIndex = Math.min(currentStepIndex + 1, progressSteps.length - 1);
        setCurrentStep(currentStepIndex);
        setGenerationProgress(progressSteps[currentStepIndex]);
      }, 3000);

      // Generate course with Gemini AI
      const result = await geminiCourseService.generateCourseWithGemini(
        userPrompt,
        {
          maxVideosPerSubtopic: courseSettings.maxVideosPerSubtopic,
          includeQuizzes: courseSettings.includeQuizzes,
          questionsPerLesson: courseSettings.questionsPerLesson,
          onStructureGenerated: (structure) => {
            // Mark extracting as complete and set real subtopics
            updateRealStepStatus("extracting-subtopics", "completed");
            setCourseSubtopics(structure.subtopics);
            // Create real steps based on actual structure
            const steps = createRealGenerationSteps(structure.subtopics);
            setRealGenerationSteps(steps);
          },
          onLessonStart: (lessonIndex, _lessonTitle) => {
            updateRealStepStatus(
              `lesson-${lessonIndex + 1}-content`,
              "in-progress"
            );
          },
          onLessonVideosStart: (lessonIndex) => {
            updateRealStepStatus(
              `lesson-${lessonIndex + 1}-content`,
              "completed"
            );
            updateRealStepStatus(
              `lesson-${lessonIndex + 1}-videos`,
              "in-progress"
            );
          },
          onLessonVideosComplete: (lessonIndex) => {
            updateRealStepStatus(
              `lesson-${lessonIndex + 1}-videos`,
              "completed"
            );
          },
          onLessonQuizStart: (lessonIndex) => {
            if (courseSettings.includeQuizzes) {
              updateRealStepStatus(
                `lesson-${lessonIndex + 1}-quiz`,
                "in-progress"
              );
            }
          },
          onLessonQuizComplete: (lessonIndex) => {
            if (courseSettings.includeQuizzes) {
              updateRealStepStatus(
                `lesson-${lessonIndex + 1}-quiz`,
                "completed"
              );
            }
          },
          onLessonComplete: (lessonIndex) => {
            // Lesson is fully complete
            console.log(`✅ Lesson ${lessonIndex + 1} completed`);
          },
        }
      );

      clearInterval(progressInterval);
      setGeneratedCourse(result);
      setGlobalGeneratedCourse(result);
      setGenerationProgress("Saving course to database...");
      setCurrentStep(0);
      setIsGenerationMinimized(true); // Minimize instead of hiding completely

      // Automatically save the course and redirect
      await autoSaveAndRedirect(result);
      
      // Mark generation as complete after successful save
      setIsGenerationComplete(true);
      setShouldRedirectToCourseBuilder(true);
    } catch (error) {
      console.error("Error generating course:", error);
      setGenerationProgress("");
      setCurrentStep(0);
      
      if (error instanceof Error) {
        if (error.message.includes("INVALID_API_KEY")) {
          toast.error("❌ Invalid Gemini API key. Please check your API key in settings.");
        } else if (error.message.includes("MISSING_API_KEY")) {
          toast.error("❌ Missing Gemini API key. Please add your API key in settings.");
        } else if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
          toast.error("⏳ Rate limit exceeded. Please wait a moment and try again. Consider upgrading your Gemini API plan for higher limits.");
        } else if (error.message.includes("API_KEY")) {
          toast.error("❌ API key error. Please check your Gemini API key in settings.");
        } else {
          toast.error("❌ Failed to generate course. Please try again.");
        }
      } else {
        toast.error("❌ Failed to generate course. Please check your API keys and try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };



  const handlePublishCourse = async () => {
    if (!generatedCourse) {
      toast.error("No course to publish");
      return;
    }

    if (!user) {
      toast.error("Please sign in to publish courses");
      navigate("/signin");
      return;
    }

    // Check if course is already saved as draft
    if (!savedCourse || !savedCourse.id) {
      toast.error("Course must be saved as draft first");
      return;
    }

    try {
      setGenerationProgress("Publishing course...");

      console.log("🚀 Publishing existing course:", {
        courseId: savedCourse.id,
        title: savedCourse.title,
      });

      // Publish the existing course
      await publishCourse(savedCourse.id);

      // Update local state to reflect published status
      const updatedCourse = { ...savedCourse, is_published: true };
      setSavedCourse(updatedCourse);
      setGlobalSavedCourse(updatedCourse);
      
      // Update course in store
      updateCourse(savedCourse.id, { is_published: true });

      setGenerationProgress("");
      toast.success(
        "Course published successfully! Others can now discover it."
      );
      navigate(`/create`);
    } catch (error) {
      console.error("Error publishing course:", error);
      setGenerationProgress("");
      toast.error("Failed to publish course");
    }
  };

  const handleGoToExplore = () => {
    navigate("/explore");
  };

  const handleCreateNewCourse = () => {
    console.log("🔄 Creating new course - resetting course builder state");
    console.log("Before reset - generatedCourse:", !!generatedCourse);
    setGeneratedCourse(null);
    setGlobalGeneratedCourse(null);
    setSavedCourse(null);
    setGlobalSavedCourse(null);
    setIsGenerationComplete(false);
    setUserPrompt('');
    setIsGenerationMinimized(false);
    setShowGenerationSidebar(false);
    console.log("After reset - should see prompt interface");
    toast.success("✨ Ready to create your next course!");
  };

  const examplePrompts = [
    "Psychology - Introduction to Human Behavior and Mental Processes",
    "Machine Learning for Beginners - From Theory to Practice",
    "Digital Marketing Strategy - Social Media to SEO",
    "Web Development with React - Modern Frontend Development",
    "Data Science with Python - Analytics and Visualization",
    "Graphic Design Fundamentals - Typography to Color Theory",
    "Financial Planning and Investment - Personal Finance Management",
    "Creative Writing Techniques - Storytelling and Character Development",
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "article":
        return <FileText className="h-4 w-4" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "article":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "quiz":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  return (
    <>
      {/* Course Generation Progress Sidebar */}
      <CourseGenerationSidebar
        isVisible={showGenerationSidebar}
        isMinimized={isGenerationMinimized}
        courseTitle={generatedCourse?.course.title || userPrompt}
        mainTopic={
          generatedCourse?.metadata.mainTopic ||
          userPrompt.split(" ")[0] ||
          "Course"
        }
        subtopics={courseSubtopics}
        steps={realGenerationSteps}
        currentStep={currentStepId}
        onClose={() => setIsGenerationMinimized(true)}
        onToggle={() => setIsGenerationMinimized(!isGenerationMinimized)}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Create New Course Button - Prominent at top when course is generated */}
        {generatedCourse && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateNewCourse}
              className="bg-gradient-to-r from-brand-500 to-accent-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center space-x-2"
            >
              <Sparkles className="h-6 w-6" />
              <span>✨ Create New Course</span>
            </motion.button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-brand-500 to-accent-500 p-3 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              AI Course Builder
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Create professional courses with <strong>AI intelligence</strong>{" "}
            and <strong>real YouTube videos</strong>. Your courses are
            automatically saved to your library.
          </p>

          {/* API Status Indicators */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Youtube className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                {import.meta.env.VITE_YOUTUBE_API_KEY
                  ? "YouTube API Connected"
                  : "YouTube API Required"}
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-purple-700 dark:text-purple-300">
                {import.meta.env.VITE_GEMINI_API_KEY
                  ? "Gemini AI Connected"
                  : "Gemini AI Optional"}
              </span>
            </div>
          </div>
        </motion.div>

        {!generatedCourse ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            {/* API Key Warning - Shows above course input */}
            <ApiKeyWarning
              onValidationChange={(isValid, isLoading) => {
                setHasValidApiKeys(isValid);
                setIsCheckingApiKeys(isLoading);
              }}
            />

            {/* Course Input */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
              <label
                htmlFor="prompt"
                className="block text-lg font-semibold text-gray-900 dark:text-white mb-4"
              >
                Describe the course you want to create
              </label>
              <div className="relative">
                <textarea
                  id="prompt"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="E.g., Psychology - Introduction to Human Behavior and Mental Processes, covering research methods, cognitive psychology, social psychology, and practical applications..."
                  rows={4}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-lg"
                  disabled={isGenerating}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    !userPrompt.trim() ||
                    !user ||
                    !hasValidApiKeys ||
                    isCheckingApiKeys
                  }
                  className="absolute bottom-4 right-4 bg-gradient-to-r from-brand-500 to-accent-500 text-white p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isGenerating ? (
                    <Loader className="h-6 w-6 animate-spin" />
                  ) : (
                    <Send className="h-6 w-6" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Course Settings */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>Course Settings</span>
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Videos per Lesson
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={courseSettings.maxVideosPerSubtopic}
                    onChange={(e) =>
                    setCourseSettings({
                    ...courseSettings,
                    maxVideosPerSubtopic: parseInt(e.target.value) || 3,
                    })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    aria-label="Number of videos per lesson"
                    title="Set the number of YouTube videos to find for each lesson"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Number of YouTube videos to find for each lesson
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Questions per Lesson
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={courseSettings.questionsPerLesson}
                    onChange={(e) =>
                    setCourseSettings({
                    ...courseSettings,
                    questionsPerLesson: Math.max(
                    5,
                    Math.min(30, parseInt(e.target.value) || 10)
                    ),
                    })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    aria-label="Number of questions per lesson"
                    title="Set the number of quiz questions to generate for each lesson"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Number of quiz questions per lesson (5-30)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Include Interactive Quizzes
                  </label>
                  <div className="flex items-center space-x-3 pt-3">
                    <button
                    onClick={() =>
                      setCourseSettings({
                        ...courseSettings,
                        includeQuizzes: !courseSettings.includeQuizzes,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    courseSettings.includeQuizzes
                    ? "bg-brand-500"
                    : "bg-gray-300 dark:bg-gray-600"
                    }`}
                      title={`${courseSettings.includeQuizzes ? 'Disable' : 'Enable'} interactive quizzes`}
                     >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          courseSettings.includeQuizzes
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                      {courseSettings.includeQuizzes ? "Yes" : "No"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Generate interactive quiz questions for each lesson
                  </p>
                </div>
              </div>
            </div>

            {/* Example Prompts */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>Example Course Ideas</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {examplePrompts.map((example, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserPrompt(example)}
                    className="p-4 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 text-brand-700 dark:text-brand-300 rounded-2xl text-left hover:from-brand-100 hover:to-accent-100 dark:hover:from-brand-800/30 dark:hover:to-accent-800/30 transition-all duration-200 border border-brand-200 dark:border-brand-800"
                  >
                    <div className="font-medium">{example}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Creating your course with AI...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  {generationProgress}
                </p>

                {/* Additional progress info */}
                {currentStep >= 4 && currentStep <= 7 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {currentStep === 4 &&
                          "Finding the best educational videos for your course..."}
                        {currentStep === 5 &&
                          "Analyzing video quality and educational value..."}
                        {currentStep === 6 &&
                          "Creating personalized quiz questions for each lesson..."}
                        {currentStep === 7 &&
                          "Developing interactive assessments and explanations..."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress Steps */}
                <div className="max-w-2xl mx-auto mb-6">
                  <div className="flex items-center justify-between">
                    {progressSteps.map((_step, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index <= currentStep
                            ? "bg-brand-500 scale-110"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Step {currentStep + 1} of {progressSteps.length}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                  <span>This may take 2-10 minutes for quality content...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >


            {/* Course Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {generatedCourse.course.title}
                    </h2>
                    {savedCourse && (
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                        savedCourse.is_published 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        <Save className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {savedCourse.is_published ? 'Published' : 'Saved as Draft'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                    {generatedCourse.course.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                        {generatedCourse.lessons.length}
                      </div>
                      <div className="text-sm text-brand-700 dark:text-brand-300">
                        Lessons
                      </div>
                    </div>
                    <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {generatedCourse.metadata.videoCount}
                      </div>
                      <div className="text-sm text-accent-700 dark:text-accent-300">
                        Real Videos
                      </div>
                    </div>
                    <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                        {Math.floor(
                          generatedCourse.metadata.totalDuration / 60
                        )}
                        h
                      </div>
                      <div className="text-sm text-success-700 dark:text-success-300">
                        Duration
                      </div>
                    </div>
                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                        {generatedCourse.metadata.quizCount}
                      </div>
                      <div className="text-sm text-warning-700 dark:text-warning-300">
                        Quizzes
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {generatedCourse.metadata.subtopicsCount}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        Topics
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {generatedCourse.course.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="ml-6">
                  <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-16 h-16 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                {[
                  { id: "overview", label: "Course Overview", icon: BookOpen },
                  { id: "lessons", label: "Lessons & Videos", icon: Play },
                  { id: "quiz", label: "Interactive Quiz", icon: HelpCircle },
                  { id: "settings", label: "Publish Settings", icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Course Structure
                    </h3>
                    <div className="grid gap-4">
                      {generatedCourse.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                        >
                          <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div
                                className={`p-1 rounded ${getTypeColor(
                                  lesson.type
                                )}`}
                              >
                                {getTypeIcon(lesson.type)}
                              </div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {lesson.title}
                              </h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {lesson.videos.length} real videos •{" "}
                              {lesson.articles.length} articles •{" "}
                              {lesson.quiz_questions?.length || 0} quiz
                              questions
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "lessons" && (
                  <div className="space-y-8">
                    {/* Lesson Selector */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {generatedCourse.lessons.map((_lesson, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedLessonIndex(index)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                            selectedLessonIndex === index
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          Lesson {index + 1}
                        </button>
                      ))}
                    </div>

                    {/* Selected Lesson Content */}
                    {generatedCourse.lessons[selectedLessonIndex] && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {generatedCourse.lessons[selectedLessonIndex].title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Video className="h-4 w-4" />
                              <span>
                                {
                                  generatedCourse.lessons[selectedLessonIndex]
                                    .videos.length
                                }{" "}
                                real videos
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Videos */}
                        {generatedCourse.lessons[selectedLessonIndex].videos
                          .length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                              <Youtube className="h-5 w-5 text-red-500" />
                              <span>Real YouTube Videos (AI Selected)</span>
                            </h4>
                            <div className="grid gap-6">
                              {generatedCourse.lessons[
                                selectedLessonIndex
                              ].videos.map((video, videoIndex) => (
                                <VideoPlayer key={videoIndex} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "quiz" && (
                  <div className="space-y-8">
                    {/* Lesson Selector for Quiz */}
                    {/* <div className="flex flex-wrap gap-2 mb-6">
                    {generatedCourse.lessons.map((lesson, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedLessonIndex(index)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                          selectedLessonIndex === index
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span>Lesson {index + 1}</span>
                        {lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <HelpCircle className="h-3 w-3" />
                            <span className="text-xs">
                              ({lesson.quiz_questions.length})
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div> */}

                    {/* Quiz Content */}
                    {generatedCourse.lessons[selectedLessonIndex]
                      ?.quiz_questions &&
                    generatedCourse.lessons[selectedLessonIndex].quiz_questions
                      .length > 0 ? (
                      <InteractiveQuiz
                        questions={
                          (generatedCourse.lessons[selectedLessonIndex]
                            .quiz_questions || []) as any
                        }
                        title={`${generatedCourse.lessons[selectedLessonIndex].title} - Quiz`}
                        lessons={generatedCourse.lessons as any}
                        selectedLessonIndex={selectedLessonIndex}
                        onLessonChange={setSelectedLessonIndex}
                        onComplete={(score, total) => {
                          toast.success(
                            `Quiz completed! You scored ${score}/${total} (${Math.round(
                              (score / total) * 100
                            )}%)`
                          );
                        }}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          No Quiz Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          This lesson doesn't have quiz questions yet. Quiz
                          questions might still be generating.
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Try selecting another lesson or wait for quiz
                          generation to complete.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Course Status
                    </h3>

                    <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-6 border border-brand-200 dark:border-brand-800">
                      <div className="flex items-start space-x-4">
                        <div className="bg-brand-500 p-2 rounded-xl">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">
                            Publish Your Course
                          </h4>
                          <p className="text-brand-700 dark:text-brand-300 mb-4">
                            When you publish this course, it will be visible to
                            all users in the course catalog. They can discover,
                            enroll, and rate your course.
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-brand-600 dark:text-brand-400">
                            <Star className="h-4 w-4" />
                            <span>
                              Course will appear in search results and
                              recommendations
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Course Preview
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Main Topic:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {generatedCourse.metadata.mainTopic}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total Lessons:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {generatedCourse.lessons.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Real Video Content:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {generatedCourse.metadata.videoCount} videos
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Interactive Quizzes:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {generatedCourse.metadata.quizCount} quizzes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Estimated Duration:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {Math.floor(
                              generatedCourse.metadata.totalDuration / 60
                            )}
                            h {generatedCourse.metadata.totalDuration % 60}m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Difficulty:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {generatedCourse.metadata.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToExplore}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center justify-center space-x-2"
              >
                <BookOpen className="h-5 w-5" />
                <span>Explore Courses</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePublishCourse}
                className="flex-1 bg-gradient-to-r from-success-500 to-success-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-success-600 hover:to-success-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Publish Course</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};
