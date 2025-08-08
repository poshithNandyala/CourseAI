// Quick test of the improved YouTube service
import { youtubeService } from './src/services/youtube.service.js';

async function testYouTubeSearch() {
    try {
        console.log('🧪 Testing improved YouTube search...');
        
        // You'll need to replace this with a real API key for testing
        const testApiKey = 'YOUR_TEST_API_KEY';
        
        const results = await youtubeService.searchEducationalVideos(
            'JavaScript',
            'React Hooks',
            5,
            testApiKey
        );
        
        console.log('\n📊 RESULTS:');
        results.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title}`);
            console.log(`   Channel: ${video.channelTitle}`);
            console.log(`   Quality Score: ${video.qualityScore}/100`);
            console.log(`   Views: ${video.viewCount?.toLocaleString()}`);
            console.log(`   Duration: ${video.duration}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Uncomment to test (but provide a real API key first)
// testYouTubeSearch();

console.log('🚀 YouTube service loaded with extraordinary video selection!');
console.log('📝 Features:');
console.log('  ✨ Advanced search strategies');
console.log('  🎯 Quality scoring system');
console.log('  🏆 Premium educational channel detection');
console.log('  🔍 Multi-phase intelligent filtering');
console.log('  📊 Engagement metrics analysis');
console.log('  🎓 Educational content optimization');
