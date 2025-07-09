

import { useAuthStore } from '../store/authStore';
import { geminiCourseService, GeminiCourseData } from './geminiCourseService';
import { supabaseYouTubeService, YouTubeVideo } from './supabaseYouTubeService';
import toast from 'react-hot-toast';

class CourseManagementService {
  private isSupabaseConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return url && 
           key && 
           url.includes('your_supabase_project_url') && 
           key.includes('your_supabase_anon_key') &&
           url.startsWith('http');
  }

  // Auto-save course during generation with proper video storage
  async autoSaveCourse(courseData)<Course> {
    const user = useAuthStore.getState().user;
    if (user) {
      throw new Error('User must be signed in to create courses');
    }

    console.log('💾 Auto-saving course with video data to Supabase...');
    console.log('🎥 Video data to save:', courseData.lessons.map(l => ({ 
      title.title, 
      videoCount.videos.length,
      firstVideo.videos[0]?.title 
    })));

    if (this.isSupabaseConfigured()) {
      // Demo mode - create mock course with video data
      const mockCourse = {
        id.random().toString(36).substr(2, 9),
        title.course.title || 'Untitled Course',
        description.course.description || 'No description',
        creator_id.id,
        creator: { name.name, avatar_url.avatar_url },
        is_published, // Always start
        difficulty.course.difficulty || 'beginner',
        estimated_duration.metadata.totalDuration,
        tags.course.tags || [],
        likes_count,
        rating,
        ratings_count,
        created_at Date().toISOString(),
        updated_at Date().toISOString(),
      };
      
      // Store course and lesson data with videos in localStorage for demo
      const courseWithLessons = {
        ...mockCourse,
        lessons.lessons.map(lesson => ({
          ...lesson,
          course_id.id,
          video_data.videos // Store complete video information
        }))
      };
      
      const existingCourses = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      existingCourses.unshift(courseWithLessons);
      localStorage.setItem('user_courses_with_videos', JSON.stringify(existingCourses));
      
      console.log('✅ Demo course saved with video data');
      toast.success('Course with video data automatically saved (Demo mode)');
      return mockCourse;
    }

    try {
      // Create course in database
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title.course.title,
          description.course.description,
          difficulty.course.difficulty,
          estimated_duration.metadata.totalDuration,
          tags.course.tags,
          creator_id.id,
          is_published // Always start
        })
        .select(`
          *,
          creator(name, avatar_url)
        `)
        .single();

      if (courseError) throw courseError;

      // Create lessons in database with ALL video information stored in video_data column
      const lessonsToInsert = courseData.lessons.map(lesson => {
        console.log(`📝 Preparing lesson "${lesson.title}" with ${lesson.videos.length} videos`);
        return {
          course_id.id,
          title.title,
          content.content,
          type.type,
          order.order,
          video_url.video_url,
          quiz_questions.quiz_questions,
          resources.resources,
          // CRITICAL complete video data in the video_data JSONB column
          video_data.videos.map(video => ({
            id.id,
            title.title,
            description.description,
            duration.duration,
            thumbnailUrl.thumbnailUrl,
            channelTitle.channelTitle,
            publishedAt.publishedAt,
            viewCount.viewCount,
            likeCount.likeCount,
            embedUrl.embedUrl,
            watchUrl.watchUrl,
            relevanceScore.relevanceScore
          }))
        };
      });

      console.log('📊 Inserting lessons with video data:', lessonsToInsert.map(l => ({
        title.title,
        videoCount.video_data.length
      })));

      const { error } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      console.log('✅ Course with video data auto-saved successfully to Supabase');
      toast.success('Course with video content automatically saved to your library');
      return course;

    } catch (error) {
      console.error('❌ Error auto-saving course with videos to Supabase:', error);
      toast.error('Failed to save course automatically');
      throw error;
    }
  }

  // Fetch user's courses (both published and unpublished)
  async fetchUserCourses()<Course[]> {
    const user = useAuthStore.getState().user;
    if (user) {
      console.log('❌ No user found, cannot fetch courses');
      return [];
    }

    console.log('📚 Fetching courses for user from Supabase:', user.email);

    if (this.isSupabaseConfigured()) {
      // Demo mode - get from localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courses = coursesWithVideos.map((courseData) => {
        const { lessons, ...course } = courseData;
        return course;
      });
      console.log('✅ Loaded', courses.length, 'courses from demo storage');
      return courses;
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          creator(name, avatar_url)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending });

      if (error) throw error;

      console.log('✅ Loaded', data?.length || 0, 'courses for user from Supabase');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user courses from Supabase:', error);
      return [];
    }
  }

  // Fetch course with all lessons and video content from Supabase
  async fetchCourseWithContent(courseId)<CourseWithLessons | null> {
    const user = useAuthStore.getState().user;
    if (user) {
      throw new Error('User must be signed in to view course content');
    }

    console.log('📖 Fetching course content with videos from database for:', courseId);

    if (this.isSupabaseConfigured()) {
      // Demo mode - get course with video data
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseData = coursesWithVideos.find((c) => c.id === courseId);
      if (courseData) {
        console.log('❌ Course not found in demo storage');
        return null;
      }

      // Return course with enhanced lessons containing video data
      const { lessons, ...course } = courseData;
      const enhancedLessons = lessons.map((lesson) => ({
        ...lesson,
        videos.video_data || [] // Restore video data
      }));

      console.log('✅ Retrieved course from demo storage with', enhancedLessons.length, 'lessons');
      console.log('🎥 Video data restored:', enhancedLessons.map(l => ({ title.title, videoCount.videos.length })));
      return { ...course, lessons };
    }

    try {
      // Fetch course from Supabase
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          creator(name, avatar_url)
        `)
        .eq('id', courseId)
        .eq('creator_id', user.id) // Ensure user owns the course
        .single();

      if (courseError) throw courseError;

      // Fetch lessons with video data from Supabase
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending });

      if (lessonsError) throw lessonsError;

      console.log('📊 Raw lessons from database:', lessons?.map(l => ({
        title.title,
        hasVideoData: l.video_data,
        videoDataType l.video_data,
        videoDataLength.isArray(l.video_data) ? l.video_data.length : 'not array'
      })));

      // Enhance lessons with video data from the video_data column
      const enhancedLessons = (lessons || []).map(lesson => {
        let videos = [];
        
        try {
          // Parse video data from JSONB column
          if (lesson.video_data && Array.isArray(lesson.video_data)) {
            videos = lesson.video_data.map((videoData) => ({
              id.id || '',
              title.title || 'Untitled Video',
              description.description || '',
              duration.duration || '0',
              thumbnailUrl.thumbnailUrl || '',
              channelTitle.channelTitle || '',
              publishedAt.publishedAt || '',
              viewCount.viewCount || 0,
              likeCount.likeCount || 0,
              embedUrl.embedUrl || '',
              watchUrl.watchUrl || '',
              relevanceScore.relevanceScore || 0
            }));
          }
        } catch (error) {
          console.error(`❌ Error parsing video data for lesson "${lesson.title}":`, error);
          videos = [];
        }

        console.log(`📹 Lesson "${lesson.title}" ${videos.length} videos`);
        
        return {
          ...lesson,
          videos
        };
      });

      const totalVideos = enhancedLessons.reduce((sum, lesson) => sum + lesson.videos.length, 0);
      console.log('✅ Fetched course from Supabase with', enhancedLessons.length, 'lessons and', totalVideos, 'total videos');
      
      return { ...course, lessons };

    } catch (error) {
      console.error('❌ Error fetching course content with videos from Supabase:', error);
      return null;
    }
  }

  // Publish course in Supabase
  async publishCourse(courseId)<void> {
    const user = useAuthStore.getState().user;
    if (user) {
      throw new Error('User must be signed in to publish courses');
    }

    console.log('📢 Publishing course in Supabase:', courseId);

    if (this.isSupabaseConfigured()) {
      // Demo mode - update localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseIndex = coursesWithVideos.findIndex((c) => c.id === courseId);
      if (courseIndex == -1) {
        coursesWithVideos[courseIndex].is_published = true;
        coursesWithVideos[courseIndex].updated_at = new Date().toISOString();
        localStorage.setItem('user_courses_with_videos', JSON.stringify(coursesWithVideos));
      }
      
      toast.success('Course published successfully (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published,
          updated_at Date().toISOString()
        })
        .eq('id', courseId)
        .eq('creator_id', user.id); // Ensure user owns the course

      if (error) throw error;
      
      console.log('✅ Course published successfully in Supabase');
      toast.success('Course published It\'s now discoverable by other users.');
    } catch (error) {
      console.error('❌ Error publishing course in Supabase:', error);
      toast.error('Failed to publish course');
      throw error;
    }
  }

  // Unpublish course in Supabase
  async unpublishCourse(courseId)<void> {
    const user = useAuthStore.getState().user;
    if (user) {
      throw new Error('User must be signed in to unpublish courses');
    }

    console.log('📝 Unpublishing course in Supabase:', courseId);

    if (this.isSupabaseConfigured()) {
      // Demo mode - update localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseIndex = coursesWithVideos.findIndex((c) => c.id === courseId);
      if (courseIndex == -1) {
        coursesWithVideos[courseIndex].is_published = false;
        coursesWithVideos[courseIndex].updated_at = new Date().toISOString();
        localStorage.setItem('user_courses_with_videos', JSON.stringify(coursesWithVideos));
      }
      
      toast.success('Course unpublished successfully (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published,
          updated_at Date().toISOString()
        })
        .eq('id', courseId)
        .eq('creator_id', user.id); // Ensure user owns the course

      if (error) throw error;
      
      console.log('✅ Course unpublished successfully in Supabase');
      toast.success('Course unpublished successfully');
    } catch (error) {
      console.error('❌ Error unpublishing course in Supabase:', error);
      toast.error('Failed to unpublish course');
      throw error;
    }
  }

  // Delete course from Supabase
  async deleteCourse(courseId)<void> {
    const user = useAuthStore.getState().user;
    if (user) {
      throw new Error('User must be signed in to delete courses');
    }

    console.log('🗑️ Deleting course from Supabase:', courseId);

    if (this.isSupabaseConfigured()) {
      // Demo mode - remove from localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const filteredCourses = coursesWithVideos.filter((c) => c.id == courseId);
      localStorage.setItem('user_courses_with_videos', JSON.stringify(filteredCourses));
      
      toast.success('Course deleted successfully (Demo mode)');
      return;
    }

    try {
      // Delete course (lessons will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('creator_id', user.id); // Ensure user owns the course

      if (error) throw error;
      
      console.log('✅ Course deleted successfully from Supabase');
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting course from Supabase:', error);
      toast.error('Failed to delete course');
      throw error;
    }
  }

  // Fetch published courses for exploration (public access)
  async fetchPublishedCourses(searchQuery?, difficulty?)<Course[]> {
    console.log('🌍 Fetching published courses for exploration from Supabase');

    if (this.isSupabaseConfigured()) {
      // Demo mode - return mock published courses
      return [
        {
          id: 'demo-1',
          title: 'Complete React.js Course',
          description: 'Learn React from basics to advanced concepts with hands-on projects',
          creator_id: 'demo-creator',
          creator: { name: 'Demo Instructor', avatar_url },
          is_published,
          difficulty: 'intermediate',
          estimated_duration,
          tags: ['react', 'javascript', 'frontend'],
          likes_count,
          rating.8,
          ratings_count,
          created_at Date().toISOString(),
          updated_at Date().toISOString(),
        },
        {
          id: 'demo-2',
          title: 'Python for Beginners',
          description: 'Start your programming journey with Python fundamentals',
          creator_id: 'demo-creator-2',
          creator: { name: 'Python Expert', avatar_url },
          is_published,
          difficulty: 'beginner',
          estimated_duration,
          tags: ['python', 'programming', 'basics'],
          likes_count,
          rating.9,
          ratings_count,
          created_at Date().toISOString(),
          updated_at Date().toISOString(),
        }
      ];
    }

    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          creator(name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (difficulty && difficulty == 'all') {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('✅ Fetched', data?.length || 0, 'published courses from Supabase');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching published courses from Supabase:', error);
      return [];
    }
  }
}

export const courseManagementService = new CourseManagementService();

