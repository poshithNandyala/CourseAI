// OpenAI API service for generating course content
export interface CourseGenerationRequest {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  includeProjects: boolean;
}

export interface GeneratedCourseContent {
  title: string;
  description: string;
  targetAudience: string;
  prerequisites: string[];
  learningObjectives: string[];
  courseOutline: CourseModule[];
  assessments: Assessment[];
  projects: Project[];
}

export interface CourseModule {
  title: string;
  description: string;
  duration: number; // in minutes
  topics: string[];
  keyPoints: string[];
}

export interface Assessment {
  type: 'quiz' | 'assignment' | 'project';
  title: string;
  description: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
}

export interface Project {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  requirements: string[];
  deliverables: string[];
  skills: string[];
}

class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async generateCourse(request: CourseGenerationRequest): Promise<GeneratedCourseContent> {
    if (!this.apiKey) {
      console.warn('OpenAI API key not configured, using structured mock data');
      return this.generateMockCourse(request);
    }

    try {
      const prompt = this.buildCoursePrompt(request);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert course designer and educator. Create comprehensive, well-structured courses that are engaging and practical.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return this.parseCourseContent(content, request);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateMockCourse(request);
    }
  }

  private buildCoursePrompt(request: CourseGenerationRequest): string {
    return `
Create a comprehensive ${request.difficulty} level course on "${request.topic}" that takes approximately ${request.duration} hours to complete.

Please provide a detailed course structure including:

1. Course title and description
2. Target audience and prerequisites
3. Learning objectives (5-7 specific, measurable goals)
4. Course modules (6-8 modules with topics and key points)
5. Assessment methods (quizzes, assignments, projects)
6. ${request.includeProjects ? 'Practical projects with detailed requirements' : 'Theoretical exercises and examples'}

Format the response as a structured outline that can be easily parsed. Focus on practical, real-world applications and ensure the content is engaging and progressive in difficulty.

The course should be suitable for ${request.difficulty} learners and include modern best practices and industry-relevant skills.
    `;
  }

  private parseCourseContent(content: string, request: CourseGenerationRequest): GeneratedCourseContent {
    // This would parse the AI response into structured data
    // For now, we'll return a structured mock based on the request
    return this.generateMockCourse(request);
  }

  private generateMockCourse(request: CourseGenerationRequest): GeneratedCourseContent {
    const topicLower = request.topic.toLowerCase();
    
    // Generate course based on topic and difficulty
    const courseData: GeneratedCourseContent = {
      title: `Complete ${request.topic} Course - ${request.difficulty.charAt(0).toUpperCase() + request.difficulty.slice(1)} Level`,
      description: `Master ${request.topic} with this comprehensive ${request.difficulty} course. Learn through hands-on projects, real-world examples, and industry best practices. Perfect for ${request.difficulty === 'beginner' ? 'those new to' : request.difficulty === 'intermediate' ? 'those with some experience in' : 'experienced developers wanting to master'} ${request.topic}.`,
      targetAudience: this.getTargetAudience(request.topic, request.difficulty),
      prerequisites: this.getPrerequisites(request.topic, request.difficulty),
      learningObjectives: this.getLearningObjectives(request.topic, request.difficulty),
      courseOutline: this.generateCourseOutline(request.topic, request.difficulty, request.duration),
      assessments: this.generateAssessments(request.topic, request.difficulty),
      projects: this.generateProjects(request.topic, request.difficulty, request.includeProjects)
    };

    return courseData;
  }

  private getTargetAudience(topic: string, difficulty: string): string {
    const audiences = {
      beginner: `This course is perfect for complete beginners who want to learn ${topic} from scratch. No prior experience required.`,
      intermediate: `Designed for learners with basic programming knowledge who want to advance their ${topic} skills.`,
      advanced: `Ideal for experienced developers looking to master advanced ${topic} concepts and best practices.`
    };
    return audiences[difficulty as keyof typeof audiences];
  }

  private getPrerequisites(topic: string, difficulty: string): string[] {
    const topicLower = topic.toLowerCase();
    
    if (difficulty === 'beginner') {
      return ['Basic computer literacy', 'Willingness to learn', 'Access to a computer'];
    }
    
    if (topicLower.includes('react')) {
      return difficulty === 'intermediate' 
        ? ['Basic JavaScript knowledge', 'HTML/CSS fundamentals', 'Understanding of ES6+']
        : ['Advanced JavaScript', 'React fundamentals', 'State management experience'];
    }
    
    if (topicLower.includes('python')) {
      return difficulty === 'intermediate'
        ? ['Basic programming concepts', 'Understanding of variables and functions']
        : ['Python fundamentals', 'Object-oriented programming', 'Data structures knowledge'];
    }
    
    return difficulty === 'intermediate'
      ? ['Basic programming knowledge', 'Familiarity with development tools']
      : ['Strong programming foundation', 'Experience with related technologies'];
  }

  private getLearningObjectives(topic: string, difficulty: string): string[] {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('react')) {
      return [
        'Build modern React applications using functional components and hooks',
        'Manage application state effectively with useState and useReducer',
        'Handle side effects and API calls with useEffect',
        'Create reusable components with proper prop handling',
        'Implement routing and navigation in React applications',
        'Apply React best practices and performance optimization techniques',
        'Deploy React applications to production environments'
      ];
    }
    
    if (topicLower.includes('python')) {
      return [
        'Write clean, efficient Python code following PEP 8 standards',
        'Work with Python data structures and control flow',
        'Handle file operations and data processing',
        'Create and use functions, classes, and modules',
        'Work with external libraries and APIs',
        'Implement error handling and debugging techniques',
        'Build practical Python applications and scripts'
      ];
    }
    
    // Generic objectives
    return [
      `Understand core ${topic} concepts and principles`,
      `Apply ${topic} in real-world scenarios`,
      `Build practical projects using ${topic}`,
      `Follow industry best practices and standards`,
      `Debug and troubleshoot ${topic} applications`,
      `Optimize performance and maintainability`,
      `Deploy and maintain ${topic} solutions`
    ];
  }

  private generateCourseOutline(topic: string, difficulty: string, duration: number): CourseModule[] {
    const modulesCount = Math.max(6, Math.min(10, Math.floor(duration * 1.5)));
    const moduleTime = Math.floor((duration * 60) / modulesCount);
    
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('react')) {
      return [
        {
          title: 'Introduction to React and Modern JavaScript',
          description: 'Get started with React fundamentals and ES6+ features',
          duration: moduleTime,
          topics: ['React overview', 'JSX syntax', 'ES6+ features', 'Development setup'],
          keyPoints: ['Understanding React philosophy', 'Setting up development environment', 'Writing your first component']
        },
        {
          title: 'Components and Props',
          description: 'Learn to create reusable components and pass data between them',
          duration: moduleTime,
          topics: ['Functional components', 'Props and prop types', 'Component composition', 'Children prop'],
          keyPoints: ['Creating reusable components', 'Proper prop handling', 'Component architecture']
        },
        {
          title: 'State Management with Hooks',
          description: 'Master React state management using hooks',
          duration: moduleTime,
          topics: ['useState hook', 'useEffect hook', 'useReducer', 'Custom hooks'],
          keyPoints: ['Managing component state', 'Side effects handling', 'Creating custom hooks']
        },
        {
          title: 'Event Handling and Forms',
          description: 'Handle user interactions and form submissions',
          duration: moduleTime,
          topics: ['Event handling', 'Controlled components', 'Form validation', 'Input handling'],
          keyPoints: ['Handling user events', 'Form state management', 'Input validation techniques']
        },
        {
          title: 'API Integration and Data Fetching',
          description: 'Connect your React app to external APIs',
          duration: moduleTime,
          topics: ['Fetch API', 'Axios library', 'Loading states', 'Error handling'],
          keyPoints: ['Making API calls', 'Handling async operations', 'Error boundaries']
        },
        {
          title: 'Routing and Navigation',
          description: 'Implement client-side routing in React applications',
          duration: moduleTime,
          topics: ['React Router', 'Route parameters', 'Navigation', 'Protected routes'],
          keyPoints: ['Setting up routing', 'Dynamic routes', 'Route protection']
        }
      ];
    }
    
    // Generic module structure
    const genericModules = [
      'Introduction and Fundamentals',
      'Core Concepts and Syntax',
      'Data Structures and Operations',
      'Advanced Features',
      'Best Practices and Patterns',
      'Real-World Applications',
      'Testing and Debugging',
      'Deployment and Production'
    ];
    
    return genericModules.slice(0, modulesCount).map((title, index) => ({
      title: `${title} in ${topic}`,
      description: `Learn ${title.toLowerCase()} and apply them in ${topic} development`,
      duration: moduleTime,
      topics: [`${topic} ${title.toLowerCase()}`, 'Practical examples', 'Best practices'],
      keyPoints: [`Understanding ${title.toLowerCase()}`, 'Hands-on practice', 'Real-world applications']
    }));
  }

  private generateAssessments(topic: string, difficulty: string): Assessment[] {
    return [
      {
        type: 'quiz',
        title: `${topic} Fundamentals Quiz`,
        description: 'Test your understanding of core concepts',
        questions: [
          {
            question: `What is the main purpose of ${topic}?`,
            type: 'multiple_choice',
            options: [
              'To make development easier',
              'To improve performance',
              'To solve specific problems',
              'All of the above'
            ],
            correctAnswer: 3,
            explanation: `${topic} serves multiple purposes including making development easier, improving performance, and solving specific problems in software development.`
          }
        ]
      },
      {
        type: 'assignment',
        title: 'Practical Implementation',
        description: `Build a small project demonstrating ${topic} concepts`
      }
    ];
  }

  private generateProjects(topic: string, difficulty: string, includeProjects: boolean): Project[] {
    if (!includeProjects) return [];
    
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('react')) {
      return [
        {
          title: 'Personal Portfolio Website',
          description: 'Build a responsive portfolio website showcasing your projects and skills',
          difficulty: 'beginner' as const,
          estimatedTime: '8-12 hours',
          requirements: ['React functional components', 'CSS styling', 'Responsive design', 'Component composition'],
          deliverables: ['Fully functional portfolio site', 'Responsive design', 'Clean code structure', 'Deployed application'],
          skills: ['React components', 'CSS/Styling', 'Responsive design', 'Deployment']
        },
        {
          title: 'Task Management Application',
          description: 'Create a full-featured task management app with CRUD operations',
          difficulty: 'intermediate' as const,
          estimatedTime: '15-20 hours',
          requirements: ['State management', 'Local storage', 'Form handling', 'Component lifecycle'],
          deliverables: ['Working task manager', 'Data persistence', 'User-friendly interface', 'Error handling'],
          skills: ['State management', 'Data persistence', 'Form handling', 'User experience']
        }
      ];
    }
    
    return [
      {
        title: `${topic} Practical Project`,
        description: `Build a real-world application using ${topic} concepts and best practices`,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        estimatedTime: '10-15 hours',
        requirements: [`${topic} fundamentals`, 'Problem-solving skills', 'Clean code practices'],
        deliverables: ['Working application', 'Documentation', 'Code repository', 'Presentation'],
        skills: [`${topic} development`, 'Project planning', 'Code organization', 'Documentation']
      }
    ];
  }
}

export const openaiService = new OpenAIService();