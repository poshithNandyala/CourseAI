import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { youtubeService } from '../services/youtube.service.js';

// Search for YouTube videos
const searchVideos = async (req, res) => {
  try {
    const { query, maxResults, order, duration, publishedAfter, apiKey } = req.body;

    if (!query) {
      throw new ApiError(400, 'Search query is required');
    }

    if (!apiKey) {
      throw new ApiError(400, 'YouTube API key is required');
    }

    const searchParams = {
      query,
      maxResults: maxResults || 10,
      order: order || 'relevance',
      duration: duration || 'medium',
      publishedAfter
    };

    const videos = await youtubeService.searchVideos(searchParams, apiKey);

    return res.status(200).json(
      new ApiResponse(200, videos, 'Videos found successfully')
    );
  } catch (error) {
    console.error('Error searching videos:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to search videos')
    );
  }
};

// Search for educational videos
const searchEducationalVideos = async (req, res) => {
  try {
    const { topic, subtopic, maxResults, apiKey } = req.body;

    if (!topic || !subtopic) {
      throw new ApiError(400, 'Topic and subtopic are required');
    }

    if (!apiKey) {
      throw new ApiError(400, 'YouTube API key is required');
    }

    const videos = await youtubeService.searchEducationalVideos(
      topic,
      subtopic,
      maxResults || 3,
      apiKey
    );

    return res.status(200).json(
      new ApiResponse(200, videos, 'Educational videos found successfully')
    );
  } catch (error) {
    console.error('Error searching educational videos:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to search educational videos')
    );
  }
};

export {
  searchVideos,
  searchEducationalVideos
};
