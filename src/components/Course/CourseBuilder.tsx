import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader, Sparkles, BookOpen, Video, FileText, HelpCircle } from 'lucide-react';
import { generateCourseWithAI, createCourse } from '../../services/courseService';
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
  } | null>(null);
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
      
      // TODO: Save lessons to database
      // For now, we'll navigate to the course editor
      navigate(`/course/${course.id}/edit`);
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const examplePrompts = [
    "Teach me Python programming from scratch",
    "Learn React.js and build modern web apps",
    "Master data structures and algorithms",
    "Complete guide to machine learning",
    "Web design with HTML, CSS, and JavaScript"
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Sparkles className="h-8 w-8 text-brand-600 dark:text-brand-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">AI Course Builder</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Describe what you want to teach, and our AI will create a comprehensive course with lessons, 
          videos, quizzes, and resources.
        </p>
      </motion.div>

      {!generatedCourse ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-200 dark:border-gray-800">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Topic
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Teach me JavaScript from basics to advanced..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={isGenerating}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="absolute bottom-3 right-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg"
              >
                {isGenerating ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Need inspiration? Try these examples:</h3>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPrompt(example)}
                  className="px-3 py-2 bg-gradient-to-r from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 text-brand-700 dark:text-brand-300 rounded-xl text-sm hover:from-brand-200 hover:to-accent-200 dark:hover:from-brand-800/50 dark:hover:to-accent-800/50 transition-all duration-200"
                >
                  {example}
                </motion.button>
              ))}
            </div>
          </div>

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="h-8 w-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Generating your course...</h3>
              <p className="text-gray-600 dark:text-gray-400">Our AI is creating structured lessons, quizzes, and resources for you.</p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{generatedCourse.course.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{generatedCourse.course.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{generatedCourse.lessons.length} lessons</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="capitalize">{generatedCourse.course.difficulty}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>{generatedCourse.course.estimated_duration} min</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {generatedCourse.course.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Course Outline</h3>
            {generatedCourse.lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-soft border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {lesson.type === 'video' && <Video className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {lesson.type === 'article' && <FileText className="h-4 w-4 text-accent-600 dark:text-accent-400" />}
                      {lesson.type === 'quiz' && <HelpCircle className="h-4 w-4 text-success-600 dark:text-success-400" />}
                      {lesson.type === 'code' && <BookOpen className="h-4 w-4 text-warning-600 dark:text-warning-400" />}
                      <h4 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{lesson.content.slice(0, 100)}...</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex space-x-4 pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateCourse}
              className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Course
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGeneratedCourse(null)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              Generate New
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};