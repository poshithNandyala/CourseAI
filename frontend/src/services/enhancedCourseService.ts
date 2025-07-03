import { supabase } from '../lib/supabase';
import { Course, Lesson } from '../types';
import { useAuthStore } from '../store/authStore';
import { youtubeApi, YouTubeVideo } from './youtubeApi';
import { openaiService, CourseGenerationRequest } from './openaiApi';
import toast from 'react-hot-toast';

export interface EnhancedCourse extends Course {
  lessons: EnhancedLesson[];
  totalVideos: number;
  totalQuizzes: number;
  totalAssignments: number;
}

export interface EnhancedLesson extends Lesson {
  videos: YouTubeVideo[];
  estimatedDuration: number;
  completed?: boolean;
}

export interface CourseCreationData {
  course: Partial<Course>;
  lessons: EnhancedLesson[];
  metadata: {
    totalDuration: number;
    videoCount: number;
    quizCount: number;
    difficulty: string;
  };
}

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return url && 
         key && 
         !url.includes('your_supabase_project_url') && 
         !key.includes('your_supabase_anon_key') &&
         url.startsWith('http');
};

export class EnhancedCourseService {
  async generateCourseWithAI(topic: string, options?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
    includeProjects?: boolean;
  }): Promise<CourseCreationData> {
    console.log('🤖 Generating enhanced AI course for:', topic);
    
    const {
      difficulty = 'beginner',
      duration = 4,
      includeProjects = true
    } = options || {};

    try {
      // Step 1: Generate course structure using AI
      const courseRequest: CourseGenerationRequest = {
        topic,
        difficulty,
        duration,
        includeProjects
      };

      const aiCourse = await openaiService.generateCourse(courseRequest);
      console.log('✅ AI course structure generated');

      // Step 2: Search for relevant YouTube videos
      const videoPromises = aiCourse.courseOutline.map(async (module, index) => {
        const searchQuery = `${topic} ${module.title} tutorial`;
        const videos = await youtubeApi.searchVideos({
          query: searchQuery,
          maxResults: index === 0 ? 3 : 2, // More videos for intro module
          order: 'relevance',
          duration: 'medium'
        });
        return { module, videos };
      });

      const moduleVideos = await Promise.all(videoPromises);
      console.log('✅ YouTube videos fetched');

      // Step 3: Create enhanced lessons
      const lessons: EnhancedLesson[] = moduleVideos.map((moduleData, index) => {
        const { module, videos } = moduleData;
        
        // Generate quiz questions for this module
        const quizQuestions = this.generateModuleQuiz(module.title, topic, difficulty);
        
        // Calculate estimated duration
        const videoDuration = videos.reduce((total, video) => {
          const duration = this.parseDuration(video.duration);
          return total + duration;
        }, 0);
        
        const readingTime = 15; // 15 minutes reading time
        const estimatedDuration = videoDuration + readingTime;

        return {
          id: `lesson-${index + 1}`,
          course_id: '',
          title: module.title,
          content: this.formatLessonContent(module, videos),
          type: index % 4 === 3 ? 'quiz' : 'article' as 'article' | 'quiz',
          order: index + 1,
          video_url: videos[0]?.embedUrl,
          videos: videos,
          estimatedDuration,
          quiz_questions: quizQuestions,
          resources: this.generateResources(topic, module.title),
          created_at: new Date().toISOString()
        };
      });

      // Step 4: Create course metadata
      const totalDuration = lessons.reduce((total, lesson) => total + lesson.estimatedDuration, 0);
      const videoCount = lessons.reduce((total, lesson) => total + lesson.videos.length, 0);
      const quizCount = lessons.filter(lesson => lesson.type === 'quiz').length;

      const courseData: Partial<Course> = {
        title: aiCourse.title,
        description: aiCourse.description,
        difficulty,
        estimated_duration: totalDuration,
        tags: this.extractTags(topic, aiCourse),
        is_published: false,
      };

      console.log('✅ Enhanced course generation completed');

      return {
        course: courseData,
        lessons,
        metadata: {
          totalDuration,
          videoCount,
          quizCount,
          difficulty
        }
      };

    } catch (error) {
      console.error('❌ Enhanced course generation failed:', error);
      throw new Error('Failed to generate course. Please try again.');
    }
  }

  async createCourseWithLessons(courseCreationData: CourseCreationData): Promise<EnhancedCourse> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User must be authenticated');

    if (!isSupabaseConfigured()) {
      // Return mock course for demo
      const mockCourse: EnhancedCourse = {
        id: Math.random().toString(36).substr(2, 9),
        title: courseCreationData.course.title || 'Untitled Course',
        description: courseCreationData.course.description || 'No description',
        creator_id: user.id,
        creator: { name: user.name, avatar_url: user.avatar_url },
        is_published: false,
        difficulty: courseCreationData.course.difficulty || 'beginner',
        estimated_duration: courseCreationData.metadata.totalDuration,
        tags: courseCreationData.course.tags || [],
        likes_count: 0,
        rating: 0,
        ratings_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lessons: courseCreationData.lessons,
        totalVideos: courseCreationData.metadata.videoCount,
        totalQuizzes: courseCreationData.metadata.quizCount,
        totalAssignments: 0
      };
      
      toast.success('Course created successfully! (Demo mode)');
      return mockCourse;
    }

    try {
      // Create course in database
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          ...courseCreationData.course,
          creator_id: user.id,
        })
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .single();

      if (courseError) throw courseError;

      // Create lessons in database
      const lessonsToInsert = courseCreationData.lessons.map(lesson => ({
        course_id: courseData.id,
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        order: lesson.order,
        video_url: lesson.video_url,
        quiz_questions: lesson.quiz_questions,
        resources: lesson.resources
      }));

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert)
        .select('*');

      if (lessonsError) throw lessonsError;

      // Combine course with lessons
      const enhancedCourse: EnhancedCourse = {
        ...courseData,
        lessons: lessonsData.map((lesson, index) => ({
          ...lesson,
          videos: courseCreationData.lessons[index].videos,
          estimatedDuration: courseCreationData.lessons[index].estimatedDuration
        })),
        totalVideos: courseCreationData.metadata.videoCount,
        totalQuizzes: courseCreationData.metadata.quizCount,
        totalAssignments: 0
      };

      toast.success('Course created successfully!');
      return enhancedCourse;

    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
      throw error;
    }
  }

  async publishCourse(courseId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
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
        .eq('id', courseId);

      if (error) throw error;
      
      toast.success('Course published successfully! It\'s now visible to other users.');
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to publish course');
      throw error;
    }
  }

  async unpublishCourse(courseId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
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
        .eq('id', courseId);

      if (error) throw error;
      
      toast.success('Course unpublished successfully!');
    } catch (error) {
      console.error('Error unpublishing course:', error);
      toast.error('Failed to unpublish course');
      throw error;
    }
  }

  async fetchPublishedCourses(searchQuery?: string, difficulty?: string): Promise<Course[]> {
    if (!isSupabaseConfigured()) {
      // Return mock published courses
      return [
        {
          id: '1',
          title: 'Complete React.js Course',
          description: 'Learn React from basics to advanced concepts with hands-on projects',
          creator_id: 'demo-user',
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
      return data || [];
    } catch (error) {
      console.error('Error fetching published courses:', error);
      return [];
    }
  }

  private parseDuration(duration: string): number {
    // Parse duration string (e.g., "2:30:00" or "45:30") to minutes
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1]; // hours * 60 + minutes
    } else if (parts.length === 2) {
      return parts[0]; // assume it's already in minutes
    }
    return 30; // default fallback
  }

  private formatLessonContent(module: any, videos: YouTubeVideo[]): string {
    let content = `# ${module.title}\n\n`;
    
    content += `## Overview\n${module.description}\n\n`;
    
    content += `## Learning Objectives\n`;
    module.topics.forEach((topic: string) => {
      content += `- ${topic}\n`;
    });
    content += '\n';
    
    if (videos.length > 0) {
      content += `## Video Resources\n\n`;
      videos.forEach((video, index) => {
        content += `### ${index + 1}. ${video.title}\n`;
        content += `**Channel:** ${video.channelTitle}\n`;
        content += `**Duration:** ${video.duration}\n\n`;
        content += `${video.description.slice(0, 200)}...\n\n`;
        content += `[Watch on YouTube](https://www.youtube.com/watch?v=${video.id})\n\n`;
      });
    }
    
    content += `## Key Points\n`;
    module.keyPoints.forEach((point: string) => {
      content += `- ${point}\n`;
    });
    content += '\n';
    
    content += `## Summary\n`;
    content += `In this lesson, you've learned about ${module.title.toLowerCase()}. `;
    content += `Make sure to practice the concepts covered and complete any exercises provided. `;
    content += `This knowledge will be essential for the upcoming lessons.\n\n`;
    
    return content;
  }

  private generateModuleQuiz(moduleTitle: string, topic: string, difficulty: string) {
    // Generate contextual quiz questions based on module and topic
    return [
      {
        id: `q-${Math.random().toString(36).substr(2, 9)}`,
        question: `What is the main focus of the "${moduleTitle}" module?`,
        type: 'multiple_choice' as const,
        options: [
          `Understanding ${moduleTitle.toLowerCase()} concepts`,
          'General programming principles',
          'Advanced optimization techniques',
          'Project management skills'
        ],
        correct_answer: `Understanding ${moduleTitle.toLowerCase()} concepts`,
        explanation: `This module specifically focuses on ${moduleTitle.toLowerCase()} within the context of ${topic}.`
      },
      {
        id: `q-${Math.random().toString(36).substr(2, 9)}`,
        question: `How does ${moduleTitle} relate to ${topic} development?`,
        type: 'multiple_choice' as const,
        options: [
          'It\'s not directly related',
          'It\'s a fundamental concept',
          'It\'s only for advanced users',
          'It\'s optional knowledge'
        ],
        correct_answer: 'It\'s a fundamental concept',
        explanation: `${moduleTitle} is a fundamental concept in ${topic} that forms the basis for more advanced topics.`
      }
    ];
  }

  private generateResources(topic: string, moduleTitle: string) {
    return [
      {
        id: `r-${Math.random().toString(36).substr(2, 9)}`,
        title: `${topic} Official Documentation`,
        url: `https://docs.${topic.toLowerCase().replace(/\s+/g, '')}.org/`,
        type: 'documentation' as const
      },
      {
        id: `r-${Math.random().toString(36).substr(2, 9)}`,
        title: `${moduleTitle} Tutorial`,
        url: `https://www.tutorialspoint.com/${topic.toLowerCase().replace(/\s+/g, '-')}/`,
        type: 'tutorial' as const
      }
    ];
  }

  private extractTags(topic: string, aiCourse: any): string[] {
    const tags = new Set<string>();
    
    // Add main topic
    tags.add(topic.toLowerCase().replace(/\s+/g, '-'));
    
    // Add related tags based on content
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('react')) {
      tags.add('react');
      tags.add('javascript');
      tags.add('frontend');
      tags.add('web-development');
    }
    if (topicLower.includes('python')) {
      tags.add('python');
      tags.add('programming');
      tags.add('backend');
    }
    if (topicLower.includes('javascript')) {
      tags.add('javascript');
      tags.add('programming');
      tags.add('web');
    }
    
    // Add general tags
    tags.add('tutorial');
    tags.add('beginner-friendly');
    tags.add('hands-on');
    
    return Array.from(tags);
  }
}

export const enhancedCourseService = new EnhancedCourseService();