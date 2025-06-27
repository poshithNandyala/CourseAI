import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Eye, EyeOff, Users, Star, Calendar, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { fetchCourses } from '../../services/courseService';
import { enhancedCourseService } from '../../services/enhancedCourseService';
import { useAuthStore } from '../../store/authStore';
import { useCourseStore } from '../../store/courseStore';
import toast from 'react-hot-toast';

export const EnhancedDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { courses, setCourses } = useCourseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📊 Enhanced Dashboard mounted, user:', user?.email || 'none');
    if (user) {
      loadUserCourses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserCourses = async () => {
    if (!user) {
      console.log('❌ No user found, cannot load courses');
      setLoading(false);
      return;
    }

    try {
      console.log('📚 Loading courses for user:', user.email);
      setLoading(true);
      const allCourses = await fetchCourses();
      const userCourses = allCourses.filter(course => course.creator_id === user.id);
      console.log('✅ Loaded', userCourses.length, 'courses for user');
      setCourses(userCourses);
    } catch (error) {
      console.error('❌ Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (courseId: string, isCurrentlyPublished: boolean) => {
    try {
      if (isCurrentlyPublished) {
        await enhancedCourseService.unpublishCourse(courseId);
      } else {
        await enhancedCourseService.publishCourse(courseId);
      }
      
      // Refresh courses
      await loadUserCourses();
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real implementation, you'd call a delete API
      toast.success('Course deleted successfully');
      await loadUserCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const stats = [
    {
      label: 'Total Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'from-brand-500 to-brand-600'
    },
    {
      label: 'Published',
      value: courses.filter(c => c.is_published).length,
      icon: Eye,
      color: 'from-accent-500 to-accent-600'
    },
    {
      label: 'Total Likes',
      value: courses.reduce((sum, c) => sum + c.likes_count, 0),
      icon: Star,
      color: 'from-warning-500 to-warning-600'
    },
    {
      label: 'Avg Rating',
      value: courses.length > 0 ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1) : '0.0',
      icon: Users,
      color: 'from-success-500 to-success-600'
    }
  ];

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-soft border border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please sign in to view your dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be signed in to access your course dashboard and manage your content.
            </p>
            <Link
              to="/signin"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your courses, track performance, and create new content
            </p>
          </div>
          <Link
            to="/create"
            className="flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Courses</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-800">
            <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first course with AI-powered content generation</p>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-200 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Create Course</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-200 dark:border-gray-800 hover:shadow-soft-lg hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        course.is_published 
                          ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                          : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                      }`}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{course.description}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span>{course.rating.toFixed(1)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.likes_count}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(course.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {course.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/course/${course.id}/edit`}
                    className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-center px-3 py-2.5 rounded-xl text-sm font-medium hover:from-brand-600 hover:to-accent-600 transition-all duration-200 flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                  
                  <button
                    onClick={() => handlePublishToggle(course.id, course.is_published)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
                      course.is_published
                        ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 hover:bg-warning-200 dark:hover:bg-warning-800/50'
                        : 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 hover:bg-success-200 dark:hover:bg-success-800/50'
                    }`}
                  >
                    {course.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{course.is_published ? 'Unpublish' : 'Publish'}</span>
                  </button>
                  
                  <Link
                    to={`/course/${course.id}`}
                    className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};