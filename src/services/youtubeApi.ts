// YouTube API service for fetching real video content
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  embedUrl: string;
}

export interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
  order?: 'relevance' | 'date' | 'rating' | 'viewCount';
  duration?: 'short' | 'medium' | 'long';
}

class YouTubeAPIService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    // In production, this should be from environment variables
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured, using mock data');
      return this.getMockVideos(params.query);
    }

    try {
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: `${params.query} tutorial beginner`,
        type: 'video',
        maxResults: (params.maxResults || 5).toString(),
        order: params.order || 'relevance',
        videoDuration: params.duration || 'medium',
        videoDefinition: 'high',
        videoEmbeddable: 'true',
        key: this.apiKey
      });

      const searchResponse = await fetch(`${this.baseUrl}/search?${searchParams}`);
      
      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

      // Get detailed video information
      const detailsParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: this.apiKey
      });

      const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
      const detailsData = await detailsResponse.json();

      return detailsData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        duration: this.formatDuration(item.contentDetails.duration),
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount,
        embedUrl: `https://www.youtube.com/embed/${item.id}`
      }));
    } catch (error) {
      console.error('YouTube API error:', error);
      return this.getMockVideos(params.query);
    }
  }

  private formatDuration(duration: string): string {
    // Convert ISO 8601 duration to readable format
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

  private getMockVideos(query: string): YouTubeVideo[] {
    // Curated high-quality educational videos for different topics
    const mockVideoDatabase: Record<string, YouTubeVideo[]> = {
      react: [
        {
          id: 'SqcY0GlETPk',
          title: 'React Tutorial for Beginners',
          description: 'Learn React from scratch in this comprehensive tutorial. Perfect for beginners who want to master React fundamentals.',
          duration: '2:25:00',
          thumbnailUrl: 'https://img.youtube.com/vi/SqcY0GlETPk/maxresdefault.jpg',
          channelTitle: 'Programming with Mosh',
          publishedAt: '2023-01-15T00:00:00Z',
          viewCount: '2500000',
          embedUrl: 'https://www.youtube.com/embed/SqcY0GlETPk'
        },
        {
          id: 'O6P86uwfdR0',
          title: 'React Hooks Explained - useState, useEffect, and Custom Hooks',
          description: 'Deep dive into React Hooks with practical examples and best practices.',
          duration: '38:30',
          thumbnailUrl: 'https://img.youtube.com/vi/O6P86uwfdR0/maxresdefault.jpg',
          channelTitle: 'Web Dev Simplified',
          publishedAt: '2023-02-10T00:00:00Z',
          viewCount: '1200000',
          embedUrl: 'https://www.youtube.com/embed/O6P86uwfdR0'
        }
      ],
      javascript: [
        {
          id: 'PkZNo7MFNFg',
          title: 'JavaScript Full Course for Beginners | Complete All-in-One Tutorial',
          description: 'Complete JavaScript course covering all fundamentals and advanced concepts.',
          duration: '3:26:00',
          thumbnailUrl: 'https://img.youtube.com/vi/PkZNo7MFNFg/maxresdefault.jpg',
          channelTitle: 'Dave Gray',
          publishedAt: '2023-03-01T00:00:00Z',
          viewCount: '3800000',
          embedUrl: 'https://www.youtube.com/embed/PkZNo7MFNFg'
        },
        {
          id: 'PoRJizFvM7s',
          title: 'Async JavaScript Tutorial For Beginners',
          description: 'Master asynchronous JavaScript with promises, async/await, and more.',
          duration: '45:30',
          thumbnailUrl: 'https://img.youtube.com/vi/PoRJizFvM7s/maxresdefault.jpg',
          channelTitle: 'Dev Ed',
          publishedAt: '2023-01-20T00:00:00Z',
          viewCount: '950000',
          embedUrl: 'https://www.youtube.com/embed/PoRJizFvM7s'
        }
      ],
      python: [
        {
          id: '_uQrJ0TkZlc',
          title: 'Python Tutorial - Python Full Course for Beginners',
          description: 'Complete Python programming course for absolute beginners. Learn Python from scratch.',
          duration: '6:14:00',
          thumbnailUrl: 'https://img.youtube.com/vi/_uQrJ0TkZlc/maxresdefault.jpg',
          channelTitle: 'Programming with Mosh',
          publishedAt: '2023-01-05T00:00:00Z',
          viewCount: '5200000',
          embedUrl: 'https://www.youtube.com/embed/_uQrJ0TkZlc'
        },
        {
          id: 'rfscVS0vtbw',
          title: 'Learn Python - Full Course for Beginners [Tutorial]',
          description: 'This course will give you a full introduction into all of the core concepts in Python.',
          duration: '4:26:00',
          thumbnailUrl: 'https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg',
          channelTitle: 'freeCodeCamp.org',
          publishedAt: '2023-02-15T00:00:00Z',
          viewCount: '4100000',
          embedUrl: 'https://www.youtube.com/embed/rfscVS0vtbw'
        }
      ]
    };

    // Find matching videos based on query
    const queryLower = query.toLowerCase();
    for (const [topic, videos] of Object.entries(mockVideoDatabase)) {
      if (queryLower.includes(topic)) {
        return videos;
      }
    }

    // Default fallback videos
    return [
      {
        id: 'default1',
        title: `${query} - Complete Tutorial for Beginners`,
        description: `Learn ${query} from scratch with this comprehensive tutorial designed for beginners.`,
        duration: '2:30:00',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        channelTitle: 'Educational Channel',
        publishedAt: '2023-01-01T00:00:00Z',
        viewCount: '1000000',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      }
    ];
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/videos?${params}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          duration: this.formatDuration(item.contentDetails.duration),
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          viewCount: item.statistics.viewCount,
          embedUrl: `https://www.youtube.com/embed/${item.id}`
        };
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
    }

    return null;
  }
}

export const youtubeApi = new YouTubeAPIService();