// Supabase-integrated YouTube service that properly stores and retrieves video data
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  embedUrl: string;
  watchUrl: string;
  relevanceScore: number;
}

class SupabaseYouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
    console.log('🔑 YouTube API Key status:', this.apiKey ? 'CONFIGURED' : 'MISSING');
  }

  private isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return url && 
           key && 
           !url.includes('your_supabase_project_url') && 
           !key.includes('your_supabase_anon_key') &&
           url.startsWith('http');
  }

  async searchAndStoreVideos(mainTopic: string, subtopic: string, maxResults = 3): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      console.error('❌ YouTube API key is missing!');
      throw new Error('YouTube API key is required. Please add VITE_YOUTUBE_API_KEY to your .env file');
    }

    console.log(`🔍 Searching YouTube for: "${mainTopic} - ${subtopic}"`);
    
    try {
      let allVideos: YouTubeVideo[] = [];

      // Multiple search strategies for better results
      const searchQueries = [
        `${mainTopic} ${subtopic} tutorial`,
        `${subtopic} ${mainTopic} explained`,
        `learn ${subtopic} ${mainTopic}`,
        `${mainTopic} ${subtopic} course`,
        `${subtopic} basics ${mainTopic}`
      ];

      for (const query of searchQueries) {
        if (allVideos.length >= maxResults * 2) break;

        try {
          console.log(`  🔍 Searching: "${query}"`);
          const videos = await this.performYouTubeSearch(query);
          allVideos = [...allVideos, ...videos];
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed search for "${query}":`, error);
          continue;
        }
      }

      // Remove duplicates and score
      const uniqueVideos = this.removeDuplicatesAndScore(allVideos, mainTopic, subtopic);

      // Sort by relevance and return top results
      const bestVideos = uniqueVideos
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(`✅ Found ${bestVideos.length} relevant videos for "${subtopic}"`);
      return bestVideos;

    } catch (error) {
      console.error(`❌ YouTube search failed for "${subtopic}":`, error);
      throw error;
    }
  }

  private async performYouTubeSearch(query: string): Promise<YouTubeVideo[]> {
    // Step 1: Search for videos
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
      publishedAfter: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      key: this.apiKey
    });

    const searchResponse = await fetch(`${this.baseUrl}/search?${searchParams}`);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube Search API error:', errorData);
      throw new Error(`YouTube Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Step 2: Get detailed video information
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    const detailsParams = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds,
      key: this.apiKey
    });

    const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
    
    if (!detailsResponse.ok) {
      throw new Error(`YouTube Videos API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    return detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || '',
      duration: this.formatDuration(item.contentDetails.duration),
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      embedUrl: `https://www.youtube.com/embed/${item.id}?rel=0&modestbranding=1&showinfo=0&controls=1`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
      relevanceScore: 0
    }));
  }

  private removeDuplicatesAndScore(videos: YouTubeVideo[], mainTopic: string, subtopic: string): YouTubeVideo[] {
    // Remove duplicates by video ID
    const uniqueVideos = videos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    // Calculate relevance scores
    return uniqueVideos.map(video => ({
      ...video,
      relevanceScore: this.calculateRelevanceScore(video, mainTopic, subtopic)
    }));
  }

  private calculateRelevanceScore(video: YouTubeVideo, mainTopic: string, subtopic: string): number {
    let score = 0;
    
    const titleLower = video.title.toLowerCase();
    const descriptionLower = video.description.toLowerCase();
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

    // Channel quality indicators
    const educationalChannels = ['khan academy', 'coursera', 'edx', 'mit', 'stanford', 'harvard', 'crash course'];
    if (educationalChannels.some(channel => video.channelTitle.toLowerCase().includes(channel))) {
      score += 20;
    }

    // View count and engagement
    const viewScore = Math.min(video.viewCount / 100000, 10);
    const likeScore = Math.min(video.likeCount / 1000, 5);
    score += viewScore + likeScore;

    return score;
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

  // Store video data in Supabase lesson
  async storeVideoDataInLesson(lessonId: string, videos: YouTubeVideo[]): Promise<void> {
    if (!this.isSupabaseConfigured()) {
      console.log('📝 Demo mode: Video data stored locally');
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .update({ video_data: videos })
        .eq('id', lessonId);

      if (error) throw error;
      console.log(`✅ Stored ${videos.length} videos in lesson ${lessonId}`);
    } catch (error) {
      console.error('❌ Error storing video data:', error);
      throw error;
    }
  }

  // Retrieve video data from Supabase lesson
  async getVideoDataFromLesson(lessonId: string): Promise<YouTubeVideo[]> {
    if (!this.isSupabaseConfigured()) {
      console.log('📖 Demo mode: Returning empty video data');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('video_data')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      
      const videos = data?.video_data || [];
      console.log(`📖 Retrieved ${videos.length} videos from lesson ${lessonId}`);
      return videos;
    } catch (error) {
      console.error('❌ Error retrieving video data:', error);
      return [];
    }
  }

  // Get all lessons with video data for a course
  async getCourseWithVideoData(courseId: string): Promise<any> {
    if (!this.isSupabaseConfigured()) {
      console.log('📖 Demo mode: Returning mock course data');
      return null;
    }

    try {
      // Get course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          creator:users(name, avatar_url)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Get lessons with video data
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

      console.log(`✅ Retrieved course with ${enhancedLessons.length} lessons and video data`);
      return { ...course, lessons: enhancedLessons };

    } catch (error) {
      console.error('❌ Error retrieving course with video data:', error);
      return null;
    }
  }
}

export const supabaseYouTubeService = new SupabaseYouTubeService();