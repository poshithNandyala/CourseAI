import React from 'react';
import { motion } from 'framer-motion';
import { Github, Chrome, Brain, BookOpen, Users, Zap } from 'lucide-react';
import { signInWithGoogle, signInWithGitHub } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Note: User will be redirected to Google, then back to dashboard
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
      // Note: User will be redirected to GitHub, then back to dashboard
    } catch (error) {
      console.error('GitHub sign-in failed:', error);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Course Generation',
      description: 'Transform simple prompts into comprehensive, structured learning experiences'
    },
    {
      icon: BookOpen,
      title: 'Rich Content Creation',
      description: 'Create courses with videos, articles, quizzes, and interactive elements'
    },
    {
      icon: Users,
      title: 'Community Learning',
      description: 'Share, rate, and comment on courses to build a learning community'
    },
    {
      icon: Zap,
      title: 'Instant Publishing',
      description: 'Publish your courses instantly and reach learners worldwide'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CourseAI
              </h1>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Create Amazing Courses with AI
            </h2>
            <p className="text-xl text-gray-600">
              Transform your ideas into comprehensive learning experiences. Just describe what you want to teach, and let AI create structured courses with videos, quizzes, and resources.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-lg">
                  <feature.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
        >
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h3>
              <p className="text-gray-600">Sign in to start creating amazing courses</p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <Chrome className="h-5 w-5" />
                <span className="font-medium">Continue with Google</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGitHubSignIn}
                className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white rounded-lg px-6 py-3 hover:bg-gray-800 transition-all duration-200 shadow-sm"
              >
                <Github className="h-5 w-5" />
                <span className="font-medium">Continue with GitHub</span>
              </motion.button>
            </div>

            <div className="text-center text-sm text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};