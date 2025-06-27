import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader, Sparkles, BookOpen, Video, FileText, HelpCircle, Play, ExternalLink, Brain, CheckCircle, Clock, Target } from 'lucide-react';
import { generateCourseWithAI, createCourse } from '../../services/courseService';
import { GeneratedCourse } from '../../services/aiCourseGenerator';
import { Course, Lesson } from '../../types';
import { useCourseStore } from '../../store/courseStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const CourseBuilder: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<{
    course: Partial<Course>;
    lessons: Lesson[];
    generatedContent: GeneratedCourse;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'flashcards' | 'assignments'>('overview');
  const { addCourse } = useCourseStore();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a course topic');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCourseWithAI(prompt);
      setGeneratedCourse(result);
      toast.success('Course generated successfully!');
    } catch (error) {
      console.error('Error generating course:', error);
      toast.error('Failed to generate course. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!generatedCourse) return;

    try {
      const course = await createCourse(generatedCourse.course);
      addCourse(course);
      
      toast.success('Course created successfully!');
      navigate(`/dashboard`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const examplePrompts = [
    "Learn React.js from scratch with hooks and modern patterns",
    "Complete Python programming course for beginners",
    "Master JavaScript ES6+ features and async programming",
    "Data Science with Python - from basics to machine learning",
    "Web Development with HTML, CSS, and JavaScript",
    "Node.js backend development and API creation",
    "Introduction to Machine Learning and AI concepts",
    "CSS Grid and Flexbox for modern web layouts"
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      case 'code': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'article': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'quiz': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'code': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
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
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">AI Course Builder</h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Transform your ideas into comprehensive learning experiences. Our AI creates structured courses with 
          video resources, quizzes, flashcards, and practical assignments.
        </p>
      </motion.div>

      {!generatedCourse ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
            <label htmlFor="prompt" className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What would you like to teach?
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Complete React.js course with hooks, state management, and building real projects..."
                rows={4}
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-lg"
                disabled={isGenerating}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
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

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>Need inspiration? Try these examples:</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {examplePrompts.map((example, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPrompt(example)}
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
                <Brain className="h-10 w-10 text-white animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Creating your course...</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                Our AI is generating comprehensive lessons, quizzes, and resources for you.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                <span>This may take a few moments...</span>
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
                  {generatedCourse.generatedContent.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                  {generatedCourse.generatedContent.overview}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{generatedCourse.lessons.length} lessons</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{generatedCourse.course.estimated_duration} minutes</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span className="capitalize">{generatedCourse.course.difficulty}</span>
                  </span>
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

            <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-4 border border-brand-200 dark:border-brand-800">
              <h4 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">Target Audience</h4>
              <p className="text-brand-700 dark:text-brand-300">{generatedCourse.generatedContent.targetAudience}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              {[
                { id: 'overview', label: 'Course Overview', icon: BookOpen },
                { id: 'lessons', label: 'Lessons', icon: Play },
                { id: 'flashcards', label: 'Flashcards', icon: Brain },
                { id: 'assignments', label: 'Assignments', icon: Target }
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
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {lesson.content.slice(0, 100)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'lessons' && (
                <div className="space-y-6">
                  {generatedCourse.generatedContent.lessons.map((lesson, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{lesson.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">{lesson.objective}</p>
                        </div>
                      </div>

                      {lesson.videos.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Video Resources</h5>
                          <div className="space-y-3">
                            {lesson.videos.map((video, videoIndex) => (
                              <div key={videoIndex} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Play className="h-5 w-5 text-red-600" />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">{video.title}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{video.duration}</div>
                                </div>
                                <a
                                  href={video.url}
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

                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h5>
                        <p className="text-gray-600 dark:text-gray-400">{lesson.summary}</p>
                      </div>

                      {lesson.quiz.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Quiz Questions</h5>
                          <div className="space-y-3">
                            {lesson.quiz.map((question, qIndex) => (
                              <div key={qIndex} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="font-medium text-gray-900 dark:text-white mb-2">{question.question}</div>
                                <div className="space-y-1">
                                  {question.options.map((option, oIndex) => (
                                    <div
                                      key={oIndex}
                                      className={`text-sm p-2 rounded ${
                                        oIndex === question.correctAnswer
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                          : 'text-gray-600 dark:text-gray-400'
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

              {activeTab === 'flashcards' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Study Flashcards</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {generatedCourse.generatedContent.flashcards.map((flashcard, index) => (
                      <div key={index} className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-6 border border-brand-200 dark:border-brand-800">
                        <div className="mb-3">
                          <div className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-1">Question</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{flashcard.front}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-accent-600 dark:text-accent-400 mb-1">Answer</div>
                          <div className="text-gray-700 dark:text-gray-300">{flashcard.back}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Practical Assignments</h3>
                  {generatedCourse.generatedContent.practicalAssignments.map((assignment, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{assignment.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          assignment.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          assignment.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {assignment.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{assignment.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h5>
                          <ul className="space-y-1">
                            {assignment.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Deliverables</h5>
                          <ul className="space-y-1">
                            {assignment.deliverables.map((deliverable, delIndex) => (
                              <li key={delIndex} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <Target className="h-4 w-4 text-brand-500" />
                                <span>{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Estimated time: {assignment.estimatedTime}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateCourse}
              className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              Create Course
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