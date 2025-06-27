// Real content fetching service for articles and resources
export interface Article {
  title: string;
  url: string;
  description: string;
  source: string;
  publishedDate?: string;
  readingTime?: string;
}

export interface RealCourseContent {
  title: string;
  description: string;
  subtopics: CourseSubtopic[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
}

export interface CourseSubtopic {
  title: string;
  description: string;
  order: number;
  videos: any[];
  articles: Article[];
  keyPoints: string[];
  estimatedDuration: number;
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

class RealContentAPI {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async generateCourseStructure(topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): Promise<RealCourseContent> {
    if (!this.openaiApiKey) {
      return this.generateStructuredCourse(topic, difficulty);
    }

    try {
      const prompt = this.buildCourseStructurePrompt(topic, difficulty);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational content creator. Create comprehensive, well-structured courses with clear learning progressions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return this.parseCourseStructure(content, topic, difficulty);
    } catch (error) {
      console.error('OpenAI API error, falling back to structured generation:', error);
      return this.generateStructuredCourse(topic, difficulty);
    }
  }

  private buildCourseStructurePrompt(topic: string, difficulty: string): string {
    return `
Create a comprehensive ${difficulty} level course structure for "${topic}".

Please provide a JSON response with the following structure:
{
  "title": "Course title",
  "description": "Course description (2-3 sentences)",
  "subtopics": [
    {
      "title": "Subtopic title",
      "description": "What this subtopic covers",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "estimatedDuration": 45
    }
  ],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
}

Requirements:
- Create 6-10 subtopics that build upon each other logically
- Each subtopic should be focused and specific
- Include 3-5 key points per subtopic
- Estimated duration in minutes (30-60 minutes per subtopic)
- Make it suitable for ${difficulty} learners
- Focus on practical, applicable knowledge

Topic: ${topic}
Difficulty: ${difficulty}
`;
  }

  private parseCourseStructure(content: string, topic: string, difficulty: string): RealCourseContent {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `Complete ${topic} Course`,
        description: parsed.description || `Learn ${topic} from ${difficulty} to advanced level`,
        subtopics: parsed.subtopics?.map((subtopic: any, index: number) => ({
          title: subtopic.title,
          description: subtopic.description,
          order: index + 1,
          videos: [],
          articles: [],
          keyPoints: subtopic.keyPoints || [],
          estimatedDuration: subtopic.estimatedDuration || 45,
          quiz: []
        })) || [],
        totalDuration: parsed.subtopics?.reduce((total: number, sub: any) => total + (sub.estimatedDuration || 45), 0) || 0,
        difficulty,
        prerequisites: parsed.prerequisites || [],
        learningObjectives: parsed.learningObjectives || []
      };
    } catch (error) {
      console.error('Failed to parse AI response, using fallback');
      return this.generateStructuredCourse(topic, difficulty);
    }
  }

  private generateStructuredCourse(topic: string, difficulty: string): RealCourseContent {
    const topicLower = topic.toLowerCase();
    
    // Psychology course structure
    if (topicLower.includes('psychology')) {
      return {
        title: `Complete Psychology Course - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`,
        description: `Comprehensive introduction to psychology covering major theories, research methods, and applications in real-world settings.`,
        difficulty: difficulty as any,
        prerequisites: difficulty === 'beginner' ? ['High school education', 'Interest in human behavior'] : ['Basic psychology knowledge', 'Research methods understanding'],
        learningObjectives: [
          'Understand major psychological theories and perspectives',
          'Learn research methods used in psychological studies',
          'Apply psychological principles to real-world situations',
          'Analyze human behavior and mental processes',
          'Evaluate psychological research and findings'
        ],
        subtopics: [
          {
            title: 'Introduction to Psychology',
            description: 'Overview of psychology as a science, major perspectives, and historical development',
            order: 1,
            videos: [],
            articles: [],
            keyPoints: [
              'Definition and scope of psychology',
              'Major psychological perspectives',
              'History of psychology',
              'Psychology as a science'
            ],
            estimatedDuration: 45,
            quiz: []
          },
          {
            title: 'Research Methods in Psychology',
            description: 'Scientific methods used in psychological research, experimental design, and data analysis',
            order: 2,
            videos: [],
            articles: [],
            keyPoints: [
              'Scientific method in psychology',
              'Experimental vs correlational studies',
              'Ethical considerations in research',
              'Statistical analysis basics'
            ],
            estimatedDuration: 60,
            quiz: []
          },
          {
            title: 'Biological Psychology',
            description: 'The biological basis of behavior, brain structure, and nervous system function',
            order: 3,
            videos: [],
            articles: [],
            keyPoints: [
              'Brain structure and function',
              'Nervous system organization',
              'Neurotransmitters and behavior',
              'Genetics and behavior'
            ],
            estimatedDuration: 50,
            quiz: []
          },
          {
            title: 'Sensation and Perception',
            description: 'How we process sensory information and perceive the world around us',
            order: 4,
            videos: [],
            articles: [],
            keyPoints: [
              'Sensory processes',
              'Visual and auditory perception',
              'Perceptual organization',
              'Attention and consciousness'
            ],
            estimatedDuration: 45,
            quiz: []
          },
          {
            title: 'Learning and Memory',
            description: 'Principles of learning, memory formation, and cognitive processes',
            order: 5,
            videos: [],
            articles: [],
            keyPoints: [
              'Classical and operant conditioning',
              'Observational learning',
              'Memory encoding and retrieval',
              'Forgetting and memory disorders'
            ],
            estimatedDuration: 55,
            quiz: []
          },
          {
            title: 'Cognitive Psychology',
            description: 'Mental processes including thinking, problem-solving, and decision-making',
            order: 6,
            videos: [],
            articles: [],
            keyPoints: [
              'Thinking and reasoning',
              'Problem-solving strategies',
              'Decision-making processes',
              'Language and cognition'
            ],
            estimatedDuration: 50,
            quiz: []
          },
          {
            title: 'Developmental Psychology',
            description: 'Human development across the lifespan, from infancy to old age',
            order: 7,
            videos: [],
            articles: [],
            keyPoints: [
              'Theories of development',
              'Cognitive development',
              'Social and emotional development',
              'Lifespan development'
            ],
            estimatedDuration: 55,
            quiz: []
          },
          {
            title: 'Social Psychology',
            description: 'How social factors influence individual behavior and group dynamics',
            order: 8,
            videos: [],
            articles: [],
            keyPoints: [
              'Social influence and conformity',
              'Attitudes and persuasion',
              'Group behavior',
              'Prejudice and discrimination'
            ],
            estimatedDuration: 50,
            quiz: []
          },
          {
            title: 'Personality Psychology',
            description: 'Major theories of personality and individual differences',
            order: 9,
            videos: [],
            articles: [],
            keyPoints: [
              'Trait theories of personality',
              'Psychodynamic approaches',
              'Humanistic perspectives',
              'Personality assessment'
            ],
            estimatedDuration: 45,
            quiz: []
          },
          {
            title: 'Abnormal Psychology and Mental Health',
            description: 'Understanding psychological disorders, diagnosis, and treatment approaches',
            order: 10,
            videos: [],
            articles: [],
            keyPoints: [
              'Defining abnormal behavior',
              'Major psychological disorders',
              'Diagnostic criteria',
              'Treatment approaches'
            ],
            estimatedDuration: 60,
            quiz: []
          }
        ],
        totalDuration: 515
      };
    }

    // Generic course structure for other topics
    return {
      title: `Complete ${topic} Course`,
      description: `Comprehensive ${difficulty} course covering all essential aspects of ${topic}`,
      difficulty: difficulty as any,
      prerequisites: difficulty === 'beginner' ? ['Basic computer literacy'] : [`Basic ${topic} knowledge`],
      learningObjectives: [
        `Understand core ${topic} concepts`,
        `Apply ${topic} principles practically`,
        `Analyze ${topic} problems and solutions`
      ],
      subtopics: [
        {
          title: `Introduction to ${topic}`,
          description: `Overview and fundamentals of ${topic}`,
          order: 1,
          videos: [],
          articles: [],
          keyPoints: [`What is ${topic}`, 'Key concepts', 'Applications'],
          estimatedDuration: 45,
          quiz: []
        }
      ],
      totalDuration: 45
    };
  }

  async findRelevantArticles(topic: string, subtopic: string): Promise<Article[]> {
    // In a real implementation, you would use APIs like:
    // - Google Custom Search API
    // - Bing Search API
    // - News APIs
    // For now, we'll generate structured article suggestions
    
    const articles: Article[] = [
      {
        title: `${subtopic} in ${topic}: A Comprehensive Guide`,
        url: `https://www.psychologytoday.com/us/basics/${subtopic.toLowerCase().replace(/\s+/g, '-')}`,
        description: `In-depth exploration of ${subtopic} concepts and applications in ${topic}`,
        source: 'Psychology Today',
        readingTime: '8 min read'
      },
      {
        title: `Understanding ${subtopic}: Research and Practice`,
        url: `https://www.apa.org/science/about/psa/2018/06/${subtopic.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Academic perspective on ${subtopic} with latest research findings`,
        source: 'American Psychological Association',
        readingTime: '12 min read'
      },
      {
        title: `${subtopic} Explained: Practical Applications`,
        url: `https://www.verywellmind.com/${subtopic.toLowerCase().replace(/\s+/g, '-')}-overview`,
        description: `Practical guide to understanding and applying ${subtopic} principles`,
        source: 'Verywell Mind',
        readingTime: '6 min read'
      }
    ];

    return articles;
  }

  generateQuizQuestions(topic: string, subtopic: string, keyPoints: string[]): QuizQuestion[] {
    return [
      {
        question: `What is the primary focus of ${subtopic} in ${topic}?`,
        options: [
          keyPoints[0] || `Understanding ${subtopic} basics`,
          'General theoretical concepts',
          'Advanced research methods',
          'Historical perspectives only'
        ],
        correctAnswer: 0,
        explanation: `${subtopic} primarily focuses on ${keyPoints[0] || 'fundamental concepts'} within the broader field of ${topic}.`
      },
      {
        question: `Which of the following is a key principle of ${subtopic}?`,
        options: [
          'It has no practical applications',
          keyPoints[1] || `Practical application of ${subtopic}`,
          'It only applies to theoretical research',
          'It contradicts other psychological principles'
        ],
        correctAnswer: 1,
        explanation: `${keyPoints[1] || 'Practical application'} is indeed a fundamental principle of ${subtopic}.`
      }
    ];
  }
}

export const realContentAPI = new RealContentAPI();