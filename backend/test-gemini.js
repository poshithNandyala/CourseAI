// Test Gemini API directly
import fetch from 'node-fetch';

async function testGemini() {
    console.log('🧪 Testing Gemini API directly...');
    
    // You'll need to replace this with a real API key
    const apiKey = 'YOUR_GEMINI_API_KEY_HERE';
    const baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    if (apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.log('❌ Please replace with a real API key in the test file');
        return;
    }

    try {
        const response = await fetch(`${baseUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: 'Create 2 simple quiz questions about JavaScript. Return only JSON array: [{"question": "What is JavaScript?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Test"}]'
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            }),
        });

        console.log(`📥 Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error:', errorData);
            return;
        }

        const data = await response.json();
        console.log('✅ Success! Response structure:', {
            hasCandidates: !!data.candidates,
            candidatesCount: data.candidates?.length || 0
        });

        if (data.candidates && data.candidates[0]) {
            const text = data.candidates[0].content.parts[0].text;
            console.log('📝 Response text:', text);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

console.log('🔧 To test:');
console.log('1. Replace YOUR_GEMINI_API_KEY_HERE with your actual API key');
console.log('2. Run: node test-gemini.js');
console.log('3. Check if Gemini API is working');

// Uncomment to test (after adding real API key)
// testGemini();
