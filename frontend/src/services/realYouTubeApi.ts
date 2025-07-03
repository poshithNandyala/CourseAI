// Real YouTube API service that fetches actual videos consistently
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
      console.error('❌ YouTube API key is missing!');
      throw new Error('YouTube API key is required. Please add VITE_YOUTUBE_API_KEY to your .env file');
    }

    try {
      console.log(`🔍 Searching YouTube for: "${params.query}"`);
      
      // Step 1: Search for videos with multiple strategies
      const searchStrategies = [
        `${params.query} tutorial`,
        `${params.query} explained`,
        `${params.query} course`,
        `learn ${params.query}`,
        `${params.query} basics`
      ];

      let allVideos: YouTubeVideo[] = [];

      for (const searchQuery of searchStrategies) {
        if (allVideos.length >= (params.maxResults || 10)) break;

        try {
          const searchParams = new URLSearchParams({
            part: 'snippet',
            q: searchQuery,
            type: 'video',
            maxResults: '10',
            order: params.order || 'relevance',
            videoDuration: params.duration || 'medium',
            videoDefinition: 'high',
            videoEmbeddable: 'true',
            videoSyndicated: 'true',
            safeSearch: 'strict',
            relevanceLanguage: 'en',
            regionCode: 'US',
            key: this.apiKey
          });

          if (params.publishedAfter) {
            searchParams.append('publishedAfter', params.publishedAfter);
          }

          const searchResponse = await fetch(`${this.baseUrl}/search?${searchParams}`);
          
          if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            console.error('YouTube Search API error:', errorData);
            continue; // Try next strategy
          }

          const searchData = await searchResponse.json();
          
          if (searchData.items && searchData.items.length > 0) {
            const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

            // Get detailed video information
            const detailsParams = new URLSearchParams({
              part: 'snippet,contentDetails,statistics',
              id: videoIds,
              key: this.apiKey
            });

            const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
            
            if (detailsResponse.ok) {
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
                embedUrl: `https://www.youtube.com/embed/${item.id}?rel=0&modestbranding=1`,
                watchUrl: `https://www.youtube.com/watch?v=${item.id}`
              }));

              allVideos = [...allVideos, ...videos];
            }
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.warn(`Failed search strategy: ${searchQuery}`, error);
          continue;
        }
      }

      // Remove duplicates and return best results
      const uniqueVideos = allVideos.filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      );

      // Sort by view count and relevance
      const sortedVideos = uniqueVideos
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, params.maxResults || 10);

      console.log(`✅ Found ${sortedVideos.length} real YouTube videos`);
      return sortedVideos;

    } catch (error) {
      console.error('❌ YouTube API error:', error);
      throw error;
    }
  }

  async searchEducationalVideos(topic: string, subtopic: string, maxResults = 3): Promise<YouTubeVideo[]> {
    const searchQuery = `${topic} ${subtopic} tutorial beginner explained`;
    
    return this.searchVideos({
      query: searchQuery,
      maxResults,
      order: 'relevance',
      duration: 'medium',
      publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // Last year
    });
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