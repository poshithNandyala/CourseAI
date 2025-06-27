// Enhanced YouTube API service with intelligent search strategies
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount?: number;
  embedUrl: string;
  watchUrl: string;
  relevanceScore: number;
}

export interface YouTubeSearchStrategy {
  searchTerms: string[];
  filters: {
    duration?: 'short' | 'medium' | 'long';
    order?: 'relevance' | 'date' | 'rating' | 'viewCount';
    publishedAfter?: string;
  };
}

class EnhancedYouTubeAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  async searchVideosForSubtopic(
    mainTopic: string, 
    subtopic: string, 
    searchTerms: string[], 
    maxResults = 3
  ): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key is required. Please add VITE_YOUTUBE_API_KEY to your .env file');
    }

    console.log(`🔍 Searching YouTube for: ${mainTopic} - ${subtopic}`);
    console.log(`📝 Search terms:`, searchTerms);

    try {
      let allVideos: YouTubeVideo[] = [];

      // Strategy 1: Use provided search terms
      for (const searchTerm of searchTerms.slice(0, 3)) {
        try {
          const videos = await this.performSearch(searchTerm, {
            duration: 'medium',
            order: 'relevance',
            publishedAfter: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString() // Last 2 years
          });
          allVideos = [...allVideos, ...videos];
        } catch (error) {
          console.warn(`Failed search for term: ${searchTerm}`, error);
        }
      }

      // Strategy 2: Fallback searches if not enough videos
      if (allVideos.length < maxResults) {
        const fallbackTerms = [
          `${mainTopic} ${subtopic} tutorial beginner`,
          `${subtopic} explained simply`,
          `learn ${mainTopic} ${subtopic}`,
          `${mainTopic} ${subtopic} course`
        ];

        for (const term of fallbackTerms) {
          if (allVideos.length >= maxResults) break;
          
          try {
            const videos = await this.performSearch(term, {
              duration: 'medium',
              order: 'relevance'
            });
            allVideos = [...allVideos, ...videos];
          } catch (error) {
            console.warn(`Failed fallback search for: ${term}`, error);
          }
        }
      }

      // Remove duplicates and calculate relevance scores
      const uniqueVideos = this.removeDuplicatesAndScore(allVideos, mainTopic, subtopic);

      // Sort by relevance score and return top results
      const sortedVideos = uniqueVideos
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(`✅ Found ${sortedVideos.length} relevant videos for ${subtopic}`);
      return sortedVideos;

    } catch (error) {
      console.error(`❌ YouTube search failed for ${subtopic}:`, error);
      throw error;
    }
  }

  private async performSearch(query: string, filters: any): Promise<YouTubeVideo[]> {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '10',
      order: filters.order || 'relevance',
      videoDuration: filters.duration || 'medium',
      videoDefinition: 'high',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      safeSearch: 'strict',
      relevanceLanguage: 'en',
      regionCode: 'US',
      key: this.apiKey
    });

    if (filters.publishedAfter) {
      searchParams.append('publishedAfter', filters.publishedAfter);
    }

    const searchResponse = await fetch(`${this.baseUrl}/search?${searchParams}`);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      throw new Error(`YouTube Search API error: ${searchResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // Get detailed video information
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
      embedUrl: `https://www.youtube.com/embed/${item.id}`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
      relevanceScore: 0 // Will be calculated later
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

    // View count and engagement (normalized)
    const viewScore = Math.min(video.viewCount / 100000, 10); // Max 10 points for views
    const likeScore = Math.min((video.likeCount || 0) / 1000, 5); // Max 5 points for likes
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
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    
    return hours * 60 + minutes;
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
}

export const enhancedYouTubeAPI = new EnhancedYouTubeAPI();