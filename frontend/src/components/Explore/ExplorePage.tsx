import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Clock, BookOpen, Play, Heart, X } from 'lucide-react';
import { fetchPublishedCourses, toggleCourseLike, fetchUserLikedCourses } from '../../services/courseService';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCourseStore } from '../../store/courseStore';
import { Course } from '../../types';
import toast from 'react-hot-toast';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { publishedCourses, setPublishedCourses, lastPublishUpdate } = useCourseStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [likedCourses, setLikedCourses] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    minLikes: 0,
    sortBy: 'newest' as 'newest' | 'oldest' | 'rating' | 'likes' | 'duration'
  });

  const loadUserLikedCourses = async () => {
    if (!user) return;
    
    try {
      console.log('❤️ Loading user liked courses...');
      const likedCourseIds = await fetchUserLikedCourses();
      setLikedCourses(new Set(likedCourseIds));
      console.log('✅ Loaded user liked courses:', likedCourseIds.length);
    } catch (error) {
      console.error('❌ Error loading user liked courses:', error);
    }
  };

  const loadPublishedCourses = async () => {
    try {
      setLoading(true);
      console.log('🌍 Loading ALL published courses...');
      
      const result = await fetchPublishedCourses({
        search: searchTerm,
        difficulty: selectedDifficulty,
        page: 1,
        limit: 10000
      });
      
      console.log('✅ Loaded', result.courses.length, 'published courses');
      setPublishedCourses(result.courses);
      
    } catch (error) {
      console.error('❌ Error loading published courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedCourses();
    if (user) {
      loadUserLikedCourses();
    }
  }, [selectedDifficulty, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for publish/unpublish updates
  useEffect(() => {
    if (lastPublishUpdate > 0) {
      console.log('🔄 Detected course publish/unpublish update, refreshing...');
      loadPublishedCourses();
    }
  }, [lastPublishUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply filters when they change
  useEffect(() => {
    // No need to reload from server, just triggers re-filtering via filteredCourses
  }, [filters, searchTerm]);

  const handleSearch = () => {
    loadPublishedCourses();
  };

  const handleViewCourse = (courseId: string) => {
    console.log('🔗 Opening public course for ALL users:', courseId);
    navigate(`/course/${courseId}`, { state: { from: 'explore' } });
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
      const updatedCourses = publishedCourses.map((course: Course) => 
        course.id === courseId 
          ? { 
              ...course, 
              likes_count: result.isLiked 
                ? course.likes_count + 1 
                : course.likes_count - 1 
            }
          : course
      );
      setPublishedCourses(updatedCourses);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const filteredCourses = publishedCourses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = course.rating >= filters.minRating;
      const matchesLikes = course.likes_count >= filters.minLikes;
      
      return matchesSearch && matchesRating && matchesLikes;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'likes':
          return b.likes_count - a.likes_count;
        case 'duration':
          return a.estimated_duration - b.estimated_duration;
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'newest':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced', 'professional'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Explore <span className="text-blue-600 dark:text-blue-400">Courses</span>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 border border-gray-300 dark:border-gray-700 rounded-xl transition-colors ${
                  showFilters 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400' 
                    : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Filter courses"
              >
                <Filter className="h-5 w-5" />
              </button>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                title="Select difficulty level"
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

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rating Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Rating
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.minRating}
                      onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                      className="w-full"
                      aria-label="Minimum rating filter"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Any</span>
                      <span className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{filters.minRating}</span>
                      </span>
                      <span>5 stars</span>
                    </div>
                  </div>
                </div>

                {/* Likes Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Likes
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={filters.minLikes}
                      onChange={(e) => setFilters(prev => ({ ...prev, minLikes: Number(e.target.value) }))}
                      className="w-full"
                      aria-label="Minimum likes filter"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Any</span>
                      <span className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{filters.minLikes}</span>
                      </span>
                      <span>100+</span>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    aria-label="Sort courses by"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="likes">Most Liked</option>
                    <option value="duration">Shortest Duration</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ minRating: 0, minLikes: 0, sortBy: 'newest' })}
                  className="text-sm"
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleViewCourse(course.id)}
                className="cursor-pointer"
              >
                <Card hover className="h-full">
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
                        title={likedCourses.has(course.id) ? 'Unlike course' : 'Like course'}
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
                          <div className="h-6 w-6 bg-blue-600 rounded-full"></div>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {course.creator?.name || 'Anonymous'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        course.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        course.difficulty === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        course.difficulty === 'professional' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs"
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
        </>
      )}
    </div>
  );
};