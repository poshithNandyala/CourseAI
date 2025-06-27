import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Eye, Users, Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { fetchCourses } from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';
import { useCourseStore } from '../../store/courseStore';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { courses, setCourses } = useCourseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserCourses();
  }, [user]);

  const loadUserCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allCourses = await fetchCourses();
      const userCourses = allCourses.filter(course => course.creator_id === user.id);
      setCourses(userCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Published',
      value: courses.filter(c => c.is_published).length,
      icon: Eye,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Total Likes',
      value: courses.reduce((sum, c) => sum + c.likes_count, 0),
      icon: Star,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      label: 'Avg Rating',
      value: courses.length > 0 ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1) : '0.0',
      icon: Users,
      color: 'from-green-500 to-green-600'
    }
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your dashboard</h1>
        <Link
          to="/auth"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          <span>Sign In</span>
        </Link>
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">Manage your courses and track your progress</p>
          </div>
          <Link
            to="/create"
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
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
              className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg`}>
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
          <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">Create your first course to get started</p>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
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
                className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.is_published 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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

                <div className="flex space-x-2">
                  <Link
                    to={`/course/${course.id}/edit`}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center px-4 py-2 rounded-lg text-sm hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/course/${course.id}`}
                    className="flex-1 bg-white/60 backdrop-blur-sm text-gray-700 text-center px-4 py-2 rounded-lg text-sm hover:bg-white/80 transition-all border border-white/20"
                  >
                    View
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