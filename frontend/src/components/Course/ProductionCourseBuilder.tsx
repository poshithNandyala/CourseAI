import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader,
  Brain,
  Video,
  FileText,
  HelpCircle,
  Play,
  ExternalLink,
  CheckCircle,
  Clock,
  Settings,
  Eye,
  EyeOff,
  Users,
  Star,
  Youtube,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import {
  productionCourseService,
  ProductionCourseData,
} from "../../services/productionCourseService";
import { useCourseStore } from "../../store/courseStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ApiKeyWarning from "../Common/ApiKeyWarning";

export const ProductionCourseBuilder: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] =
    useState<ProductionCourseData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "settings"
  >("overview");
  const [courseSettings, setCourseSettings] = useState({
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    maxVideosPerSubtopic: 3,
    includeQuizzes: true,
  });
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [hasValidApiKeys, setHasValidApiKeys] = useState(false);
  const [isCheckingApiKeys, setIsCheckingApiKeys] = useState(true);
  const { addCourse } = useCourseStore();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a course topic");
      return;
    }

    if (!hasValidApiKeys) {
      console.log("🚫 Course generation blocked - API keys not configured");
      toast.error(
        "⚠️ Please configure your Gemini AI and YouTube Data API keys in Settings first!"
      );
      return;
    }

    console.log("✅ API keys validated - proceeding with course generation");

    setIsGenerating(true);
    setGenerationProgress("Initializing course generation...");

    try {
      // Update progress during generation
      const progressInterval = setInterval(() => {
        const messages = [
          "Analyzing course topic...",
          "Structuring course content...",
          "Searching YouTube for relevant videos...",
          "Finding educational articles...",
          "Generating quiz questions...",
          "Finalizing course structure...",
        ];
        setGenerationProgress(
          messages[Math.floor(Math.random() * messages.length)]
        );
      }, 2000);

      const result = await productionCourseService.generateRealCourse(topic, {
        difficulty: courseSettings.difficulty,
        maxVideosPerSubtopic: courseSettings.maxVideosPerSubtopic,
        includeQuizzes: courseSettings.includeQuizzes,
      });

      clearInterval(progressInterval);
      setGeneratedCourse(result);
      setGenerationProgress("");
      toast.success(
        "Real course generated successfully with actual YouTube videos!"
      );
    } catch (error) {
      console.error("Error generating course:", error);
      setGenerationProgress("");
      toast.error(
        "Failed to generate course. Please check your API keys and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!generatedCourse) return;

    try {
      const course = await productionCourseService.saveCourseToDatabase(
        generatedCourse
      );
      addCourse(course);

      toast.success("Course saved to database!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    }
  };

  const handlePublishCourse = async () => {
    if (!generatedCourse) return;

    try {
      // First save the course
      const course = await productionCourseService.saveCourseToDatabase(
        generatedCourse
      );

      // Then publish it
      await productionCourseService.publishCourse(course.id);

      addCourse(course);
      toast.success(
        "Course created and published! Others can now discover it."
      );
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating and publishing course:", error);
      toast.error("Failed to create and publish course");
    }
  };

  const exampleTopics = [
    "Psychology - Introduction to Human Behavior",
    "Machine Learning for Beginners",
    "Digital Marketing Strategy",
    "Web Development with React",
    "Data Science with Python",
    "Graphic Design Fundamentals",
    "Financial Planning and Investment",
    "Creative Writing Techniques",
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            AI Course Builder
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Create professional courses with <strong>real YouTube videos</strong>,
          comprehensive content, and interactive elements. Powered by AI and
          integrated with live APIs.
        </p>

        {/* API Status Indicators */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              YouTube API Required
            </span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Gemini AI Required
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
              htmlFor="topic"
              className="block text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              What course would you like to create?
            </label>
            <div className="relative">
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., Psychology - Introduction to Human Behavior and Mental Processes..."
                rows={4}
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-lg"
                disabled={isGenerating}
              />
              <motion.button
                whileHover={{
                  scale: !hasValidApiKeys || isCheckingApiKeys ? 1 : 1.05,
                }}
                whileTap={{
                  scale: !hasValidApiKeys || isCheckingApiKeys ? 1 : 0.95,
                }}
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  !topic.trim() ||
                  !hasValidApiKeys ||
                  isCheckingApiKeys
                }
                className={`absolute bottom-4 right-4 p-3 rounded-2xl transition-all duration-200 shadow-lg ${
                  (!hasValidApiKeys || isCheckingApiKeys) && !isGenerating
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
                title={
                  !hasValidApiKeys || isCheckingApiKeys
                    ? "Configure API keys to enable course creation"
                    : "Generate course"
                }
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
                  Difficulty Level
                </label>
                <select
                  value={courseSettings.difficulty}
                  onChange={(e) =>
                    setCourseSettings((prev) => ({
                      ...prev,
                      difficulty: e.target.value as
                        | "beginner"
                        | "intermediate"
                        | "advanced",
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

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
                    setCourseSettings((prev) => ({
                      ...prev,
                      maxVideosPerSubtopic: parseInt(e.target.value) || 3,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include Quizzes
                </label>
                <div className="flex items-center space-x-3 pt-3">
                  <button
                    onClick={() =>
                      setCourseSettings((prev) => ({
                        ...prev,
                        includeQuizzes: !prev.includeQuizzes,
                      }))
                    }
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-200 ${
                      courseSettings.includeQuizzes
                        ? "bg-blue-600 shadow-lg"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-all duration-200 ${
                        courseSettings.includeQuizzes
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`text-base font-medium ${
                    courseSettings.includeQuizzes 
                      ? "text-blue-700 dark:text-blue-300" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {courseSettings.includeQuizzes ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Example Topics */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Example Course Topics</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {exampleTopics.map((example, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTopic(example)}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-2xl text-left hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200 border border-blue-200 dark:border-blue-800"
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
              <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-10 w-10 text-white animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Creating your course with real content...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {generationProgress ||
                  "Fetching real YouTube videos and educational resources..."}
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>This may take 1-2 minutes for quality content...</span>
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {generatedCourse.course.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                  {generatedCourse.course.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {generatedCourse.lessons.length}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Lessons
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {generatedCourse.metadata.videoCount}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      Real Videos
                    </div>
                  </div>
                  <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                      {Math.floor(generatedCourse.metadata.totalDuration / 60)}h
                    </div>
                    <div className="text-sm text-success-700 dark:text-success-300">
                      Duration
                    </div>
                  </div>
                  <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                      {generatedCourse.metadata.articleCount}
                    </div>
                    <div className="text-sm text-warning-700 dark:text-warning-300">
                      Articles
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {generatedCourse.course.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
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
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({lesson.estimatedDuration} min)
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {lesson.videos.length} real videos •{" "}
                            {lesson.articles.length} articles •{" "}
                            {lesson.quiz_questions?.length || 0} quiz questions
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "lessons" && (
                <div className="space-y-6">
                  {generatedCourse.lessons.map((lesson, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                    >
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {lesson.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{lesson.estimatedDuration} minutes</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Video className="h-4 w-4" />
                              <span>{lesson.videos.length} real videos</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>{lesson.articles.length} articles</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {lesson.videos.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                            <Youtube className="h-5 w-5 text-red-500" />
                            <span>Real YouTube Videos</span>
                          </h5>
                          <div className="space-y-3">
                            {lesson.videos.map((video, videoIndex) => (
                              <div
                                key={videoIndex}
                                className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                              >
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-32 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                                    {video.title}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {video.channelTitle} • {video.duration} •{" "}
                                    {video.viewCount.toLocaleString()} views
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-500">
                                    {video.description.slice(0, 150)}...
                                  </div>
                                </div>
                                <a
                                  href={video.watchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lesson.articles.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Reading Materials
                          </h5>
                          <div className="space-y-2">
                            {lesson.articles.map((article, articleIndex) => (
                              <div
                                key={articleIndex}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                              >
                                <div className="font-medium text-gray-900 dark:text-white mb-1">
                                  {article.title}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {article.source} • {article.readingTime}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-500">
                                  {article.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lesson.quiz_questions &&
                        lesson.quiz_questions.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Quiz Questions
                            </h5>
                            <div className="space-y-3">
                              {lesson.quiz_questions.map((question, qIndex) => (
                                <div
                                  key={qIndex}
                                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                                    {question.question}
                                  </div>
                                  <div className="space-y-1">
                                    {question.options?.map((option, oIndex) => (
                                      <div
                                        key={oIndex}
                                        className={`text-sm p-2 rounded ${
                                          option === question.correct_answer
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                            : "text-gray-600 dark:text-gray-400"
                                        }`}
                                      >
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Publishing Options
                  </h3>

                  <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-6 border border-brand-200 dark:border-brand-800">
                    <div className="flex items-start space-x-4">
                      <div className="bg-brand-500 p-2 rounded-xl">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">
                          Make Course Public
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
                          Reading Materials:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {generatedCourse.metadata.articleCount} articles
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
              onClick={handleSaveCourse}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center justify-center space-x-2"
            >
              <EyeOff className="h-5 w-5" />
              <span>Save as Draft</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePublishCourse}
              className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center justify-center space-x-2"
            >
              <Eye className="h-5 w-5" />
              <span>Create & Publish</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGeneratedCourse(null)}
              className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 text-lg"
            >
              Generate New
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
