import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface PublicCourse {
  id: string;
  title: string;
  description: string;
  creator: { name: string; avatar_url?: string };
  difficulty: string;
  estimated_duration: number;
  tags: string[];
  likes_count: number;
  rating: number;
  ratings_count: number;
  created_at: string;
  lessons: any[];
}

interface Comment {
  id: string;
  user: { name: string; avatar_url?: string };
  content: string;
  created_at: string;
  likes: number;
}

interface UserInteraction {
  isLiked: boolean;
  rating: number;
}

class PublicCourseService {
  private isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return url && 
           key && 
           !url.includes('your_supabase_project_url') && 
           !key.includes('your_supabase_anon_key') &&
           url.startsWith('http');
  }

  async fetchPublicCourse(courseId: string): Promise<PublicCourse | null> {
    console.log('🌍 Fetching public course:', courseId);

    if (!this.isSupabaseConfigured()) {
      // Demo mode - return mock course
      return {
        id: courseId,
        title: 'Complete React.js Course',
        description: 'Learn React from basics to advanced concepts with hands-on projects and real YouTube videos',
        creator: { name: 'Demo Instructor', avatar_url: undefined },
        difficulty: 'intermediate',
        estimated_duration: 240,
        tags: ['react', 'javascript', 'frontend'],
        likes_count: 156,
        rating: 4.8,
        ratings_count: 42,
        created_at: new Date().toISOString(),
        lessons: [
          {
            id: 'lesson-1',
            title: 'Introduction to React',
            content: '# Introduction to React\n\nLearn the basics of React...',
            videos: [
              {
                id: 'demo-video-1',
                title: 'React Tutorial for Beginners',
                description: 'Complete React tutorial covering components, state, props, and hooks',
                duration: '2:25:00',
                thumbnailUrl: 'https://img.youtube.com/vi/SqcY0GlETPk/maxresdefault.jpg',
                channelTitle: 'Programming with Mosh',
                viewCount: 2500000,
                embedUrl: 'https://www.youtube.com/embed/SqcY0GlETPk',
                watchUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk'
              }
            ],
            quiz_questions: [
              {
                id: 'q1',
                question: 'What is React?',
                options: ['A JavaScript library', 'A database', 'A server', 'An operating system'],
                correct_answer: 'A JavaScript library',
                explanation: 'React is a JavaScript library for building user interfaces.'
              }
            ]
          }
        ]
      };
    }

    try {
      // Fetch published course with lessons and video data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .eq('id', courseId)
        .eq('is_published', true)
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
      const enhancedLessons = (lessons || []).map(lesson => ({
        ...lesson,
        videos: lesson.video_data || []
      }));

      console.log('✅ Fetched public course with', enhancedLessons.length, 'lessons');
      return { ...course, lessons: enhancedLessons };

    } catch (error) {
      console.error('❌ Error fetching public course:', error);
      return null;
    }
  }

  async getUserInteraction(courseId: string): Promise<UserInteraction> {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { isLiked: false, rating: 0 };
    }

    if (!this.isSupabaseConfigured()) {
      return { isLiked: false, rating: 0 };
    }

    try {
      // Check if user liked the course
      const { data: likeData } = await supabase
        .from('course_likes')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Check user's rating
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('rating')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        isLiked: !!likeData,
        rating: ratingData?.rating || 0
      };
    } catch (error) {
      console.error('Error fetching user interaction:', error);
      return { isLiked: false, rating: 0 };
    }
  }

  async toggleCourseLike(courseId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to like courses');
    }

    if (!this.isSupabaseConfigured()) {
      toast.success('Like toggled! (Demo mode)');
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('course_likes')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Remove like
        await supabase
          .from('course_likes')
          .delete()
          .eq('course_id', courseId)
          .eq('user_id', user.id);

        // Decrease likes count
        await supabase.rpc('decrement_course_likes', { course_id: courseId });
      } else {
        // Add like
        await supabase
          .from('course_likes')
          .insert({ course_id: courseId, user_id: user.id });

        // Increase likes count
        await supabase.rpc('increment_course_likes', { course_id: courseId });
      }
    } catch (error) {
      console.error('Error toggling course like:', error);
      throw error;
    }
  }

  async rateCourse(courseId: string, rating: number): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to rate courses');
    }

    if (!this.isSupabaseConfigured()) {
      toast.success('Rating submitted! (Demo mode)');
      return;
    }

    try {
      // Upsert rating
      await supabase
        .from('ratings')
        .upsert({
          course_id: courseId,
          user_id: user.id,
          rating
        }, { onConflict: 'course_id,user_id' });

      // Update course rating statistics
      await supabase.rpc('update_course_rating', { course_id: courseId });
    } catch (error) {
      console.error('Error rating course:', error);
      throw error;
    }
  }

  async fetchCourseComments(courseId: string): Promise<Comment[]> {
    if (!this.isSupabaseConfigured()) {
      // Demo comments
      return [
        {
          id: '1',
          user: { name: 'John Doe', avatar_url: undefined },
          content: 'Great course! Really helped me understand React concepts.',
          created_at: new Date().toISOString(),
          likes: 5
        },
        {
          id: '2',
          user: { name: 'Jane Smith', avatar_url: undefined },
          content: 'The video content is excellent and very well explained.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          likes: 3
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(comment => ({
        id: comment.id,
        user: comment.user,
        content: comment.content,
        created_at: comment.created_at,
        likes: 0 // TODO: Implement comment likes
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  async addComment(courseId: string, content: string): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User must be signed in to comment');
    }

    if (!this.isSupabaseConfigured()) {
      toast.success('Comment added! (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
}

export const publicCourseService = new PublicCourseService();