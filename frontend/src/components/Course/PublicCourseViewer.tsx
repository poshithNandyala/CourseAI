import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Play,
  BookOpen,
  Clock,
  Star,
  Users,
  ArrowLeft,
  Youtube,
  FileText,
  HelpCircle,
  AlertCircle,
  Heart,
  MessageCircle,
  Send,
  User,
  ThumbsUp,
  Unlock,
} from "lucide-react";
import {
  fetchCourseById,
  fetchCourseComments,
  addCourseComment,
  toggleCourseLike,
} from "../../services/courseService";
import { useAuthStore } from "../../store/authStore";
import { VideoPlayer } from "./VideoPlayer";
import { InteractiveQuiz } from "../Quiz/InteractiveQuiz";
import { geminiAPI } from "../../services/geminiApi";
import toast from "react-hot-toast";

export const PublicCourseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "quiz" | "comments"
  >("overview");
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [lessonSummary, setLessonSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error("Course not found");
      navigate("/explore");
      return;
    }

    loadPublicCourse();
    loadComments();
  }, [id]);

  // Generate summary for initial lesson when lessons are loaded
  useEffect(() => {
    if (lessons.length > 0 && selectedLessonIndex >= 0 && !lessonSummary) {
      generateLessonSummary(lessons[selectedLessonIndex]);
    }
  }, [lessons, selectedLessonIndex]);

  const loadPublicCourse = async () => {
    if (!id) return;

    try {
      setLoading(true);
      console.log(
        "🌍 Loading public course for ALL users (no auth required):",
        id
      );
      const result = await fetchCourseById(id);
      if (result) {
        console.log(
          "✅ Public course loaded with",
          result.lessons.length,
          "lessons"
        );
        setCourse(result.course);
        setLessons(result.lessons);
      } else {
        toast.error("Course not found or not published");
        navigate("/explore");
      }
    } catch (error) {
      console.error("❌ Error loading public course:", error);
      toast.error("Failed to load course");
      navigate("/explore");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;

    try {
      console.log("💬 Loading comments for ALL users (no auth required)");
      const courseComments = await fetchCourseComments(id);
      setComments(courseComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!user) {
      toast.error("Please sign in to comment");
      navigate("/signin");
      return;
    }

    try {
      setSubmittingComment(true);
      await addCourseComment(id!, newComment.trim());
      setNewComment("");
      await loadComments();
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeCourse = async () => {
    if (!user) {
      toast.error("Please sign in to like this course");
      navigate("/signin");
      return;
    }

    try {
      const result = await toggleCourseLike(id!);
      setIsLiked(result.isLiked);

      // Update course likes count
      setCourse((prev) => ({
        ...prev,
        likes_count: result.isLiked
          ? prev.likes_count + 1
          : prev.likes_count - 1,
      }));

      toast.success(result.isLiked ? "Course liked!" : "Course unliked!");
    } catch (error) {
      console.error("Error toggling course like:", error);
    }
  };

  const generateLessonSummary = async (lesson: any) => {
    try {
      setLoadingSummary(true);
      const summary = await geminiAPI.generateLessonSummary(
        lesson.title,
        lesson.content
      );
      setLessonSummary(summary);
    } catch (error) {
      console.error("Error generating lesson summary:", error);
      setLessonSummary(
        `In this lesson, you will learn about ${lesson.title}. This lesson covers the fundamental concepts and provides practical insights to help you understand the core principles and apply them effectively.`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading course content...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Course not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The course you're looking for doesn't exist or is not published.
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-200"
          >
            Explore Courses
          </button>
        </div>
      </div>
    );
  }

  const selectedLesson = lessons[selectedLessonIndex];
  const hasQuizQuestions =
    selectedLesson?.quiz_questions && selectedLesson.quiz_questions.length > 0;
  const hasVideos =
    selectedLesson?.video_data && selectedLesson.video_data.length > 0;
  const totalVideos = lessons.reduce(
    (sum, lesson) => sum + (lesson.video_data?.length || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => {
              const from = location.state?.from;
              if (from === "dashboard") {
                navigate("/dashboard");
              } else {
                navigate("/explore");
              }
            }}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>
              {location.state?.from === "dashboard"
                ? "Back to Dashboard"
                : "Back to Explore"}
            </span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft border border-gray-200 dark:border-gray-800">
          {/* Free Access Banner */}
          {course.is_published && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-4 mb-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Unlock className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Free Access for Everyone!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    This course is completely free and accessible to all users.
                    No login required to view content!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {course.description}
              </p>

              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>
                    {course.rating.toFixed(1)} ({course.ratings_count} ratings)
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Heart
                    className={`h-4 w-4 ${
                      isLiked ? "text-red-500 fill-red-500" : ""
                    }`}
                    onClick={handleLikeCourse}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{course.likes_count} likes</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.estimated_duration} minutes</span>
                </span>
                <span className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{lessons.length} lessons</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span>{totalVideos} videos</span>
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  {course.creator?.avatar_url ? (
                    <img
                      src={course.creator.avatar_url}
                      alt={course.creator.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    Created by {course.creator?.name || "Anonymous"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {[
            { id: "overview", label: "Course Overview", icon: BookOpen },
            { id: "lessons", label: "Lessons & Videos", icon: Play },
            { id: "quiz", label: "Interactive Quiz", icon: HelpCircle },
            {
              id: "comments",
              label: `Comments (${comments.length})`,
              icon: MessageCircle,
            },
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
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                  >
                    <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {lesson.title}
                        </h4>
                        {lesson.video_data && lesson.video_data.length > 0 && (
                          <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs">
                            <Youtube className="h-3 w-3" />
                            <span>{lesson.video_data.length} videos</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {lesson.video_data?.length || 0} videos •{" "}
                        {lesson.quiz_questions?.length || 0} quiz questions
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLessonIndex(index);
                        setActiveTab("lessons");
                      }}
                      className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200"
                    >
                      View Free
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "lessons" && (
            <div className="space-y-8">
              {/* Lesson Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {lessons.map((lesson, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedLessonIndex(index);
                      generateLessonSummary(lesson);
                    }}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                      selectedLessonIndex === index
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>Lesson {index + 1}</span>
                    {lesson.video_data && lesson.video_data.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Youtube className="h-3 w-3" />
                        <span className="text-xs">
                          ({lesson.video_data.length})
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Lesson Content */}
              {selectedLesson && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedLesson.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Youtube className="h-4 w-4 text-red-500" />
                        <span>
                          {selectedLesson.video_data?.length || 0} videos
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <HelpCircle className="h-4 w-4 text-green-500" />
                        <span>
                          {selectedLesson.quiz_questions?.length || 0} quiz
                          questions
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* AI-Generated Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <span>What You'll Learn</span>
                    </h4>
                    {loadingSummary ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Generating lesson summary with AI...
                        </span>
                      </div>
                    ) : lessonSummary ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {lessonSummary}
                        </p>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          In this lesson on {selectedLesson.title}, you will
                          learn key concepts and practical skills related to
                          this topic. You'll develop a thorough understanding of
                          important principles and learn how to apply them
                          effectively. By the end of this lesson, you'll have
                          gained valuable knowledge and be ready to confidently
                          move forward with your learning journey.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Real YouTube Videos */}
                  {hasVideos ? (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <span>
                          Free YouTube Videos (
                          {selectedLesson.video_data.length})
                        </span>
                      </h4>
                      <div className="grid gap-6">
                        {selectedLesson.video_data.map(
                          (video: any, videoIndex: number) => (
                            <VideoPlayer
                              key={`${selectedLesson.id}-video-${videoIndex}`}
                              video={video}
                            />
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        No Videos Available
                      </h4>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        This lesson doesn't have video content available.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "quiz" && (
            <div>
              {hasQuizQuestions ? (
                <InteractiveQuiz
                  questions={selectedLesson.quiz_questions}
                  title={`${selectedLesson.title} - Quiz`}
                  lessons={lessons}
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
                    Select a lesson with quiz questions to take an interactive
                    quiz.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {lessons.map(
                      (lesson, index) =>
                        lesson.quiz_questions &&
                        lesson.quiz_questions.length > 0 && (
                          <button
                            key={index}
                            onClick={() => setSelectedLessonIndex(index)}
                            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200"
                          >
                            Lesson {index + 1} Quiz
                          </button>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Comments ({comments.length}) - Open to Everyone
              </h3>

              {/* Add Comment */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Add a comment
                </h4>
                <div className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this course..."
                    rows={3}
                    disabled={submittingComment}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                  />
                  <div className="flex justify-end">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setNewComment("")}
                        disabled={!newComment.trim() || submittingComment}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || submittingComment}
                        className="flex items-center space-x-2 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Send className="h-4 w-4" />
                        <span>
                          {submittingComment ? "Posting..." : "Post Comment"}
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      No comments yet
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Be the first to share your thoughts about this course!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start space-x-4">
                        {comment.user && comment.user.avatar_url ? (
                          <img
                            src={comment.user.avatar_url}
                            alt={comment.user.name || "Anonymous"}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.user?.name || "Anonymous"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(
                                comment.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {comment.content}
                          </p>
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-200">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{comment.likes_count || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
