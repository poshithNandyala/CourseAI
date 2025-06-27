import { supabase } from '../lib/supabase';
import { Course, Lesson } from '../types';
import { useAuthStore } from '../store/authStore';
import { geminiAPI, ExtractedTopic, GeminiCourseStructure } from './geminiApi';
import { enhancedYouTubeAPI, YouTubeVideo } from './enhancedYouTubeApi';
import toast from 'react-hot-toast';

export interface GeminiCourseData {
  course: Partial<Course>;
  lessons: GeminiLesson[];
  metadata: {
    totalDuration: number;
    videoCount: number;
    articleCount: number;
    quizCount: number;
    difficulty: string;
    mainTopic: string;
    subtopicsCount: number;
  };
}

export interface GeminiLesson extends Lesson {
  videos: YouTubeVideo[];
  articles: any[];
  estimatedDuration: number;
  keyPoints: string[];
  subtopicTitle: string;
}

class GeminiCourseService {
  async generateCourseWithGemini(
    userPrompt: string,
    options: {
      maxVideosPerSubtopic?: number;
      includeQuizzes?: boolean;
    } = {}
  ): Promise<GeminiCourseData> {
    const { maxVideosPerSubtopic = 3, includeQuizzes = true } = options;

    console.log(`🧠 Starting Gemini-powered course generation for: "${userPrompt}"`);
    
    try {
      // Step 1: Extract topic and structure using Gemini
      console.log('🔍 Step 1: Extracting topic and subtopics with Gemini AI...');
      const extractedTopic = await geminiAPI.extractTopicAndStructure(userPrompt);
      console.log('✅ Topic extracted:', extractedTopic.mainTopic);
      console.log('📋 Subtopics:', extractedTopic.subtopics);

      // Step 2: Generate detailed course structure using Gemini
      console.log('🏗️ Step 2: Generating detailed course structure...');
      const courseStructure = await geminiAPI.generateCourseStructure(extractedTopic);
      console.log('✅ Course structure generated with', courseStructure.subtopics.length, 'lessons');

      // Step 3: Fetch real YouTube videos for each subtopic
      console.log('🎥 Step 3: Fetching real YouTube videos for each subtopic...');
      const enrichedLessons = await this.enrichLessonsWithRealContent(
        courseStructure,
        maxVideosPerSubtopic,
        includeQuizzes
      );

      // Step 4: Create course data
      const courseData: Partial<Course> = {
        title: courseStructure.title,
        description: courseStructure.description,
        difficulty: courseStructure.difficulty,
        estimated_duration: courseStructure.totalDuration,
        tags: this.extractTags(courseStructure),
        is_published: false,
      };

      // Step 5: Calculate metadata
      const totalVideos = enrichedLessons.reduce((sum, lesson) => sum + lesson.videos.length, 0);
      const totalArticles = enrichedLessons.reduce((sum, lesson) => sum + lesson.articles.length, 0);
      const totalQuizzes = enrichedLessons.filter(lesson => lesson.quiz_questions && lesson.quiz_questions.length > 0).length;

      console.log(`🎉 Course generation completed successfully!`);
      console.log(`📊 Generated: ${enrichedLessons.length} lessons, ${totalVideos} real videos, ${totalQuizzes} quizzes`);

      return {
        course: courseData,
        lessons: enrichedLessons,
        metadata: {
          totalDuration: courseStructure.totalDuration,
          videoCount: totalVideos,
          articleCount: totalArticles,
          quizCount: totalQuizzes,
          difficulty: courseStructure.difficulty,
          mainTopic: courseStructure.mainTopic,
          subtopicsCount: courseStructure.subtopics.length
        }
      };

    } catch (error) {
      console.error('❌ Gemini course generation failed:', error);
      toast.error('Failed to generate course. Please check your API keys and try again.');
      throw error;
    }
  }

  private async enrichLessonsWithRealContent(
    courseStructure: GeminiCourseStructure,
    maxVideosPerSubtopic: number,
    includeQuizzes: boolean
  ): Promise<GeminiLesson[]> {
    const enrichedLessons: GeminiLesson[] = [];

    for (let i = 0; i < courseStructure.subtopics.length; i++) {
      const subtopic = courseStructure.subtopics[i];
      console.log(`🔄 Processing lesson ${i + 1}/${courseStructure.subtopics.length}: "${subtopic.title}"`);

      try {
        // Fetch real YouTube videos using enhanced search
        console.log(`  🎬 Searching for videos...`);
        const videos = await enhancedYouTubeAPI.searchVideosForSubtopic(
          courseStructure.mainTopic,
          subtopic.title,
          subtopic.searchTerms,
          maxVideosPerSubtopic
        );
        console.log(`  ✅ Found ${videos.length} relevant videos`);

        // Generate articles (mock for now, can be enhanced with real article APIs)
        const articles = this.generateArticles(courseStructure.mainTopic, subtopic.title);

        // Create lesson
        const lesson: GeminiLesson = {
          id: `lesson-${i + 1}`,
          course_id: '',
          title: subtopic.title,
          content: this.formatLessonContent(subtopic, courseStructure.mainTopic, videos),
          type: subtopic.quizQuestions.length > 0 && includeQuizzes ? 'quiz' : 'article',
          order: subtopic.order,
          video_url: videos[0]?.embedUrl,
          videos,
          articles,
          estimatedDuration: subtopic.estimatedDuration,
          keyPoints: subtopic.keyPoints,
          subtopicTitle: subtopic.title,
          quiz_questions: includeQuizzes ? subtopic.quizQuestions.map(q => ({
            id: `q-${i}-${Math.random().toString(36).substr(2, 9)}`,
            question: q.question,
            type: 'multiple_choice' as const,
            options: q.options,
            correct_answer: q.options[q.correctAnswer],
            explanation: q.explanation
          })) : [],
          resources: articles.map(article => ({
            id: `r-${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            type: 'article' as const
          })),
          created_at: new Date().toISOString()
        };

        enrichedLessons.push(lesson);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to enrich lesson "${subtopic.title}":`, error);
        // Continue with minimal content rather than failing completely
        const lesson: GeminiLesson = {
          id: `lesson-${i + 1}`,
          course_id: '',
          title: subtopic.title,
          content: this.formatLessonContent(subtopic, courseStructure.mainTopic, []),
          type: 'article',
          order: subtopic.order,
          video_url: undefined,
          videos: [],
          articles: [],
          estimatedDuration: subtopic.estimatedDuration,
          keyPoints: subtopic.keyPoints,
          subtopicTitle: subtopic.title,
          quiz_questions: [],
          resources: [],
          created_at: new Date().toISOString()
        };
        enrichedLessons.push(lesson);
      }
    }

    return enrichedLessons;
  }

  private formatLessonContent(subtopic: any, mainTopic: string, videos: YouTubeVideo[]): string {
    let content = `# ${subtopic.title}\n\n`;
    
    content += `## Overview\n${subtopic.description}\n\n`;
    
    // Key Learning Points
    if (subtopic.keyPoints.length > 0) {
      content += `## Key Learning Points\n\n`;
      subtopic.keyPoints.forEach((point: string) => {
        content += `- ${point}\n`;
      });
      content += '\n';
    }

    // Video Resources
    if (videos.length > 0) {
      content += `## Video Resources\n\n`;
      videos.forEach((video, index) => {
        content += `### ${index + 1}. ${video.title}\n`;
        content += `**Channel:** ${video.channelTitle}\n`;
        content += `**Duration:** ${video.duration}\n`;
        content += `**Views:** ${video.viewCount.toLocaleString()}\n`;
        content += `**Relevance Score:** ${video.relevanceScore.toFixed(1)}/100\n\n`;
        content += `${video.description.slice(0, 200)}...\n\n`;
        content += `[Watch on YouTube](${video.watchUrl})\n\n`;
      });
    }

    // Summary
    content += `## Summary\n\n`;
    content += `In this lesson on ${subtopic.title}, you've explored the essential concepts that form the foundation of this important area in ${mainTopic}. `;
    content += `The carefully selected videos provide comprehensive coverage from multiple perspectives, ensuring you gain a well-rounded understanding. `;
    content += `Make sure to watch all recommended videos and complete the quiz to test your knowledge before proceeding to the next lesson.\n\n`;

    return content;
  }

  private generateArticles(mainTopic: string, subtopic: string): any[] {
    return [
      {
        title: `${subtopic} in ${mainTopic}: A Comprehensive Guide`,
        url: `https://www.example.com/${subtopic.toLowerCase().replace(/\s+/g, '-')}-guide`,
        description: `In-depth exploration of ${subtopic} concepts and applications in ${mainTopic}`,
        source: 'Educational Resource',
        readingTime: '8 min read'
      },
      {
        title: `Understanding ${subtopic}: Research and Practice`,
        url: `https://www.example.com/${subtopic.toLowerCase().replace(/\s+/g, '-')}-research`,
        description: `Academic perspective on ${subtopic} with latest research findings`,
        source: 'Academic Journal',
        readingTime: '12 min read'
      },
      {
        title: `${subtopic} Explained: Practical Applications`,
        url: `https://www.example.com/${subtopic.toLowerCase().replace(/\s+/g, '-')}-practical`,
        description: `Practical guide to understanding and applying ${subtopic} principles`,
        source: 'Professional Blog',
        readingTime: '6 min read'
      }
    ];
  }

  private extractTags(courseStructure: GeminiCourseStructure): string[] {
    const tags = new Set<string>();
    
    // Add main topic
    tags.add(courseStructure.mainTopic.toLowerCase().replace(/\s+/g, '-'));
    
    // Add subtopic-based tags
    courseStructure.subtopics.forEach(subtopic => {
      const subtopicWords = subtopic.title.toLowerCase().split(' ');
      subtopicWords.forEach(word => {
        if (word.length > 3 && !['introduction', 'fundamentals', 'advanced'].includes(word)) {
          tags.add(word);
        }
      });
    });
    
    // Add difficulty and general tags
    tags.add(courseStructure.difficulty);
    tags.add('education');
    tags.add('online-course');
    tags.add('ai-generated');
    
    return Array.from(tags).slice(0, 10);
  }

  async saveCourseToDatabase(courseData: GeminiCourseData): Promise<Course> {
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

export const geminiCourseService = new GeminiCourseService();