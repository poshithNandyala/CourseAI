import { supabase } from '../lib/supabase';

import { useAuthStore } from '../store/authStore';
import { realYouTubeAPI, YouTubeVideo } from './realYouTubeApi';
import { realContentAPI, RealCourseContent, CourseSubtopic } from './realContentAPI';
import toast from 'react-hot-toast';

;
}

class ProductionCourseService {
  async generateRealCourse(
    topic, 
    options: {
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      maxVideosPerSubtopic?;
      includeQuizzes?;
    } = {}
  )<ProductionCourseData> {
    const {
      difficulty = 'beginner',
      maxVideosPerSubtopic = 3,
      includeQuizzes = true
    } = options;

    console.log(`🚀 Starting REAL course generation for: "${topic}" (${difficulty} level)`);
    
    try {
      // Step 1 course structure using AI/predefined logic
      console.log('📋 Generating course structure...');
      const courseStructure = await realContentAPI.generateCourseStructure(topic, difficulty);
      
      // Step 2 real YouTube videos for each subtopic
      console.log('🎥 Fetching real YouTube videos for each subtopic...');
      const enrichedSubtopics = await this.enrichSubtopicsWithRealContent(
        courseStructure.subtopics,
        topic,
        maxVideosPerSubtopic,
        includeQuizzes
      );

      // Step 3 course data
      const courseData<Course> = {
        title.title,
        description.description,
        difficulty.difficulty,
        estimated_duration.totalDuration,
        tags.extractTags(topic, courseStructure),
        is_published,
      };

      // Step 4 to lessons
      const lessons = enrichedSubtopics.map((subtopic, index) => ({
        id: `lesson-${index + 1}`,
        course_id: '',
        title.title,
        content.formatLessonContent(subtopic, topic),
        type.quiz.length > 0 ? 'quiz' : 'article' as 'article' | 'quiz',
        order.order,
        video_url.videos[0]?.embedUrl,
        videos.videos,
        articles.articles,
        estimatedDuration.estimatedDuration,
        keyPoints.keyPoints,
        quiz_questions.quiz.map(q => ({
          id: `q-${index}-${Math.random().toString(36).substr(2, 9)}`,
          question.question,
          type: 'multiple_choice',
          options.options,
          correct_answer.options[q.correctAnswer],
          explanation.explanation
        })),
        resources.articles.map(article => ({
          id: `r-${Math.random().toString(36).substr(2, 9)}`,
          title.title,
          url.url,
          type: 'article'
        })),
        created_at Date().toISOString()
      }));

      // Step 5 metadata
      const totalVideos = lessons.reduce((sum, lesson) => sum + lesson.videos.length, 0);
      const totalArticles = lessons.reduce((sum, lesson) => sum + lesson.articles.length, 0);
      const totalQuizzes = lessons.filter(lesson => lesson.quiz_questions && lesson.quiz_questions.length > 0).length;

      console.log(`✅ Course generation completed`);
      console.log(`📊 Generated: ${lessons.length} lessons, ${totalVideos} videos, ${totalArticles} articles, ${totalQuizzes} quizzes`);

      return {
        course,
        lessons,
        metadata: {
          totalDuration.totalDuration,
          videoCount,
          articleCount,
          quizCount,
          difficulty.difficulty
        }
      };

    } catch (error) {
      console.error('❌ Course generation failed:', error);
      toast.error('Failed to generate course. Please check your API keys and try again.');
      throw error;
    }
  }

  private async enrichSubtopicsWithRealContent(
    subtopics,
    mainTopic,
    maxVideosPerSubtopic,
    includeQuizzes
  )<CourseSubtopic[]> {
    const enrichedSubtopics = [];

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
        let quiz = [];
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

  private formatLessonContent(subtopic, mainTopic) {
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

  private extractTags(topic, courseStructure) {
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

  async saveCourseToDatabase(courseData)<Course> {
    const user = useAuthStore.getState().user;
    if (user) throw new Error('User must be authenticated');

    const isSupabaseConfigured = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      return url && 
             key && 
             url.includes('your_supabase_project_url') && 
             key.includes('your_supabase_anon_key') &&
             url.startsWith('http');
    };

    if (isSupabaseConfigured()) {
      // Return mock course for demo
      const mockCourse = {
        id.random().toString(36).substr(2, 9),
        title.course.title || 'Untitled Course',
        description.course.description || 'No description',
        creator_id.id,
        creator: { name.name, avatar_url.avatar_url },
        is_published,
        difficulty.course.difficulty || 'beginner',
        estimated_duration.metadata.totalDuration,
        tags.course.tags || [],
        likes_count,
        rating,
        ratings_count,
        created_at Date().toISOString(),
        updated_at Date().toISOString(),
      };
      
      toast.success('Course saved successfully (Demo mode)');
      return mockCourse;
    }

    try {
      // Create course in database
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData.course,
          creator_id.id,
        })
        .select(`
          *,
          creator(name, avatar_url)
        `)
        .single();

      if (courseError) throw courseError;

      // Create lessons in database
      const lessonsToInsert = courseData.lessons.map(lesson => ({
        course_id.id,
        title.title,
        content.content,
        type.type,
        order.order,
        video_url.video_url,
        quiz_questions.quiz_questions,
        resources.resources
      }));

      const { error } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      toast.success('Course saved successfully to database');
      return course;

    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course to database');
      throw error;
    }
  }

  async publishCourse(courseId)<void> {
    const isSupabaseConfigured = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      return url && 
             key && 
             url.includes('your_supabase_project_url') && 
             key.includes('your_supabase_anon_key') &&
             url.startsWith('http');
    };

    if (isSupabaseConfigured()) {
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
        .eq('id', courseId);

      if (error) throw error;
      
      toast.success('Course published It\'s now discoverable by other users.');
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to publish course');
      throw error;
    }
  }
}

export const productionCourseService = new ProductionCourseService();

