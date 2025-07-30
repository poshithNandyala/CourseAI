import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  Eye,
  EyeOff,
} from "lucide-react";
import { fetchCourseById, publishCourse, unpublishCourse } from "../../services/courseService";
import { useAuthStore } from "../../store/authStore";
import { VideoPlayer } from "./VideoPlayer";
import { InteractiveQuiz } from "../Quiz/InteractiveQuiz";
import { CourseRating } from "./CourseRating";
import { submitCourseRating, getUserCourseRating } from "../../services/ratingService";
import { getCourseDurationStats } from "../../utils/durationCalculator";
import toast from "react-hot-toast";

export const CourseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "quiz">(
    "overview"
  );
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [isOwner, setIsOwner] = useState(false);
  const [durationStats, setDurationStats] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to view course content");
      navigate("/signin");
      return;
    }

    if (!id) {
      toast.error("Course not found");
      navigate("/dashboard");
      return;
    }

    loadCourse();
  }, [id, user]);

  const handleRatingSubmit = async (rating: number) => {
    if (!id) return;
    
    try {
      const response = await submitCourseRating(id, rating);
      setUserRating(rating);
      
      // Update course rating in local state
      if (course) {
        setCourse({
          ...course,
          rating: response.data.courseStats.averageRating,
          ratings_count: response.data.courseStats.totalRatings
        });
      }
      
      toast.success("Rating submitted successfully!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
      throw error;
    }
  };

  const handlePublishToggle = async () => {
    if (!id || !course) return;
    
    try {
      if (course.is_published) {
        await unpublishCourse(id);
        setCourse({ ...course, is_published: false });
        toast.success("Course unpublished successfully!");
      } else {
        await publishCourse(id);
        setCourse({ ...course, is_published: true });
        toast.success("Course published successfully! It is now visible to others.");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update course status");
    }
  };

  const loadCourse = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Check if course data was passed via navigation state
      const courseData = location.state?.courseData;
      if (courseData) {
        console.log("📖 Using course data from navigation state");
        setCourse(courseData.course);
        setLessons(courseData.lessons);
        
        // Calculate exact duration from video data
        const stats = getCourseDurationStats(courseData.lessons);
        setDurationStats(stats);
        
        // Load user's rating if authenticated
        if (user) {
          try {
            const rating = await getUserCourseRating(id);
            setUserRating(rating || undefined);
          } catch (error) {
            // User hasn't rated this course yet
            setUserRating(undefined);
          }
        }
        
        setLoading(false);
        return;
      }

      // Determine if ownerMode is set in query params
      const params = new URLSearchParams(location.search);
      const ownerMode = params.get("ownerMode") === "1";
      console.log(
        "📖 Fetching course with video data from database (ownerMode:",
        ownerMode,
        ")"
      );
      setIsOwner(ownerMode);
      const fetchedCourse = await fetchCourseById(id, ownerMode);
      if (fetchedCourse) {
        console.log(
          "✅ Course loaded with",
          fetchedCourse.lessons.length,
          "lessons"
        );
        console.log(
          "🎥 Video data loaded:",
          fetchedCourse.lessons.map((l) => ({
            title: l.title,
            videoCount: l.video_data?.length || 0,
          }))
        );
        setCourse(fetchedCourse.course);
        setLessons(fetchedCourse.lessons);
        
        // Calculate exact duration from video data
        const stats = getCourseDurationStats(fetchedCourse.lessons);
        setDurationStats(stats);
        
        // Load user's rating if authenticated
        if (user) {
          try {
            const rating = await getUserCourseRating(id);
            setUserRating(rating || undefined);
          } catch (error) {
            // User hasn't rated this course yet
            setUserRating(undefined);
          }
        }
      } else {
        toast.error("Course not found or you don't have access to it");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error loading course:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading course content with videos...
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
            The course you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-200"
          >
            Back to Dashboard
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

  console.log("🎬 Current lesson video status:", {
    lessonTitle: selectedLesson?.title,
    hasVideos,
    videoCount: selectedLesson?.video_data?.length || 0,
    firstVideoTitle: selectedLesson?.video_data?.[0]?.title,
  });

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
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to My Courses</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft border border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {course.description}
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{course.rating.toFixed(1)} ({course.ratings_count} ratings)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.likes_count} likes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {durationStats ? (
                        <>
                          {durationStats.formattedDuration}
                          {durationStats.totalMinutes !== course.estimated_duration && (
                            <span className="text-xs text-gray-400 ml-1">
                              (est: {course.estimated_duration}m)
                            </span>
                          )}
                        </>
                      ) : (
                        `${course.estimated_duration} minutes`
                      )}
                    </span>
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

                {/* Course Rating Component */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <CourseRating
                    courseId={course.id}
                    currentRating={course.rating}
                    ratingsCount={course.ratings_count}
                    userRating={user ? userRating : undefined}
                    onRatingSubmit={handleRatingSubmit}
                    isLoggedIn={!!user}
                  />
                </div>
              </div>
            </div>

            <div className="ml-6 flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.is_published
                    ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400"
                    : "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400"
                }`}
              >
                {course.is_published ? "Published" : "Draft"}
              </span>

              {/* Publish/Unpublish Button for Course Owners */}
              {isOwner && (
                <button
                  onClick={handlePublishToggle}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    course.is_published
                      ? "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 hover:bg-warning-200 dark:hover:bg-warning-800/50"
                      : "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 hover:bg-success-200 dark:hover:bg-success-800/50"
                  }`}
                >
                  {course.is_published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span>
                    {course.is_published ? "Unpublish" : "Publish"}
                  </span>
                </button>
              )}
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
              {/* Course Summary */}
              {course?.summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Course Overview
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {course.summary}
                  </p>
                </div>
              )}

              {/* Duration Statistics */}


              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Course Structure
              </h3>

              {/* Video Status Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Youtube className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Video Content Status
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This course contains {totalVideos} real YouTube videos
                      across {lessons.length} lessons
                    </p>
                  </div>
                </div>
              </div>

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
                      View
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
                    onClick={() => setSelectedLessonIndex(index)}
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

                  {/* Lesson Content */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <div className="prose dark:prose-invert max-w-none">
                      {selectedLesson.content.split("\n").map((line: string, index: number) => {
                        if (line.startsWith("# ")) {
                          return (
                            <h1 key={index} className="text-2xl font-bold mb-4">
                              {line.substring(2)}
                            </h1>
                          );
                        } else if (line.startsWith("## ")) {
                          return (
                            <h2
                              key={index}
                              className="text-xl font-semibold mb-3"
                            >
                              {line.substring(3)}
                            </h2>
                          );
                        } else if (line.startsWith("### ")) {
                          return (
                            <h3
                              key={index}
                              className="text-lg font-medium mb-2"
                            >
                              {line.substring(4)}
                            </h3>
                          );
                        } else if (line.startsWith("- ")) {
                          return (
                            <ul key={index}>
                              <li className="ml-4">
                                {line.substring(2)}
                              </li>
                            </ul>
                          );
                        } else if (line.trim()) {
                          return (
                            <p key={index} className="mb-3">
                              {line}
                            </p>
                          );
                        }
                        return <br key={index} />;
                      })}
                    </div>
                  </div>

                  {/* Real YouTube Videos */}
                  {hasVideos ? (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <span>
                          Real YouTube Videos (
                          {selectedLesson.video_data.length})
                        </span>
                      </h4>
                      <div className="grid gap-6">
                        {selectedLesson.video_data.map((video: any, videoIndex: number) => (
                          <VideoPlayer
                            key={`${selectedLesson.id}-video-${videoIndex}`}
                            video={video}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        No Videos Available
                      </h4>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        No video content was found for this lesson. This might
                        be due to:
                      </p>
                      <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 space-y-1">
                        <li>
                          • Video data not properly stored during course
                          generation
                        </li>
                        <li>
                          • YouTube API limitations during content creation
                        </li>
                        <li>• This lesson was created without video content</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-8">
              {/* Lesson Selector for Quiz */}
              <div className="flex flex-wrap gap-2 mb-6">
                {lessons.map((lesson, index) => (
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
              </div>

              {/* Quiz Content */}
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
                    This lesson doesn't have quiz questions yet. Quiz questions might still be generating.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Try selecting another lesson or wait for quiz generation to complete.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
