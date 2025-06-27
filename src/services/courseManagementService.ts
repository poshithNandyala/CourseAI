import { supabase } from '../lib/supabase';
import { Course, Lesson } from '../types';
import { useAuthStore } from '../store/authStore';
import { geminiCourseService, GeminiCourseData } from './geminiCourseService';
import { YouTubeVideo } from './realYouTubeService';
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

  // Auto-save course during generation
  async autoSaveCourse(courseData: GeminiCourseData): Promise<Course> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to create courses');
    }

    console.log('💾 Auto-saving course with video data to database...');

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

      // Create lessons in database with ALL video information stored
      const lessonsToInsert = courseData.lessons.map(lesson => ({
        course_id: course.id,
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        order: lesson.order,
        video_url: lesson.video_url,
        quiz_questions: lesson.quiz_questions,
        resources: lesson.resources,
        // Store complete video data for retrieval
        video_data: lesson.videos
      }));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      console.log('✅ Course with video data auto-saved successfully');
      toast.success('Course with video content automatically saved to your library!');
      return course;

    } catch (error) {
      console.error('❌ Error auto-saving course with videos:', error);
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

    console.log('📚 Fetching courses for user:', user.email);

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

      console.log('✅ Loaded', data?.length || 0, 'courses for user');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user courses:', error);
      return [];
    }
  }

  // Fetch course with all lessons and video content
  async fetchCourseWithContent(courseId: string): Promise<CourseWithLessons | null> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to view course content');
    }

    console.log('📖 Fetching course content with videos for:', courseId);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - get course with video data
      const coursesWithVideos = JSON.parse(localStorage.getItem('user_courses_with_videos') || '[]');
      const courseData = coursesWithVideos.find((c: any) => c.id === courseId);
      if (!courseData) return null;

      // Return course with enhanced lessons containing video data
      const { lessons, ...course } = courseData;
      const enhancedLessons: EnhancedLesson[] = lessons.map((lesson: any) => ({
        ...lesson,
        videos: lesson.video_data || [] // Restore video data
      }));

      return { ...course, lessons: enhancedLessons };
    }

    try {
      // Fetch course
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

      // Fetch lessons with video data
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Enhance lessons with video data
      const enhancedLessons: EnhancedLesson[] = (lessons || []).map(lesson => ({
        ...lesson,
        videos: lesson.video_data || [] // Restore stored video data
      }));

      console.log('✅ Fetched course with', enhancedLessons.length, 'lessons and video data');
      return { ...course, lessons: enhancedLessons };

    } catch (error) {
      console.error('❌ Error fetching course content with videos:', error);
      return null;
    }
  }

  // Publish course
  async publishCourse(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to publish courses');
    }

    console.log('📢 Publishing course:', courseId);

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
      
      console.log('✅ Course published successfully');
      toast.success('Course published! It\'s now discoverable by other users.');
    } catch (error) {
      console.error('❌ Error publishing course:', error);
      toast.error('Failed to publish course');
      throw error;
    }
  }

  // Unpublish course
  async unpublishCourse(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to unpublish courses');
    }

    console.log('📝 Unpublishing course:', courseId);

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
      
      console.log('✅ Course unpublished successfully');
      toast.success('Course unpublished successfully!');
    } catch (error) {
      console.error('❌ Error unpublishing course:', error);
      toast.error('Failed to unpublish course');
      throw error;
    }
  }

  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to delete courses');
    }

    console.log('🗑️ Deleting course:', courseId);

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
      
      console.log('✅ Course deleted successfully');
      toast.success('Course deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      toast.error('Failed to delete course');
      throw error;
    }
  }

  // Fetch published courses for exploration (public access)
  async fetchPublishedCourses(searchQuery?: string, difficulty?: string): Promise<Course[]> {
    console.log('🌍 Fetching published courses for exploration');

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
      
      console.log('✅ Fetched', data?.length || 0, 'published courses');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching published courses:', error);
      return [];
    }
  }
}

export const courseManagementService = new CourseManagementService();