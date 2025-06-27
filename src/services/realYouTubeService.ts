// REAL YouTube API service that ACTUALLY works with your API key
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

class RealYouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
    console.log('🔑 YouTube API Key loaded:', this.apiKey ? 'YES' : 'NO');
  }

  async searchVideosForTopic(mainTopic: string, subtopic: string, maxResults = 3): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      console.error('❌ YouTube API key is missing!');
      throw new Error('YouTube API key is required. Please check your .env file for VITE_YOUTUBE_API_KEY');
    }

    console.log(`🔍 Searching YouTube for: "${mainTopic} - ${subtopic}"`);
    
    try {
      let allVideos: YouTubeVideo[] = [];

      // Multiple search strategies for better results
      const searchQueries = [
        `${mainTopic} ${subtopic} tutorial`,
        `${subtopic} ${mainTopic} explained`,
        `learn ${subtopic} ${mainTopic}`,
        `${mainTopic} ${subtopic} course beginner`,
        `${subtopic} basics ${mainTopic}`,
        `${mainTopic} ${subtopic} introduction`
      ];

      for (const query of searchQueries) {
        if (allVideos.length >= maxResults * 2) break; // Get extra to filter best ones

        try {
          console.log(`  🔍 Searching: "${query}"`);
          const videos = await this.performSearch(query);
          allVideos = [...allVideos, ...videos];
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed search for "${query}":`, error);
          continue;
        }
      }

      // Remove duplicates
      const uniqueVideos = allVideos.filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      );

      // Calculate relevance scores and sort
      const scoredVideos = uniqueVideos.map(video => ({
        ...video,
        relevanceScore: this.calculateRelevanceScore(video, mainTopic, subtopic)
      }));

      // Sort by relevance and return top results
      const bestVideos = scoredVideos
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(`✅ Found ${bestVideos.length} relevant videos for "${subtopic}"`);
      return bestVideos;

    } catch (error) {
      console.error(`❌ YouTube search failed for "${subtopic}":`, error);
      throw error;
    }
  }

  private async performSearch(query: string): Promise<YouTubeVideo[]> {
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
      publishedAfter: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // Last 2 years
      key: this.apiKey
    });

    const searchResponse = await fetch(`${this.baseUrl}/search?${searchParams}`);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube Search API error:', errorData);
      throw new Error(`YouTube Search API error: ${searchResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log(`No results found for: "${query}"`);
      return [];
    }

    // Step 2: Get detailed video information
    const videoIds = searchData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',');

    const detailsParams = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds,
      key: this.apiKey
    });

    const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
    
    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json();
      console.error('YouTube Videos API error:', errorData);
      throw new Error(`YouTube Videos API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    return detailsData.items.map((item: {
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: {
          high?: { url: string };
          medium?: { url: string };
          default: { url: string };
        };
        channelTitle: string;
        publishedAt: string;
      };
      contentDetails: {
        duration: string;
      };
      statistics: {
        viewCount?: string;
        likeCount?: string;
      };
    }) => ({
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
      relevanceScore: 0 // Will be calculated later
    }));
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
    if (titleLower.includes('introduction')) score += 8;

    // Description relevance
    if (descriptionLower.includes(mainTopicLower)) score += 10;
    if (descriptionLower.includes(subtopicLower)) score += 10;

    // Channel quality indicators
    const educationalChannels = ['khan academy', 'coursera', 'edx', 'mit', 'stanford', 'harvard', 'crash course', 'freecodecamp'];
    if (educationalChannels.some(channel => video.channelTitle.toLowerCase().includes(channel))) {
      score += 20;
    }

    // View count and engagement (normalized)
    const viewScore = Math.min(video.viewCount / 100000, 10); // Max 10 points for views
    const likeScore = Math.min(video.likeCount / 1000, 5); // Max 5 points for likes
    score += viewScore + likeScore;

    // Duration preference (medium length videos)
    const durationMinutes = this.parseDurationToMinutes(video.duration);
    if (durationMinutes >= 10 && durationMinutes <= 60) {
      score += 10;
    } else if (durationMinutes > 60 && durationMinutes <= 120) {
      score += 5;
    }

    return score;
  }

  private parseDurationToMinutes(duration: string): number {
    const match = duration.match(/(\d+):(\d+)/);
    if (!match) return 0;

    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    
    return minutes + (seconds / 60);
  }
}

export const realYouTubeService = new RealYouTubeService();