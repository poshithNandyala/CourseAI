import fetch from "node-fetch";

class YouTubeService {
  constructor() {
    this.baseUrl = "https://www.googleapis.com/youtube/v3";
  }

  async searchVideos(params, apiKey) {
    try {
      console.log(`🔍 YouTube search for: "${params.query}"`);

      // Direct YouTube search - simple and effective
      const searchParams = new URLSearchParams({
        part: "snippet",
        q: params.query,
        type: "video",
        maxResults: String(params.maxResults || 10),
        order: params.order || "relevance",
        videoDuration: params.duration || "medium",
        videoDefinition: "high",
        videoEmbeddable: "true",
        safeSearch: "strict",
        relevanceLanguage: "en",
        regionCode: "US",
        key: apiKey,
      });

      // Add publishedAfter if specified
      if (params.publishedAfter) {
        searchParams.append("publishedAfter", params.publishedAfter);
      }

      console.log(`🔗 YouTube API URL: ${this.baseUrl}/search?${searchParams}`);

      const searchResponse = await fetch(
        `${this.baseUrl}/search?${searchParams}`
      );

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        console.error("❌ YouTube Search API error:", errorData);
        throw new Error(
          `YouTube API error: ${searchResponse.status} - ${errorData.error?.message || "Unknown error"}`
        );
      }

      const searchData = await searchResponse.json();
      console.log(
        `📊 YouTube returned ${searchData.items?.length || 0} videos`
      );

      if (!searchData.items || searchData.items.length === 0) {
        console.log("⚠️ No videos found for query");
        return [];
      }

      // Get detailed video information
      const videoIds = searchData.items
        .map((item) => item.id.videoId)
        .join(",");

      const detailsParams = new URLSearchParams({
        part: "snippet,contentDetails,statistics",
        id: videoIds,
        key: apiKey,
      });

      const detailsResponse = await fetch(
        `${this.baseUrl}/videos?${detailsParams}`
      );

      if (!detailsResponse.ok) {
        console.error("❌ YouTube Videos API error:", detailsResponse.status);
        throw new Error(`YouTube Videos API error: ${detailsResponse.status}`);
      }

      const detailsData = await detailsResponse.json();

      const videos = detailsData.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || "",
        duration: this.formatDuration(item.contentDetails.duration),
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || "0"),
        likeCount: parseInt(item.statistics.likeCount || "0"),
        commentCount: parseInt(item.statistics.commentCount || "0"),
        embedUrl: `https://www.youtube.com/embed/${item.id}?rel=0&modestbranding=1`,
        watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
      }));

      console.log(`✅ Successfully processed ${videos.length} videos`);
      return videos;
    } catch (error) {
      console.error("❌ YouTube search failed:", error);
      throw error;
    }
  }

  async searchEducationalVideos(topic, subtopic, maxResults, apiKey) {
    console.log(`🎓 Educational video search: "${subtopic}" (topic: ${topic})`);

    // Intelligent video count based on topic complexity and depth
    const intelligentVideoCount = this.determineVideoCount(
      topic,
      subtopic,
      maxResults
    );
    console.log(
      `🧠 Intelligent video count: ${intelligentVideoCount} (requested: ${maxResults || "auto"})`
    );

    // Create focused search query for the subtopic
    const searchQuery = this.buildSubtopicQuery(topic, subtopic);
    console.log(`🔍 Search query: "${searchQuery}"`);

    try {
      const videos = await this.searchVideos(
        {
          query: searchQuery,
          maxResults: intelligentVideoCount,
          order: "relevance",
          duration: "medium",
          publishedAfter: new Date(
            Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // Last 2 years
        },
        apiKey
      );

      console.log(
        `📚 Found ${videos.length} educational videos for "${subtopic}"`
      );

      // Log the top results for debugging
      if (videos.length > 0) {
        console.log(`🎯 Top results for "${subtopic}":`);
        videos.slice(0, 3).forEach((video, index) => {
          console.log(
            `  ${index + 1}. "${video.title}" by ${video.channelTitle}`
          );
        });
      }

      return videos;
    } catch (error) {
      console.error(
        `❌ Educational video search failed for "${subtopic}":`,
        error
      );
      throw error;
    }
  }

  determineVideoCount(topic, subtopic, maxResults) {
    // If maxResults is explicitly provided, respect it as a maximum
    const userLimit = maxResults || 8;

    // Analyze topic and subtopic complexity
    const topicComplexity = this.analyzeTopicComplexity(topic, subtopic);
    console.log(
      `📊 Topic complexity analysis: ${topicComplexity.level} (${topicComplexity.reason})`
    );

    // Determine video count based on complexity
    let videoCount;
    switch (topicComplexity.level) {
      case "basic":
        videoCount = Math.min(2, userLimit);
        break;
      case "intermediate":
        videoCount = Math.min(4, userLimit);
        break;
      case "advanced":
        videoCount = Math.min(6, userLimit);
        break;
      case "complex":
        videoCount = Math.min(8, userLimit);
        break;
      default:
        videoCount = Math.min(4, userLimit);
    }

    return Math.max(1, videoCount); // Always return at least 1 video
  }

  analyzeTopicComplexity(topic, subtopic) {
    const combined = `${topic} ${subtopic}`.toLowerCase();

    // Keywords that indicate different complexity levels
    const complexityIndicators = {
      basic: [
        "introduction",
        "intro",
        "basics",
        "fundamentals",
        "overview",
        "getting started",
        "beginner",
        "simple",
        "easy",
        "first steps",
        "what is",
        "definition",
      ],
      intermediate: [
        "understanding",
        "concepts",
        "principles",
        "methods",
        "techniques",
        "strategies",
        "implementation",
        "application",
        "practical",
        "how to",
        "tutorial",
      ],
      advanced: [
        "advanced",
        "deep dive",
        "in-depth",
        "detailed",
        "comprehensive",
        "analysis",
        "research",
        "theory",
        "framework",
        "model",
        "system",
        "architecture",
      ],
      complex: [
        "optimization",
        "algorithms",
        "mathematical",
        "statistical",
        "computational",
        "machine learning",
        "artificial intelligence",
        "quantum",
        "neural networks",
        "data science",
        "engineering",
        "calculus",
        "linear algebra",
        "differential",
      ],
    };

    // Count matches for each complexity level
    const scores = {};
    for (const [level, keywords] of Object.entries(complexityIndicators)) {
      scores[level] = keywords.filter((keyword) =>
        combined.includes(keyword)
      ).length;
    }

    // Determine the complexity level
    const maxScore = Math.max(...Object.values(scores));
    const complexityLevel =
      Object.keys(scores).find((level) => scores[level] === maxScore) ||
      "intermediate";

    // Additional heuristics
    const subtopicWords = subtopic.split(" ").length;
    let finalLevel = complexityLevel;
    let reason = `keyword analysis (${maxScore} matches)`;

    // Longer subtopics might need more videos to cover comprehensively
    if (subtopicWords > 6) {
      if (finalLevel === "basic") finalLevel = "intermediate";
      else if (finalLevel === "intermediate") finalLevel = "advanced";
      reason += `, long subtopic (${subtopicWords} words)`;
    }

    // Technical fields typically need more comprehensive coverage
    const technicalFields = [
      "programming",
      "engineering",
      "mathematics",
      "physics",
      "chemistry",
      "computer science",
      "data science",
      "machine learning",
      "artificial intelligence",
      "software development",
    ];
    if (technicalFields.some((field) => combined.includes(field))) {
      if (finalLevel === "basic") finalLevel = "intermediate";
      else if (finalLevel === "intermediate") finalLevel = "advanced";
      reason += ", technical field";
    }

    return {
      level: finalLevel,
      reason: reason,
      scores: scores,
    };
  }

  buildSubtopicQuery(topic, subtopic) {
    // Clean the inputs
    const cleanTopic = topic.replace(/[^\w\s-]/g, "").trim();
    const cleanSubtopic = subtopic.replace(/[^\w\s-]/g, "").trim();

    // Create a focused search query that prioritizes the subtopic
    const queries = [
      `${cleanSubtopic} tutorial`,
      `${cleanSubtopic} explained`,
      `${cleanSubtopic} guide`,
      `learn ${cleanSubtopic}`,
      `${cleanSubtopic} ${cleanTopic}`,
    ];

    // Use the first (most focused) query
    return queries[0];
  }

  formatDuration(duration) {
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
}

export const youtubeService = new YouTubeService();
