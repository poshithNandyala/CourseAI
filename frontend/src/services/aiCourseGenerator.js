

// Course templates for different topics
const courseTemplates = {
  programming: {
    lessons: [
      'Introduction and Setup',
      'Basic Concepts and Syntax',
      'Data Structures and Variables',
      'Control Flow and Functions',
      'Object-Oriented Programming',
      'Best Practices and Projects'
    ],
    duration
  },
  webdev: {
    lessons: [
      'Introduction to Web Development',
      'HTML Fundamentals',
      'CSS Styling and Layout',
      'JavaScript Basics',
      'Responsive Design',
      'Building Your First Website'
    ],
    duration
  },
  datascience: {
    lessons: [
      'Introduction to Data Science',
      'Data Collection and Cleaning',
      'Exploratory Data Analysis',
      'Statistical Analysis',
      'Machine Learning Basics',
      'Data Visualization and Reporting'
    ],
    duration
  },
  design: {
    lessons: [
      'Design Fundamentals',
      'Color Theory and Typography',
      'Layout and Composition',
      'User Experience Principles',
      'Design Tools and Software',
      'Portfolio Development'
    ],
    duration
  },
  business: {
    lessons: [
      'Business Fundamentals',
      'Market Research and Analysis',
      'Business Planning',
      'Marketing and Sales',
      'Financial Management',
      'Growth and Scaling'
    ],
    duration
  },
  default: {
    lessons: [
      'Introduction and Overview',
      'Core Concepts',
      'Practical Applications',
      'Advanced Techniques',
      'Real-World Examples',
      'Summary and Next Steps'
    ],
    duration
  }
};

// Real YouTube video databases for different topics
const videoDatabase = {
  react: [
    {
      title: "React Tutorial for Beginners",
      url: "https://www.youtube.com/watch?v=SqcY0GlETPk",
      duration: "2",
      description: "Complete React tutorial covering components, state, props, and hooks"
    },
    {
      title: "React Hooks Explained",
      url: "https://www.youtube.com/watch?v=O6P86uwfdR0",
      duration: "38",
      description: "Deep dive into React Hooks including useState, useEffect, and custom hooks"
    },
    {
      title: "Building a React App from Scratch",
      url: "https://www.youtube.com/watch?v=hQAHSlTtcmY",
      duration: "1",
      description: "Step-by-step guide to building a complete React application"
    }
  ],
  javascript: [
    {
      title: "JavaScript Full Course for Beginners",
      url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
      duration: "3",
      description: "Complete JavaScript course covering fundamentals to advanced concepts"
    },
    {
      title: "JavaScript ES6 Features",
      url: "https://www.youtube.com/watch?v=WZQc7RUAg18",
      duration: "1",
      description: "Modern JavaScript features including arrow functions, destructuring, and modules"
    },
    {
      title: "Async JavaScript Tutorial",
      url: "https://www.youtube.com/watch?v=PoRJizFvM7s",
      duration: "45",
      description: "Understanding promises, async/await, and asynchronous programming"
    }
  ],
  python: [
    {
      title: "Python Tutorial for Beginners",
      url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
      duration: "6",
      description: "Complete Python programming course for absolute beginners"
    },
    {
      title: "Python Data Structures",
      url: "https://www.youtube.com/watch?v=R-HLU9Fl5ug",
      duration: "2",
      description: "Comprehensive guide to Python lists, dictionaries, sets, and tuples"
    },
    {
      title: "Object-Oriented Programming in Python",
      url: "https://www.youtube.com/watch?v=Ej_02ICOIgs",
      duration: "1",
      description: "Learn classes, objects, inheritance, and OOP principles in Python"
    }
  ],
  html: [
    {
      title: "HTML Full Course for Beginners",
      url: "https://www.youtube.com/watch?v=pQN-pnXPaVg",
      duration: "4",
      description: "Complete HTML tutorial covering all essential tags and concepts"
    },
    {
      title: "HTML5 Semantic Elements",
      url: "https://www.youtube.com/watch?v=kGW8Al_cga4",
      duration: "25",
      description: "Understanding semantic HTML5 elements for better web structure"
    }
  ],
  css: [
    {
      title: "CSS Tutorial for Beginners",
      url: "https://www.youtube.com/watch?v=yfoY53QXEnI",
      duration: "11",
      description: "Complete CSS course covering styling, layout, and responsive design"
    },
    {
      title: "CSS Flexbox Tutorial",
      url: "https://www.youtube.com/watch?v=JJSoEo8JSnc",
      duration: "20",
      description: "Master CSS Flexbox for modern web layouts"
    },
    {
      title: "CSS Grid Layout",
      url: "https://www.youtube.com/watch?v=jV8B24rSN5o",
      duration: "25",
      description: "Learn CSS Grid for advanced web layouts"
    }
  ],
  nodejs: [
    {
      title: "Node.js Tutorial for Beginners",
      url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
      duration: "3",
      description: "Complete Node.js course covering server-side JavaScript development"
    },
    {
      title: "Express.js Tutorial",
      url: "https://www.youtube.com/watch?v=L72fhGm1tfE",
      duration: "35",
      description: "Building web applications with Express.js framework"
    }
  ],
  machinelearning: [
    {
      title: "Machine Learning Explained",
      url: "https://www.youtube.com/watch?v=ukzFI9rgwfU",
      duration: "15",
      description: "Introduction to machine learning concepts and applications"
    },
    {
      title: "Python for Machine Learning",
      url: "https://www.youtube.com/watch?v=7eh4d6sabA0",
      duration: "2",
      description: "Using Python libraries for machine learning projects"
    }
  ],
  datascience: [
    {
      title: "Data Science Tutorial for Beginners",
      url: "https://www.youtube.com/watch?v=ua-CiDNNj30",
      duration: "12",
      description: "Complete data science course covering analysis, visualization, and modeling"
    },
    {
      title: "Pandas Tutorial",
      url: "https://www.youtube.com/watch?v=vmEHCJofslg",
      duration: "1",
      description: "Data manipulation and analysis with Python Pandas"
    }
  ]
};

// Reading resources database
const readingDatabase = {
  react: [
    {
      title: "React Official Documentation",
      url: "https://react.dev/",
      type: "documentation",
      description: "Official React documentation with guides and API reference"
    },
    {
      title: "React Patterns",
      url: "https://reactpatterns.com/",
      type: "article",
      description: "Common React patterns and best practices"
    },
    {
      title: "React Hook Patterns",
      url: "https://blog.logrocket.com/react-hooks-cheat-sheet-unlock-solutions-to-common-problems-af4caf699e70/",
      type: "blog",
      description: "Comprehensive guide to React Hooks patterns"
    }
  ],
  javascript: [
    {
      title: "MDN JavaScript Guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      type: "documentation",
      description: "Comprehensive JavaScript documentation and tutorials"
    },
    {
      title: "JavaScript.info",
      url: "https://javascript.info/",
      type: "tutorial",
      description: "Modern JavaScript tutorial with detailed explanations"
    },
    {
      title: "You Don't Know JS",
      url: "https://github.com/getify/You-Dont-Know-JS",
      type: "article",
      description: "Deep dive into JavaScript core concepts"
    }
  ],
  python: [
    {
      title: "Python Official Documentation",
      url: "https://docs.python.org/3/",
      type: "documentation",
      description: "Official Python documentation and tutorials"
    },
    {
      title: "Real Python",
      url: "https://realpython.com/",
      type: "tutorial",
      description: "High-quality Python tutorials and articles"
    },
    {
      title: "Python PEP 8 Style Guide",
      url: "https://pep8.org/",
      type: "article",
      description: "Python code style guidelines and best practices"
    }
  ]
};

function detectCourseCategory(topic) {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('react') || topicLower.includes('vue') || topicLower.includes('angular')) {
    return 'webdev';
  }
  if (topicLower.includes('python') || topicLower.includes('javascript') || topicLower.includes('java') || 
      topicLower.includes('programming') || topicLower.includes('coding')) {
    return 'programming';
  }
  if (topicLower.includes('data science') || topicLower.includes('machine learning') || 
      topicLower.includes('ai') || topicLower.includes('analytics')) {
    return 'datascience';
  }
  if (topicLower.includes('design') || topicLower.includes('ui') || topicLower.includes('ux')) {
    return 'design';
  }
  if (topicLower.includes('business') || topicLower.includes('marketing') || 
      topicLower.includes('entrepreneur')) {
    return 'business';
  }
  
  return 'default';
}

function getVideosForTopic(topic) {
  const topicLower = topic.toLowerCase();
  
  // Try to find exact matches first
  for (const [key, videos] of Object.entries(videoDatabase)) {
    if (topicLower.includes(key)) {
      return videos.slice(0, 3); // Return up to 3 videos
    }
  }
  
  // Fallback to general programming videos
  if (topicLower.includes('programming') || topicLower.includes('coding')) {
    return videoDatabase.javascript.slice(0, 2);
  }
  
  // Default fallback
  return [
    {
      title: `${topic} Tutorial for Beginners`,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      duration: "45",
      description: `Comprehensive introduction to ${topic} concepts and fundamentals`
    }
  ];
}

function getReadingResourcesForTopic(topic) {
  const topicLower = topic.toLowerCase();
  
  // Try to find exact matches first
  for (const [key, resources] of Object.entries(readingDatabase)) {
    if (topicLower.includes(key)) {
      return resources.slice(0, 4);
    }
  }
  
  // Generate generic resources
  return [
    {
      title: `${topic} Official Documentation`,
      url: `https://docs.${topic.toLowerCase().replace(/\s+/g, '')}.org/`,
      type: "documentation",
      description: `Official documentation and guides for ${topic}`
    },
    {
      title: `Learn ${topic} - Tutorial`,
      url: `https://www.tutorialspoint.com/${topic.toLowerCase().replace(/\s+/g, '-')}/`,
      type: "tutorial",
      description: `Step-by-step tutorial for learning ${topic}`
    },
    {
      title: `${topic} Best Practices`,
      url: `https://medium.com/tag/${topic.toLowerCase().replace(/\s+/g, '-')}`,
      type: "blog",
      description: `Articles and best practices for ${topic} development`
    }
  ];
}

function generateQuizQuestions(lessonTitle, topic) {
  const questions = [];
  
  // Generate topic-specific questions
  if (topic.toLowerCase().includes('react')) {
    questions.push(
      {
        question: "What is JSX in React?",
        options: [
          "A JavaScript library",
          "A syntax extension for JavaScript",
          "A CSS framework",
          "A database query language"
        ],
        correctAnswer,
        explanation: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files."
      },
      {
        question: "What is the purpose of React hooks?",
        options: [
          "To style components",
          "To manage state and lifecycle in functional components",
          "To create class components",
          "To handle routing"
        ],
        correctAnswer,
        explanation: "React hooks allow you to use state and other React features in functional components without writing a class."
      }
    );
  } else if (topic.toLowerCase().includes('javascript')) {
    questions.push(
      {
        question: "What is the difference between 'let' and 'var' in JavaScript?",
        options: [
          "No difference",
          "let has block scope, var has function scope",
          "var has block scope, let has function scope",
          "let is for numbers, var is for strings"
        ],
        correctAnswer,
        explanation: "let has block scope and is not hoisted, while var has function scope and is hoisted."
      },
      {
        question: "What is a closure in JavaScript?",
        options: [
          "A way to close the browser",
          "A function that has access to variables in its outer scope",
          "A method to end a loop",
          "A type of error"
        ],
        correctAnswer,
        explanation: "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned."
      }
    );
  } else if (topic.toLowerCase().includes('python')) {
    questions.push(
      {
        question: "What is the difference between a list and a tuple in Python?",
        options: [
          "Lists are mutable, tuples are immutable",
          "Tuples are mutable, lists are immutable",
          "No difference",
          "Lists store numbers, tuples store strings"
        ],
        correctAnswer,
        explanation: "Lists are mutable (can be changed after creation) while tuples are immutable (cannot be changed after creation)."
      },
      {
        question: "What is PEP 8?",
        options: [
          "A Python library",
          "A Python version",
          "Python's style guide",
          "A Python framework"
        ],
        correctAnswer,
        explanation: "PEP 8 is the official style guide for Python code, providing conventions for writing readable code."
      }
    );
  } else {
    // Generic questions
    questions.push(
      {
        question: `What is the main benefit of learning ${topic}?`,
        options: [
          "It's easy to learn",
          "High demand in the job market",
          "Versatile and widely applicable",
          "All of the above"
        ],
        correctAnswer,
        explanation: `Learning ${topic} offers multiple benefits including ease of learning, job market demand, and versatile applications.`
      },
      {
        question: `What is the best way to practice ${topic}?`,
        options: [
          "Reading books only",
          "Watching videos only",
          "Hands-on projects and practice",
          "Memorizing syntax"
        ],
        correctAnswer,
        explanation: "The best way to learn any skill is through hands-on practice and building real projects."
      }
    );
  }
  
  return questions.slice(0, Math.min(4, questions.length));
}

function generateFlashcards(topic) {
  const flashcards = [];
  
  if (topic.toLowerCase().includes('react')) {
    flashcards.push(
      { front: "What is React?", back: "A JavaScript library for building user ,
      { front: "What is a React component?", back: "A reusable piece of code that returns JSX and can accept props." },
      { front: "What is state in React?", back: "Data that can change over time and affects what the component renders." },
      { front: "What are props?", back: "Properties passed from parent to child components to share data." },
      { front: "What is the Virtual DOM?", back: "A JavaScript representation of the actual DOM that React uses for efficient updates." }
    );
  } else if (topic.toLowerCase().includes('javascript')) {
    flashcards.push(
      { front: "What is JavaScript?", back: "A high-level, interpreted programming language used for web development and more." },
      { front: "What is a variable?", back: "A container that stores data values that can be referenced and manipulated." },
      { front: "What is a function?", back: "A block of reusable code that performs a specific task when called." },
      { front: "What is an array?", back: "A data structure that stores multiple values in a single variable." },
      { front: "What is an object?", back: "A collection of key-value pairs that represent a real-world entity." }
    );
  } else if (topic.toLowerCase().includes('python')) {
    flashcards.push(
      { front: "What is Python?", back: "A high-level, interpreted programming language known for its simplicity and readability." },
      { front: "What is a list in Python?", back: "An ordered, mutable collection of items that can store different data types." },
      { front: "What is a dictionary?", back: "A collection of key-value pairs that is unordered and mutable." },
      { front: "What is indentation in Python?", back: "The use of whitespace to define code blocks instead of curly braces." },
      { front: "What is a module?", back: "A file containing Python code that can be imported and used in other programs." }
    );
  } else {
    // Generic flashcards
    flashcards.push(
      { front: `What is ${topic}?`, back: `${topic} is a valuable skill/technology that can enhance your capabilities and career prospects.` },
      { front: `Why learn ${topic}?`, back: `Learning ${topic} provides new opportunities, improves problem-solving skills, and keeps you current with technology.` },
      { front: `Best practices for ${topic}?`, back: `Follow industry standards, practice regularly, stay updated with latest developments, and build real projects.` },
      { front: `How to master ${topic}?`, back: `Consistent practice, building projects, learning from others, and staying curious about new developments.` }
    );
  }
  
  return flashcards;
}

function generatePracticalAssignments(topic) {
  const assignments = [];
  
  if (topic.toLowerCase().includes('react')) {
    assignments.push(
      {
        title: "Build a Todo List App",
        description: "Create a fully functional todo list application using React hooks for state management.",
        difficulty: "beginner",
        estimatedTime: "4-6 hours",
        requirements: [
          "React functional components",
          "useState and useEffect hooks",
          "Event handling",
          "Conditional rendering"
        ],
        deliverables: [
          "Working todo app with add/delete functionality",
          "Clean, readable code with comments",
          "Responsive design",
          "GitHub repository with README"
        ]
      },
      {
        title: "Weather Dashboard",
        description: "Build a weather dashboard that fetches data from a weather API and displays current conditions.",
        difficulty: "intermediate",
        estimatedTime: "6-8 hours",
        requirements: [
          "API integration",
          "Error handling",
          "Loading states",
          "Component composition"
        ],
        deliverables: [
          "Functional weather app",
          "Error handling for API failures",
          "Loading indicators",
          "Deployed application"
        ]
      }
    );
  } else if (topic.toLowerCase().includes('javascript')) {
    assignments.push(
      {
        title: "Interactive Calculator",
        description: "Build a calculator that can perform basic arithmetic operations with a clean user ,
      {
        title: "Memory Card Game",
        description: "Create a memory card matching game with score tracking and difficulty levels.",
        difficulty: "intermediate",
        estimatedTime: "5-7 hours",
        requirements: [
          "Game logic implementation",
          "DOM manipulation",
          "Local storage for high scores",
          "Animation effects"
        ],
        deliverables: [
          "Fully functional memory game",
          "Score tracking system",
          "Multiple difficulty levels",
          "Smooth animations"
        ]
      }
    );
  } else if (topic.toLowerCase().includes('python')) {
    assignments.push(
      {
        title: "Personal Expense Tracker",
        description: "Build a command-line application to track personal expenses with data persistence.",
        difficulty: "beginner",
        estimatedTime: "4-6 hours",
        requirements: [
          "File I/O operations",
          "Data structures (lists, dictionaries)",
          "User input validation",
          "Basic calculations"
        ],
        deliverables: [
          "Working expense tracker",
          "Data persistence using files",
          "Input validation and error handling",
          "Summary reports and statistics"
        ]
      },
      {
        title: "Web Scraper for News Headlines",
        description: "Create a web scraper that collects news headlines from multiple sources and saves them to a file.",
        difficulty: "intermediate",
        estimatedTime: "5-7 hours",
        requirements: [
          "Web scraping with BeautifulSoup",
          "HTTP requests",
          "Data cleaning and processing",
          "File output formatting"
        ],
        deliverables: [
          "Functional web scraper",
          "Clean, formatted output",
          "Error handling for network issues",
          "Documentation and usage instructions"
        ]
      }
    );
  } else {
    // Generic assignments
    assignments.push(
      {
        title: `${topic} Fundamentals Project`,
        description: `Build a practical project that demonstrates your understanding of ${topic} fundamentals.`,
        difficulty: "beginner",
        estimatedTime: "4-6 hours",
        requirements: [
          `Core ${topic} concepts`,
          "Problem-solving approach",
          "Clean implementation",
          "Documentation"
        ],
        deliverables: [
          "Working project demonstrating key concepts",
          "Well-documented code",
          "README with setup instructions",
          "Reflection on learning outcomes"
        ]
      }
    );
  }
  
  return assignments;
}

export async function generateAICourse(topic)<GeneratedCourse> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const category = detectCourseCategory(topic);
  const template = courseTemplates[category] || courseTemplates.default;
  
  const course = {
    title: `Complete ${topic} Course`,
    overview: `Master ${topic} from fundamentals to advanced concepts. This comprehensive course covers everything you need to know to become proficient in ${topic}. Through hands-on projects, real-world examples, and practical exercises, you'll gain the skills and confidence to apply ${topic} in professional settings. Perfect for beginners with no prior experience, this course provides a solid foundation and clear learning path.`,
    targetAudience: `This course is designed for beginners who want to learn ${topic} from scratch. No prior experience is required, but basic computer literacy is helpful. Perfect for students, career changers, and professionals looking to expand their skillset.`,
    lessons: [],
    flashcards(topic),
    practicalAssignments(topic)
  };
  
  // Generate lessons based on template
  template.lessons.forEach((lessonTitle, index) => {
    const lesson = {
      title.replace(/Introduction|Basic|Advanced/, match => 
        match === 'Introduction' ? `Introduction to ${topic}`  === 'Basic' ? `${topic} Basics` :
        `Advanced ${topic}`
      ),
      objective: `By the end of this lesson, you will understand ${lessonTitle.toLowerCase()} and be able to apply these concepts in practical scenarios.`,
      videos(topic).slice(0, index === 0 ? 2 ), // More videos for intro lesson
      summary: `In this lesson, we explore ${lessonTitle.toLowerCase()} in ${topic}. We'll cover the fundamental concepts, practical applications, and best practices. Through examples and hands-on exercises, you'll gain a solid understanding of how to implement these concepts effectively. This knowledge forms a crucial foundation for your ${topic} journey and will be essential for the upcoming lessons.`,
      furtherReading(topic),
      quiz(lessonTitle, topic)
    };
    
    course.lessons.push(lesson);
  });
  
  return course;
}

