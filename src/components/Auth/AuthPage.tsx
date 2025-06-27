import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Chrome, Brain, BookOpen, Users, Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, resetPassword } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmail(formData.email, formData.password);
        navigate('/dashboard');
      } else if (authMode === 'signup') {
        await signUpWithEmail(formData.email, formData.password, formData.name);
        // Don't navigate immediately for signup - user might need to confirm email
      } else if (authMode === 'reset') {
        await resetPassword(formData.email);
        setAuthMode('signin');
      }
    } catch (error) {
      console.error('Email auth failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle({
        options: {
          redirectTo: 'https://course-ai-nu.vercel.app/auth/callback',
        },
      });
      // User will be redirected to Google, then back to dashboard
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
      // User will be redirected to GitHub, then back to dashboard
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {authMode === 'signin' && 'Welcome Back'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'reset' && 'Reset Password'}
              </h3>
              <p className="text-gray-600">
                {authMode === 'signin' && 'Sign in to continue creating amazing courses'}
                {authMode === 'signup' && 'Join thousands of educators and creators'}
                {authMode === 'reset' && 'Enter your email to reset your password'}
              </p>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {authMode !== 'reset' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Please wait...</span>
                  </div>
                ) : (
                  <>
                    {authMode === 'signin' && 'Sign In'}
                    {authMode === 'signup' && 'Create Account'}
                    {authMode === 'reset' && 'Send Reset Email'}
                  </>
                )}
              </motion.button>
            </form>

            {/* Auth Mode Switcher */}
            <div className="text-center text-sm">
              {authMode === 'signin' && (
                <div className="space-y-2">
                  <button
                    onClick={() => setAuthMode('reset')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Forgot your password?
                  </button>
                  <div>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Sign in
                  </button>
                </div>
              )}
              {authMode === 'reset' && (
                <div>
                  Remember your password?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>

            {authMode !== 'reset' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
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
              </>
            )}

            <div className="text-center text-sm text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};