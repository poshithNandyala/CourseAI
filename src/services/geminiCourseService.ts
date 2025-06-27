import { supabase } from '../lib/supabase';
import { Course, Lesson } from '../types';
import { useAuthStore } from '../store/authStore';
import { geminiAPI, ExtractedTopic, GeminiCourseStructure } from './geminiApi';
import { enhancedYouTubeAPI, YouTubeVideo } from './enhancedYouTubeApi';
import { quizService } from './quizService';
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
    
    // Check YouTube API key first
    const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      toast.error('YouTube API key is required! Please add VITE_YOUTUBE_API_KEY to your .env file');
      throw new Error('YouTube API key is required');
    }
    
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

      // Step 3: Fetch REAL YouTube videos for each subtopic with retry logic
      console.log('🎥 Step 3: Fetching REAL YouTube videos for each subtopic...');
      const enrichedLessons = await this.enrichLessonsWithRealVideos(
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
      console.log(`📊 Generated: ${enrichedLessons.length} lessons, ${totalVideos} REAL videos, ${totalQuizzes} quizzes`);

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

  private async enrichLessonsWithRealVideos(
    courseStructure: GeminiCourseStructure,
    maxVideosPerSubtopic: number,
    includeQuizzes: boolean
  ): Promise<GeminiLesson[]> {
    const enrichedLessons: GeminiLesson[] = [];

    for (let i = 0; i < courseStructure.subtopics.length; i++) {
      const subtopic = courseStructure.subtopics[i];
      console.log(`🔄 Processing lesson ${i + 1}/${courseStructure.subtopics.length}: "${subtopic.title}"`);

      try {
        // Fetch REAL YouTube videos with multiple search strategies
        console.log(`  🎬 Searching for REAL videos...`);
        const videos = await this.fetchRealYouTubeVideos(
          courseStructure.mainTopic,
          subtopic.title,
          subtopic.searchTerms,
          maxVideosPerSubtopic
        );
        console.log(`  ✅ Found ${videos.length} REAL YouTube videos`);

        // Generate articles (mock for now, can be enhanced with real article APIs)
        const articles = this.generateArticles(courseStructure.mainTopic, subtopic.title);

        // Generate proper quiz questions using the enhanced quiz service
        let quizQuestions: any[] = [];
        if (includeQuizzes) {
          console.log(`  ❓ Generating proper quiz questions...`);
          const generatedQuiz = quizService.generateQuizQuestions({
            topic: courseStructure.mainTopic,
            subtopic: subtopic.title,
            keyPoints: subtopic.keyPoints,
            difficulty: courseStructure.difficulty,
            questionCount: 4
          });
          
          quizQuestions = generatedQuiz.map(q => ({
            id: q.id,
            question: q.question,
            type: 'multiple_choice' as const,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation
          }));
          console.log(`  ✅ Generated ${quizQuestions.length} proper quiz questions`);
        }

        // Create lesson
        const lesson: GeminiLesson = {
          id: `lesson-${i + 1}`,
          course_id: '',
          title: subtopic.title,
          content: this.formatLessonContent(subtopic, courseStructure.mainTopic, videos),
          type: 'article', // Always article type, quiz is separate
          order: subtopic.order,
          video_url: videos[0]?.embedUrl,
          videos,
          articles,
          estimatedDuration: subtopic.estimatedDuration,
          keyPoints: subtopic.keyPoints,
          subtopicTitle: subtopic.title,
          quiz_questions: quizQuestions,
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
        await new Promise(resolve => setTimeout(resolve, 1500));

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

  private async fetchRealYouTubeVideos(
    mainTopic: string,
    subtopic: string,
    searchTerms: string[],
    maxResults: number
  ): Promise<YouTubeVideo[]> {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is required');
    }

    const baseUrl = 'https://www.googleapis.com/youtube/v3';
    let allVideos: YouTubeVideo[] = [];

    // Multiple search strategies for better results
    const searchQueries = [
      `${mainTopic} ${subtopic} tutorial`,
      `${subtopic} explained ${mainTopic}`,
      `learn ${subtopic} ${mainTopic}`,
      `${mainTopic} ${subtopic} course`,
      `${subtopic} basics ${mainTopic}`,
      ...searchTerms.slice(0, 3)
    ];

    for (const query of searchQueries) {
      if (allVideos.length >= maxResults) break;

      try {
        console.log(`    🔍 Searching: "${query}"`);

        // Search for videos
        const searchParams = new URLSearchParams({
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: '10',
          order: 'relevance',
          videoDuration: 'medium',
          videoDefinition: 'high',
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
          safeSearch: 'strict',
          relevanceLanguage: 'en',
          regionCode: 'US',
          key: apiKey
        });

        const searchResponse = await fetch(`${baseUrl}/search?${searchParams}`);
        
        if (!searchResponse.ok) {
          const errorData = await searchResponse.json();
          console.error('YouTube Search API error:', errorData);
          continue;
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
          console.log(`    ⚠️ No results for: "${query}"`);
          continue;
        }

        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

        // Get detailed video information
        const detailsParams = new URLSearchParams({
          part: 'snippet,contentDetails,statistics',
          id: videoIds,
          key: apiKey
        });

        const detailsResponse = await fetch(`${baseUrl}/videos?${detailsParams}`);
        
        if (!detailsResponse.ok) {
          console.error('YouTube Videos API error:', detailsResponse.status);
          continue;
        }

        const detailsData = await detailsResponse.json();

        const videos = detailsData.items.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description || '',
          duration: this.formatDuration(item.contentDetails.duration),
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(item.statistics.viewCount || '0'),
          likeCount: parseInt(item.statistics.likeCount || '0'),
          embedUrl: `https://www.youtube.com/embed/${item.id}?rel=0&modestbranding=1&showinfo=0`,
          watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
          relevanceScore: this.calculateRelevanceScore(item, mainTopic, subtopic)
        }));

        allVideos = [...allVideos, ...videos];
        console.log(`    ✅ Found ${videos.length} videos for: "${query}"`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed search for "${query}":`, error);
        continue;
      }
    }

    // Remove duplicates and get best videos
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    // Sort by relevance score and return top results
    const sortedVideos = uniqueVideos
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    return sortedVideos;
  }

  private formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private calculateRelevanceScore(video: any, mainTopic: string, subtopic: string): number {
    let score = 0;
    
    const titleLower = video.snippet.title.toLowerCase();
    const descriptionLower = (video.snippet.description || '').toLowerCase();
    const mainTopicLower = mainTopic.toLowerCase();
    const subtopicLower = subtopic.toLowerCase();

    // Title relevance (highest weight)
    if (titleLower.includes(mainTopicLower)) score += 30;
    if (titleLower.includes(subtopicLower)) score += 25;
    if (titleLower.includes('tutorial')) score += 15;
    if (titleLower.includes('course')) score += 15;
    if (titleLower.includes('beginner')) score += 10;
    if (titleLower.includes('explained')) score += 10;

    // Description relevance
    if (descriptionLower.includes(mainTopicLower)) score += 10;
    if (descriptionLower.includes(subtopicLower)) score += 10;

    // View count and engagement (normalized)
    const viewScore = Math.min(parseInt(video.statistics.viewCount || '0') / 100000, 10);
    const likeScore = Math.min(parseInt(video.statistics.likeCount || '0') / 1000, 5);
    score += viewScore + likeScore;

    return score;
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