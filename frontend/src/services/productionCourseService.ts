import { supabase } from '../lib/supabase';
import { Course, Lesson } from '../types';
import { useAuthStore } from '../store/authStore';
import { realYouTubeAPI, YouTubeVideo } from './realYouTubeApi';
import { realContentAPI, RealCourseContent, CourseSubtopic } from './realContentAPI';
import toast from 'react-hot-toast';

export interface ProductionCourseData {
  course: Partial<Course>;
  lessons: ProductionLesson[];
  metadata: {
    totalDuration: number;
    videoCount: number;
    articleCount: number;
    quizCount: number;
    difficulty: string;
  };
}

export interface ProductionLesson extends Lesson {
  videos: YouTubeVideo[];
  articles: any[];
  estimatedDuration: number;
  keyPoints: string[];
}

class ProductionCourseService {
  async generateRealCourse(
    topic: string, 
    options: {
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      maxVideosPerSubtopic?: number;
      includeQuizzes?: boolean;
    } = {}
  ): Promise<ProductionCourseData> {
    const {
      difficulty = 'beginner',
      maxVideosPerSubtopic = 3,
      includeQuizzes = true
    } = options;

    console.log(`🚀 Starting REAL course generation for: "${topic}" (${difficulty} level)`);
    
    try {
      // Step 1: Generate course structure using AI/predefined logic
      console.log('📋 Generating course structure...');
      const courseStructure = await realContentAPI.generateCourseStructure(topic, difficulty);
      
      // Step 2: Fetch real YouTube videos for each subtopic
      console.log('🎥 Fetching real YouTube videos for each subtopic...');
      const enrichedSubtopics = await this.enrichSubtopicsWithRealContent(
        courseStructure.subtopics,
        topic,
        maxVideosPerSubtopic,
        includeQuizzes
      );

      // Step 3: Create course data
      const courseData: Partial<Course> = {
        title: courseStructure.title,
        description: courseStructure.description,
        difficulty: courseStructure.difficulty,
        estimated_duration: courseStructure.totalDuration,
        tags: this.extractTags(topic, courseStructure),
        is_published: false,
      };

      // Step 4: Convert to lessons
      const lessons: ProductionLesson[] = enrichedSubtopics.map((subtopic, index) => ({
        id: `lesson-${index + 1}`,
        course_id: '',
        title: subtopic.title,
        content: this.formatLessonContent(subtopic, topic),
        type: subtopic.quiz.length > 0 ? 'quiz' : 'article' as 'article' | 'quiz',
        order: subtopic.order,
        video_url: subtopic.videos[0]?.embedUrl,
        videos: subtopic.videos,
        articles: subtopic.articles,
        estimatedDuration: subtopic.estimatedDuration,
        keyPoints: subtopic.keyPoints,
        quiz_questions: subtopic.quiz.map(q => ({
          id: `q-${index}-${Math.random().toString(36).substr(2, 9)}`,
          question: q.question,
          type: 'multiple_choice' as const,
          options: q.options,
          correct_answer: q.options[q.correctAnswer],
          explanation: q.explanation
        })),
        resources: subtopic.articles.map(article => ({
          id: `r-${Math.random().toString(36).substr(2, 9)}`,
          title: article.title,
          url: article.url,
          type: 'article' as const
        })),
        created_at: new Date().toISOString()
      }));

      // Step 5: Calculate metadata
      const totalVideos = lessons.reduce((sum, lesson) => sum + lesson.videos.length, 0);
      const totalArticles = lessons.reduce((sum, lesson) => sum + lesson.articles.length, 0);
      const totalQuizzes = lessons.filter(lesson => lesson.quiz_questions && lesson.quiz_questions.length > 0).length;

      console.log(`✅ Course generation completed!`);
      console.log(`📊 Generated: ${lessons.length} lessons, ${totalVideos} videos, ${totalArticles} articles, ${totalQuizzes} quizzes`);

      return {
        course: courseData,
        lessons,
        metadata: {
          totalDuration: courseStructure.totalDuration,
          videoCount: totalVideos,
          articleCount: totalArticles,
          quizCount: totalQuizzes,
          difficulty: courseStructure.difficulty
        }
      };

    } catch (error) {
      console.error('❌ Course generation failed:', error);
      toast.error('Failed to generate course. Please check your API keys and try again.');
      throw error;
    }
  }

  private async enrichSubtopicsWithRealContent(
    subtopics: CourseSubtopic[],
    mainTopic: string,
    maxVideosPerSubtopic: number,
    includeQuizzes: boolean
  ): Promise<CourseSubtopic[]> {
    const enrichedSubtopics: CourseSubtopic[] = [];

    for (let i = 0; i < subtopics.length; i++) {
      const subtopic = subtopics[i];
      console.log(`🔍 Processing subtopic ${i + 1}/${subtopics.length}: "${subtopic.title}"`);

      try {
        // Fetch real YouTube videos
        console.log(`  📹 Searching YouTube for: "${mainTopic} ${subtopic.title}"`);
        const videos = await realYouTubeAPI.searchEducationalVideos(
          mainTopic,
          subtopic.title,
          maxVideosPerSubtopic
        );
        console.log(`  ✅ Found ${videos.length} relevant videos`);

        // Fetch relevant articles
        console.log(`  📰 Finding relevant articles...`);
        const articles = await realContentAPI.findRelevantArticles(mainTopic, subtopic.title);
        console.log(`  ✅ Found ${articles.length} relevant articles`);

        // Generate quiz questions
        let quiz: any[] = [];
        if (includeQuizzes) {
          console.log(`  ❓ Generating quiz questions...`);
          quiz = realContentAPI.generateQuizQuestions(mainTopic, subtopic.title, subtopic.keyPoints);
          console.log(`  ✅ Generated ${quiz.length} quiz questions`);
        }

        enrichedSubtopics.push({
          ...subtopic,
          videos,
          articles,
          quiz
        });

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to enrich subtopic "${subtopic.title}":`, error);
        // Continue with empty content rather than failing completely
        enrichedSubtopics.push({
          ...subtopic,
          videos: [],
          articles: [],
          quiz: []
        });
      }
    }

    return enrichedSubtopics;
  }

  private formatLessonContent(subtopic: CourseSubtopic, mainTopic: string): string {
    let content = `# ${subtopic.title}\n\n`;
    
    content += `## Overview\n${subtopic.description}\n\n`;
    
    // Key Learning Points
    if (subtopic.keyPoints.length > 0) {
      content += `## Key Learning Points\n\n`;
      subtopic.keyPoints.forEach(point => {
        content += `- ${point}\n`;
      });
      content += '\n';
    }

    // Video Resources
    if (subtopic.videos.length > 0) {
      content += `## Video Resources\n\n`;
      subtopic.videos.forEach((video, index) => {
        content += `### ${index + 1}. ${video.title}\n`;
        content += `**Channel:** ${video.channelTitle}\n`;
        content += `**Duration:** ${video.duration}\n`;
        content += `**Views:** ${video.viewCount.toLocaleString()}\n\n`;
        content += `${video.description.slice(0, 200)}...\n\n`;
        content += `[Watch on YouTube](${video.watchUrl})\n\n`;
      });
    }

    // Reading Materials
    if (subtopic.articles.length > 0) {
      content += `## Recommended Reading\n\n`;
      subtopic.articles.forEach((article, index) => {
        content += `### ${index + 1}. ${article.title}\n`;
        content += `**Source:** ${article.source}\n`;
        if (article.readingTime) {
          content += `**Reading Time:** ${article.readingTime}\n`;
        }
        content += `\n${article.description}\n\n`;
        content += `[Read Article](${article.url})\n\n`;
      });
    }

    // Summary
    content += `## Summary\n\n`;
    content += `In this lesson on ${subtopic.title}, you've learned about the key concepts and principles that form the foundation of this important area in ${mainTopic}. `;
    content += `Make sure to watch the recommended videos and read the articles to deepen your understanding. `;
    content += `Complete the quiz to test your knowledge before moving on to the next lesson.\n\n`;

    return content;
  }

  private extractTags(topic: string, courseStructure: RealCourseContent): string[] {
    const tags = new Set<string>();
    
    // Add main topic
    tags.add(topic.toLowerCase().replace(/\s+/g, '-'));
    
    // Add subtopic-based tags
    courseStructure.subtopics.forEach(subtopic => {
      const subtopicWords = subtopic.title.toLowerCase().split(' ');
      subtopicWords.forEach(word => {
        if (word.length > 3) {
          tags.add(word);
        }
      });
    });
    
    // Add difficulty and general tags
    tags.add(courseStructure.difficulty);
    tags.add('education');
    tags.add('online-course');
    
    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  async saveCourseToDatabase(courseData: ProductionCourseData): Promise<Course> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User must be authenticated');

    const isSupabaseConfigured = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      return url && 
             key && 
             !url.includes('your_supabase_project_url') && 
             !key.includes('your_supabase_anon_key') &&
             url.startsWith('http');
    };

    if (!isSupabaseConfigured()) {
      // Return mock course for demo
      const mockCourse: Course = {
        id: Math.random().toString(36).substr(2, 9),
        title: courseData.course.title || 'Untitled Course',
        description: courseData.course.description || 'No description',
        creator_id: user.id,
        creator: { name: user.name, avatar_url: user.avatar_url },
        is_published: false,
        difficulty: courseData.course.difficulty || 'beginner',
        estimated_duration: courseData.metadata.totalDuration,
        tags: courseData.course.tags || [],
        likes_count: 0,
        rating: 0,
        ratings_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      toast.success('Course saved successfully! (Demo mode)');
      return mockCourse;
    }

    try {
      // Create course in database
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          ...courseData.course,
          creator_id: user.id,
        })
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .single();

      if (courseError) throw courseError;

      // Create lessons in database
      const lessonsToInsert = courseData.lessons.map(lesson => ({
        course_id: course.id,
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        order: lesson.order,
        video_url: lesson.video_url,
        quiz_questions: lesson.quiz_questions,
        resources: lesson.resources
      }));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      toast.success('Course saved successfully to database!');
      return course;

    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course to database');
      throw error;
    }
  }

  async publishCourse(courseId: string): Promise<void> {
    const isSupabaseConfigured = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      return url && 
             key && 
             !url.includes('your_supabase_project_url') && 
             !key.includes('your_supabase_anon_key') &&
             url.startsWith('http');
    };

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
      
      toast.success('Course published! It\'s now discoverable by other users.');
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to publish course');
      throw error;
    }
  }
}

export const productionCourseService = new ProductionCourseService();