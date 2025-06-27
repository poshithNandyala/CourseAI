// Gemini AI API service for intelligent course generation
export interface GeminiCourseRequest {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  includeProjects: boolean;
}

export interface ExtractedTopic {
  mainTopic: string;
  subtopics: string[];
  difficulty: string;
  estimatedDuration: number;
  prerequisites: string[];
  learningObjectives: string[];
}

export interface GeminiCourseStructure {
  title: string;
  description: string;
  mainTopic: string;
  subtopics: GeminiSubtopic[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
}

export interface GeminiSubtopic {
  title: string;
  description: string;
  order: number;
  keyPoints: string[];
  estimatedDuration: number;
  searchTerms: string[]; // For YouTube search
  quizQuestions: GeminiQuizQuestion[];
}

export interface GeminiQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

class GeminiAPIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  async extractTopicAndStructure(userPrompt: string): Promise<ExtractedTopic> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured, using intelligent parsing');
      return this.intelligentTopicExtraction(userPrompt);
    }

    try {
      const prompt = `
Analyze this course request and extract the main topic and subtopics:

User Request: "${userPrompt}"

Please respond with a JSON object in this exact format:
{
  "mainTopic": "The main subject (e.g., Psychology, Machine Learning, etc.)",
  "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3", ...],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedDuration": 6,
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
}

Rules:
- Extract 6-12 logical subtopics that build upon each other
- Determine appropriate difficulty level from the request
- Estimate duration in hours (4-12 hours typical)
- List realistic prerequisites
- Create 5-7 specific learning objectives

Focus on creating a logical learning progression.
`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseTopicExtraction(response, userPrompt);

    } catch (error) {
      console.error('Gemini API error for topic extraction:', error);
      return this.intelligentTopicExtraction(userPrompt);
    }
  }

  async generateCourseStructure(extractedTopic: ExtractedTopic): Promise<GeminiCourseStructure> {
    if (!this.apiKey) {
      return this.generateStructuredCourse(extractedTopic);
    }

    try {
      const prompt = `
Create a comprehensive course structure for: "${extractedTopic.mainTopic}"

Subtopics to cover: ${extractedTopic.subtopics.join(', ')}
Difficulty: ${extractedTopic.difficulty}
Duration: ${extractedTopic.estimatedDuration} hours

For each subtopic, provide:
1. Detailed description
2. 4-6 key learning points
3. Estimated duration (30-60 minutes)
4. 3-5 YouTube search terms for finding relevant videos
5. 2-3 quiz questions with multiple choice answers

Respond with JSON in this format:
{
  "title": "Complete Course Title",
  "description": "Course description (2-3 sentences)",
  "mainTopic": "${extractedTopic.mainTopic}",
  "subtopics": [
    {
      "title": "Subtopic Title",
      "description": "What this subtopic covers in detail",
      "order": 1,
      "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "estimatedDuration": 45,
      "searchTerms": ["search term 1", "search term 2", "search term 3"],
      "quizQuestions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct"
        }
      ]
    }
  ],
  "totalDuration": ${extractedTopic.estimatedDuration * 60},
  "difficulty": "${extractedTopic.difficulty}",
  "prerequisites": ${JSON.stringify(extractedTopic.prerequisites)},
  "learningObjectives": ${JSON.stringify(extractedTopic.learningObjectives)}
}

Make it comprehensive and educational.
`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseCourseStructure(response, extractedTopic);

    } catch (error) {
      console.error('Gemini API error for course structure:', error);
      return this.generateStructuredCourse(extractedTopic);
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private parseTopicExtraction(response: string, originalPrompt: string): ExtractedTopic {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mainTopic: parsed.mainTopic || this.extractMainTopicFromPrompt(originalPrompt),
          subtopics: parsed.subtopics || [],
          difficulty: parsed.difficulty || 'beginner',
          estimatedDuration: parsed.estimatedDuration || 6,
          prerequisites: parsed.prerequisites || [],
          learningObjectives: parsed.learningObjectives || []
        };
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
    }
    
    return this.intelligentTopicExtraction(originalPrompt);
  }

  private parseCourseStructure(response: string, extractedTopic: ExtractedTopic): GeminiCourseStructure {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || `Complete ${extractedTopic.mainTopic} Course`,
          description: parsed.description || `Learn ${extractedTopic.mainTopic} from ${extractedTopic.difficulty} to advanced level`,
          mainTopic: parsed.mainTopic || extractedTopic.mainTopic,
          subtopics: parsed.subtopics || [],
          totalDuration: parsed.totalDuration || extractedTopic.estimatedDuration * 60,
          difficulty: parsed.difficulty || extractedTopic.difficulty,
          prerequisites: parsed.prerequisites || extractedTopic.prerequisites,
          learningObjectives: parsed.learningObjectives || extractedTopic.learningObjectives
        };
      }
    } catch (error) {
      console.error('Failed to parse course structure:', error);
    }

    return this.generateStructuredCourse(extractedTopic);
  }

  private intelligentTopicExtraction(prompt: string): ExtractedTopic {
    const promptLower = prompt.toLowerCase();
    
    // Extract main topic
    let mainTopic = 'General Course';
    let subtopics: string[] = [];
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';

    // Psychology course detection
    if (promptLower.includes('psychology')) {
      mainTopic = 'Psychology';
      subtopics = [
        'Introduction to Psychology',
        'Research Methods in Psychology',
        'Biological Psychology',
        'Sensation and Perception',
        'Learning and Memory',
        'Cognitive Psychology',
        'Developmental Psychology',
        'Social Psychology',
        'Personality Psychology',
        'Abnormal Psychology and Mental Health'
      ];
    }
    // Machine Learning detection
    else if (promptLower.includes('machine learning') || promptLower.includes('ml')) {
      mainTopic = 'Machine Learning';
      subtopics = [
        'Introduction to Machine Learning',
        'Data Preprocessing and Exploration',
        'Supervised Learning Algorithms',
        'Unsupervised Learning',
        'Model Evaluation and Validation',
        'Feature Engineering',
        'Deep Learning Fundamentals',
        'Neural Networks',
        'Model Deployment',
        'Ethics in Machine Learning'
      ];
    }
    // Web Development detection
    else if (promptLower.includes('web development') || promptLower.includes('react') || promptLower.includes('javascript')) {
      mainTopic = 'Web Development';
      subtopics = [
        'HTML Fundamentals',
        'CSS Styling and Layout',
        'JavaScript Basics',
        'DOM Manipulation',
        'React Components',
        'State Management',
        'API Integration',
        'Responsive Design',
        'Testing and Debugging',
        'Deployment and Hosting'
      ];
    }
    // Digital Marketing detection
    else if (promptLower.includes('marketing') || promptLower.includes('digital marketing')) {
      mainTopic = 'Digital Marketing';
      subtopics = [
        'Digital Marketing Fundamentals',
        'Content Marketing Strategy',
        'Social Media Marketing',
        'Search Engine Optimization (SEO)',
        'Pay-Per-Click Advertising (PPC)',
        'Email Marketing',
        'Analytics and Data Analysis',
        'Conversion Optimization',
        'Marketing Automation',
        'Brand Building and Strategy'
      ];
    }
    // Data Science detection
    else if (promptLower.includes('data science') || promptLower.includes('python')) {
      mainTopic = 'Data Science';
      subtopics = [
        'Introduction to Data Science',
        'Python for Data Science',
        'Data Collection and Cleaning',
        'Exploratory Data Analysis',
        'Statistical Analysis',
        'Data Visualization',
        'Machine Learning for Data Science',
        'Big Data Technologies',
        'Data Ethics and Privacy',
        'Real-World Data Projects'
      ];
    }
    else {
      // Generic extraction
      mainTopic = this.extractMainTopicFromPrompt(prompt);
      subtopics = [
        `Introduction to ${mainTopic}`,
        `${mainTopic} Fundamentals`,
        `Core ${mainTopic} Concepts`,
        `Advanced ${mainTopic} Techniques`,
        `Practical ${mainTopic} Applications`,
        `${mainTopic} Best Practices`
      ];
    }

    // Detect difficulty
    if (promptLower.includes('advanced') || promptLower.includes('expert')) {
      difficulty = 'advanced';
    } else if (promptLower.includes('intermediate') || promptLower.includes('medium')) {
      difficulty = 'intermediate';
    }

    return {
      mainTopic,
      subtopics,
      difficulty,
      estimatedDuration: subtopics.length * 0.75, // 45 minutes per subtopic
      prerequisites: difficulty === 'beginner' ? ['Basic computer literacy'] : [`Basic ${mainTopic} knowledge`],
      learningObjectives: [
        `Understand core ${mainTopic} concepts and principles`,
        `Apply ${mainTopic} techniques in practical scenarios`,
        `Analyze and solve ${mainTopic}-related problems`,
        `Create projects using ${mainTopic} skills`,
        `Evaluate and optimize ${mainTopic} solutions`
      ]
    };
  }

  private extractMainTopicFromPrompt(prompt: string): string {
    // Simple extraction logic
    const words = prompt.split(' ');
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['course', 'learn', 'tutorial', 'guide', 'introduction', 'complete'].includes(word.toLowerCase())
    );
    
    return importantWords.slice(0, 2).join(' ') || 'General Course';
  }

  private generateStructuredCourse(extractedTopic: ExtractedTopic): GeminiCourseStructure {
    const subtopics: GeminiSubtopic[] = extractedTopic.subtopics.map((subtopic, index) => ({
      title: subtopic,
      description: `Comprehensive coverage of ${subtopic} including theory, practical applications, and real-world examples.`,
      order: index + 1,
      keyPoints: [
        `Understanding ${subtopic} fundamentals`,
        `Key concepts and terminology`,
        `Practical applications`,
        `Best practices and common pitfalls`,
        `Real-world examples and case studies`
      ],
      estimatedDuration: 45,
      searchTerms: [
        `${extractedTopic.mainTopic} ${subtopic} tutorial`,
        `${subtopic} explained`,
        `${extractedTopic.mainTopic} ${subtopic} course`,
        `learn ${subtopic}`,
        `${subtopic} for beginners`
      ],
      quizQuestions: [
        {
          question: `What is the main focus of ${subtopic}?`,
          options: [
            `Understanding ${subtopic} principles`,
            'General theoretical concepts',
            'Advanced research methods',
            'Historical perspectives only'
          ],
          correctAnswer: 0,
          explanation: `${subtopic} primarily focuses on understanding its core principles and practical applications.`
        },
        {
          question: `Which approach is most effective for learning ${subtopic}?`,
          options: [
            'Reading textbooks only',
            'Watching videos only',
            'Hands-on practice with theory',
            'Memorizing definitions'
          ],
          correctAnswer: 2,
          explanation: 'Combining hands-on practice with theoretical understanding provides the most effective learning experience.'
        }
      ]
    }));

    return {
      title: `Complete ${extractedTopic.mainTopic} Course - ${extractedTopic.difficulty.charAt(0).toUpperCase() + extractedTopic.difficulty.slice(1)} Level`,
      description: `Master ${extractedTopic.mainTopic} with this comprehensive ${extractedTopic.difficulty} course. Learn through hands-on projects, real-world examples, and industry best practices.`,
      mainTopic: extractedTopic.mainTopic,
      subtopics,
      totalDuration: extractedTopic.estimatedDuration * 60,
      difficulty: extractedTopic.difficulty,
      prerequisites: extractedTopic.prerequisites,
      learningObjectives: extractedTopic.learningObjectives
    };
  }
}

export const geminiAPI = new GeminiAPIService();