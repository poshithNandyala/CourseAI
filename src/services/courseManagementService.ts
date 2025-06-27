import { supabase } from '../lib/supabase';
import { Course, Lesson } from '../types';
import { useAuthStore } from '../store/authStore';
import { geminiCourseService, GeminiCourseData } from './geminiCourseService';
import { supabaseYouTubeService, YouTubeVideo } from './supabaseYouTubeService';
import toast from 'react-hot-toast';

export interface CourseWithLessons extends Course {
  lessons: EnhancedLesson[];
}

export interface EnhancedLesson extends Lesson {
  videos: YouTubeVideo[];
}

class CourseManagementService {
  private isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return url && 
           key && 
           !url.includes('your_supabase_project_url') && 
           !key.includes('your_supabase_anon_key') &&
           url.startsWith('http');
  }

  // Auto-save course during generation with proper video storage
  async autoSaveCourse(courseData: GeminiCourseData): Promise<Course> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to create courses');
    }

    console.log('💾 Auto-saving course with video data to Supabase...');
    console.log('🎥 Video data to save:', courseData.lessons.map(l => ({ 
      title: l.title, 
      videoCount: l.videos.length,
      firstVideo: l.videos[0]?.title 
    })));

    if (!this.isSupabaseConfigured()) {
      // Demo mode - create mock course with video data
      const mockCourse: Course = {
        id: Math.random().toString(36).substr(2, 9),
        title: courseData.course.title || 'Untitled Course',
        description: courseData.course.description || 'No description',
        creator_id: user.id,
        creator: { name: user.name, avatar_url: user.avatar_url },
        is_published: false, // Always start as draft
        difficulty: courseData.course.difficulty || 'beginner',
        estimated_duration: courseData.metadata.totalDuration,
        tags: courseData.course.tags || [],
        likes_count: 0,
        rating: 0,
        ratings_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store course and lesson data with videos in localStorage for demo
      const courseWithLessons = {
        ...mockCourse,
        lessons: courseData.lessons.map(lesson => ({
          ...lesson,
          course_id: mockCourse.id,
          video_data: lesson.videos // Store complete video information
        }))
      };
      
      const existingCourses = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      existingCourses.unshift(courseWithLessons);
      localStorage.setItem('user_courses_with_videos', JSON.stringify(existingCourses));
      
      console.log('✅ Demo course saved with video data');
      toast.success('Course with video data automatically saved! (Demo mode)');
      return mockCourse;
    }

    try {
      // Create course in database
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.course.title,
          description: courseData.course.description,
          difficulty: courseData.course.difficulty,
          estimated_duration: courseData.metadata.totalDuration,
          tags: courseData.course.tags,
          creator_id: user.id,
          is_published: false // Always start as draft
        })
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .single();

      if (courseError) throw courseError;

      // Create lessons in database with ALL video information stored in video_data column
      const lessonsToInsert = courseData.lessons.map(lesson => {
        console.log(`📝 Preparing lesson "${lesson.title}" with ${lesson.videos.length} videos`);
        return {
          course_id: course.id,
          title: lesson.title,
          content: lesson.content,
          type: lesson.type,
          order: lesson.order,
          video_url: lesson.video_url,
          quiz_questions: lesson.quiz_questions,
          resources: lesson.resources,
          // CRITICAL: Store complete video data in the video_data JSONB column
          video_data: lesson.videos.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            duration: video.duration,
            thumbnailUrl: video.thumbnailUrl,
            channelTitle: video.channelTitle,
            publishedAt: video.publishedAt,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            embedUrl: video.embedUrl,
            watchUrl: video.watchUrl,
            relevanceScore: video.relevanceScore
          }))
        };
      });

      console.log('📊 Inserting lessons with video data:', lessonsToInsert.map(l => ({
        title: l.title,
        videoCount: l.video_data.length
      })));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      console.log('✅ Course with video data auto-saved successfully to Supabase');
      toast.success('Course with video content automatically saved to your library!');
      return course;

    } catch (error) {
      console.error('❌ Error auto-saving course with videos to Supabase:', error);
      toast.error('Failed to save course automatically');
      throw error;
    }
  }

  // Fetch user's courses (both published and unpublished)
  async fetchUserCourses(): Promise<Course[]> {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log('❌ No user found, cannot fetch courses');
      return [];
    }

    console.log('📚 Fetching courses for user from Supabase:', user.email);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - get from localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courses = coursesWithVideos.map((courseData: any) => {
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
          creator:users(name, avatar_url)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Loaded', data?.length || 0, 'courses for user from Supabase');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user courses from Supabase:', error);
      return [];
    }
  }

  // Fetch course with all lessons and video content from Supabase
  async fetchCourseWithContent(courseId: string): Promise<CourseWithLessons | null> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to view course content');
    }

    console.log('📖 Fetching course content with videos from database for:', courseId);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - get course with video data
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseData = coursesWithVideos.find((c: any) => c.id === courseId);
      if (!courseData) {
        console.log('❌ Course not found in demo storage');
        return null;
      }

      // Return course with enhanced lessons containing video data
      const { lessons, ...course } = courseData;
      const enhancedLessons: EnhancedLesson[] = lessons.map((lesson: any) => ({
        ...lesson,
        videos: lesson.video_data || [] // Restore video data
      }));

      console.log('✅ Retrieved course from demo storage with', enhancedLessons.length, 'lessons');
      console.log('🎥 Video data restored:', enhancedLessons.map(l => ({ title: l.title, videoCount: l.videos.length })));
      return { ...course, lessons: enhancedLessons };
    }

    try {
      // Fetch course from Supabase
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .eq('id', courseId)
        .eq('creator_id', user.id) // Ensure user owns the course
        .single();

      if (courseError) throw courseError;

      // Fetch lessons with video data from Supabase
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (lessonsError) throw lessonsError;

      console.log('📊 Raw lessons from database:', lessons?.map(l => ({
        title: l.title,
        hasVideoData: !!l.video_data,
        videoDataType: typeof l.video_data,
        videoDataLength: Array.isArray(l.video_data) ? l.video_data.length : 'not array'
      })));

      // Enhance lessons with video data from the video_data column
      const enhancedLessons: EnhancedLesson[] = (lessons || []).map(lesson => {
        let videos: YouTubeVideo[] = [];
        
        try {
          // Parse video data from JSONB column
          if (lesson.video_data && Array.isArray(lesson.video_data)) {
            videos = lesson.video_data.map((videoData: any) => ({
              id: videoData.id || '',
              title: videoData.title || 'Untitled Video',
              description: videoData.description || '',
              duration: videoData.duration || '0:00',
              thumbnailUrl: videoData.thumbnailUrl || '',
              channelTitle: videoData.channelTitle || '',
              publishedAt: videoData.publishedAt || '',
              viewCount: videoData.viewCount || 0,
              likeCount: videoData.likeCount || 0,
              embedUrl: videoData.embedUrl || '',
              watchUrl: videoData.watchUrl || '',
              relevanceScore: videoData.relevanceScore || 0
            }));
          }
        } catch (error) {
          console.error(`❌ Error parsing video data for lesson "${lesson.title}":`, error);
          videos = [];
        }

        console.log(`📹 Lesson "${lesson.title}": restored ${videos.length} videos`);
        
        return {
          ...lesson,
          videos
        };
      });

      const totalVideos = enhancedLessons.reduce((sum, lesson) => sum + lesson.videos.length, 0);
      console.log('✅ Fetched course from Supabase with', enhancedLessons.length, 'lessons and', totalVideos, 'total videos');
      
      return { ...course, lessons: enhancedLessons };

    } catch (error) {
      console.error('❌ Error fetching course content with videos from Supabase:', error);
      return null;
    }
  }

  // Publish course in Supabase
  async publishCourse(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to publish courses');
    }

    console.log('📢 Publishing course in Supabase:', courseId);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - update localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseIndex = coursesWithVideos.findIndex((c: any) => c.id === courseId);
      if (courseIndex !== -1) {
        coursesWithVideos[courseIndex].is_published = true;
        coursesWithVideos[courseIndex].updated_at = new Date().toISOString();
        localStorage.setItem('user_courses_with_videos', JSON.stringify(coursesWithVideos));
      }
      
      toast.success('Course published successfully! (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .eq('creator_id', user.id); // Ensure user owns the course

      if (error) throw error;
      
      console.log('✅ Course published successfully in Supabase');
      toast.success('Course published! It\'s now discoverable by other users.');
    } catch (error) {
      console.error('❌ Error publishing course in Supabase:', error);
      toast.error('Failed to publish course');
      throw error;
    }
  }

  // Unpublish course in Supabase
  async unpublishCourse(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to unpublish courses');
    }

    console.log('📝 Unpublishing course in Supabase:', courseId);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - update localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseIndex = coursesWithVideos.findIndex((c: any) => c.id === courseId);
      if (courseIndex !== -1) {
        coursesWithVideos[courseIndex].is_published = false;
        coursesWithVideos[courseIndex].updated_at = new Date().toISOString();
        localStorage.setItem('user_courses_with_videos', JSON.stringify(coursesWithVideos));
      }
      
      toast.success('Course unpublished successfully! (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .eq('creator_id', user.id); // Ensure user owns the course

      if (error) throw error;
      
      console.log('✅ Course unpublished successfully in Supabase');
      toast.success('Course unpublished successfully!');
    } catch (error) {
      console.error('❌ Error unpublishing course in Supabase:', error);
      toast.error('Failed to unpublish course');
      throw error;
    }
  }

  // Delete course from Supabase
  async deleteCourse(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to delete courses');
    }

    console.log('🗑️ Deleting course from Supabase:', courseId);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - remove from localStorage
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const filteredCourses = coursesWithVideos.filter((c: any) => c.id !== courseId);
      localStorage.setItem('user_courses_with_videos', JSON.stringify(filteredCourses));
      
      toast.success('Course deleted successfully! (Demo mode)');
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
      toast.success('Course deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting course from Supabase:', error);
      toast.error('Failed to delete course');
      throw error;
    }
  }

  // Fetch published courses for exploration (public access)
  async fetchPublishedCourses(searchQuery?: string, difficulty?: string): Promise<Course[]> {
    console.log('🌍 Fetching published courses for exploration from Supabase');

    if (!this.isSupabaseConfigured()) {
      // Demo mode - return mock published courses
      return [
        {
          id: 'demo-1',
          title: 'Complete React.js Course',
          description: 'Learn React from basics to advanced concepts with hands-on projects',
          creator_id: 'demo-creator',
          creator: { name: 'Demo Instructor', avatar_url: undefined },
          is_published: true,
          difficulty: 'intermediate',
          estimated_duration: 240,
          tags: ['react', 'javascript', 'frontend'],
          likes_count: 156,
          rating: 4.8,
          ratings_count: 42,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          title: 'Python for Beginners',
          description: 'Start your programming journey with Python fundamentals',
          creator_id: 'demo-creator-2',
          creator: { name: 'Python Expert', avatar_url: undefined },
          is_published: true,
          difficulty: 'beginner',
          estimated_duration: 180,
          tags: ['python', 'programming', 'basics'],
          likes_count: 203,
          rating: 4.9,
          ratings_count: 67,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
    }

    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (difficulty && difficulty !== 'all') {
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