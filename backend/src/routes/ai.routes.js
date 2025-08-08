import { Router } from 'express';
import {
  generateCourse,
  extractTopicStructure,
  generateCourseStructure,
  generateComprehensiveQuiz,
  generateLessonSummary
} from '../controllers/ai.controller.js';
import { VerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All AI endpoints require authentication since they use user's API keys
router.use(VerifyJWT);

// OpenAI endpoints
router.post('/generate-course', generateCourse);

// Gemini endpoints
router.post('/extract-topic', extractTopicStructure);
router.post('/generate-structure', generateCourseStructure);
router.post('/generate-quiz', generateComprehensiveQuiz);
router.post('/generate-summary', generateLessonSummary);

// Test endpoint for debugging
router.post('/test-quiz', async (req, res) => {
  try {
    console.log('🧪 Test quiz endpoint called');
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API key required' });
    }

    console.log(`🔑 API key provided: ${apiKey.substring(0, 10)}...`);

    // Import the AI service
    const { aiService } = await import('../services/ai.service.js');
    
    const result = await aiService.generateQuizWithGemini({
      topic: 'JavaScript',
      lessonTitle: 'React Hooks',
      lessonContent: 'React Hooks are functions that let you use state and other React features in functional components.',
      questionsPerLesson: 3,
      apiKey
    });

    console.log(`✅ Test quiz generated: ${result.length} questions`);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: `Successfully generated ${result.length} quiz questions`
    });
  } catch (error) {
    console.error('❌ Test quiz failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

export default router;
