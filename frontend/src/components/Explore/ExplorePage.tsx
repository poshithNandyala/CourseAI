import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Users, Clock, BookOpen, Play, Heart } from 'lucide-react';
import { fetchPublishedCourses, toggleCourseLike } from '../../services/courseService';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Course } from '../../types';
import toast from 'react-hot-toast';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [likedCourses, setLikedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPublishedCourses();
  }, [selectedDifficulty]);

  const loadPublishedCourses = async () => {
    try {
      setLoading(true);
      console.log('🌍 Loading ALL published courses for public access...');
      const result = await fetchPublishedCourses({
        search: searchTerm,
        difficulty: selectedDifficulty,
        page: 1,
        limit: 20
      });
      console.log('✅ Loaded', result.courses.length, 'published courses');
      setCourses(result.courses);
    } catch (error) {
      console.error('❌ Error loading published courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPublishedCourses();
  };

  const handleViewCourse = (courseId: string) => {
    console.log('🔗 Opening public course for ALL users:', courseId);
    navigate(`/course/${courseId}`);
  };

  const handleLikeCourse = async (courseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to like courses');
      navigate('/signin');
      return;
    }

    try {
      const result = await toggleCourseLike(courseId);
      
      if (result.isLiked) {
        setLikedCourses(prev => new Set([...prev, courseId]));
        toast.success('Course liked!');
      } else {
        setLikedCourses(prev => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
        toast.success('Course unliked!');
      }

      // Update the course in the list
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { 
              ...course, 
              likes_count: result.isLiked 
                ? course.likes_count + 1 
                : course.likes_count - 1 
            }
          : course
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Explore <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">Courses</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover amazing courses created by our community - accessible to everyone!
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleSearch} variant="primary">
              Search
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading published courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || selectedDifficulty !== 'all' ? 'No courses found' : 'No published courses available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedDifficulty !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Be the first to create and publish a course!'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full cursor-pointer" onClick={() => handleViewCourse(course.id)}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 flex-1">
                      {course.title}
                    </h3>
                    <button
                      onClick={(e) => handleLikeCourse(course.id, e)}
                      className={`ml-2 p-2 rounded-full transition-all duration-200 ${
                        likedCourses.has(course.id)
                          ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${likedCourses.has(course.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{course.rating.toFixed(1)} ({course.ratings_count})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{course.likes_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.estimated_duration}m</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {course.creator?.avatar_url ? (
                        <img
                          src={course.creator.avatar_url}
                          alt={course.creator.name}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"></div>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {course.creator?.name || 'Anonymous'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      course.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {course.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCourse(course.id);
                    }}
                    icon={<Play className="h-4 w-4" />}
                  >
                    View Course
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};