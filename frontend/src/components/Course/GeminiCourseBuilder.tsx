import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Users,
  Star,
  Youtube,
  BookOpen,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Save
} from 'lucide-react';
import { geminiCourseService, GeminiCourseData } from '../../services/geminiCourseService';
import { courseManagementService } from '../../services/courseManagementService';
import { useCourseStore } from '../../store/courseStore';
import { useNavigate } from 'react-router-dom';
import { InteractiveQuiz } from '../Quiz/InteractiveQuiz';
import { VideoPlayer } from './VideoPlayer';
import toast from 'react-hot-toast';

export const GeminiCourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeminiCourseData | null>(null);
  const [savedCourse, setSavedCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'quiz' | 'settings'>('overview');
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [courseSettings, setCourseSettings] = useState({
    maxVideosPerSubtopic: 3,
    includeQuizzes: true
  });
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { addCourse } = useCourseStore();

  const generationSteps = [
    'Checking YouTube API connection...',
    'Analyzing your course request with Gemini AI...',
    'Extracting main topic and subtopics...',
    'Generating detailed course structure...',
    'Searching YouTube for relevant educational videos...',
    'Evaluating video quality and relevance...',
    'Creating interactive quiz questions...',
    'Finalizing course content and structure...',
    'Automatically saving course to your library...'
  ];

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      toast.error('Please describe the course you want to create');
      return;
    }

    // Check if YouTube API key is configured
    const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      toast.error('YouTube API key is required. Please add VITE_YOUTUBE_API_KEY to your .env file');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);
    setGenerationProgress(generationSteps[0]);
    
    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setCurrentStep(prev => {
          const next = Math.min(prev + 1, generationSteps.length - 1);
          setGenerationProgress(generationSteps[next]);
          return next;
        });
      }, 3000);

      // Generate course with Gemini AI
      const result = await geminiCourseService.generateCourseWithGemini(userPrompt, {
        maxVideosPerSubtopic: courseSettings.maxVideosPerSubtopic,
        includeQuizzes: courseSettings.includeQuizzes
      });

      clearInterval(progressInterval);
      setGeneratedCourse(result);

      // Automatically save the course
      setGenerationProgress('Automatically saving course to your library...');
      const savedCourseData = await courseManagementService.autoSaveCourse(result);
      setSavedCourse(savedCourseData);
      addCourse(savedCourseData);

      setGenerationProgress('');
      setCurrentStep(0);
      
      toast.success(`🎉 Course generated and saved! Found ${result.metadata.videoCount} real YouTube videos across ${result.metadata.subtopicsCount} topics.`);
      
    } catch (error) {
      console.error('Error generating course:', error);
      setGenerationProgress('');
      setCurrentStep(0);
      toast.error('Failed to generate course. Please check your API keys and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!savedCourse) {
      toast.error('Course must be saved before publishing');
      return;
    }

    try {
      await courseManagementService.publishCourse(savedCourse.id);
      setSavedCourse(prev => ({ ...prev, is_published: true }));
      toast.success('Course published! Others can now discover it.');
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to publish course');
    }
  };

  const handleGoToExplore = () => {
    navigate('/explore');
  };

  const examplePrompts = [
    "Psychology - Introduction to Human Behavior and Mental Processes",
    "Machine Learning for Beginners - From Theory to Practice",
    "Digital Marketing Strategy - Social Media to SEO",
    "Web Development with React - Modern Frontend Development",
    "Data Science with Python - Analytics and Visualization",
    "Graphic Design Fundamentals - Typography to Color Theory",
    "Financial Planning and Investment - Personal Finance Management",
    "Creative Writing Techniques - Storytelling and Character Development"
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'article': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'quiz': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
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
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 p-3 rounded-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            AI Course Builder
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Create professional courses with <strong>AI intelligence</strong> and <strong>real YouTube videos</strong>. 
          Your courses are automatically saved to your library.
        </p>
        
        {/* API Status Indicators */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Youtube className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {import.meta.env.VITE_YOUTUBE_API_KEY ? 'YouTube API Connected' : 'YouTube API Required'}
            </span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-700 dark:text-purple-300">
              {import.meta.env.VITE_GEMINI_API_KEY ? 'Gemini AI Connected' : 'Gemini AI Optional'}
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
          {/* API Key Warning */}
          {!import.meta.env.VITE_YOUTUBE_API_KEY && (
            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-warning-800 dark:text-warning-200 mb-2">
                    YouTube API Key Required
                  </h3>
                  <p className="text-warning-700 dark:text-warning-300 mb-3">
                    To fetch real YouTube videos, you need to configure your YouTube API key:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-warning-600 dark:text-warning-400">
                    <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the YouTube Data API v3</li>
                    <li>Create credentials (API key)</li>
                    <li>Add <code className="bg-warning-200 dark:bg-warning-800 px-1 rounded">VITE_YOUTUBE_API_KEY=your_api_key</code> to your .env file</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Course Input */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
            <label htmlFor="prompt" className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                disabled={isGenerating || !userPrompt.trim() || !import.meta.env.VITE_YOUTUBE_API_KEY}
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
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Videos per Lesson
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={courseSettings.maxVideosPerSubtopic}
                  onChange={(e) => setCourseSettings(prev => ({ 
                    ...prev, 
                    maxVideosPerSubtopic: parseInt(e.target.value) || 3 
                  }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of YouTube videos to find for each lesson
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include Interactive Quizzes
                </label>
                <div className="flex items-center space-x-3 pt-3">
                  <button
                    onClick={() => setCourseSettings(prev => ({ ...prev, includeQuizzes: !prev.includeQuizzes }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      courseSettings.includeQuizzes ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        courseSettings.includeQuizzes ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-gray-700 dark:text-gray-300">
                    {courseSettings.includeQuizzes ? 'Yes' : 'No'}
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
              
              {/* Progress Steps */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                  {generationSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index <= currentStep 
                          ? 'bg-brand-500 scale-110' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Step {currentStep + 1} of {generationSteps.length}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                <span>This may take 2-3 minutes for quality content...</span>
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
                    <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                      <Save className="h-4 w-4" />
                      <span className="text-sm font-medium">Auto-Saved</span>
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
                    <div className="text-sm text-brand-700 dark:text-brand-300">Lessons</div>
                  </div>
                  <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                      {generatedCourse.metadata.videoCount}
                    </div>
                    <div className="text-sm text-accent-700 dark:text-accent-300">Real Videos</div>
                  </div>
                  <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                      {Math.floor(generatedCourse.metadata.totalDuration / 60)}h
                    </div>
                    <div className="text-sm text-success-700 dark:text-success-300">Duration</div>
                  </div>
                  <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                      {generatedCourse.metadata.quizCount}
                    </div>
                    <div className="text-sm text-warning-700 dark:text-warning-300">Quizzes</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {generatedCourse.metadata.subtopicsCount}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Topics</div>
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
                { id: 'overview', label: 'Course Overview', icon: BookOpen },
                { id: 'lessons', label: 'Lessons & Videos', icon: Play },
                { id: 'quiz', label: 'Interactive Quiz', icon: HelpCircle },
                { id: 'settings', label: 'Publish Settings', icon: Settings }
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
                            <div className={`p-1 rounded ${getTypeColor(lesson.type)}`}>
                              {getTypeIcon(lesson.type)}
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({lesson.estimatedDuration} min)
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {lesson.videos.length} real videos • {lesson.articles.length} articles • {lesson.quiz_questions?.length || 0} quiz questions
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'lessons' && (
                <div className="space-y-8">
                  {/* Lesson Selector */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {generatedCourse.lessons.map((lesson, index) => (
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
                  {generatedCourse.lessons[selectedLessonIndex] && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {generatedCourse.lessons[selectedLessonIndex].title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{generatedCourse.lessons[selectedLessonIndex].estimatedDuration} minutes</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Video className="h-4 w-4" />
                            <span>{generatedCourse.lessons[selectedLessonIndex].videos.length} real videos</span>
                          </span>
                        </div>
                      </div>

                      {/* Videos */}
                      {generatedCourse.lessons[selectedLessonIndex].videos.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                            <Youtube className="h-5 w-5 text-red-500" />
                            <span>Real YouTube Videos (AI Selected)</span>
                          </h4>
                          <div className="grid gap-6">
                            {generatedCourse.lessons[selectedLessonIndex].videos.map((video, videoIndex) => (
                              <VideoPlayer key={videoIndex} video={video} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'quiz' && (
                <div>
                  {generatedCourse.lessons[selectedLessonIndex]?.quiz_questions && 
                   generatedCourse.lessons[selectedLessonIndex].quiz_questions.length > 0 ? (
                    <InteractiveQuiz
                      questions={generatedCourse.lessons[selectedLessonIndex].quiz_questions}
                      title={`${generatedCourse.lessons[selectedLessonIndex].title} - Quiz`}
                      onComplete={(score, total) => {
                        toast.success(`Quiz completed! You scored ${score}/${total} (${Math.round((score/total)*100)}%)`);
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Quiz Available</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Select a lesson with quiz questions to take an interactive quiz.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Course Status</h3>
                  
                  {savedCourse && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                      <div className="flex items-start space-x-4">
                        <div className="bg-green-500 p-2 rounded-xl">
                          <Save className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Course Automatically Saved!</h4>
                          <p className="text-green-700 dark:text-green-300 mb-4">
                            Your course has been automatically saved to your library. You can now choose to publish it or keep it as a draft.
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>Status: {savedCourse.is_published ? 'Published' : 'Draft'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-6 border border-brand-200 dark:border-brand-800">
                    <div className="flex items-start space-x-4">
                      <div className="bg-brand-500 p-2 rounded-xl">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">Publish Your Course</h4>
                        <p className="text-brand-700 dark:text-brand-300 mb-4">
                          When you publish this course, it will be visible to all users in the course catalog. 
                          They can discover, enroll, and rate your course.
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-brand-600 dark:text-brand-400">
                          <Star className="h-4 w-4" />
                          <span>Course will appear in search results and recommendations</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Course Preview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Main Topic:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{generatedCourse.metadata.mainTopic}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Lessons:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{generatedCourse.lessons.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Real Video Content:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{generatedCourse.metadata.videoCount} videos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Interactive Quizzes:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{generatedCourse.metadata.quizCount} quizzes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Estimated Duration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Math.floor(generatedCourse.metadata.totalDuration / 60)}h {generatedCourse.metadata.totalDuration % 60}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{generatedCourse.metadata.difficulty}</span>
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
            
            {savedCourse && !savedCourse.is_published && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePublishCourse}
                className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Publish Course</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setGeneratedCourse(null);
                setSavedCourse(null);
                setUserPrompt('');
              }}
              className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 text-lg"
            >
              Create New Course
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};