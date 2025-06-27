// Real YouTube API service that fetches actual videos
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
}

export interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
  order?: 'relevance' | 'date' | 'rating' | 'viewCount';
  duration?: 'short' | 'medium' | 'long';
  publishedAfter?: string;
}

class RealYouTubeAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key is required. Please add VITE_YOUTUBE_API_KEY to your .env file');
    }

    try {
      // Step 1: Search for videos
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: params.query,
        type: 'video',
        maxResults: (params.maxResults || 10).toString(),
        order: params.order || 'relevance',
        videoDuration: params.duration || 'medium',
        videoDefinition: 'high',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        videoLicense: 'any',
        safeSearch: 'strict',
        relevanceLanguage: 'en',
        regionCode: 'US',
        key: this.apiKey
      });

      if (params.publishedAfter) {
        searchParams.append('publishedAfter', params.publishedAfter);
      }

      console.log('🔍 Searching YouTube for:', params.query);
      const searchResponse = await fetch(`${this.baseUrl}/search?${searchParams}`);
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(`YouTube Search API error: ${searchResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        console.warn('No videos found for query:', params.query);
        return [];
      }

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

      // Step 2: Get detailed video information
      const detailsParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: this.apiKey
      });

      console.log('📊 Fetching video details for', searchData.items.length, 'videos');
      const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
      
      if (!detailsResponse.ok) {
        throw new Error(`YouTube Videos API error: ${detailsResponse.status}`);
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
        embedUrl: `https://www.youtube.com/embed/${item.id}`,
        watchUrl: `https://www.youtube.com/watch?v=${item.id}`
      }));

      console.log('✅ Successfully fetched', videos.length, 'real YouTube videos');
      return videos;

    } catch (error) {
      console.error('❌ YouTube API error:', error);
      throw error;
    }
  }

  async searchEducationalVideos(topic: string, subtopic: string, maxResults = 3): Promise<YouTubeVideo[]> {
    const queries = [
      `${topic} ${subtopic} tutorial beginner`,
      `${topic} ${subtopic} explained`,
      `${topic} ${subtopic} course`,
      `learn ${topic} ${subtopic}`,
      `${topic} ${subtopic} basics`
    ];

    let allVideos: YouTubeVideo[] = [];

    for (const query of queries) {
      try {
        const videos = await this.searchVideos({
          query,
          maxResults: Math.ceil(maxResults / queries.length) + 1,
          order: 'relevance',
          duration: 'medium',
          publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // Last year
        });

        allVideos = [...allVideos, ...videos];
        
        if (allVideos.length >= maxResults) break;
      } catch (error) {
        console.warn(`Failed to search for: ${query}`, error);
        continue;
      }
    }

    // Remove duplicates and sort by relevance (view count + like count)
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    return uniqueVideos
      .sort((a, b) => (b.viewCount + (b.likeCount || 0)) - (a.viewCount + (a.likeCount || 0)))
      .slice(0, maxResults);
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

export const realYouTubeAPI = new RealYouTubeAPI();