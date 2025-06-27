import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Youtube,
  FileText,
  HelpCircle
} from 'lucide-react';
import { courseManagementService, CourseWithLessons } from '../../services/courseManagementService';
import { useAuthStore } from '../../store/authStore';
import { VideoPlayer } from './VideoPlayer';
import { InteractiveQuiz } from '../Quiz/InteractiveQuiz';
import toast from 'react-hot-toast';

export const CourseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'quiz'>('overview');
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to view course content');
      navigate('/signin');
      return;
    }

    if (!id) {
      toast.error('Course not found');
      navigate('/dashboard');
      return;
    }

    loadCourse();
  }, [id, user]);

  const loadCourse = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Check if course data was passed via navigation state
      const courseData = location.state?.courseData as CourseWithLessons;
      if (courseData) {
        console.log('📖 Using course data from navigation state');
        setCourse(courseData);
        setLoading(false);
        return;
      }

      // Otherwise fetch from database with video data
      console.log('📖 Fetching course with video data from database');
      const fetchedCourse = await courseManagementService.fetchCourseWithContent(id);
      if (fetchedCourse) {
        console.log('✅ Course loaded with', fetchedCourse.lessons.length, 'lessons');
        console.log('🎥 Video data available:', fetchedCourse.lessons.some(l => l.videos && l.videos.length > 0));
        setCourse(fetchedCourse);
      } else {
        toast.error('Course not found or you don\'t have access to it');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Course not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedLesson = course.lessons[selectedLessonIndex];
  const hasQuizQuestions = selectedLesson?.quiz_questions && selectedLesson.quiz_questions.length > 0;
  const hasVideos = selectedLesson?.videos && selectedLesson.videos.length > 0;

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
            onClick={() => navigate('/dashboard')}
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
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{course.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{course.likes_count} likes</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.estimated_duration} minutes</span>
                </span>
                <span className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessons.length} lessons</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span>{course.lessons.reduce((sum, lesson) => sum + (lesson.videos?.length || 0), 0)} videos</span>
                </span>
              </div>
            </div>
            
            <div className="ml-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                course.is_published 
                  ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                  : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
              }`}>
                {course.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {[
            { id: 'overview', label: 'Course Overview', icon: BookOpen },
            { id: 'lessons', label: 'Lessons & Videos', icon: Play },
            { id: 'quiz', label: 'Interactive Quiz', icon: HelpCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Course Structure</h3>
              <div className="grid gap-4">
                {course.lessons.map((lesson, index) => (
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
                        <h4 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h4>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {lesson.videos?.length || 0} videos • {lesson.quiz_questions?.length || 0} quiz questions
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLessonIndex(index);
                        setActiveTab('lessons');
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

          {activeTab === 'lessons' && (
            <div className="space-y-8">
              {/* Lesson Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {course.lessons.map((lesson, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedLessonIndex(index)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      selectedLessonIndex === index
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Lesson {index + 1}
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
                        <span>{selectedLesson.videos?.length || 0} videos</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <HelpCircle className="h-4 w-4 text-green-500" />
                        <span>{selectedLesson.quiz_questions?.length || 0} quiz questions</span>
                      </span>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <div className="prose dark:prose-invert max-w-none">
                      {selectedLesson.content.split('\n').map((line, index) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={index} className="text-2xl font-bold mb-4">{line.substring(2)}</h1>;
                        } else if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-xl font-semibold mb-3">{line.substring(3)}</h2>;
                        } else if (line.startsWith('### ')) {
                          return <h3 key={index} className="text-lg font-medium mb-2">{line.substring(4)}</h3>;
                        } else if (line.startsWith('- ')) {
                          return <li key={index} className="ml-4">{line.substring(2)}</li>;
                        } else if (line.trim()) {
                          return <p key={index} className="mb-3">{line}</p>;
                        }
                        return <br key={index} />;
                      })}
                    </div>
                  </div>

                  {/* Real YouTube Videos */}
                  {hasVideos && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <span>Real YouTube Videos ({selectedLesson.videos.length})</span>
                      </h4>
                      <div className="grid gap-6">
                        {selectedLesson.videos.map((video, videoIndex) => (
                          <VideoPlayer 
                            key={videoIndex} 
                            video={video}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Videos Message */}
                  {!hasVideos && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No videos available for this lesson
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div>
              {hasQuizQuestions ? (
                <InteractiveQuiz
                  questions={selectedLesson.quiz_questions!}
                  title={`${selectedLesson.title} - Quiz`}
                  onComplete={(score, total) => {
                    toast.success(`Quiz completed! You scored ${score}/${total} (${Math.round((score/total)*100)}%)`);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Quiz Available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select a lesson with quiz questions to take an interactive quiz.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {course.lessons.map((lesson, index) => (
                      lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
                        <button
                          key={index}
                          onClick={() => setSelectedLessonIndex(index)}
                          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200"
                        >
                          Lesson {index + 1} Quiz
                        </button>
                      )
                    ))}
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