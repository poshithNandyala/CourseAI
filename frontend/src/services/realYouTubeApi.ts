// Real YouTube API service that fetches actual videos consistently
import { userApiKeyService } from "./userApiKeyService";

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
  order?: "relevance" | "date" | "rating" | "viewCount";
  duration?: "short" | "medium" | "long";
  publishedAfter?: string;
  apiKey?: string;
}

class RealYouTubeAPI {
  private backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  private getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeVideo[]> {
    let youtubeApiKey = params.apiKey;
    
    // Try to get user's API key if not provided
    if (!youtubeApiKey) {
      try {
        youtubeApiKey = await userApiKeyService.getYouTubeApiKey();
      } catch (error) {
        console.error("❌ User's YouTube API key is missing!");
        throw new Error(
          "YouTube API key is required. Please configure your API keys in Settings."
        );
      }
    }

    try {
      console.log(`🔍 Direct YouTube API search for: "${params.query}"`);
      console.log(`📊 Search parameters:`, {
        query: params.query,
        maxResults: params.maxResults,
        order: params.order,
        duration: params.duration
      });

      const response = await fetch(`${this.backendUrl}/api/v1/youtube/search`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          query: params.query,
          maxResults: params.maxResults || 10,
          order: params.order || "relevance",
          duration: params.duration || "medium",
          publishedAfter: params.publishedAfter,
          apiKey: youtubeApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${response.status} - ${errorData.message}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.data.length} real YouTube videos`);
      return data.data;
    } catch (error) {
      console.error("❌ YouTube API error:", error);
      throw error;
    }
  }

  async searchEducationalVideos(
    topic: string,
    subtopic: string,
    maxResults = 3,
    apiKey?: string
  ): Promise<YouTubeVideo[]> {
    let youtubeApiKey = apiKey;
    
    // Try to get user's API key if not provided
    if (!youtubeApiKey) {
      try {
        youtubeApiKey = await userApiKeyService.getYouTubeApiKey();
      } catch (error) {
        console.error("❌ User's YouTube API key is missing!");
        throw new Error(
          "YouTube API key is required. Please configure your API keys in Settings."
        );
      }
    }

    try {
      console.log(`🎓 Educational video search for subtopic: "${subtopic}" in topic: "${topic}"`);
      
      const response = await fetch(`${this.backendUrl}/api/v1/youtube/search-educational`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          topic,
          subtopic,
          maxResults: maxResults || 5,
          apiKey: youtubeApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${response.status} - ${errorData.message}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("❌ YouTube educational API error:", error);
      throw error;
    }
  }
}

export const realYouTubeAPI = new RealYouTubeAPI();
