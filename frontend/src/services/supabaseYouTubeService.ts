// Supabase-integrated YouTube service that properly stores and retrieves video data

import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
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
  likeCount: number;
  embedUrl: string;
  watchUrl: string;
  relevanceScore: number;
}

class SupabaseYouTubeService {
  private backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  private getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Get user's API key dynamically
  private async getApiKey(): Promise<string> {
    return await userApiKeyService.getYouTubeApiKey();
  }

  private isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return (
      url &&
      key &&
      !url.includes("your_supabase_project_url") &&
      !key.includes("your_supabase_anon_key") &&
      url.startsWith("http")
    );
  }

  async searchAndStoreVideosUnique(
    mainTopic: string,
    subtopic: string,
    maxResults = 3,
    usedVideoIds?: Set<string>
  ): Promise<YouTubeVideo[]> {
    const videos = await this.searchAndStoreVideos(
      mainTopic,
      subtopic,
      maxResults * 3,
      usedVideoIds
    ); // Search for more to account for filtering
    return videos.slice(0, maxResults);
  }

  async searchAndStoreVideos(
    mainTopic: string,
    subtopic: string,
    maxResults = 3,
    usedVideoIds?: Set<string>
  ): Promise<YouTubeVideo[]> {
    let apiKey: string;
    try {
      apiKey = await this.getApiKey();
    } catch (error) {
      console.error("❌ User's YouTube API key is missing!");
      throw new Error(
        "YouTube API key is required. Please configure your API keys in Settings."
      );
    }

    console.log(`🎯 SUBTOPIC-FOCUSED YouTube search: "${subtopic}" within "${mainTopic}"`);

    try {
      let allVideos: YouTubeVideo[] = [];

      // Generate subtopic-focused search queries for better relevance
      const searchQueries = this.generateImprovedSearchQueries(
        mainTopic,
        subtopic
      );

      console.log(`🔍 Generated ${searchQueries.length} subtopic-focused search strategies`);

      for (const query of searchQueries) {
        if (allVideos.length >= maxResults * 2) break;

        try {
          console.log(`  🎯 Advanced search: "${query}"`);
          const videos = await this.performYouTubeSearch(query, apiKey);
          console.log(`  ✨ Found ${videos.length} extraordinary videos with avg quality score: ${videos.reduce((sum, v) => sum + (v.relevanceScore || 0), 0) / videos.length || 0}`);
          allVideos = [...allVideos, ...videos];

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`Failed search for "${query}":`, error);
          continue;
        }
      }

      // Remove duplicates and score
      const uniqueVideos = this.removeDuplicatesAndScore(
        allVideos,
        mainTopic,
        subtopic
      );

      // Filter out already used videos across lessons
      const filteredVideos = usedVideoIds
        ? uniqueVideos.filter((video) => !usedVideoIds.has(video.id))
        : uniqueVideos;

      // Additional filtering for quality and English content
      const qualityVideos = filteredVideos.filter(video => {
        // Filter out videos with very low relevance scores
        if (video.relevanceScore < 20) return false;
        
        // Double-check English content
        if (!this.isLikelyEnglish(video.title, video.description, video.channelTitle)) {
          return false;
        }
        
        // Filter out videos with very low view counts for quality
        if (video.viewCount < 500) return false;
        
        return true;
      });

      // Sort by relevance and return top results
      const bestVideos = qualityVideos
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(
        `✅ Found ${bestVideos.length} relevant videos for "${subtopic}"`
      );
      return bestVideos;
    } catch (error) {
      console.error(`❌ YouTube search failed for "${subtopic}":`, error);
      throw error;
    }
  }

  private isLikelyEnglish(title: string, description: string, channelTitle: string): boolean {
    // Common English words that indicate English content
    const englishIndicators = [
      'the', 'and', 'for', 'how', 'to', 'tutorial', 'guide', 'learn', 'course',
      'explained', 'complete', 'beginner', 'advanced', 'training', 'education',
      'step', 'by', 'with', 'about', 'what', 'why', 'when', 'where', 'best',
      'top', 'ultimate', 'comprehensive', 'master', 'professional', 'expert'
    ];

    // Non-English characters that indicate non-English content
    const nonEnglishPatterns = [
      /[\u4e00-\u9fff]/g, // Chinese characters
      /[\u3040-\u309f]/g, // Hiragana
      /[\u30a0-\u30ff]/g, // Katakana
      /[\u0400-\u04ff]/g, // Cyrillic
      /[\u0590-\u05ff]/g, // Hebrew
      /[\u0600-\u06ff]/g, // Arabic
      /[\u0900-\u097f]/g, // Devanagari (Hindi)
      /[\u1100-\u11ff]/g, // Hangul (Korean)
    ];

    const combinedText = `${title} ${description} ${channelTitle}`.toLowerCase();
    
    // Check for non-English characters (strong indicator)
    for (const pattern of nonEnglishPatterns) {
      if (pattern.test(combinedText)) {
        return false;
      }
    }

    // Check for English words
    const englishWordCount = englishIndicators.filter(word => 
      combinedText.includes(word)
    ).length;

    // Must have at least 3 English indicator words
    return englishWordCount >= 3;
  }

  private async performYouTubeSearch(
    query: string,
    apiKey: string
  ): Promise<YouTubeVideo[]> {
    try {
      console.log(`🎯 Using advanced YouTube search for: "${query}"`);
      
      // Use the new backend service for extraordinary video selection
      const response = await fetch(`${this.backendUrl}/api/v1/youtube/search`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          query: query,
          maxResults: 15, // Get more for better selection
          order: "relevance",
          duration: "medium",
          apiKey: apiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${response.status} - ${errorData.message}`);
      }

      const data = await response.json();
      const videos = data.data || [];

      // Map to our interface format
      return videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        viewCount: video.viewCount,
        likeCount: video.likeCount || 0,
        embedUrl: video.embedUrl,
        watchUrl: video.watchUrl,
        relevanceScore: video.qualityScore || 0
      }));
    } catch (error) {
      console.error('❌ Advanced YouTube search failed:', error);
      throw error;
    }
  }

  private removeDuplicatesAndScore(
    videos: YouTubeVideo[],
    mainTopic: string,
    subtopic: string
  ): YouTubeVideo[] {
    // Remove duplicates by video ID
    const uniqueVideos = videos.filter(
      (video, index, self) => index === self.findIndex((v) => v.id === video.id)
    );

    // Calculate relevance scores
    return uniqueVideos.map((video) => ({
      ...video,
      relevanceScore: this.calculateRelevanceScore(video, mainTopic, subtopic),
    }));
  }

  private calculateRelevanceScore(
    video: YouTubeVideo,
    mainTopic: string,
    subtopic: string
  ): number {
    let score = 0;

    const titleLower = video.title.toLowerCase();
    const descriptionLower = video.description.toLowerCase();
    const channelLower = video.channelTitle.toLowerCase();
    const mainTopicLower = mainTopic.toLowerCase();
    const subtopicLower = subtopic.toLowerCase();

    // Title relevance (highest weight) - exact topic matching
    if (titleLower.includes(mainTopicLower)) score += 40;
    if (titleLower.includes(subtopicLower)) score += 35;

    // Bonus for having both main topic and subtopic in title
    if (
      titleLower.includes(mainTopicLower) &&
      titleLower.includes(subtopicLower)
    )
      score += 20;

    // Educational keywords (enhanced with more weight)
    const educationalKeywords = [
      "tutorial",
      "course",
      "guide",
      "how to",
      "step by step",
      "explained",
      "beginner",
      "complete",
      "comprehensive",
      "masterclass",
      "professional",
      "training",
      "lesson",
      "learn",
      "education",
      "teach",
      "basics",
      "fundamentals",
      "advanced",
      "intermediate",
    ];
    educationalKeywords.forEach((keyword) => {
      if (titleLower.includes(keyword)) score += 15; // Increased weight
    });

    // Description relevance
    if (descriptionLower.includes(mainTopicLower)) score += 10;
    if (descriptionLower.includes(subtopicLower)) score += 10;

    // Topic-specific scoring
    if (
      mainTopicLower.includes("beauty") ||
      mainTopicLower.includes("skincare") ||
      mainTopicLower.includes("makeup")
    ) {
      // Beauty-specific channels and keywords
      const beautyChannels = [
        "james welsh",
        "hyram",
        "gothamista",
        "mixed makeup",
        "skincare by hyram",
        "cassandra bankson",
        "dr dray",
      ];
      const beautyKeywords = [
        "skincare",
        "routine",
        "glow",
        "acne",
        "anti-aging",
        "moisturizer",
        "serum",
        "cleanser",
        "makeup",
        "foundation",
        "concealer",
      ];

      if (beautyChannels.some((channel) => channelLower.includes(channel)))
        score += 25;
      beautyKeywords.forEach((keyword) => {
        if (titleLower.includes(keyword) || descriptionLower.includes(keyword))
          score += 8;
      });
    }

    // General educational channels (expanded with more popular English channels)
    const educationalChannels = [
      "khan academy",
      "coursera",
      "edx",
      "mit",
      "stanford",
      "harvard",
      "crash course",
      "ted-ed",
      "freeCodeCamp",
      "codecademy",
      "udemy",
      "pluralsight",
      "microsoft",
      "google",
      "facebook",
      "youtube creators",
      "programming with mosh",
      "the net ninja",
      "traversy media",
      "academind",
      "coding train",
      "sentdex",
      "corey schafer",
      "derek banas",
      "newboston",
      "codeacademy",
      "edureka",
      "simplilearn",
      "intellipaat",
      "great learning",
    ];
    if (educationalChannels.some((channel) => channelLower.includes(channel))) {
      score += 30; // Increased weight for trusted educational channels
    }

    // Bonus for English-speaking regions in channel names
    const englishRegionIndicators = [
      "usa", "uk", "canada", "australia", "america", "british", "english",
      "academy", "university", "college", "school", "institute", "education"
    ];
    if (englishRegionIndicators.some((indicator) => channelLower.includes(indicator))) {
      score += 10;
    }

    // Professional/Expert indicators
    const expertIndicators = [
      "dr ",
      "professor",
      "phd",
      "expert",
      "professional",
      "certified",
      "licensed",
    ];
    if (
      expertIndicators.some(
        (indicator) =>
          titleLower.includes(indicator) || channelLower.includes(indicator)
      )
    ) {
      score += 15;
    }

    // View count and engagement (improved scoring)
    // Minimum view count requirement for quality content
    if (video.viewCount < 1000) score -= 20; // Penalize very low view count
    else if (video.viewCount < 5000) score -= 10; // Slightly penalize low view count
    else if (video.viewCount >= 50000) score += 10; // Bonus for popular content
    
    const viewScore = Math.min(Math.log10(video.viewCount + 1) * 2, 15); // Logarithmic scaling
    const likeScore =
      video.viewCount > 0
        ? Math.min((video.likeCount / video.viewCount) * 100, 10)
        : 0; // Like ratio
    score += viewScore + likeScore;

    // Video duration preference (prefer educational length videos)
    const durationParts = video.duration.split(":");
    const totalMinutes =
      durationParts.length === 2
        ? parseInt(durationParts[0])
        : parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);

    // Heavily penalize shorts (under 1 minute) - not educational
    if (totalMinutes < 1) score -= 60;
    // Penalize very short videos (1-3 minutes, likely shorts or clips)
    else if (totalMinutes >= 1 && totalMinutes < 3) score -= 30;
    // Slightly penalize short videos (3-5 minutes, might be incomplete)
    else if (totalMinutes >= 3 && totalMinutes < 5) score -= 10;
    // Optimal length for educational content
    else if (totalMinutes >= 5 && totalMinutes <= 25) score += 20;
    // Good length for comprehensive content
    else if (totalMinutes >= 25 && totalMinutes <= 45) score += 15;
    // Acceptable for detailed tutorials
    else if (totalMinutes >= 45 && totalMinutes <= 90) score += 5;
    // Penalize very long videos (might be unfocused)
    else if (totalMinutes > 90) score -= 15;

    // Recent content bonus
    const publishDate = new Date(video.publishedAt);
    const monthsOld =
      (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld < 6) score += 8;
    else if (monthsOld < 12) score += 5;
    else if (monthsOld < 24) score += 2;

    // Penalty for obviously irrelevant content (expanded)
    const irrelevantKeywords = [
      "reaction",
      "drama",
      "gossip",
      "haul",
      "unboxing",
      "shopping",
      "try not to",
      "challenge",
      "prank",
      "compilation",
      "funny",
      "meme",
      "tiktok",
      "shorts",
      "vs",
      "tier list",
      "vlog",
      "storytime",
      "rant",
      "roast",
      "cringe",
      "clickbait",
      "exposed",
      "leaked",
      "secret",
      "hack",
      "trick",
      "amazing",
      "incredible",
      "insane",
      "crazy",
      "shocking",
      "unbelievable",
      "you won't believe",
      "must watch",
      "gone wrong",
      "fail",
      "wtf",
      "omg",
      "lol",
      "lmao",
      "subscribe",
      "like and subscribe",
      "smash that like",
    ];
    irrelevantKeywords.forEach((keyword) => {
      if (titleLower.includes(keyword)) score -= 30; // Increased penalty
    });

    // Heavy penalty for non-English indicators
    const nonEnglishIndicators = [
      "hindi", "español", "français", "deutsch", "中文", "日本語", "한국어",
      "português", "русский", "türkçe", "italiano", "nederlands", "svenska",
      "polski", "čeština", "magyar", "română", "українська", "العربية",
      "हिन्दी", "বাংলা", "தமிழ்", "తెలుగు", "ગુજરાતી", "मराठी", "ಕನ್ನಡ",
      "മലയാളം", "ଓଡ଼ିଆ", "ਪੰਜਾਬੀ", "اردو", "فارسی", "עברית", "ไทย", "Tiếng Việt",
      "bahasa", "tagalog", "urdu", "farsi", "persian", "arabic", "chinese",
      "japanese", "korean", "vietnamese", "thai", "indonesian", "malay"
    ];
    nonEnglishIndicators.forEach((indicator) => {
      if (titleLower.includes(indicator) || descriptionLower.includes(indicator)) {
        score -= 50; // Heavy penalty for non-English content
      }
    });

    // Extra penalty for off-topic content
    if (
      !titleLower.includes(mainTopicLower) &&
      !titleLower.includes(subtopicLower)
    ) {
      score -= 30;
    }

    return Math.max(score, 0); // Ensure non-negative score
  }

  private generateImprovedSearchQueries(
    mainTopic: string,
    subtopic: string
  ): string[] {
    const topicLower = mainTopic.toLowerCase();
    const subtopicLower = subtopic.toLowerCase();

    // Premium search queries for extraordinary video selection
    const baseQueries = [
      `${subtopic} ${mainTopic} complete tutorial course`,
      `${subtopic} ${mainTopic} explained step by step`,
      `learn ${subtopic} ${mainTopic} comprehensive guide`,
      `${subtopic} ${mainTopic} masterclass full course`,
      `${subtopic} ${mainTopic} professional training`,
      `${subtopic} ${mainTopic} beginner to advanced`,
      `${subtopic} ${mainTopic} ultimate guide`,
      `${subtopic} ${mainTopic} deep dive tutorial`,
      `${subtopic} ${mainTopic} complete walkthrough`,
      `${subtopic} ${mainTopic} fundamentals explained`,
    ];

    // Topic-specific improvements
    let topicSpecificQueries: string[] = [];

    // Beauty and skincare specific searches
    if (
      topicLower.includes("beauty") ||
      topicLower.includes("skincare") ||
      topicLower.includes("makeup")
    ) {
      topicSpecificQueries = [
        `"${subtopic}" skincare routine`,
        `"${subtopic}" makeup tutorial`,
        `"${subtopic}" beauty tips`,
        `"${subtopic}" skincare guide`,
        `"${subtopic}" beauty technique`,
        `"${subtopic}" professional method`,
        `"${subtopic}" step by step beauty`,
        `"${subtopic}" skincare education`,
        `"${subtopic}" dermatologist advice`,
        `"${subtopic}" beauty science`,
      ];
    }

    // Programming specific searches
    else if (
      topicLower.includes("programming") ||
      topicLower.includes("coding") ||
      topicLower.includes("development") ||
      topicLower.includes("javascript") ||
      topicLower.includes("python") ||
      topicLower.includes("react") ||
      topicLower.includes("node")
    ) {
      topicSpecificQueries = [
        `${subtopic} ${mainTopic} complete course project`,
        `${subtopic} ${mainTopic} real world examples`,
        `${subtopic} ${mainTopic} from scratch tutorial`,
        `${subtopic} ${mainTopic} best practices guide`,
        `${subtopic} ${mainTopic} interview preparation`,
        `${subtopic} ${mainTopic} advanced concepts`,
        `${subtopic} ${mainTopic} practical coding`,
        `${subtopic} ${mainTopic} bootcamp style`,
      ];
    }

    // Science specific searches
    else if (
      topicLower.includes("science") ||
      topicLower.includes("physics") ||
      topicLower.includes("chemistry") ||
      topicLower.includes("biology")
    ) {
      topicSpecificQueries = [
        `${subtopic} science experiment`,
        `${subtopic} scientific explanation`,
        `${subtopic} laboratory`,
        `${subtopic} research study`,
        `${subtopic} scientific method`,
        `${subtopic} science documentary`,
      ];
    }

    // Business and marketing specific searches
    else if (
      topicLower.includes("business") ||
      topicLower.includes("marketing") ||
      topicLower.includes("finance")
    ) {
      topicSpecificQueries = [
        `${subtopic} business strategy`,
        `${subtopic} marketing tips`,
        `${subtopic} business case study`,
        `${subtopic} professional guide`,
        `${subtopic} business skills`,
        `${subtopic} industry insights`,
      ];
    }

    // Fitness and health specific searches
    else if (
      topicLower.includes("fitness") ||
      topicLower.includes("health") ||
      topicLower.includes("exercise")
    ) {
      topicSpecificQueries = [
        `${subtopic} workout`,
        `${subtopic} exercise routine`,
        `${subtopic} fitness training`,
        `${subtopic} health tips`,
        `${subtopic} personal trainer`,
        `${subtopic} fitness guide`,
      ];
    }

    // Art and design specific searches
    else if (
      topicLower.includes("art") ||
      topicLower.includes("design") ||
      topicLower.includes("drawing")
    ) {
      topicSpecificQueries = [
        `${subtopic} art tutorial`,
        `${subtopic} design process`,
        `${subtopic} artistic technique`,
        `${subtopic} creative process`,
        `${subtopic} art lesson`,
        `${subtopic} design principles`,
      ];
    }

    // Combine base and topic-specific queries
    const allQueries = [...baseQueries, ...topicSpecificQueries];

    // Add quality indicators to search terms
    const qualityIndicators = [
      "professional",
      "expert",
      "complete guide",
      "masterclass",
      "comprehensive",
    ];
    const enhancedQueries = qualityIndicators.map(
      (indicator) => `${indicator} ${subtopic} ${mainTopic}`
    );

    return [...allQueries, ...enhancedQueries].slice(0, 15); // Limit to avoid too many API calls
  }

  private formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1]?.replace("H", "") || "0");
    const minutes = parseInt(match[2]?.replace("M", "") || "0");
    const seconds = parseInt(match[3]?.replace("S", "") || "0");

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // Store video data in Supabase lesson
  async storeVideoDataInLesson(
    lessonId: string,
    videos: YouTubeVideo[]
  ): Promise<void> {
    if (!this.isSupabaseConfigured()) {
      console.log("📝 Demo mode: Video data stored locally");
      return;
    }

    try {
      const { error } = await supabase
        .from("lessons")
        .update({ video_data: videos })
        .eq("id", lessonId);

      if (error) throw error;
      console.log(`✅ Stored ${videos.length} videos in lesson ${lessonId}`);
    } catch (error) {
      console.error("❌ Error storing video data:", error);
      throw error;
    }
  }

  // Retrieve video data from Supabase lesson
  async getVideoDataFromLesson(lessonId: string): Promise<YouTubeVideo[]> {
    if (!this.isSupabaseConfigured()) {
      console.log("📖 Demo mode: Returning empty video data");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("video_data")
        .eq("id", lessonId)
        .single();

      if (error) throw error;

      const videos = data?.video_data || [];
      console.log(
        `📖 Retrieved ${videos.length} videos from lesson ${lessonId}`
      );
      return videos;
    } catch (error) {
      console.error("❌ Error retrieving video data:", error);
      return [];
    }
  }

  // Get all lessons with video data for a course
  async getCourseWithVideoData(courseId: string): Promise<any> {
    if (!this.isSupabaseConfigured()) {
      console.log("📖 Demo mode: Returning mock course data");
      return null;
    }

    try {
      // Get course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select(
          `
          *,
          creator:users(name, avatar_url)
        `
        )
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      // Get lessons with video data
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order", { ascending: true });

      if (lessonsError) throw lessonsError;

      // Enhance lessons with video data
      const enhancedLessons = (lessons || []).map((lesson) => ({
        ...lesson,
        videos: lesson.video_data || [],
      }));

      console.log(
        `✅ Retrieved course with ${enhancedLessons.length} lessons and video data`
      );
      return { ...course, lessons: enhancedLessons };
    } catch (error) {
      console.error("❌ Error retrieving course with video data:", error);
      return null;
    }
  }
}

export const supabaseYouTubeService = new SupabaseYouTubeService();
