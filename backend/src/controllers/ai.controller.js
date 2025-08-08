import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { aiService } from '../services/ai.service.js';

// Generate course content using OpenAI
const generateCourse = async (req, res) => {
  try {
    const { topic, difficulty, duration, includeProjects, apiKey } = req.body;

    if (!topic || !difficulty || !duration) {
      throw new ApiError(400, 'Topic, difficulty, and duration are required');
    }

    if (!apiKey) {
      throw new ApiError(400, 'OpenAI API key is required');
    }

    const courseData = await aiService.generateCourseWithOpenAI({
      topic,
      difficulty,
      duration,
      includeProjects,
      apiKey
    });

    return res.status(200).json(
      new ApiResponse(200, courseData, 'Course generated successfully')
    );
  } catch (error) {
    console.error('Error generating course:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to generate course')
    );
  }
};

// Extract topic structure using Gemini
const extractTopicStructure = async (req, res) => {
  try {
    const { userPrompt, apiKey } = req.body;

    if (!userPrompt) {
      throw new ApiError(400, 'User prompt is required');
    }

    if (!apiKey) {
      throw new ApiError(400, 'Gemini API key is required');
    }

    const topicStructure = await aiService.extractTopicWithGemini({
      userPrompt,
      apiKey
    });

    return res.status(200).json(
      new ApiResponse(200, topicStructure, 'Topic structure extracted successfully')
    );
  } catch (error) {
    console.error('Error extracting topic structure:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to extract topic structure')
    );
  }
};

// Generate course structure using Gemini
const generateCourseStructure = async (req, res) => {
  try {
    const { extractedTopic, apiKey } = req.body;

    if (!extractedTopic) {
      throw new ApiError(400, 'Extracted topic data is required');
    }

    if (!apiKey) {
      throw new ApiError(400, 'Gemini API key is required');
    }

    const courseStructure = await aiService.generateCourseStructureWithGemini({
      extractedTopic,
      apiKey
    });

    return res.status(200).json(
      new ApiResponse(200, courseStructure, 'Course structure generated successfully')
    );
  } catch (error) {
    console.error('Error generating course structure:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to generate course structure')
    );
  }
};

// Generate comprehensive quiz using Gemini
const generateComprehensiveQuiz = async (req, res) => {
  try {
    console.log(`🧪 Quiz generation request received`);
    const { topic, lessonTitle, lessonContent, questionsPerLesson, apiKey } = req.body;

    console.log(`📋 Request params:`, {
      topic: topic || 'NOT PROVIDED',
      lessonTitle: lessonTitle || 'NOT PROVIDED', 
      lessonContent: lessonContent ? `${lessonContent.length} chars` : 'NOT PROVIDED',
      questionsPerLesson: questionsPerLesson || 'NOT PROVIDED',
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT PROVIDED'
    });

    if (!topic || !lessonTitle || !lessonContent) {
      throw new ApiError(400, 'Topic, lesson title, and lesson content are required');
    }

    if (!apiKey) {
      console.error('❌ No API key provided in request');
      throw new ApiError(400, 'Gemini API key is required');
    }

    console.log(`🚀 Calling AI service to generate quiz...`);
    const quizQuestions = await aiService.generateQuizWithGemini({
      topic,
      lessonTitle,
      lessonContent,
      questionsPerLesson: questionsPerLesson || 30,
      apiKey
    });

    console.log(`✅ Quiz generation completed. Generated ${quizQuestions.length} questions`);
    
    return res.status(200).json(
      new ApiResponse(200, quizQuestions, 'Quiz questions generated successfully')
    );
  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to generate quiz')
    );
  }
};

// Generate lesson summary using Gemini
const generateLessonSummary = async (req, res) => {
  try {
    const { lessonTitle, lessonContent, apiKey } = req.body;

    if (!lessonTitle || !lessonContent) {
      throw new ApiError(400, 'Lesson title and content are required');
    }

    if (!apiKey) {
      throw new ApiError(400, 'Gemini API key is required');
    }

    const summary = await aiService.generateLessonSummaryWithGemini({
      lessonTitle,
      lessonContent,
      apiKey
    });

    return res.status(200).json(
      new ApiResponse(200, { summary }, 'Lesson summary generated successfully')
    );
  } catch (error) {
    console.error('Error generating lesson summary:', error);
    return res.status(error.statusCode || 500).json(
      new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to generate lesson summary')
    );
  }
};

export {
  generateCourse,
  extractTopicStructure,
  generateCourseStructure,
  generateComprehensiveQuiz,
  generateLessonSummary
};
