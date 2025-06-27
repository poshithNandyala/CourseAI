import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Github, 
  Chrome, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Brain,
  Sparkles,
  BookOpen,
  Users,
  Zap
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithGitHub, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPassword 
} from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';

type AuthMode = 'signin' | 'signup' | 'reset';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
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
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error('GitHub sign-in failed:', error);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      description: 'Transform ideas into structured courses instantly'
    },
    {
      icon: Sparkles,
      title: 'Smart Content Creation',
      description: 'Videos, quizzes, and interactive elements'
    },
    {
      icon: Users,
      title: 'Community Learning',
      description: 'Share and collaborate with educators'
    },
    {
      icon: Zap,
      title: 'Instant Publishing',
      description: 'Reach learners worldwide immediately'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-brand-500 to-accent-500 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200"
            >
              <Brain className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              CourseAI
            </span>
          </Link>
          
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-screen px-4 pt-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                  Welcome to the Future of
                  <span className="block bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                    Course Creation
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Join thousands of educators using AI to create engaging, comprehensive learning experiences in minutes, not hours.
                </p>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="group"
                >
                  <div className="flex items-start space-x-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-soft transition-all duration-200">
                    <div className="bg-gradient-to-r from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <feature.icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {authMode === 'signin' && 'Welcome Back'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'reset' && 'Reset Password'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {authMode === 'signin' && 'Sign in to continue your learning journey'}
                  {authMode === 'signup' && 'Join the community of innovative educators'}
                  {authMode === 'reset' && 'Enter your email to reset your password'}
                </p>
              </div>

              {/* Social Auth Buttons */}
              {authMode !== 'reset' && (
                <div className="space-y-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-6 py-3.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow-soft font-medium"
                  >
                    <Chrome className="h-5 w-5" />
                    <span>Continue with Google</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGitHubSignIn}
                    className="w-full flex items-center justify-center space-x-3 bg-gray-900 dark:bg-gray-800 text-white rounded-xl px-6 py-3.5 hover:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-soft font-medium border border-gray-900 dark:border-gray-700"
                  >
                    <Github className="h-5 w-5" />
                    <span>Continue with GitHub</span>
                  </motion.button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {authMode !== 'reset' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-12 py-3.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
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
                  className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-3.5 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
              <div className="mt-6 text-center text-sm">
                {authMode === 'signin' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setAuthMode('reset')}
                      className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors duration-200"
                    >
                      Forgot your password?
                    </button>
                    <div className="text-gray-600 dark:text-gray-400">
                      Don't have an account?{' '}
                      <button
                        onClick={() => setAuthMode('signup')}
                        className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors duration-200"
                      >
                        Sign up
                      </button>
                    </div>
                  </div>
                )}
                {authMode === 'signup' && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => setAuthMode('signin')}
                      className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors duration-200"
                    >
                      Sign in
                    </button>
                  </div>
                )}
                {authMode === 'reset' && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Remember your password?{' '}
                    <button
                      onClick={() => setAuthMode('signin')}
                      className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors duration-200"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="text-brand-600 dark:text-brand-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};