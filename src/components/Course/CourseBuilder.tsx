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
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Course Builder</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Course Topic
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Teach me JavaScript from basics to advanced..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isGenerating}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                {isGenerating ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need inspiration? Try these examples:</h3>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPrompt(example)}
                  className="px-3 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-lg text-sm hover:from-purple-200 hover:to-blue-200 transition-all"
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
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="h-8 w-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating your course...</h3>
              <p className="text-gray-600">Our AI is creating structured lessons, quizzes, and resources for you.</p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{generatedCourse.course.title}</h2>
            <p className="text-gray-600 mb-4">{generatedCourse.course.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
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
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Course Outline</h3>
            {generatedCourse.lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {lesson.type === 'video' && <Video className="h-4 w-4 text-purple-600" />}
                      {lesson.type === 'article' && <FileText className="h-4 w-4 text-blue-600" />}
                      {lesson.type === 'quiz' && <HelpCircle className="h-4 w-4 text-green-600" />}
                      {lesson.type === 'code' && <BookOpen className="h-4 w-4 text-orange-600" />}
                      <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm">{lesson.content.slice(0, 100)}...</p>
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
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Create Course
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGeneratedCourse(null)}
              className="px-6 py-3 bg-white/60 backdrop-blur-sm text-gray-700 rounded-lg font-semibold hover:bg-white/80 transition-all border border-white/20"
            >
              Generate New
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};