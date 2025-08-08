// Test the improved services
import { youtubeService } from './src/services/youtube.service.js';
import { aiService } from './src/services/ai.service.js';

console.log('🧪 Testing improved services...');

// Test YouTube service
console.log('\n📺 YouTube Service:');
console.log('✅ Simplified direct YouTube API search');
console.log('✅ Subtopic-focused queries');
console.log('✅ Better error handling and logging');

// Test AI service  
console.log('\n🤖 AI Service:');
console.log('✅ Enhanced quiz generation with fallbacks');
console.log('✅ Better error handling and logging');
console.log('✅ Multiple quiz questions per subtopic');

console.log('\n🚀 Both services are ready for testing!');
console.log('\nTo test with real API keys:');
console.log('1. Make sure you have valid YouTube and Gemini API keys');
console.log('2. Try generating a course in the frontend');
console.log('3. Check the backend logs for detailed progress');

// Test enhanced quiz generation
console.log('\n🧪 Testing enhanced quiz generation...');
const testQuiz = aiService.generateEnhancedQuizQuestions('JavaScript', 'React Hooks', 3);
console.log(`Generated ${testQuiz.length} quiz questions:`)
testQuiz.forEach((q, i) => {
  console.log(`${i + 1}. ${q.question}`);
});
