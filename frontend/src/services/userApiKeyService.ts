const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface UserApiKeys {
  geminiApiKey: string;
  youtubeApiKey: string;
}

class UserApiKeyService {
  private cachedKeys: UserApiKeys | null = null;
  private lastFetch: number = 0;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get user's decrypted API keys (cached for performance)
  async getUserApiKeys(): Promise<UserApiKeys> {
    const now = Date.now();
    
    // Return cached keys if still valid
    if (this.cachedKeys && (now - this.lastFetch) < this.cacheTimeout) {
      return this.cachedKeys;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api-keys/keys`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get API keys');
      }

      const result = await response.json();
      this.cachedKeys = result.data;
      this.lastFetch = now;
      
      return this.cachedKeys;
    } catch (error) {
      // Clear cache on error
      this.cachedKeys = null;
      this.lastFetch = 0;
      throw error;
    }
  }

  // Clear cache (call when keys are updated)
  clearCache(): void {
    this.cachedKeys = null;
    this.lastFetch = 0;
  }

  // Check if user has valid API keys without fetching them
  async hasValidApiKeys(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys/status`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const status = result.data;
      
      return status.gemini.status === 'valid' && status.youtube.status === 'valid';
    } catch (error) {
      console.error('Failed to check API keys status:', error);
      return false;
    }
  }

  // Get specific API key
  async getGeminiApiKey(): Promise<string> {
    const keys = await this.getUserApiKeys();
    if (!keys.geminiApiKey) {
      throw new Error('Gemini API key not configured. Please set it up in Settings.');
    }
    return keys.geminiApiKey;
  }

  async getYouTubeApiKey(): Promise<string> {
    const keys = await this.getUserApiKeys();
    if (!keys.youtubeApiKey) {
      throw new Error('YouTube API key not configured. Please set it up in Settings.');
    }
    return keys.youtubeApiKey;
  }
}

export const userApiKeyService = new UserApiKeyService();
