import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Star, Zap, Brain, Code, Play } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  const features = [
    {
      icon: Brain,
      title: 'AI Course Generation',
      description: 'Transform simple prompts into comprehensive courses with structured lessons, videos, and quizzes.'
    },
    {
      icon: Code,
      title: 'Interactive Content',
      description: 'Create engaging content with code examples, quizzes, and hands-on exercises.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Share your courses with the community and get feedback through ratings and comments.'
    },
    {
      icon: Zap,
      title: 'Instant Publishing',
      description: 'Publish your courses instantly and make them available to learners worldwide.'
    }
  ];

  const stats = [
    { label: 'Courses Created', value: '10,000+' },
    { label: 'Active Learners', value: '50,000+' },
    { label: 'AI Generations', value: '1M+' },
    { label: 'Community Rating', value: '4.9/5' }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create Courses
              </span>
              <br />
              <span className="text-gray-900">with AI Magic</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              Transform simple prompts into comprehensive learning experiences. 
              Our AI creates structured courses with videos, quizzes, and resources in minutes.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              {user ? (
                <Link
                  to="/create"
                  className="group inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="group inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <Link
                to="/explore"
                className="inline-flex items-center justify-center space-x-2 bg-white/60 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/80 transition-all duration-200 border border-white/20 shadow-lg"
              >
                <BookOpen className="h-5 w-5" />
                <span>Explore Courses</span>
              </Link>
            </div>
          </motion.div>

          {/* Demo Video Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16"
          >
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-12 space-y-4">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Watch CourseAI in Action</h3>
                    <p className="text-gray-600">See how easy it is to create professional courses with AI</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to create
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> amazing courses</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to help educators and creators build engaging learning experiences
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
              >
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 lg:p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to revolutionize learning?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of educators and creators who are already using CourseAI to build amazing learning experiences.
            </p>
            
            {user ? (
              <Link
                to="/create"
                className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
              >
                <span>Create Your First Course</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
              >
                <span>Start Creating Today</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};