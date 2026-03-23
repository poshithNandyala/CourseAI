import fetch from "node-fetch";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

class AIService {
  constructor() {
    this.openaiBaseUrl = "https://api.openai.com/v1";
    this.geminiBaseUrl = GEMINI_API_URL;
  }

  // OpenAI Course Generation
  async generateCourseWithOpenAI({
    topic,
    difficulty,
    duration,
    includeProjects,
    apiKey,
  }) {
    try {
      const prompt = this.buildCoursePrompt({
        topic,
        difficulty,
        duration,
        includeProjects,
      });

      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are an expert course designer and educator. Create comprehensive, well-structured courses that are engaging and practical.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return this.parseCourseContent(content, {
        topic,
        difficulty,
        duration,
        includeProjects,
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      // Return mock data as fallback
      return this.generateMockCourse({
        topic,
        difficulty,
        duration,
        includeProjects,
      });
    }
  }

  // Gemini Topic Extraction
  async extractTopicWithGemini({ userPrompt, apiKey }) {
    try {
      const prompt = `
CRITICAL: You must stay EXACTLY on the topic requested. Do not deviate or generalize.

User Request: "${userPrompt}"

Analyze this EXACT request and create subtopics that are DIRECTLY related to this specific topic only.

STRICT RULES:
- Keep the EXACT main topic from the user's request - do not change or generalize it
- Create subtopics that are SPECIFICALLY about this topic, not general related concepts
- Do NOT suggest alternative or broader topics
- Stay focused on the user's EXACT request

Please respond with a JSON object in this exact format:
{
  "mainTopic": "Use the EXACT topic from user request",
  "subtopics": ["Specific subtopic 1", "Specific subtopic 2", "Specific subtopic 3", ...],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedDuration": 6,
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
}

Create 6-12 logical subtopics that build upon each other within this EXACT topic.
`;

      const response = await this.callGeminiAPI(prompt, apiKey);
      return this.parseTopicExtraction(response, userPrompt);
    } catch (error) {
      console.error("Gemini API error for topic extraction:", error);
      return this.intelligentTopicExtraction(userPrompt);
    }
  }

  // Gemini Course Structure Generation
  async generateCourseStructureWithGemini({ extractedTopic, apiKey }) {
    try {
      const prompt = `
CRITICAL: Stay EXACTLY focused on "${extractedTopic.mainTopic}". Do not deviate from this topic.

Create a comprehensive course structure for: "${extractedTopic.mainTopic}"

MANDATORY: All content must be directly about "${extractedTopic.mainTopic}" - do not generalize or suggest related topics.

Subtopics to cover: ${extractedTopic.subtopics.join(", ")}
Difficulty: ${extractedTopic.difficulty}
Duration: ${extractedTopic.estimatedDuration} hours

For each subtopic, provide:
1. Detailed description specifically about "${extractedTopic.mainTopic}"
2. 4-6 key learning points directly related to this subtopic
3. Estimated duration (30-60 minutes)
4. 3-5 YouTube search terms that will find videos specifically about this subtopic
5. Comprehensive quiz questions specifically about this subtopic

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

      const response = await this.callGeminiAPI(prompt, apiKey);
      return this.parseCourseStructure(response, extractedTopic);
    } catch (error) {
      console.error("Gemini API error for course structure:", error);
      return this.generateStructuredCourse(extractedTopic);
    }
  }

  // Gemini Quiz Generation
  async generateQuizWithGemini({
    topic,
    lessonTitle,
    lessonContent,
    questionsPerLesson,
    apiKey,
  }) {
    console.log(
      `🧪 Generating ${questionsPerLesson} quiz questions for: "${lessonTitle}"`
    );

    // Ensure we have a valid count
    const questionCount = Math.min(
      Math.max(parseInt(questionsPerLesson) || 10, 1),
      30
    );
    console.log(`📊 Validated question count: ${questionCount}`);

    try {
      const prompt = `You are an expert educational assessment designer. Create exactly ${questionCount} high-quality multiple choice questions about "${lessonTitle}" in the context of "${topic}".

LESSON CONTENT TO COVER:
${lessonContent}

REQUIREMENTS:
- Create exactly ${questionCount} questions that comprehensively cover the lesson content
- Questions should progress from basic understanding to advanced application
- Each question must have exactly 4 well-crafted answer options
- Only one option should be clearly correct
- Include detailed explanations that reinforce learning
- Cover different aspects: definitions, concepts, applications, analysis, and problem-solving
- Make questions practical and relevant to real-world scenarios
- Ensure questions test understanding, not just memorization

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Clear, specific question about a key concept from the lesson?",
    "options": ["Correct answer based on lesson content", "Plausible but incorrect option", "Another plausible but incorrect option", "Fourth plausible but incorrect option"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct and what the student should understand"
  }
]

IMPORTANT: 
- Generate exactly ${questionCount} questions in the JSON array
- Each question should cover different aspects of "${lessonTitle}"
- Base all questions on the provided lesson content
- Make sure explanations are educational and comprehensive`;

      console.log(`🤖 Calling Gemini API for quiz generation...`);
      const response = await this.callGeminiAPI(prompt, apiKey);
      console.log(`📝 Gemini response length: ${response.length} characters`);

      const questions = this.parseQuizQuestions(
        response,
        topic,
        lessonTitle,
        questionCount
      );
      console.log(
        `✅ Successfully generated ${questions.length} quiz questions`
      );

      // If we didn't get the expected number, supplement with enhanced questions
      if (questions.length < questionCount) {
        console.log(
          `⚠️ Only got ${questions.length}/${questionCount} questions, supplementing...`
        );
        const additionalQuestions = this.generateEnhancedQuizQuestions(
          topic,
          lessonTitle,
          questionCount - questions.length
        );
        questions.push(...additionalQuestions);
      }

      return questions.slice(0, questionCount); // Ensure exact count
    } catch (error) {
      console.error("❌ Gemini API error for quiz generation:", error);
      console.log(`🔄 Using fallback quiz generation for: "${lessonTitle}"`);
      return this.generateEnhancedQuizQuestions(
        topic,
        lessonTitle,
        questionCount
      );
    }
  }

  // Gemini Lesson Summary Generation
  async generateLessonSummaryWithGemini({
    lessonTitle,
    lessonContent,
    apiKey,
  }) {
    try {
      const prompt = `
You are an expert educational content summarizer. Analyze the following lesson content and create a high-quality, engaging summary.

Lesson Title: "${lessonTitle}"
Lesson Content: "${lessonContent}"

Create a comprehensive summary that:
1. Starts with "In this lesson on ${lessonTitle}, you will learn"
2. Clearly explains 3-5 specific learning outcomes
3. Uses engaging, educational language that motivates learners
4. Focuses on practical skills and knowledge they'll gain
5. Mentions real-world applications when possible
6. Ends with what they'll be able to do after completing the lesson

Requirements:
- Write in a natural, flowing paragraph style
- Be specific about what knowledge/skills they'll acquire
- Make it sound exciting and valuable
- Keep it 3-4 sentences, comprehensive but concise
`;

      const response = await this.callGeminiAPI(prompt, apiKey);
      return this.parseSummaryResponse(response, lessonTitle, lessonContent);
    } catch (error) {
      console.error("Gemini API error for lesson summary:", error);
      return this.generateBasicSummary(lessonTitle, lessonContent);
    }
  }

  // Gemini API Call Helper
  async callGeminiAPI(prompt, apiKey) {
    console.log(
      `🔑 Using API key: ${apiKey ? `${apiKey.substring(0, 10)}...` : "NOT PROVIDED"}`
    );
    console.log(
      `🌐 Gemini API URL: ${this.geminiBaseUrl}`
    );

    if (!apiKey) {
      throw new Error("API key is required for Gemini API calls");
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    };

    console.log(
      `📤 Request body size: ${JSON.stringify(requestBody).length} characters`
    );

    try {
      const response = await fetch(this.geminiBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 Gemini API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Gemini API error response:", errorData);
        throw new Error(
          `Gemini API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      console.log(`📊 Gemini response structure:`, {
        hasCandidates: !!data.candidates,
        candidatesCount: data.candidates?.length || 0,
        firstCandidate: data.candidates?.[0] ? "exists" : "missing",
      });

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        console.error("❌ Invalid Gemini response structure:", data);
        throw new Error("Invalid response structure from Gemini API");
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log(
        `📝 Gemini response text length: ${responseText.length} characters`
      );
      console.log(`📝 First 200 chars: ${responseText.substring(0, 200)}...`);

      return responseText;
    } catch (error) {
      console.error("❌ Gemini API call failed:", error);
      throw error;
    }
  }

  // Helper methods for parsing and fallbacks
  buildCoursePrompt({ topic, difficulty, duration, includeProjects }) {
    return `
Create a comprehensive ${difficulty} level course on "${topic}" that takes approximately ${duration} hours to complete.

Please provide a detailed course structure including:

1. Course title and description
2. Target audience and prerequisites
3. Learning objectives (5-7 specific, measurable goals)
4. Course modules (6-8 modules with topics and key points)
5. Assessment methods (quizzes, assignments, projects)
6. ${includeProjects ? "Practical projects with detailed requirements" : "Theoretical exercises and examples"}

Format the response as a structured outline that can be easily parsed. Focus on practical, real-world applications and ensure the content is engaging and progressive in difficulty.

The course should be suitable for ${difficulty} learners and include modern best practices and industry-relevant skills.
    `;
  }

  parseCourseContent(content, request) {
    // This would parse the AI response into structured data
    // For now, we'll return a structured mock based on the request
    return this.generateMockCourse(request);
  }

  parseTopicExtraction(response, userPrompt) {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanResponse);
      return parsed;
    } catch (error) {
      console.error("Failed to parse topic extraction response:", error);
      return this.intelligentTopicExtraction(userPrompt);
    }
  }

  parseCourseStructure(response, extractedTopic) {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanResponse);
      return parsed;
    } catch (error) {
      console.error("Failed to parse course structure response:", error);
      return this.generateStructuredCourse(extractedTopic);
    }
  }

  parseQuizQuestions(response, topic, lessonTitle, expectedCount = 10) {
    try {
      console.log(
        `🔍 Parsing quiz response for: "${lessonTitle}" (expecting ${expectedCount} questions)`
      );

      // Clean up the response
      let cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();

      // Try to find JSON array in the response
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      console.log(
        `📝 Cleaned response length: ${cleanResponse.length} characters`
      );

      const parsed = JSON.parse(cleanResponse);

      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(
          `✅ Successfully parsed ${parsed.length} quiz questions (expected ${expectedCount})`
        );

        // Validate each question has required properties
        const validQuestions = parsed.filter(
          (q) =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            typeof q.correctAnswer === "number" &&
            q.correctAnswer >= 0 &&
            q.correctAnswer < 4 &&
            q.explanation
        );

        console.log(
          `✅ ${validQuestions.length} valid questions after validation`
        );
        return validQuestions;
      } else {
        console.log(`⚠️ Parsed data is not a valid array, will use fallback`);
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to parse quiz questions response:", error);
      console.log(`🔄 Will use enhanced fallback quiz for: "${lessonTitle}"`);
      return [];
    }
  }

  parseSummaryResponse(response, lessonTitle, lessonContent) {
    try {
      const cleanResponse = response.trim();
      if (cleanResponse.toLowerCase().startsWith("in this lesson")) {
        return cleanResponse;
      }
      return `In this lesson on ${lessonTitle}, you will learn key concepts and practical skills related to ${lessonTitle}.`;
    } catch (error) {
      console.error("Failed to parse summary response:", error);
      return this.generateBasicSummary(lessonTitle, lessonContent);
    }
  }

  // Fallback methods
  generateMockCourse({ topic, difficulty, duration, includeProjects }) {
    return {
      title: `Complete ${topic} Course - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`,
      description: `Master ${topic} with this comprehensive ${difficulty} course.`,
      targetAudience: `This course is perfect for ${difficulty} learners.`,
      prerequisites:
        difficulty === "beginner"
          ? ["Basic computer literacy"]
          : [`Basic ${topic} knowledge`],
      learningObjectives: [
        `Understand core ${topic} concepts`,
        `Apply ${topic} in real-world scenarios`,
        `Build practical projects using ${topic}`,
        `Follow industry best practices`,
      ],
      courseOutline: [
        {
          title: `Introduction to ${topic}`,
          description: `Get started with ${topic} fundamentals`,
          duration: Math.floor((duration * 60) / 6),
          topics: [`${topic} overview`, "Basic concepts", "Getting started"],
          keyPoints: [
            "Understanding fundamentals",
            "Setting up environment",
            "First steps",
          ],
        },
      ],
      assessments: [
        {
          type: "quiz",
          title: `${topic} Fundamentals Quiz`,
          description: "Test your understanding of core concepts",
        },
      ],
      projects: includeProjects
        ? [
          {
            title: `${topic} Practical Project`,
            description: `Build a real-world application using ${topic}`,
            difficulty,
            estimatedTime: "10-15 hours",
            requirements: [`${topic} fundamentals`, "Problem-solving skills"],
            deliverables: ["Working application", "Documentation"],
            skills: [`${topic} development`, "Project planning"],
          },
        ]
        : [],
    };
  }

  intelligentTopicExtraction(prompt) {
    const promptLower = prompt.toLowerCase();
    let mainTopic = "General Course";
    let subtopics = [];
    let difficulty = "beginner";

    // Simple extraction logic
    if (promptLower.includes("react")) {
      mainTopic = "React";
      subtopics = [
        "Introduction to React",
        "Components and Props",
        "State Management",
        "Event Handling",
        "API Integration",
        "Routing",
      ];
    } else if (promptLower.includes("python")) {
      mainTopic = "Python";
      subtopics = [
        "Python Basics",
        "Data Types",
        "Control Flow",
        "Functions",
        "Object-Oriented Programming",
        "Libraries",
      ];
    } else {
      mainTopic = prompt.split(" ").slice(0, 2).join(" ");
      subtopics = [
        `Introduction to ${mainTopic}`,
        `${mainTopic} Fundamentals`,
        `Core ${mainTopic} Concepts`,
        `Advanced ${mainTopic} Techniques`,
        `Practical ${mainTopic} Applications`,
        `${mainTopic} Best Practices`,
      ];
    }

    if (promptLower.includes("advanced")) difficulty = "advanced";
    else if (promptLower.includes("intermediate")) difficulty = "intermediate";

    return {
      mainTopic,
      subtopics,
      difficulty,
      estimatedDuration: subtopics.length * 0.75,
      prerequisites:
        difficulty === "beginner"
          ? ["Basic computer literacy"]
          : [`Basic ${mainTopic} knowledge`],
      learningObjectives: [
        `Understand core ${mainTopic} concepts`,
        `Apply ${mainTopic} techniques`,
        `Analyze ${mainTopic} problems`,
        `Create ${mainTopic} solutions`,
      ],
    };
  }

  generateStructuredCourse(extractedTopic) {
    const subtopics = extractedTopic.subtopics.map((subtopic, index) => ({
      title: subtopic,
      description: `Comprehensive coverage of ${subtopic}`,
      order: index + 1,
      keyPoints: [
        `Understanding ${subtopic} fundamentals`,
        `Key concepts and terminology`,
        `Practical applications`,
        `Best practices`,
      ],
      estimatedDuration: 45,
      searchTerms: [
        `${extractedTopic.mainTopic} ${subtopic} tutorial`,
        `${subtopic} explained`,
        `learn ${subtopic}`,
      ],
      quizQuestions: this.generateBasicQuizQuestions(
        extractedTopic.mainTopic,
        subtopic,
        []
      ),
    }));

    return {
      title: `Complete ${extractedTopic.mainTopic} Course`,
      description: `Master ${extractedTopic.mainTopic} with this comprehensive course`,
      mainTopic: extractedTopic.mainTopic,
      subtopics,
      totalDuration: extractedTopic.estimatedDuration * 60,
      difficulty: extractedTopic.difficulty,
      prerequisites: extractedTopic.prerequisites,
      learningObjectives: extractedTopic.learningObjectives,
    };
  }

  generateBasicQuizQuestions(topic, subtopic, keyPoints) {
    return this.generateEnhancedQuizQuestions(topic, subtopic, 3);
  }

  generateEnhancedQuizQuestions(topic, subtopic, count) {
    console.log(
      `🎯 Generating ${count} enhanced quiz questions for: "${subtopic}"`
    );

    const questions = [];

    // Generate varied question templates covering different aspects
    const questionTemplates = [
      // Basic understanding questions
      {
        question: `What is the main purpose of ${subtopic} in ${topic}?`,
        options: [
          `To provide fundamental understanding of ${subtopic}`,
          "General theoretical concepts only",
          "Historical perspectives exclusively",
          "Advanced research methodologies",
        ],
        correctAnswer: 0,
        explanation: `${subtopic} primarily focuses on providing fundamental understanding within the context of ${topic}.`,
      },
      {
        question: `Which of the following best describes ${subtopic}?`,
        options: [
          `A key concept that helps understand ${topic} better`,
          "An outdated methodology",
          "A complex theory with no practical use",
          "A simple definition with limited scope",
        ],
        correctAnswer: 0,
        explanation: `${subtopic} is indeed a key concept that enhances understanding of ${topic}.`,
      },

      // Relationship and connection questions
      {
        question: `How does ${subtopic} relate to ${topic}?`,
        options: [
          `${subtopic} is an essential component of ${topic}`,
          "They are completely unrelated",
          "One replaces the other",
          "They are competing concepts",
        ],
        correctAnswer: 0,
        explanation: `${subtopic} serves as an essential component that contributes to the broader understanding of ${topic}.`,
      },
      {
        question: `What role does ${subtopic} play in the broader context of ${topic}?`,
        options: [
          `It provides crucial foundational knowledge for ${topic}`,
          "It serves no significant role",
          "It contradicts core principles of ${topic}",
          "It only applies to advanced practitioners",
        ],
        correctAnswer: 0,
        explanation: `${subtopic} provides crucial foundational knowledge that supports comprehensive understanding of ${topic}.`,
      },

      // Application and practical use questions
      {
        question: `When would you typically use ${subtopic} in ${topic}?`,
        options: [
          `When you need to apply specific techniques related to ${subtopic}`,
          "Only in theoretical discussions",
          "Never in practical situations",
          "Only for academic research",
        ],
        correctAnswer: 0,
        explanation: `${subtopic} is most valuable when applying specific techniques and concepts in practical ${topic} scenarios.`,
      },
      {
        question: `In what situations would knowledge of ${subtopic} be most beneficial?`,
        options: [
          `When solving real-world problems in ${topic}`,
          "Only during exam preparation",
          "When avoiding practical applications",
          "In situations unrelated to ${topic}",
        ],
        correctAnswer: 0,
        explanation: `Knowledge of ${subtopic} is most beneficial when solving real-world problems and challenges in ${topic}.`,
      },

      // Benefits and importance questions
      {
        question: `What is a key benefit of understanding ${subtopic}?`,
        options: [
          `It enhances your overall knowledge of ${topic}`,
          "It has no practical benefits",
          "It only helps with memorization",
          "It makes other concepts harder to understand",
        ],
        correctAnswer: 0,
        explanation: `Understanding ${subtopic} significantly enhances your overall comprehension and application of ${topic} principles.`,
      },
      {
        question: `Why is ${subtopic} considered important in ${topic}?`,
        options: [
          `It provides essential knowledge for effective practice`,
          "It's only important for historical reasons",
          "It has no current relevance",
          "It complicates understanding unnecessarily",
        ],
        correctAnswer: 0,
        explanation: `${subtopic} is considered important because it provides essential knowledge needed for effective practice in ${topic}.`,
      },

      // Learning and development questions
      {
        question: `What should you consider when learning about ${subtopic}?`,
        options: [
          `Understanding its role within ${topic}`,
          "Ignoring its practical applications",
          "Focusing only on memorization",
          "Avoiding real-world examples",
        ],
        correctAnswer: 0,
        explanation: `When learning ${subtopic}, it's important to understand how it fits within the broader context of ${topic}.`,
      },
      {
        question: `How can mastering ${subtopic} improve your skills in ${topic}?`,
        options: [
          `By providing deeper insights and better problem-solving abilities`,
          "By making the subject more complicated",
          "By reducing the need for practical experience",
          "By focusing only on theoretical aspects",
        ],
        correctAnswer: 0,
        explanation: `Mastering ${subtopic} improves your skills by providing deeper insights and better problem-solving abilities in ${topic}.`,
      },
    ];

    // Create additional question variations if needed
    const additionalQuestionTypes = [
      `What are the core principles underlying ${subtopic}?`,
      `How would you explain ${subtopic} to someone new to ${topic}?`,
      `What makes ${subtopic} unique within the field of ${topic}?`,
      `What challenges might you face when working with ${subtopic}?`,
      `How has ${subtopic} evolved within the context of ${topic}?`,
      `What prerequisites should you have before studying ${subtopic}?`,
      `How does ${subtopic} connect to other areas of ${topic}?`,
      `What are the practical implications of ${subtopic}?`,
      `How can you effectively apply ${subtopic} in real scenarios?`,
      `What common misconceptions exist about ${subtopic}?`,
    ];

    // Use base templates first
    const baseTemplatesNeeded = Math.min(count, questionTemplates.length);
    for (let i = 0; i < baseTemplatesNeeded; i++) {
      questions.push(questionTemplates[i]);
    }

    // Generate additional questions if needed
    let additionalQuestionsNeeded = count - questions.length;
    for (let i = 0; i < additionalQuestionsNeeded; i++) {
      const questionText =
        additionalQuestionTypes[i % additionalQuestionTypes.length];
      questions.push({
        question: questionText
          .replace("${subtopic}", subtopic)
          .replace("${topic}", topic),
        options: [
          `It involves applying key principles and concepts of ${subtopic}`,
          "It has no practical significance",
          "It only matters for theoretical study",
          "It should be avoided in practical applications",
        ],
        correctAnswer: 0,
        explanation: `This aspect of ${subtopic} involves applying key principles and concepts that are essential for effective practice in ${topic}.`,
      });
    }

    console.log(`✅ Generated ${questions.length} enhanced quiz questions`);
    return questions.slice(0, count); // Ensure exact count
  }

  generateBasicSummary(lessonTitle, lessonContent) {
    return `In this lesson on ${lessonTitle}, you will learn key concepts and practical skills related to ${lessonTitle}. You'll develop a thorough understanding of important principles and learn how to apply them effectively. By the end of this lesson, you'll have gained valuable knowledge and be ready to confidently move forward with your learning journey.`;
  }
}

export const aiService = new AIService();
