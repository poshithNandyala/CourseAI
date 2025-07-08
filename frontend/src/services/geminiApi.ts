// Gemini AI API service for intelligent course generation
export interface GeminiCourseRequest {
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in hours
  includeProjects: boolean;
}

export interface ExtractedTopic {
  mainTopic: string;
  subtopics: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
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
  difficulty: "beginner" | "intermediate" | "advanced";
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
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  }

  async extractTopicAndStructure(userPrompt: string): Promise<ExtractedTopic> {
    if (!this.apiKey) {
      console.warn("Gemini API key not configured, using intelligent parsing");
      return this.intelligentTopicExtraction(userPrompt);
    }

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

EXAMPLE: If user asks "sex positions", main topic should be "sex positions" and subtopics should be specific types/categories of sex positions, NOT general relationship advice.

Create 6-12 logical subtopics that build upon each other within this EXACT topic.
`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseTopicExtraction(response, userPrompt);
    } catch (error) {
      console.error("Gemini API error for topic extraction:", error);
      return this.intelligentTopicExtraction(userPrompt);
    }
  }

  async generateCourseStructure(
    extractedTopic: ExtractedTopic
  ): Promise<GeminiCourseStructure> {
    if (!this.apiKey) {
      return this.generateStructuredCourse(extractedTopic);
    }

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

IMPORTANT: Do not suggest alternative topics or broader concepts. Stay focused on the exact requested topic.

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
        // ... repeat for 30 total questions covering all aspects of the subtopic
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
      console.error("Gemini API error for course structure:", error);
      return this.generateStructuredCourse(extractedTopic);
    }
  }

  async generateComprehensiveQuiz(
    topic: string,
    lessonTitle: string,
    lessonContent: string,
    questionsPerLesson: number = 30
  ): Promise<GeminiQuizQuestion[]> {
    if (!this.apiKey) {
      return this.generateBasicQuizQuestions(topic, lessonTitle, []);
    }

    try {
      // Detect content type for specialized questions
      const contentType = this.detectContentType(topic, lessonContent);
      const prompt = this.buildComprehensiveQuizPrompt(
        topic,
        lessonTitle,
        lessonContent,
        contentType,
        questionsPerLesson
      );

      const response = await this.callGeminiAPI(prompt);
      return this.parseQuizQuestions(response, topic, lessonTitle);
    } catch (error) {
      console.error(
        "Gemini API error for comprehensive quiz generation:",
        error
      );
      return this.generateBasicQuizQuestions(topic, lessonTitle, []);
    }
  }

  private detectContentType(topic: string, content: string): string {
    const topicLower = topic.toLowerCase();
    const contentLower = content.toLowerCase();

    // C++ Programming
    if (
      topicLower.includes("c++") ||
      topicLower.includes("cpp") ||
      contentLower.includes("c++") ||
      contentLower.includes("cpp") ||
      contentLower.includes("iostream") ||
      contentLower.includes("cout") ||
      contentLower.includes("cin") ||
      contentLower.includes("namespace std")
    ) {
      return "cpp";
    }

    // Python Programming
    if (
      topicLower.includes("python") ||
      contentLower.includes("python") ||
      contentLower.includes("def ") ||
      contentLower.includes("import ") ||
      contentLower.includes("print(") ||
      contentLower.includes("if __name__")
    ) {
      return "python";
    }

    // JavaScript Programming
    if (
      topicLower.includes("javascript") ||
      topicLower.includes("js") ||
      topicLower.includes("react") ||
      topicLower.includes("node") ||
      contentLower.includes("javascript") ||
      contentLower.includes("function") ||
      contentLower.includes("var ") ||
      contentLower.includes("let ") ||
      contentLower.includes("const ") ||
      contentLower.includes("console.log")
    ) {
      return "javascript";
    }

    // Java Programming
    if (
      (topicLower.includes("java") && !topicLower.includes("javascript")) ||
      contentLower.includes("public class") ||
      contentLower.includes("public static void main") ||
      contentLower.includes("system.out.println")
    ) {
      return "java";
    }

    // General Programming
    if (
      topicLower.includes("programming") ||
      topicLower.includes("coding") ||
      topicLower.includes("web development") ||
      topicLower.includes("software") ||
      contentLower.includes("code") ||
      contentLower.includes("algorithm") ||
      contentLower.includes("syntax") ||
      contentLower.includes("loop") ||
      contentLower.includes("array") ||
      contentLower.includes("object")
    ) {
      return "programming";
    }

    // Data Science/Machine Learning
    if (
      topicLower.includes("data science") ||
      topicLower.includes("machine learning") ||
      topicLower.includes("artificial intelligence") ||
      topicLower.includes("ai") ||
      topicLower.includes("ml") ||
      contentLower.includes("dataset") ||
      contentLower.includes("neural") ||
      contentLower.includes("tensorflow") ||
      contentLower.includes("pandas") ||
      contentLower.includes("numpy")
    ) {
      return "datascience";
    }

    // Mathematics
    if (
      topicLower.includes("mathematics") ||
      topicLower.includes("math") ||
      topicLower.includes("calculus") ||
      topicLower.includes("algebra") ||
      topicLower.includes("geometry") ||
      topicLower.includes("statistics") ||
      contentLower.includes("equation") ||
      contentLower.includes("formula") ||
      contentLower.includes("theorem") ||
      contentLower.includes("derivative") ||
      contentLower.includes("integral")
    ) {
      return "mathematics";
    }

    // Physics
    if (
      topicLower.includes("physics") ||
      contentLower.includes("physics") ||
      contentLower.includes("force") ||
      contentLower.includes("energy") ||
      contentLower.includes("momentum") ||
      contentLower.includes("velocity") ||
      contentLower.includes("acceleration") ||
      contentLower.includes("newton")
    ) {
      return "physics";
    }

    // Chemistry
    if (
      topicLower.includes("chemistry") ||
      contentLower.includes("chemistry") ||
      contentLower.includes("molecule") ||
      contentLower.includes("atom") ||
      contentLower.includes("element") ||
      contentLower.includes("compound") ||
      contentLower.includes("reaction") ||
      contentLower.includes("periodic table")
    ) {
      return "chemistry";
    }

    // Biology
    if (
      topicLower.includes("biology") ||
      contentLower.includes("biology") ||
      contentLower.includes("cell") ||
      contentLower.includes("dna") ||
      contentLower.includes("gene") ||
      contentLower.includes("organism") ||
      contentLower.includes("evolution") ||
      contentLower.includes("ecosystem")
    ) {
      return "biology";
    }

    // Arts/Dance/Music
    if (
      topicLower.includes("dance") ||
      topicLower.includes("music") ||
      topicLower.includes("art") ||
      topicLower.includes("choreography") ||
      contentLower.includes("rhythm") ||
      contentLower.includes("beat") ||
      contentLower.includes("movement") ||
      contentLower.includes("steps")
    ) {
      return "arts";
    }

    // Business/Marketing
    if (
      topicLower.includes("business") ||
      topicLower.includes("marketing") ||
      topicLower.includes("management") ||
      topicLower.includes("finance") ||
      topicLower.includes("economics") ||
      contentLower.includes("strategy") ||
      contentLower.includes("market") ||
      contentLower.includes("customer") ||
      contentLower.includes("revenue") ||
      contentLower.includes("profit")
    ) {
      return "business";
    }

    // Psychology/Social
    if (
      topicLower.includes("psychology") ||
      topicLower.includes("social") ||
      contentLower.includes("behavior") ||
      contentLower.includes("mind") ||
      contentLower.includes("emotion") ||
      contentLower.includes("cognitive") ||
      contentLower.includes("therapy") ||
      contentLower.includes("mental health")
    ) {
      return "psychology";
    }

    return "general";
  }

  private buildComprehensiveQuizPrompt(
    topic: string,
    lessonTitle: string,
    lessonContent: string,
    contentType: string,
    questionsPerLesson: number = 30
  ): string {
    const basicCount = Math.floor(questionsPerLesson * 0.3);
    const intermediateCount = Math.floor(questionsPerLesson * 0.5);
    const advancedCount = questionsPerLesson - basicCount - intermediateCount;
    
    const basePrompt = `
You are a world-class educational assessment expert and quiz creator with expertise in cognitive science and learning theory. Create ${questionsPerLesson} exceptional, high-quality multiple-choice questions about "${lessonTitle}" within the topic of "${topic}".

Lesson Content to Cover:
${lessonContent}

CRITICAL QUALITY REQUIREMENTS FOR TOP-NOTCH QUESTIONS:
- Create exactly ${questionsPerLesson} questions that comprehensively cover ALL aspects of the lesson systematically
- Questions should range from basic to advanced difficulty (${basicCount} basic, ${intermediateCount} intermediate, ${advancedCount} advanced)
- Include practical application questions that test real-world understanding and critical thinking
- Each question must have 4 meaningful, well-crafted answer options with only one definitively correct answer
- Provide detailed explanations that teach additional concepts and reinforce learning
- Questions should test understanding, application, analysis, synthesis, and evaluation (Bloom's Taxonomy)
- Avoid vague, trick, or ambiguous questions - focus on genuine learning assessment
- Include scenario-based questions that simulate real professional/academic situations
- Questions should be clear, precise, and unambiguous with professional language
- Ensure comprehensive coverage of all key concepts, principles, and practices in the lesson
- Create questions that challenge students to think critically and apply knowledge creatively

PREMIUM QUESTION DESIGN PRINCIPLES:
- Use authentic, real-world scenarios that professionals in this field would encounter
- Include case studies, problem-solving scenarios, and decision-making questions
- Test conceptual understanding rather than rote memorization
- Create questions that require analysis, evaluation, and synthesis of multiple concepts
- Use current, relevant examples that connect to modern practices
- Include questions that test ability to apply knowledge to novel situations
- Ensure distractors (wrong answers) are plausible but clearly incorrect to experts
- Create questions that help students identify and correct common misconceptions
- Include questions that test understanding of relationships between concepts
- Design questions that assess practical skills and professional competence`;

    let specificInstructions = "";

    switch (contentType) {
      case "cpp":
        const cppCodeBasedCount = Math.floor(questionsPerLesson * 0.6);
        specificInstructions = `
C++ PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include ${cppCodeBasedCount} code-based questions with REAL, EXECUTABLE C++ code snippets
- Focus on C++ specific features: classes, objects, inheritance, polymorphism, templates, STL
- Add syntax, logic, and output prediction questions with ACTUAL C++ CODE
- Include debugging scenarios with REAL buggy C++ code examples
- Ask about memory management, pointers, references, and RAII principles
- Test understanding of OOP concepts specific to C++
- Include questions about C++ standard library (iostream, vector, string, algorithms)
- Test knowledge of C++ specific features like operator overloading, friend functions, virtual functions

MANDATORY C++ CODE EXAMPLES (Include these types):
1. Output Prediction with C++ Code: "What will this C++ code output?\n\`\`\`cpp\n#include <iostream>\nusing namespace std;\nclass Base {\npublic:\n    virtual void show() { cout << \"Base\"; }\n};\nclass Derived : public Base {\npublic:\n    void show() override { cout << \"Derived\"; }\n};\nint main() {\n    Base* ptr = new Derived();\n    ptr->show();\n    delete ptr;\n    return 0;\n}\n\`\`\`"

2. Memory Management: "What's the issue with this C++ code?\n\`\`\`cpp\nint* createArray(int size) {\n    int* arr = new int[size];\n    for(int i = 0; i < size; i++) {\n        arr[i] = i * 2;\n    }\n    return arr;\n}\nint main() {\n    int* myArray = createArray(10);\n    // Use array\n    return 0;\n}\n\`\`\`"

3. STL and Templates: "What does this C++ template code do?\n\`\`\`cpp\ntemplate<typename T>\nT maximum(T a, T b) {\n    return (a > b) ? a : b;\n}\nint main() {\n    cout << maximum<int>(5, 10) << endl;\n    cout << maximum<double>(3.7, 2.1) << endl;\n    return 0;\n}\n\`\`\`"

4. Class and Object Concepts: "In this C++ class, what will happen?\n\`\`\`cpp\nclass Rectangle {\nprivate:\n    int width, height;\npublic:\n    Rectangle(int w, int h) : width(w), height(h) {}\n    int area() const { return width * height; }\n    Rectangle operator+(const Rectangle& other) {\n        return Rectangle(width + other.width, height + other.height);\n    }\n};\n\`\`\`"

5. Inheritance and Polymorphism: "Which method will be called?\n\`\`\`cpp\nclass Animal {\npublic:\n    virtual void makeSound() { cout << \"Animal sound\"; }\n};\nclass Dog : public Animal {\npublic:\n    void makeSound() override { cout << \"Woof!\"; }\n};\nAnimal* pet = new Dog();\npet->makeSound();\n\`\`\`"

6. Pointer and Reference Questions: "What's the difference between these declarations?"
7. Exception Handling: "How should this C++ code handle exceptions?"
8. Constructor/Destructor concepts: "What happens in this object lifecycle?"

FOCUS ON C++ SPECIFICS: Classes, Objects, Inheritance, Polymorphism, Templates, STL, Memory Management, Operator Overloading, Virtual Functions, Friend Functions, Exception Handling!`;
        break;

      case "python":
        specificInstructions = `
PYTHON PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 18-20 code-based questions with REAL, EXECUTABLE Python code snippets
- Focus on Python specific features: list comprehensions, decorators, generators, context managers
- Add syntax, logic, and output prediction questions with ACTUAL Python CODE
- Include debugging scenarios with REAL buggy Python code examples
- Test understanding of Python data structures: lists, dictionaries, sets, tuples
- Include questions about Python libraries: pandas, numpy, matplotlib (if applicable)
- Test knowledge of Python OOP, file handling, and exception handling
- Include questions about Python-specific concepts like duck typing, LEGB scope

MANDATORY PYTHON CODE EXAMPLES (Include these types):
1. List Comprehensions: "What will this Python code output?\n\`\`\`python\nnumbers = [1, 2, 3, 4, 5]\nsquared_evens = [x**2 for x in numbers if x % 2 == 0]\nprint(squared_evens)\n\`\`\`"

2. Dictionary and Functions: "What's the output?\n\`\`\`python\ndef update_scores(scores, **kwargs):\n    scores.update(kwargs)\n    return scores\n\nplayer_scores = {'Alice': 10, 'Bob': 15}\nresult = update_scores(player_scores, Charlie=20, Alice=25)\nprint(player_scores)\nprint(result)\n\`\`\`"

3. Decorators: "What does this decorator do?\n\`\`\`python\ndef timer(func):\n    def wrapper(*args, **kwargs):\n        import time\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f'Time: {time.time() - start}')\n        return result\n    return wrapper\n\`\`\`"

4. Exception Handling: "What will happen with this code?"
5. Class and Inheritance: "How does Python multiple inheritance work?"
6. File Operations: "What's the best practice for file handling?"
7. Lambda and Map/Filter: "What does this functional programming code do?"
8. Generator Functions: "How do yield and generators work?"

FOCUS ON PYTHON SPECIFICS: List/Dict Comprehensions, Decorators, Generators, Context Managers, Duck Typing, Exception Handling, File Operations!`;
        break;

      case "javascript":
        specificInstructions = `
JAVASCRIPT PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 18-20 code-based questions with REAL, EXECUTABLE JavaScript code snippets
- Focus on JavaScript specific features: closures, promises, async/await, prototype chain
- Add syntax, logic, and output prediction questions with ACTUAL JavaScript CODE
- Include debugging scenarios with REAL buggy JavaScript code examples
- Test understanding of DOM manipulation, event handling, and asynchronous programming
- Include questions about ES6+ features: arrow functions, destructuring, template literals
- Test knowledge of JavaScript frameworks like React (if applicable)
- Include questions about scope, hoisting, and JavaScript's event loop

MANDATORY JAVASCRIPT CODE EXAMPLES (Include these types):
1. Closures and Scope: "What will this JavaScript code output?\n\`\`\`javascript\nfunction createCounter() {\n    let count = 0;\n    return function() {\n        count++;\n        return count;\n    };\n}\nconst counter1 = createCounter();\nconst counter2 = createCounter();\nconsole.log(counter1()); // ?\nconsole.log(counter1()); // ?\nconsole.log(counter2()); // ?\n\`\`\`"

2. Promises and Async: "What's the output order?\n\`\`\`javascript\nconsole.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');\n\`\`\`"

3. Array Methods: "What does this code return?\n\`\`\`javascript\nconst numbers = [1, 2, 3, 4, 5];\nconst result = numbers\n    .filter(n => n % 2 === 0)\n    .map(n => n * 3)\n    .reduce((sum, n) => sum + n, 0);\nconsole.log(result);\n\`\`\`"

4. Object Destructuring: "What values are extracted?"
5. This Context: "What does 'this' refer to in different contexts?"
6. Event Loop: "How does JavaScript handle asynchronous operations?"
7. Prototype Chain: "How does JavaScript inheritance work?"
8. Arrow Functions vs Regular Functions: "What's the difference?"

FOCUS ON JAVASCRIPT SPECIFICS: Closures, Promises, Async/Await, Prototypes, Event Loop, ES6+ Features, DOM Manipulation!`;
        break;

      case "java":
        specificInstructions = `
JAVA PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 18-20 code-based questions with REAL, EXECUTABLE Java code snippets
- Focus on Java specific features: interfaces, abstract classes, collections framework
- Add syntax, logic, and output prediction questions with ACTUAL Java CODE
- Include debugging scenarios with REAL buggy Java code examples
- Test understanding of OOP principles in Java context
- Include questions about Java collections, generics, and exception handling
- Test knowledge of Java-specific concepts like static methods, final keyword
- Include questions about Java memory management and garbage collection

MANDATORY JAVA CODE EXAMPLES (Include these types):
1. Inheritance and Polymorphism: "What will this Java code output?\n\`\`\`java\nabstract class Animal {\n    abstract void makeSound();\n    void sleep() { System.out.println(\"Sleeping...\"); }\n}\nclass Dog extends Animal {\n    void makeSound() { System.out.println(\"Woof!\"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Animal pet = new Dog();\n        pet.makeSound();\n        pet.sleep();\n    }\n}\n\`\`\`"

2. Collections Framework: "What's the output?\n\`\`\`java\nArrayList<Integer> numbers = new ArrayList<>();\nnumbers.add(10);\nnumbers.add(20);\nnumbers.add(10);\nSet<Integer> uniqueNumbers = new HashSet<>(numbers);\nSystem.out.println(uniqueNumbers.size());\n\`\`\`"

FOCUS ON JAVA SPECIFICS: Classes, Interfaces, Collections, Generics, Exception Handling, Static Methods, Final Keyword!`;
        break;

      case "programming":
        specificInstructions = `
PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-20 code-based questions with REAL, EXECUTABLE code snippets that test professional competence
- Add syntax, logic, and output prediction questions with ACTUAL, RUNNABLE CODE
- Include debugging scenarios with REAL buggy code examples that mirror common professional challenges
- Ask about algorithm complexity, performance optimization, and best practices with CODE EXAMPLES
- Test practical programming skills with HANDS-ON scenarios that developers face in real projects
- Include questions about code quality, maintainability, and industry standards
- Test understanding of design patterns, architectural principles, and problem-solving approaches

MANDATORY HIGH-QUALITY CODE EXAMPLES (Include these types):
1. Output Prediction with Complex Logic: "What will this code output?\n\`\`\`python\nclass Calculator:\n    def __init__(self):\n        self.result = 0\n    def add(self, x):\n        self.result += x\n        return self\n    def multiply(self, x):\n        self.result *= x\n        return self\n\ncalc = Calculator()\nprint(calc.add(5).multiply(3).result)\n\`\`\`"
2. Bug Detection with Production-Level Code: "What's the critical bug in this function?\n\`\`\`javascript\nfunction processUserData(users) {\n    const results = [];\n    for (let i = 0; i < users.length; i++) {\n        if (users[i].age > 18) {\n            results.push({\n                id: users[i].id,\n                name: users[i].name.toUpperCase(),\n                status: 'adult'\n            });\n        }\n    }\n    return results;\n}\n\`\`\`"
3. Algorithm Analysis with Real Performance Impact: "Which approach has better time complexity for processing 1 million records?\nOption A: Using HashMap lookup\nOption B: Linear search through array\nOption C: Binary search on sorted array\nOption D: Recursive traversal"
4. Best Practices and Code Quality: "Which code follows ${topic} best practices for error handling?"
5. Practical Implementation with Real-World Context: "Complete this function to implement a rate limiter for an API endpoint"
6. Architecture and Design Patterns: "Which design pattern is most appropriate for this scenario?"
7. Security and Performance: "What security vulnerability exists in this code?"
8. Testing and Debugging: "What test cases would you write for this function?"

MAKE IT PROFESSIONAL-GRADE - Use actual ${topic} syntax, industry standards, and real-world scenarios that senior developers encounter!`;
        break;

      case "arts":
        specificInstructions = `
ARTS/DANCE/MUSIC-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include PRACTICAL technique and rhythm coordination questions that test professional-level understanding
- Ask about SPECIFIC music selection for movements with BPM examples and genre characteristics
- Test knowledge of styles with REAL-WORLD performance scenarios and cultural context
- Include hands-on practice questions that assess actual skill application
- Ask about timing, beats, and musical elements with SPECIFIC, measurable examples
- Test understanding of artistic expression, creative interpretation, and performance quality
- Include questions about injury prevention, body mechanics, and professional practices
- Test knowledge of dance history, cultural significance, and artistic evolution

PREMIUM PRACTICAL EXAMPLES (Include these types):
1. Advanced Music Selection: "For a contemporary dance piece expressing emotional transformation, which musical elements are most crucial? A) Consistent 4/4 time signature with 120-140 BPM B) Dynamic tempo changes with instrumental crescendos C) Repetitive electronic beats with minimal variation D) Classical structure with predictable phrasing"
2. Complex Step Sequences: "In advanced salsa dancing, when executing a cross-body lead with inside turn, what is the critical timing element? A) Leader's right hand guides on beat 1 B) Follower begins turn on beat 5 C) Connection is maintained through beats 2-3 D) Eye contact is established on beat 7"
3. Professional Technique: "To maintain proper alignment during multiple pirouettes, which biomechanical principle is most important? A) Engaging core muscles while maintaining neutral spine B) Lifting the working leg as high as possible C) Keeping arms in high fifth position throughout D) Focusing on a single spot at eye level"
4. Musical Interpretation: "In a lyrical jazz piece, how should a dancer interpret syncopated rhythms? A) Execute movements precisely on the off-beats B) Maintain consistent timing regardless of musical accents C) Use breath and suspension to embody the musical phrasing D) Focus on sharp, staccato movements"
5. Style Analysis with Cultural Context: "What distinguishes authentic hip-hop foundation from commercial hip-hop choreography? A) Use of isolation techniques and floor work B) Emphasis on individual expression and battle culture C) Integration of breaking, popping, and locking elements D) All of the above"
6. Performance and Artistry: "When performing for an audience, which element most effectively communicates emotional intention? A) Perfect technical execution B) Authentic emotional connection and presence C) Complex choreographic patterns D) Costume and makeup choices"
7. Professional Development: "What is the most effective way to prevent common dance injuries? A) Proper warm-up and cool-down routines B) Cross-training and strength conditioning C) Understanding anatomy and body mechanics D) All of the above with emphasis on listening to your body"
8. Creative Process: "When choreographing a piece, what is the most important consideration for creating meaningful movement? A) Technical difficulty level B) Relationship between movement and musical/emotional content C) Audience appeal and entertainment value D) Number of dancers involved"

MAKE QUESTIONS PROFESSIONAL-GRADE - Focus on artistry, technique, cultural understanding, and real performance situations that serious dancers and choreographers encounter!`;
        break;

      case "datascience":
        specificInstructions = `
DATA SCIENCE/MACHINE LEARNING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 practical data science questions with REAL datasets and scenarios
- Focus on data analysis, machine learning algorithms, and statistical concepts
- Include questions about data preprocessing, feature engineering, and model evaluation
- Test understanding of Python libraries: pandas, numpy, scikit-learn, matplotlib
- Include questions about different ML algorithms: linear regression, decision trees, neural networks
- Test knowledge of data visualization and statistical analysis
- Include questions about data ethics, bias, and model interpretability

MANDATORY DATA SCIENCE EXAMPLES (Include these types):
1. Data Analysis: "Given this dataset, what does this pandas code do?\n\`\`\`python\nimport pandas as pd\ndf = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})\nresult = df.groupby('A').agg({'B': ['mean', 'sum']})\nprint(result)\n\`\`\`"

2. Machine Learning: "Which algorithm is best for this classification problem with 1000 features and 100 samples?"
3. Statistical Analysis: "What does a p-value of 0.03 indicate in this hypothesis test?"
4. Data Preprocessing: "How should you handle missing values in this scenario?"
5. Model Evaluation: "What's the difference between precision and recall?"
6. Feature Engineering: "How would you encode categorical variables?"
7. Data Visualization: "Which plot type best shows correlation between variables?"
8. Ethics in AI: "What bias might exist in this training dataset?"

FOCUS ON: Data Analysis, Machine Learning, Statistics, Python Libraries, Model Evaluation, Data Ethics!`;
        break;

      case "mathematics":
        specificInstructions = `
MATHEMATICS-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 mathematical problems with REAL calculations and formulas
- Focus on problem-solving, step-by-step solutions, and mathematical reasoning
- Include questions about algebra, calculus, geometry, statistics (as applicable)
- Test understanding of mathematical concepts through practical applications
- Include questions with graphs, equations, and mathematical notation
- Test knowledge of mathematical proofs and logical reasoning
- Include real-world word problems that require mathematical modeling

MANDATORY MATHEMATICS EXAMPLES (Include these types):
1. Calculus: "Find the derivative of f(x) = 3x³ - 2x² + 5x - 1. A) 9x² - 4x + 5 B) 9x² - 4x + 5x C) 3x² - 2x + 5 D) 9x² - 4x"

2. Algebra: "Solve for x: 2(x + 3) = 4x - 8. A) x = 7 B) x = 5 C) x = 3 D) x = 1"

3. Geometry: "A circle has radius 5 cm. What's its area? A) 25π cm² B) 10π cm² C) 25 cm² D) 50π cm²"

4. Statistics: "In a normal distribution with mean 100 and standard deviation 15, what percentage of values fall within one standard deviation?"

5. Word Problems: "A train travels 240 miles in 4 hours. What's its average speed?"
6. Functions: "What's the domain of f(x) = 1/(x-2)?"
7. Probability: "What's the probability of getting two heads in three coin flips?"
8. Trigonometry: "If sin(θ) = 3/5, what is cos(θ)?"

FOCUS ON: Problem-solving, Calculations, Mathematical Reasoning, Real-world Applications!`;
        break;

      case "physics":
        specificInstructions = `
PHYSICS-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 physics problems with REAL calculations and formulas
- Focus on mechanics, thermodynamics, electromagnetism, waves, and modern physics
- Include questions with numerical calculations and unit analysis
- Test understanding of physics concepts through practical scenarios
- Include questions about force, energy, momentum, electricity, and magnetism
- Test knowledge of physics laws and principles
- Include real-world physics applications and problem-solving

MANDATORY PHYSICS EXAMPLES (Include these types):
1. Mechanics: "A 10 kg object moves at 5 m/s. What's its kinetic energy? A) 125 J B) 250 J C) 50 J D) 25 J"

2. Force and Motion: "F = ma. If F = 20 N and a = 4 m/s², what's the mass? A) 5 kg B) 80 kg C) 16 kg D) 24 kg"

3. Electricity: "V = IR. If voltage is 12V and resistance is 4Ω, what's the current? A) 3 A B) 8 A C) 48 A D) 16 A"

4. Energy: "A ball dropped from 10m height. Using PE = mgh, what happens to potential energy?"

5. Waves: "If a wave has frequency 50 Hz and wavelength 2m, what's its speed?"
6. Thermodynamics: "How does heat transfer in different methods?"
7. Optics: "What happens to light when it passes through a convex lens?"
8. Modern Physics: "What's the relationship between energy and mass (E=mc²)?"

FOCUS ON: Problem-solving, Calculations, Physics Laws, Real-world Applications, Units and Measurements!`;
        break;

      case "chemistry":
        specificInstructions = `
CHEMISTRY-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 chemistry problems with REAL chemical equations and calculations
- Focus on atomic structure, chemical bonding, reactions, and stoichiometry
- Include questions with molecular formulas, chemical equations, and calculations
- Test understanding of periodic table, chemical properties, and reactions
- Include questions about acids, bases, pH, organic chemistry
- Test knowledge of chemical laws and principles
- Include real-world chemistry applications and problem-solving

MANDATORY CHEMISTRY EXAMPLES (Include these types):
1. Stoichiometry: "In the reaction 2H₂ + O₂ → 2H₂O, how many moles of water form from 4 moles of H₂? A) 2 mol B) 4 mol C) 8 mol D) 1 mol"

2. Atomic Structure: "How many electrons does a neutral carbon atom have? A) 6 B) 12 C) 14 D) 8"

3. Chemical Bonding: "What type of bond exists between Na and Cl in NaCl? A) Ionic B) Covalent C) Metallic D) Hydrogen"

4. pH Calculations: "What's the pH of a solution with [H⁺] = 1×10⁻³ M? A) 3 B) -3 C) 11 D) 7"

5. Balancing Equations: "Balance this equation: C₃H₈ + O₂ → CO₂ + H₂O"
6. Periodic Trends: "How does atomic radius change across a period?"
7. Organic Chemistry: "What functional group is -OH?"
8. Gas Laws: "Using PV = nRT, what happens when temperature increases?"

FOCUS ON: Chemical Equations, Calculations, Periodic Table, Chemical Bonding, Real-world Applications!`;
        break;

      case "biology":
        specificInstructions = `
BIOLOGY-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 biology questions covering cell biology, genetics, ecology, evolution
- Focus on biological processes, systems, and scientific understanding
- Include questions about DNA, proteins, cellular respiration, photosynthesis
- Test understanding of biological concepts through scenarios and applications
- Include questions about human biology, plant biology, and animal behavior
- Test knowledge of biological classification and evolution
- Include real-world biology applications and environmental science

MANDATORY BIOLOGY EXAMPLES (Include these types):
1. Cell Biology: "What organelle is responsible for protein synthesis? A) Nucleus B) Ribosome C) Mitochondria D) Golgi apparatus"

2. Genetics: "In a cross between Aa × Aa, what's the probability of AA offspring? A) 25% B) 50% C) 75% D) 100%"

3. Photosynthesis: "What's the overall equation for photosynthesis? Include CO₂, H₂O, glucose, and O₂"

4. Evolution: "What mechanism explains how giraffes developed long necks? A) Natural selection B) Genetic drift C) Mutation D) Gene flow"

5. Ecology: "In a food chain, what are organisms that make their own food called?"
6. Human Biology: "Which organ system transports oxygen throughout the body?"
7. DNA Structure: "What are the four bases in DNA?"
8. Classification: "What's the correct order of taxonomic hierarchy?"

FOCUS ON: Biological Processes, Systems, Genetics, Evolution, Ecology, Human Biology, Scientific Method!`;
        break;

      case "science":
        specificInstructions = `
SCIENCE/MATH-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include ACTUAL calculation and formula-based questions with REAL NUMBERS and units
- Ask about REAL-WORLD applications with specific, measurable scenarios
- Test understanding with PRACTICAL problems that scientists/engineers encounter
- Include step-by-step problem-solving questions that require logical reasoning
- Ask about cause-and-effect with SPECIFIC examples and quantitative relationships
- Test understanding of scientific method, experimental design, and data analysis
- Include questions about error analysis, uncertainty, and scientific reasoning
- Test ability to interpret graphs, data, and experimental results

PREMIUM PRACTICAL EXAMPLES (Include these types):
1. Complex Calculations: "A projectile is launched at 45° with initial velocity 30 m/s. If air resistance is negligible, what is the maximum height reached? A) 11.5 m B) 23.0 m C) 45.9 m D) 91.8 m"
2. Multi-Step Formula Application: "A gas sample at 25°C and 1 atm pressure occupies 2.5 L. If heated to 75°C at constant pressure, what is the new volume? A) 2.9 L B) 3.0 L C) 3.1 L D) 7.5 L"
3. Real-world Engineering Problems: "A bridge cable experiences thermal expansion from -10°C to 40°C. If the cable is 200m long and made of steel (α = 12×10⁻⁶/°C), what is the total expansion? A) 0.012 m B) 0.12 m C) 1.2 m D) 12 m"
4. Scientific Principles with Quantitative Analysis: "Why does ice float on water? Given: density of ice = 917 kg/m³, density of water = 1000 kg/m³. A) Ice molecules are larger B) Ice has lower density due to hydrogen bonding structure C) Ice contains air bubbles D) Temperature affects buoyancy"
5. Variable Analysis with Mathematical Relationships: "If you double the radius of a sphere, the volume increases by a factor of: A) 2 B) 4 C) 6 D) 8"
6. Data Interpretation: "Based on this graph showing enzyme activity vs. temperature, what is the optimal temperature for maximum enzyme activity? [Include specific data points]"
7. Experimental Design: "To test the effect of pH on enzyme activity, which variables must be controlled? A) Temperature and substrate concentration B) Buffer type and ionic strength C) Enzyme concentration and reaction time D) All of the above"
8. Error Analysis: "If a measurement has a systematic error of +0.5 units and a random error of ±0.2 units, what is the total uncertainty? A) ±0.3 units B) ±0.5 units C) ±0.7 units D) ±0.54 units"

INCLUDE ACTUAL NUMBERS, units, and professional-level calculations that test quantitative reasoning and scientific thinking!`;
        break;

      case "business":
        specificInstructions = `
BUSINESS/MARKETING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include detailed case study and scenario-based questions with specific business contexts
- Ask about strategy implementation and decision-making with real market conditions
- Test knowledge of best practices and methodologies with current industry examples
- Include ROI and metrics-based questions with actual numbers and KPIs
- Ask about real-world business applications with measurable outcomes
- Test understanding of competitive analysis, market positioning, and strategic planning
- Include questions about crisis management, stakeholder relations, and ethical considerations
- Test knowledge of digital transformation, data-driven decision making, and innovation

PREMIUM BUSINESS EXAMPLES (Include these types):
1. Strategic Decision Making: "A SaaS company with 15% monthly churn rate and $50 customer acquisition cost faces declining growth. Which strategy should be prioritized? A) Increase marketing spend by 200% B) Focus on customer retention and product improvements C) Reduce pricing by 30% to increase volume D) Expand to new geographic markets immediately"
2. Financial Analysis: "A marketing campaign costs $50,000 and generates 500 new customers with an average lifetime value of $200. What is the ROI? A) 100% B) 200% C) 300% D) 400%"
3. Market Analysis: "In a market with 3 competitors holding 40%, 25%, and 20% market share, what is the most effective positioning strategy for a new entrant? A) Direct price competition with the leader B) Niche specialization targeting underserved segments C) Copying the second-place competitor's strategy D) Broad market approach with higher marketing spend"
4. Customer Segmentation: "For an e-commerce platform, which customer segment typically has the highest lifetime value? A) Frequent buyers with low average order value B) Occasional buyers with high average order value C) New customers with moderate spending D) Customers who engage with customer service frequently"
5. Crisis Management: "During a product recall affecting 10% of customers, which communication strategy is most effective? A) Minimize public disclosure and handle privately B) Proactive, transparent communication with clear action plan C) Blame suppliers and redirect responsibility D) Wait for media coverage before responding"
6. Digital Transformation: "Which metric best indicates successful digital transformation in a traditional retail business? A) Website traffic increase B) Online sales as percentage of total revenue C) Social media followers D) Number of mobile app downloads"
7. Innovation Strategy: "For a mature company in a declining industry, which innovation approach offers the best growth potential? A) Incremental improvements to existing products B) Disruptive innovation in adjacent markets C) Cost reduction through automation D) Acquisition of direct competitors"
8. Stakeholder Management: "When facing investor pressure for short-term profits versus long-term growth investments, which approach balances both needs? A) Prioritize short-term profits exclusively B) Focus only on long-term growth C) Develop phased plan with quick wins and strategic investments D) Ignore investor concerns and continue current strategy"

MAKE QUESTIONS BUSINESS-REALISTIC - Include specific numbers, real market conditions, and strategic decisions that executives and managers face!`;
        break;

      case "psychology":
        specificInstructions = `
PSYCHOLOGY-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include complex behavioral scenario questions with detailed case studies
- Ask about psychological principles and their applications in real clinical/research settings
- Test understanding of human behavior patterns with evidence-based explanations
- Include case study analysis questions with diagnostic and therapeutic considerations
- Ask about therapeutic techniques and approaches with specific methodologies
- Test knowledge of research methods, statistical analysis, and ethical considerations
- Include questions about cultural factors, individual differences, and contextual variables
- Test understanding of psychological assessment, intervention planning, and outcome measurement

PREMIUM PSYCHOLOGY EXAMPLES (Include these types):
1. Clinical Case Analysis: "A client presents with persistent worry about work performance, difficulty sleeping, and muscle tension lasting 8 months. They report no specific triggers and symptoms occur across multiple life domains. Which diagnosis is most likely? A) Generalized Anxiety Disorder B) Panic Disorder C) Social Anxiety Disorder D) Adjustment Disorder with Anxiety"
2. Therapeutic Intervention: "For a client with PTSD using avoidance behaviors, which evidence-based treatment approach is most effective? A) Cognitive Behavioral Therapy with exposure therapy B) Psychodynamic therapy focusing on childhood experiences C) Humanistic therapy emphasizing self-acceptance D) Behavioral therapy using only relaxation techniques"
3. Research Methods: "In a study examining the relationship between stress and immune function, what is the most appropriate design to establish causation? A) Cross-sectional survey B) Longitudinal correlational study C) Randomized controlled experiment D) Case study approach"
4. Developmental Psychology: "According to Piaget's theory, a child who can understand that pouring water from a short, wide glass into a tall, narrow glass doesn't change the amount has developed which cognitive ability? A) Object permanence B) Conservation C) Abstract thinking D) Symbolic representation"
5. Social Psychology: "In a study on conformity, participants were more likely to give incorrect answers when confederates unanimously gave the same wrong answer. This demonstrates which phenomenon? A) Social facilitation B) Groupthink C) Asch conformity effect D) Fundamental attribution error"
6. Cognitive Psychology: "A person remembers where they were when they learned about a significant historical event. This type of memory is called: A) Procedural memory B) Semantic memory C) Episodic memory D) Flashbulb memory"
7. Psychological Assessment: "When interpreting a psychological test, which factor is most important for ensuring valid results? A) Test-retest reliability B) Cultural appropriateness and normative data C) Length of assessment session D) Client's motivation level"
8. Ethical Considerations: "A psychologist discovers their client is engaging in behavior that could harm others but isn't illegal. What is the most appropriate ethical response? A) Immediately report to authorities B) Discuss confidentiality limits and explore options for addressing the risk C) Terminate therapy immediately D) Ignore the information to maintain confidentiality"

MAKE QUESTIONS CLINICALLY RELEVANT - Include specific diagnostic criteria, evidence-based practices, and real scenarios that psychology professionals encounter!`;
        break;

      default:
        specificInstructions = `
GENERAL REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include conceptual understanding questions that test deep comprehension
- Ask about practical applications with specific, measurable scenarios
- Test problem-solving abilities with complex, multi-step challenges
- Include scenario-based questions that simulate real professional situations
- Ask about best practices and methodologies with current industry standards
- Test critical thinking, analysis, and synthesis of information
- Include questions about ethical considerations and professional responsibilities
- Test ability to apply knowledge to novel, unfamiliar situations

PREMIUM GENERAL EXAMPLES (Include these types):
1. Conceptual Application: "When implementing ${topic} in a large organization, which factor is most critical for success? A) Technical expertise alone B) Stakeholder buy-in and change management C) Budget allocation D) Timeline compression"
2. Problem-Solving: "In a complex ${topic} project facing multiple constraints, which approach would you prioritize? A) Address technical challenges first B) Resolve resource limitations C) Conduct thorough stakeholder analysis and priority mapping D) Implement quick wins to build momentum"
3. Best Practices: "According to current industry standards, which ${topic} methodology provides the most reliable outcomes? A) Traditional approaches with proven track records B) Innovative methods with limited validation C) Hybrid approaches combining traditional and modern techniques D) Customized methods based on specific context"
4. Ethical Considerations: "When faced with a ${topic} decision that benefits the organization but may have negative societal impacts, what is the most appropriate response? A) Prioritize organizational benefit B) Consider broader stakeholder impacts and long-term consequences C) Delay decision until more information is available D) Delegate decision to higher authority"
5. Critical Analysis: "Which indicator best demonstrates successful ${topic} implementation? A) Immediate cost savings B) Stakeholder satisfaction scores C) Long-term sustainable outcomes and performance metrics D) Completion within original timeline"

MAKE QUESTIONS THOUGHT-PROVOKING - Focus on higher-order thinking skills and real-world application!`;
    }

    return `${basePrompt}

${specificInstructions}

QUESTION DIFFICULTY DISTRIBUTION:
- 10 Basic questions (foundational concepts)
- 15 Intermediate questions (application and analysis)
- 5 Advanced questions (synthesis and evaluation)

Respond with JSON array in this exact format:
[
  {
    "question": "Detailed question text with context?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
    "difficulty": "basic|intermediate|advanced"
  }
]

ADDITIONAL QUALITY GUIDELINES FOR EXCEPTIONAL QUESTIONS:
- Each question should be unique and avoid repetition while building on previous concepts
- Use clear, professional language appropriate for the subject matter and expertise level
- Include specific examples, numbers, or scenarios when possible to increase realism
- Make distractors (wrong answers) plausible but clearly incorrect to domain experts
- Ensure questions test deep understanding, critical thinking, and practical application
- Include "what-if" scenarios that test application of concepts to novel situations
- Use varied question stems and formats to maintain engagement and test different cognitive skills
- Make sure explanations provide value beyond just stating the correct answer - teach related concepts
- Include questions that test integration of multiple concepts and cross-disciplinary thinking
- Create questions that assess professional competence and real-world problem-solving abilities
- Test understanding of cause-and-effect relationships and system thinking
- Include questions about common mistakes, misconceptions, and how to avoid them

CRITICAL QUALITY STANDARDS:
- Questions should be answerable by experts but challenging for learners
- Each question should assess a specific, important learning objective
- Explanations should provide additional insight and learning value
- Questions should be relevant to current industry practices and standards
- Include questions that test both theoretical knowledge and practical skills
- Create questions that help learners develop professional judgment and decision-making abilities
- Test understanding of ethical, legal, and professional considerations when relevant
- Include questions that assess ability to evaluate and critique information

ABSOLUTELY AVOID:
- Questions that can be answered without understanding the concept
- Ambiguous wording that leads to multiple interpretations
- "All of the above" or "None of the above" options (create specific, meaningful choices)
- Questions that test trivial facts rather than important concepts
- Leading questions that make the answer obvious
- Questions with cultural, gender, or other biases
- Questions that test memorization of definitions without understanding
- Questions that are too easy or too obscure for the intended audience

Make each question a valuable learning opportunity that reinforces key concepts, develops critical thinking, and prepares learners for real-world application.`;
  }

  async generateQuizQuestions(
    topic: string,
    subtopic: string,
    keyPoints: string[],
    questionsPerLesson: number = 30
  ): Promise<GeminiQuizQuestion[]> {
    if (!this.apiKey) {
      return this.generateEnhancedBasicQuizQuestions(
        topic,
        subtopic,
        keyPoints,
        questionsPerLesson
      );
    }

    try {
      const basicCount = Math.floor(questionsPerLesson * 0.3);
      const intermediateCount = Math.floor(questionsPerLesson * 0.5);
      const advancedCount = questionsPerLesson - basicCount - intermediateCount;
      
      const prompt = `
You are an expert quiz creator and educational specialist. Create ${questionsPerLesson} comprehensive, high-quality multiple-choice questions about "${subtopic}" within the topic of "${topic}".

Key learning points to cover:
${keyPoints.map((point) => `- ${point}`).join("\n")}

CRITICAL QUALITY REQUIREMENTS:
- Create exactly ${questionsPerLesson} questions covering ALL aspects of the subtopic systematically
- Questions should range from basic to advanced difficulty (${basicCount} basic, ${intermediateCount} intermediate, ${advancedCount} advanced)
- Include practical application questions that test real-world understanding
- Each question must have 4 meaningful answer options with only one correct
- Provide detailed explanations for correct answers that teach additional concepts
- Questions should test understanding, application, analysis, and synthesis
- Avoid vague or trick questions - focus on genuine learning assessment
- Include scenario-based questions that simulate real situations
- Questions should be clear, precise, and unambiguous
- Ensure comprehensive coverage of all key learning points

PRACTICAL FOCUS:
- If topic involves programming: Include code snippets, output prediction, debugging scenarios
- If topic involves math/science: Include calculations, formulas, real-world problems
- If topic involves arts/dance: Include technique, rhythm, step sequences, music selection
- If topic involves business: Include case studies, metrics, strategy scenarios

Respond with JSON array in this exact format:
[
  {
    "question": "Detailed question text with context?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong"
  }
]

ADDITIONAL QUALITY GUIDELINES FOR EXCEPTIONAL QUESTIONS:
- Each question should be unique and avoid repetition while building on previous concepts
- Use clear, professional language appropriate for the subject matter and expertise level
- Include specific examples, numbers, or scenarios when possible to increase realism
- Make distractors (wrong answers) plausible but clearly incorrect to domain experts
- Ensure questions test deep understanding, critical thinking, and practical application
- Include "what-if" scenarios that test application of concepts to novel situations
- Use varied question stems and formats to maintain engagement and test different cognitive skills
- Make sure explanations provide value beyond just stating the correct answer - teach related concepts
- Include questions that test integration of multiple concepts and cross-disciplinary thinking
- Create questions that assess professional competence and real-world problem-solving abilities
- Test understanding of cause-and-effect relationships and system thinking
- Include questions about common mistakes, misconceptions, and how to avoid them

CRITICAL QUALITY STANDARDS:
- Questions should be answerable by experts but challenging for learners
- Each question should assess a specific, important learning objective
- Explanations should provide additional insight and learning value
- Questions should be relevant to current industry practices and standards
- Include questions that test both theoretical knowledge and practical skills
- Create questions that help learners develop professional judgment and decision-making abilities
- Test understanding of ethical, legal, and professional considerations when relevant
- Include questions that assess ability to evaluate and critique information

ABSOLUTELY AVOID:
- Questions that can be answered without understanding the concept
- Ambiguous wording that leads to multiple interpretations
- "All of the above" or "None of the above" options (create specific, meaningful choices)
- Questions that test trivial facts rather than important concepts
- Leading questions that make the answer obvious
- Questions with cultural, gender, or other biases
- Questions that test memorization of definitions without understanding
- Questions that are too easy or too obscure for the intended audience

Make each question a valuable learning opportunity that reinforces key concepts, develops critical thinking, and prepares learners for real-world application.`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseQuizQuestions(response, topic, subtopic);
    } catch (error) {
      console.error("Gemini API error for basic quiz generation:", error);
      return this.generateEnhancedBasicQuizQuestions(
        topic,
        subtopic,
        keyPoints,
        30
      );
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
          temperature: 0.8,
          topK: 50,
          topP: 0.9,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    const rawResponse = data.candidates[0].content.parts[0].text;
    console.log("🔍 Raw Gemini API response:", rawResponse.substring(0, 200) + "...");
    return rawResponse;
  }

  /**
   * Centralized JSON parser for all Gemini API responses
   * Handles string responses and converts them to proper JSON objects
   */
  private parseJsonResponse(rawResponse: string): any {
    try {
      console.log("🔄 Attempting to parse JSON from raw response");
      
      // First, try to parse the entire response as JSON
      try {
        const directParse = JSON.parse(rawResponse);
        console.log("✅ Successfully parsed entire response as JSON");
        return directParse;
      } catch (directError) {
        console.log("⚠️ Direct JSON parse failed, trying extraction methods");
      }

      // Clean the response
      let cleanResponse = rawResponse.trim();
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');
      
      // Remove JavaScript-style comments that cause JSON parsing issues
      cleanResponse = cleanResponse.replace(/\/\/.*$/gm, ''); // Remove single-line comments
      cleanResponse = cleanResponse.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
      
      // Remove any leading/trailing text that's not JSON
      cleanResponse = cleanResponse.replace(/^[^[\{]*/, '').replace(/[^}\]]*$/, '');
      
      // Try multiple JSON extraction strategies
      const strategies = [
        // Strategy 1: Find complete JSON object
        (text: string) => {
          const objectMatch = text.match(/\{[\s\S]*\}/);
          return objectMatch ? JSON.parse(objectMatch[0]) : null;
        },
        
        // Strategy 2: Find JSON array
        (text: string) => {
          const arrayMatch = text.match(/\[[\s\S]*\]/);
          return arrayMatch ? JSON.parse(arrayMatch[0]) : null;
        },
        
        // Strategy 3: Clean and parse with bracket completion
        (text: string) => {
          let cleaned = text
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
            .replace(/'/g, '"') // Convert single quotes to double
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' '); // Normalize whitespace
          
          // Complete any incomplete JSON structures
          const openBraces = (cleaned.match(/\{/g) || []).length;
          const closeBraces = (cleaned.match(/\}/g) || []).length;
          const openBrackets = (cleaned.match(/\[/g) || []).length;
          const closeBrackets = (cleaned.match(/\]/g) || []).length;
          
          // Add missing closing braces and brackets
          for (let i = 0; i < openBraces - closeBraces; i++) {
            cleaned += '}';
          }
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            cleaned += ']';
          }
          
          return JSON.parse(cleaned);
        }
      ];

      for (const strategy of strategies) {
        try {
          const result = strategy(cleanResponse);
          if (result) {
            console.log("✅ Successfully parsed JSON using extraction strategy");
            return result;
          }
        } catch (error) {
          continue;
        }
      }
      
      console.error("❌ All JSON parsing strategies failed");
      throw new Error("Unable to parse JSON from response");
      
    } catch (error) {
      console.error("❌ JSON parsing failed:", error);
      console.log("📄 Problematic response:", rawResponse.substring(0, 500) + "...");
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Main entry point for processing any API response
   * Converts string responses to JSON and validates the data type
   */
  public processApiResponse(rawResponse: string, expectedType: 'course' | 'quiz' | 'topic' = 'course'): any {
    console.log(`🚀 Processing API response for type: ${expectedType}`);
    
    // First check if response is already parsed JSON
    if (typeof rawResponse === 'object') {
      console.log("✅ Response is already parsed JSON");
      return this.extractSpecificDataStructure(rawResponse, expectedType);
    }
    
    // If it's a string, parse it as JSON
    return this.extractJsonData(rawResponse, expectedType);
  }

  /**
   * Enhanced method to extract JSON data from any Gemini response
   * Works for both course and quiz data
   */
  private extractJsonData(rawResponse: string, expectedType: 'course' | 'quiz' | 'topic' = 'course'): any {
    try {
      // First try centralized JSON parser
      const parsed = this.parseJsonResponse(rawResponse);
      
      // Validate the parsed data based on expected type
      if (expectedType === 'course' && this.isValidCourseData(parsed)) {
        return parsed;
      } else if (expectedType === 'quiz' && this.isValidQuizData(parsed)) {
        return parsed;
      } else if (expectedType === 'topic' && this.isValidTopicData(parsed)) {
        return parsed;
      }
      
      // If validation fails, try to extract specific data structures
      return this.extractSpecificDataStructure(parsed, expectedType);
      
    } catch (error) {
      console.error(`❌ Failed to extract ${expectedType} JSON data:`, error);
      throw error;
    }
  }

  private isValidCourseData(data: any): boolean {
    return data && (
      (data.course && data.subtopics) || 
      (data.title && data.lessons) ||
      (Array.isArray(data.subtopics) && data.subtopics.length > 0)
    );
  }

  private isValidQuizData(data: any): boolean {
    return data && (
      Array.isArray(data) ||
      (data.questions && Array.isArray(data.questions)) ||
      (data.quiz && Array.isArray(data.quiz))
    );
  }

  private isValidTopicData(data: any): boolean {
    return data && (
      data.mainTopic || 
      data.topic ||
      (data.subtopics && Array.isArray(data.subtopics))
    );
  }

  private extractSpecificDataStructure(data: any, type: string): any {
    switch (type) {
      case 'course':
        return data.course || data.courseStructure || data;
      case 'quiz':
        return data.questions || data.quiz || (Array.isArray(data) ? data : [data]);
      case 'topic':
        return data.topic || data.extraction || data;
      default:
        return data;
    }
  }

  private parseTopicExtraction(
    response: string,
    originalPrompt: string
  ): ExtractedTopic {
    try {
      console.log("🔍 Parsing topic extraction from response");
      
      // Use centralized JSON parser
      const parsed = this.extractJsonData(response, 'topic');
      
      return {
        mainTopic:
          parsed.mainTopic || parsed.topic || this.extractMainTopicFromPrompt(originalPrompt),
        subtopics: parsed.subtopics || [],
        difficulty: parsed.difficulty || "beginner",
        estimatedDuration: parsed.estimatedDuration || 6,
        prerequisites: parsed.prerequisites || [],
        learningObjectives: parsed.learningObjectives || [],
      };
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
    }

    return this.intelligentTopicExtraction(originalPrompt);
  }

  private parseCourseStructure(
    response: string,
    extractedTopic: ExtractedTopic
  ): GeminiCourseStructure {
    try {
      console.log("🔍 Parsing course structure from response");
      
      // Use centralized JSON parser
      const parsed = this.extractJsonData(response, 'course');
      
      console.log("✅ Successfully parsed course structure JSON");
      return {
        title: parsed.title || `Complete ${extractedTopic.mainTopic} Course`,
        description:
          parsed.description ||
          `Learn ${extractedTopic.mainTopic} from ${extractedTopic.difficulty} to advanced level`,
        mainTopic: parsed.mainTopic || extractedTopic.mainTopic,
        subtopics: parsed.subtopics || [],
        totalDuration:
          parsed.totalDuration || extractedTopic.estimatedDuration * 60,
        difficulty: parsed.difficulty || extractedTopic.difficulty,
        prerequisites: parsed.prerequisites || extractedTopic.prerequisites,
        learningObjectives:
          parsed.learningObjectives || extractedTopic.learningObjectives,
      };
    } catch (error) {
      console.error("Failed to parse course structure:", error);
      console.log("Course structure response that failed to parse:", response.substring(0, 500) + "...");
    }

    console.warn("Falling back to structured course generation");
    return this.generateStructuredCourse(extractedTopic);
  }

  private parseQuizQuestions(
    response: string,
    topic: string,
    subtopic: string
  ): GeminiQuizQuestion[] {
    try {
      console.log(`🔍 Starting quiz parsing for ${topic} - ${subtopic}`);
      console.log(`📝 Response length: ${response.length}`);
      
      // First, try the centralized JSON parser
      try {
        const parsed = this.extractJsonData(response, 'quiz');
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validatedQuestions = this.validateAndFormatQuestions(parsed);
          if (validatedQuestions.length > 0) {
            console.log(`✅ Successfully parsed ${validatedQuestions.length} questions using centralized parser`);
            return validatedQuestions;
          }
        }
      } catch (jsonError) {
        console.log("🔄 Centralized JSON parsing failed, trying specific methods...");
      }
      
      // Fallback to the enhanced JSON parsing
      const jsonResult = this.parseJsonQuestions(response);
      if (jsonResult.length > 0) {
        console.log(`✅ Successfully parsed ${jsonResult.length} questions from specific JSON parser`);
        return jsonResult;
      }
      
      // Fallback to text extraction
      console.log("🔄 JSON parsing failed, attempting text extraction...");
      const textResult = this.extractQuestionsFromText(response, topic, subtopic);
      if (textResult.length > 0) {
        console.log(`✅ Successfully extracted ${textResult.length} questions from text`);
        return textResult;
      }
      
      // If all else fails, return basic questions
      console.log("⚠️ All parsing methods failed, generating basic questions");
      return this.generateBasicQuizQuestions(topic, subtopic, []);
      
    } catch (error) {
      console.error("❌ Quiz parsing failed completely:", error);
      console.log("📄 Response preview:", response.substring(0, 500) + "...");
      return this.generateBasicQuizQuestions(topic, subtopic, []);
    }
  }

  private parseJsonQuestions(response: string): GeminiQuizQuestion[] {
    try {
      // Step 1: Clean the response
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing text that's not JSON
      cleanResponse = cleanResponse.replace(/^[^[\{]*/, '').replace(/[^}\]]*$/, '');
      
      // Step 2: Find JSON structures
      const jsonCandidates = this.findJsonStructures(cleanResponse);
      
      for (const candidate of jsonCandidates) {
        try {
          const parsed = this.attemptJsonParse(candidate);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            return this.validateAndFormatQuestions(parsed);
          }
        } catch (error) {
          console.warn(`Failed to parse JSON candidate: ${error}`);
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error("JSON parsing failed:", error);
      return [];
    }
  }

  private findJsonStructures(text: string): string[] {
    const candidates: string[] = [];
    
    // Pattern 1: Complete JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      candidates.push(arrayMatch[0]);
    }
    
    // Pattern 2: Incomplete JSON array (missing closing bracket)
    const incompleteArrayMatch = text.match(/\[[\s\S]*$/);
    if (incompleteArrayMatch) {
      const incomplete = incompleteArrayMatch[0];
      const completed = this.completeJsonStructure(incomplete);
      candidates.push(completed);
    }
    
    // Pattern 3: Multiple JSON objects
    const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const objectMatches = text.match(objectPattern);
    if (objectMatches && objectMatches.length > 1) {
      candidates.push('[' + objectMatches.join(',') + ']');
    }
    
    return candidates;
  }

  private completeJsonStructure(jsonString: string): string {
    // Count opening and closing brackets/braces
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    
    let completed = jsonString;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      completed += '}';
    }
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      completed += ']';
    }
    
    return completed;
  }

  private attemptJsonParse(jsonString: string): any {
    // Multiple parsing strategies
    const strategies = [
      // Strategy 1: Direct parse
      (str: string) => JSON.parse(str),
      
      // Strategy 2: Basic cleaning
      (str: string) => {
        const cleaned = str
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
          .replace(/:\s*([0-9]+)(?=\s*[,}])/g, ': $1') // Preserve numbers
          .replace(/'/g, '"') // Convert single quotes to double
          .replace(/[\u0000-\u001f\u007f-\u009f]/g, ''); // Remove control characters
        return JSON.parse(cleaned);
      },
      
      // Strategy 3: Advanced cleaning
      (str: string) => {
        const cleaned = str
          .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
          .replace(/\r?\n/g, ' ') // Replace newlines with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote keys
          .replace(/:\s*'([^']*)'(?=\s*[,}])/g, ': "$1"') // Convert single quotes
          .replace(/:\s*([^",\[\]{}]+)(?=\s*[,}])/g, (_, value) => {
            // Quote non-number values
            return isNaN(Number(value.trim())) ? `: "${value.trim()}"` : `: ${value.trim()}`;
          })
          .replace(/,\s*[,}]/g, '}') // Remove duplicate commas
          .replace(/,\s*]/g, ']') // Remove trailing commas
          .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2'); // Fix unescaped backslashes
        return JSON.parse(cleaned);
      },
      
      // Strategy 4: Extract individual objects
      (str: string) => {
        const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        const objects = str.match(objectPattern);
        if (objects) {
          const parsedObjects = objects.map(obj => {
            const cleaned = obj
              .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
              .replace(/,\s*}/g, '}')
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
              .replace(/:\s*'([^']*)'(?=\s*[,}])/g, ': "$1"')
              .replace(/:\s*([^",\[\]{}]+)(?=\s*[,}])/g, (_, value) => {
                return isNaN(Number(value.trim())) ? `: "${value.trim()}"` : `: ${value.trim()}`;
              });
            return JSON.parse(cleaned);
          });
          return parsedObjects;
        }
        throw new Error('No objects found');
      }
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy(jsonString);
        if (result) {
          return result;
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('All parsing strategies failed');
  }

  private validateAndFormatQuestions(parsed: any[]): GeminiQuizQuestion[] {
    return parsed
      .filter(q => q && typeof q === 'object') // Only valid objects
      .map((q, index) => {
        // Normalize question text
        const question = this.normalizeText(q.question || q.text || q.prompt || `Question ${index + 1}`);
        
        // Normalize options
        let options: string[] = [];
        if (Array.isArray(q.options)) {
          options = q.options.map((opt: any) => this.normalizeText(opt));
        } else if (Array.isArray(q.choices)) {
          options = q.choices.map((opt: any) => this.normalizeText(opt));
        } else if (q.a && q.b && q.c && q.d) {
          options = [q.a, q.b, q.c, q.d].map((opt: any) => this.normalizeText(opt));
        }
        
        // Ensure we have at least 4 options
        while (options.length < 4) {
          options.push(`Option ${String.fromCharCode(65 + options.length)}`);
        }
        options = options.slice(0, 4); // Limit to 4 options
        
        // Normalize correct answer
        let correctAnswer = 0;
        if (typeof q.correctAnswer === 'number') {
          correctAnswer = Math.max(0, Math.min(3, q.correctAnswer));
        } else if (typeof q.correct_answer === 'number') {
          correctAnswer = Math.max(0, Math.min(3, q.correct_answer));
        } else if (typeof q.correctAnswer === 'string') {
          const index = options.findIndex(opt => opt === q.correctAnswer);
          correctAnswer = index !== -1 ? index : 0;
        } else if (typeof q.correct_answer === 'string') {
          const index = options.findIndex(opt => opt === q.correct_answer);
          correctAnswer = index !== -1 ? index : 0;
        } else if (typeof q.answer === 'string') {
          // Handle single letter answers like 'A', 'B', 'C', 'D'
          const letterAnswer = q.answer.toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(letterAnswer)) {
            correctAnswer = letterAnswer.charCodeAt(0) - 65;
          }
        }
        
        // Normalize explanation
        const explanation = this.normalizeText(q.explanation || q.reason || q.rationale || `This is the correct answer for question ${index + 1}.`);
        
        return {
          question,
          options,
          correctAnswer,
          explanation,
        };
      })
      .filter(q => q.question.length > 5 && q.options.length === 4); // Final validation
  }

  private normalizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/^[A-D]\)\s*/, '') // Remove leading option letters
      .trim();
  }

  private extractQuestionsFromText(
    response: string,
    topic: string,
    subtopic: string
  ): GeminiQuizQuestion[] {
    try {
      console.log("📝 Attempting text extraction from response");
      
      // Multiple extraction strategies
      const strategies = [
        () => this.extractWithPatterns(response),
        () => this.extractWithRegex(response),
        () => this.extractWithLines(response),
        () => this.extractWithBlocks(response)
      ];
      
      for (const strategy of strategies) {
        try {
          const extracted = strategy();
          if (extracted.length > 0) {
            console.log(`✅ Text extraction successful with ${extracted.length} questions`);
            return extracted;
          }
        } catch (error) {
          console.warn("Text extraction strategy failed:", error);
          continue;
        }
      }
      
      // If all strategies fail, return basic questions
      console.log("⚠️ All text extraction strategies failed, generating basic questions");
      return this.generateBasicQuizQuestions(topic, subtopic, []);
      
    } catch (error) {
      console.error("❌ Text extraction failed completely:", error);
      return this.generateBasicQuizQuestions(topic, subtopic, []);
    }
  }

  private extractWithPatterns(response: string): GeminiQuizQuestion[] {
    const questions: GeminiQuizQuestion[] = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    let currentQuestion: any = {};
    let questionCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Enhanced question patterns
      if (this.isQuestionLine(trimmedLine)) {
        if (currentQuestion.question && questionCount < 30) {
          questions.push(this.finalizeQuestion(currentQuestion, questionCount));
          questionCount++;
        }
        currentQuestion = {
          question: this.extractQuestionText(trimmedLine),
          options: [],
          correctAnswer: 0,
          explanation: ''
        };
      }
      // Enhanced option patterns
      else if (this.isOptionLine(trimmedLine)) {
        currentQuestion.options = currentQuestion.options || [];
        currentQuestion.options.push(this.extractOptionText(trimmedLine));
      }
      // Enhanced answer patterns
      else if (this.isAnswerLine(trimmedLine)) {
        const answerIndex = this.extractAnswerIndex(trimmedLine);
        if (answerIndex !== -1) {
          currentQuestion.correctAnswer = answerIndex;
        }
      }
      // Enhanced explanation patterns
      else if (this.isExplanationLine(trimmedLine)) {
        currentQuestion.explanation = this.extractExplanationText(trimmedLine);
      }
    }
    
    // Add the last question
    if (currentQuestion.question && questionCount < 30) {
      questions.push(this.finalizeQuestion(currentQuestion, questionCount));
    }
    
    return questions;
  }

  private extractWithRegex(response: string): GeminiQuizQuestion[] {
    const questions: GeminiQuizQuestion[] = [];
    
    // Pattern for complete question blocks
    const questionBlockPattern = /(?:(?:^\d+[\.\)]?\s*)|(?:^Q\d*[\.\)]?\s*)|(?:^Question\s*\d*[\.\)]?\s*))([^\n]+)[\s\S]*?(?:(?:A[\.\)]?\s*([^\n]+))|(?:a[\.\)]?\s*([^\n]+)))[\s\S]*?(?:(?:B[\.\)]?\s*([^\n]+))|(?:b[\.\)]?\s*([^\n]+)))[\s\S]*?(?:(?:C[\.\)]?\s*([^\n]+))|(?:c[\.\)]?\s*([^\n]+)))[\s\S]*?(?:(?:D[\.\)]?\s*([^\n]+))|(?:d[\.\)]?\s*([^\n]+)))[\s\S]*?(?:(?:Answer|Correct|answer|correct)[\s\S]*?([A-Da-d]))?[\s\S]*?(?:(?:Explanation|explanation)[\s\S]*?([^\n]+))?/gim;
    
    let match;
    while ((match = questionBlockPattern.exec(response)) !== null && questions.length < 30) {
      const question = match[1]?.trim();
      const options = [
        match[2] || match[3],
        match[4] || match[5],
        match[6] || match[7],
        match[8] || match[9]
      ].filter(opt => opt && opt.trim()).map(opt => opt.trim());
      
      if (question && options.length >= 4) {
        let correctAnswer = 0;
        if (match[10]) {
          const answerLetter = match[10].toUpperCase();
          correctAnswer = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
          if (correctAnswer === -1) correctAnswer = 0;
        }
        
        const explanation = match[11]?.trim() || `This is the correct answer for this question about ${question.substring(0, 30)}...`;
        
        questions.push({
          question,
          options: options.slice(0, 4),
          correctAnswer,
          explanation
        });
      }
    }
    
    return questions;
  }

  private extractWithLines(response: string): GeminiQuizQuestion[] {
    const questions: GeminiQuizQuestion[] = [];
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    for (let i = 0; i < lines.length && questions.length < 30; i++) {
      const line = lines[i];
      
      // Check if this line looks like a question
      if (this.isQuestionLine(line)) {
        const question = this.extractQuestionText(line);
        const options: string[] = [];
        let correctAnswer = 0;
        let explanation = '';
        
        // Look for options in the next few lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          
          if (this.isOptionLine(nextLine)) {
            options.push(this.extractOptionText(nextLine));
          } else if (this.isAnswerLine(nextLine)) {
            const answerIndex = this.extractAnswerIndex(nextLine);
            if (answerIndex !== -1) {
              correctAnswer = answerIndex;
            }
          } else if (this.isExplanationLine(nextLine)) {
            explanation = this.extractExplanationText(nextLine);
          } else if (this.isQuestionLine(nextLine)) {
            // Next question found, stop looking
            break;
          }
        }
        
        if (options.length >= 4) {
          questions.push({
            question,
            options: options.slice(0, 4),
            correctAnswer,
            explanation: explanation || `This is the correct answer for: ${question.substring(0, 50)}...`
          });
        }
      }
    }
    
    return questions;
  }

  private extractWithBlocks(response: string): GeminiQuizQuestion[] {
    const questions: GeminiQuizQuestion[] = [];
    
    // Split response into blocks based on double newlines or question markers
    const blocks = response.split(/\n\s*\n|\n(?=\d+[\.\)]?\s)|\n(?=Q\d*[\.\)]?\s)|\n(?=Question\s*\d*[\.\)]?\s)/i);
    
    for (const block of blocks) {
      if (questions.length >= 30) break;
      
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 4) continue; // Need at least question + 3 options
      
      let question = '';
      const options: string[] = [];
      let correctAnswer = 0;
      let explanation = '';
      
      for (const line of lines) {
        if (this.isQuestionLine(line) && !question) {
          question = this.extractQuestionText(line);
        } else if (this.isOptionLine(line) && options.length < 4) {
          options.push(this.extractOptionText(line));
        } else if (this.isAnswerLine(line)) {
          const answerIndex = this.extractAnswerIndex(line);
          if (answerIndex !== -1) {
            correctAnswer = answerIndex;
          }
        } else if (this.isExplanationLine(line)) {
          explanation = this.extractExplanationText(line);
        }
      }
      
      if (question && options.length >= 4) {
        questions.push({
          question,
          options: options.slice(0, 4),
          correctAnswer,
          explanation: explanation || `This is the correct answer for: ${question.substring(0, 50)}...`
        });
      }
    }
    
    return questions;
  }

  private isQuestionLine(line: string): boolean {
    return /^\d+[\.\)]?\s+/.test(line) || 
           /^Q\d*[\.\)]?\s+/i.test(line) ||
           /^Question\s*\d*[\.\)]?\s+/i.test(line) ||
           line.toLowerCase().includes('question') ||
           line.includes('?');
  }

  private isOptionLine(line: string): boolean {
    return /^[A-Da-d][\.\)]?\s+/.test(line) ||
           /^\([A-Da-d]\)\s+/.test(line) ||
           /^-\s+/.test(line) ||
           /^\*\s+/.test(line);
  }

  private isAnswerLine(line: string): boolean {
    return /^(?:answer|correct|solution)[\s:]*[A-Da-d]/i.test(line) ||
           /[A-Da-d]\s*(?:is|are)?\s*(?:the)?\s*(?:correct|right|answer)/i.test(line);
  }

  private isExplanationLine(line: string): boolean {
    return /^(?:explanation|reason|because|rationale)[\s:]/i.test(line) ||
           line.toLowerCase().includes('explanation') ||
           line.toLowerCase().includes('because');
  }

  private extractQuestionText(line: string): string {
    return line
      .replace(/^\d+[\.\)]?\s+/, '')
      .replace(/^Q\d*[\.\)]?\s+/i, '')
      .replace(/^Question\s*\d*[\.\)]?\s+/i, '')
      .trim();
  }

  private extractOptionText(line: string): string {
    return line
      .replace(/^[A-Da-d][\.\)]?\s+/, '')
      .replace(/^\([A-Da-d]\)\s+/, '')
      .replace(/^-\s+/, '')
      .replace(/^\*\s+/, '')
      .trim();
  }

  private extractAnswerIndex(line: string): number {
    const match = line.match(/[A-Da-d]/);
    if (match) {
      const letter = match[0].toUpperCase();
      return ['A', 'B', 'C', 'D'].indexOf(letter);
    }
    return -1;
  }

  private extractExplanationText(line: string): string {
    return line
      .replace(/^(?:explanation|reason|because|rationale)[\s:]*/i, '')
      .trim();
  }

  private finalizeQuestion(questionData: any, index: number): GeminiQuizQuestion {
    return {
      question: questionData.question || `Question ${index + 1}`,
      options: questionData.options && questionData.options.length >= 4 
        ? questionData.options.slice(0, 4) 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof questionData.correctAnswer === 'number' 
        ? Math.max(0, Math.min(3, questionData.correctAnswer))
        : 0,
      explanation: questionData.explanation || `Explanation for question ${index + 1}`
    };
  }

  private intelligentTopicExtraction(prompt: string): ExtractedTopic {
    const promptLower = prompt.toLowerCase();

    // Extract main topic
    let mainTopic = "General Course";
    let subtopics: string[] = [];
    let difficulty: "beginner" | "intermediate" | "advanced" = "beginner";

    // Psychology course detection
    if (promptLower.includes("psychology")) {
      mainTopic = "Psychology";
      subtopics = [
        "Introduction to Psychology",
        "Research Methods in Psychology",
        "Biological Psychology",
        "Sensation and Perception",
        "Learning and Memory",
        "Cognitive Psychology",
        "Developmental Psychology",
        "Social Psychology",
        "Personality Psychology",
        "Abnormal Psychology and Mental Health",
      ];
    }
    // Machine Learning detection
    else if (
      promptLower.includes("machine learning") ||
      promptLower.includes("ml")
    ) {
      mainTopic = "Machine Learning";
      subtopics = [
        "Introduction to Machine Learning",
        "Data Preprocessing and Exploration",
        "Supervised Learning Algorithms",
        "Unsupervised Learning",
        "Model Evaluation and Validation",
        "Feature Engineering",
        "Deep Learning Fundamentals",
        "Neural Networks",
        "Model Deployment",
        "Ethics in Machine Learning",
      ];
    }
    // Web Development detection
    else if (
      promptLower.includes("web development") ||
      promptLower.includes("react") ||
      promptLower.includes("javascript")
    ) {
      mainTopic = "Web Development";
      subtopics = [
        "HTML Fundamentals",
        "CSS Styling and Layout",
        "JavaScript Basics",
        "DOM Manipulation",
        "React Components",
        "State Management",
        "API Integration",
        "Responsive Design",
        "Testing and Debugging",
        "Deployment and Hosting",
      ];
    }
    // Digital Marketing detection
    else if (
      promptLower.includes("marketing") ||
      promptLower.includes("digital marketing")
    ) {
      mainTopic = "Digital Marketing";
      subtopics = [
        "Digital Marketing Fundamentals",
        "Content Marketing Strategy",
        "Social Media Marketing",
        "Search Engine Optimization (SEO)",
        "Pay-Per-Click Advertising (PPC)",
        "Email Marketing",
        "Analytics and Data Analysis",
        "Conversion Optimization",
        "Marketing Automation",
        "Brand Building and Strategy",
      ];
    }
    // Data Science detection
    else if (
      promptLower.includes("data science") ||
      promptLower.includes("python")
    ) {
      mainTopic = "Data Science";
      subtopics = [
        "Introduction to Data Science",
        "Python for Data Science",
        "Data Collection and Cleaning",
        "Exploratory Data Analysis",
        "Statistical Analysis",
        "Data Visualization",
        "Machine Learning for Data Science",
        "Big Data Technologies",
        "Data Ethics and Privacy",
        "Real-World Data Projects",
      ];
    } else {
      // Generic extraction
      mainTopic = this.extractMainTopicFromPrompt(prompt);
      subtopics = [
        `Introduction to ${mainTopic}`,
        `${mainTopic} Fundamentals`,
        `Core ${mainTopic} Concepts`,
        `Advanced ${mainTopic} Techniques`,
        `Practical ${mainTopic} Applications`,
        `${mainTopic} Best Practices`,
      ];
    }

    // Detect difficulty
    if (promptLower.includes("advanced") || promptLower.includes("expert")) {
      difficulty = "advanced";
    } else if (
      promptLower.includes("intermediate") ||
      promptLower.includes("medium")
    ) {
      difficulty = "intermediate";
    }

    return {
      mainTopic,
      subtopics,
      difficulty,
      estimatedDuration: subtopics.length * 0.75, // 45 minutes per subtopic
      prerequisites:
        difficulty === "beginner"
          ? ["Basic computer literacy"]
          : [`Basic ${mainTopic} knowledge`],
      learningObjectives: [
        `Understand core ${mainTopic} concepts and principles`,
        `Apply ${mainTopic} techniques in practical scenarios`,
        `Analyze and solve ${mainTopic}-related problems`,
        `Create projects using ${mainTopic} skills`,
        `Evaluate and optimize ${mainTopic} solutions`,
      ],
    };
  }

  private extractMainTopicFromPrompt(prompt: string): string {
    // Simple extraction logic
    const words = prompt.split(" ");
    const importantWords = words.filter(
      (word) =>
        word.length > 3 &&
        ![
          "course",
          "learn",
          "tutorial",
          "guide",
          "introduction",
          "complete",
        ].includes(word.toLowerCase())
    );

    return importantWords.slice(0, 2).join(" ") || "General Course";
  }

  private generateStructuredCourse(
    extractedTopic: ExtractedTopic
  ): GeminiCourseStructure {
    const subtopics: GeminiSubtopic[] = extractedTopic.subtopics.map(
      (subtopic, index) => ({
        title: subtopic,
        description: `Comprehensive coverage of ${subtopic} including theory, practical applications, and real-world examples.`,
        order: index + 1,
        keyPoints: [
          `Understanding ${subtopic} fundamentals`,
          `Key concepts and terminology`,
          `Practical applications`,
          `Best practices and common pitfalls`,
          `Real-world examples and case studies`,
        ],
        estimatedDuration: 45,
        searchTerms: [
          `${extractedTopic.mainTopic} ${subtopic} tutorial`,
          `${subtopic} explained`,
          `${extractedTopic.mainTopic} ${subtopic} course`,
          `learn ${subtopic}`,
          `${subtopic} for beginners`,
        ],
        quizQuestions: this.generateBasicQuizQuestions(
          extractedTopic.mainTopic,
          subtopic,
          []
        ),
      })
    );

    return {
      title: `Complete ${extractedTopic.mainTopic} Course - ${
        extractedTopic.difficulty.charAt(0).toUpperCase() +
        extractedTopic.difficulty.slice(1)
      } Level`,
      description: `Master ${extractedTopic.mainTopic} with this comprehensive ${extractedTopic.difficulty} course. Learn through hands-on projects, real-world examples, and industry best practices.`,
      mainTopic: extractedTopic.mainTopic,
      subtopics,
      totalDuration: extractedTopic.estimatedDuration * 60,
      difficulty: extractedTopic.difficulty as
        | "beginner"
        | "intermediate"
        | "advanced",
      prerequisites: extractedTopic.prerequisites,
      learningObjectives: extractedTopic.learningObjectives,
    };
  }

  async generateLessonSummary(
    lessonTitle: string,
    lessonContent: string
  ): Promise<string> {
    if (!this.apiKey) {
      return this.generateBasicSummary(lessonTitle, lessonContent);
    }

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
- Include the lesson title naturally in the opening
- Keep it 3-4 sentences, comprehensive but concise

Example format:
"In this lesson on ${lessonTitle}, you will learn [specific skill/concept], including [detailed learning point 1], [detailed learning point 2], and [detailed learning point 3]. You'll discover how to [practical application], understand [important principle], and master [specific technique] that you can apply immediately. By the end of this lesson, you'll have gained [specific competency] and be ready to [next actionable step]."
`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseSummaryResponse(response, lessonTitle, lessonContent);
    } catch (error) {
      console.error("Gemini API error for lesson summary:", error);
      return this.generateBasicSummary(lessonTitle, lessonContent);
    }
  }

  private parseSummaryResponse(
    response: string,
    lessonTitle: string,
    lessonContent: string
  ): string {
    try {
      // Clean up the response and extract the summary
      const cleanResponse = response.trim();

      // If the response already starts with "In this lesson", use it directly
      if (cleanResponse.toLowerCase().startsWith("in this lesson")) {
        return cleanResponse;
      }

      // Otherwise, try to extract meaningful content and format it properly
      const sentences = cleanResponse
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);
      if (sentences.length > 0) {
        return `In this lesson on ${lessonTitle}, you will learn ${sentences[0]
          .trim()
          .toLowerCase()}.`;
      }
    } catch (error) {
      console.error("Failed to parse summary response:", error);
    }

    return this.generateBasicSummary(lessonTitle, lessonContent);
  }

  private generateBasicSummary(
    lessonTitle: string,
    lessonContent: string
  ): string {
    // Extract key information from the lesson content
    const content = lessonContent.toLowerCase();

    // Create a more engaging fallback summary
    let summary = `In this lesson on ${lessonTitle}, you will learn `;

    // Add specific learning outcomes based on content analysis
    if (content.includes("introduction") || content.includes("overview")) {
      summary += `the fundamental concepts and core principles of ${lessonTitle}. You'll gain a comprehensive understanding of the key ideas that form the foundation of this topic. `;
    } else if (
      content.includes("practical") ||
      content.includes("example") ||
      content.includes("application")
    ) {
      summary += `how to apply ${lessonTitle} concepts in real-world scenarios. You'll explore practical examples and discover actionable techniques you can use immediately. `;
    } else if (
      content.includes("technique") ||
      content.includes("method") ||
      content.includes("approach")
    ) {
      summary += `essential techniques and methodologies related to ${lessonTitle}. You'll master proven approaches and learn best practices used by professionals in the field. `;
    } else {
      summary += `key concepts and practical skills related to ${lessonTitle}. You'll develop a thorough understanding of important principles and learn how to apply them effectively. `;
    }

    summary += `By the end of this lesson, you'll have gained valuable knowledge and be ready to confidently move forward with your learning journey.`;

    return summary;
  }

  private generateEnhancedBasicQuizQuestions(
    topic: string,
    subtopic: string,
    keyPoints: string[],
    count: number = 30
  ): GeminiQuizQuestion[] {
    const questions: GeminiQuizQuestion[] = [];

    // Generate different types of questions to reach the count
    const questionTypes = [
      "conceptual",
      "practical",
      "analytical",
      "application",
      "comparison",
      "scenario",
      "problem-solving",
      "best-practices",
    ];

    for (let i = 0; i < count; i++) {
      const questionType = questionTypes[i % questionTypes.length];
      const keyPoint =
        keyPoints[i % keyPoints.length] ||
        `Understanding ${subtopic} fundamentals`;
      // Difficulty levels: basic (first 1/3), intermediate (middle 1/3), advanced (last 1/3)

      let question: GeminiQuizQuestion;

      switch (questionType) {
        case "conceptual":
          question = {
            question: `What is the primary focus of ${subtopic} in ${topic}?`,
            options: [
              keyPoint,
              "General theoretical concepts only",
              "Historical perspectives exclusively",
              "Advanced research methodologies",
            ],
            correctAnswer: 0,
            explanation: `${subtopic} primarily focuses on ${keyPoint}, which is fundamental to understanding this area of ${topic}.`,
          };
          break;

        case "practical":
          question = {
            question: `How would you practically implement ${subtopic} concepts in a real-world ${topic} project?`,
            options: [
              `Apply ${keyPoint} following industry best practices`,
              "Use theoretical knowledge without practical considerations",
              "Rely solely on intuition and experience",
              "Copy existing solutions without understanding",
            ],
            correctAnswer: 0,
            explanation: `Practical implementation requires applying ${keyPoint} while following established industry best practices and considering real-world constraints.`,
          };
          break;

        case "analytical":
          question = {
            question: `When analyzing ${subtopic} in ${topic}, which factor is most critical to consider?`,
            options: [
              `The relationship between ${keyPoint} and overall system performance`,
              "Only the theoretical implications",
              "Historical development patterns",
              "Cost considerations alone",
            ],
            correctAnswer: 0,
            explanation: `Analysis requires understanding how ${keyPoint} relates to and impacts overall system performance and outcomes.`,
          };
          break;

        case "application":
          question = {
            question: `In which scenario would ${subtopic} principles be most effectively applied?`,
            options: [
              `When ${keyPoint} can be systematically implemented`,
              "In purely theoretical research environments",
              "Only in laboratory conditions",
              "When avoiding practical constraints",
            ],
            correctAnswer: 0,
            explanation: `${subtopic} principles are most effective when ${keyPoint} can be systematically implemented with proper planning and execution.`,
          };
          break;

        case "comparison":
          question = {
            question: `How does ${subtopic} compare to other approaches in ${topic}?`,
            options: [
              `${subtopic} provides unique advantages through ${keyPoint}`,
              "All approaches are essentially identical",
              "Other approaches are always superior",
              "Comparison is not meaningful",
            ],
            correctAnswer: 0,
            explanation: `${subtopic} offers distinct advantages by leveraging ${keyPoint} in ways that differentiate it from alternative approaches.`,
          };
          break;

        case "scenario":
          question = {
            question: `In a challenging ${topic} scenario, how would ${subtopic} knowledge help?`,
            options: [
              `By applying ${keyPoint} to identify and solve core issues`,
              "By avoiding the problem entirely",
              "By using only general knowledge",
              "By relying on others to solve it",
            ],
            correctAnswer: 0,
            explanation: `${subtopic} knowledge enables effective problem-solving by applying ${keyPoint} to identify root causes and develop targeted solutions.`,
          };
          break;

        case "problem-solving":
          question = {
            question: `What is the most effective problem-solving approach when dealing with ${subtopic} challenges?`,
            options: [
              `Systematically apply ${keyPoint} principles to break down the problem`,
              "Try random solutions until something works",
              "Avoid addressing the problem directly",
              "Use only previous experience without analysis",
            ],
            correctAnswer: 0,
            explanation: `Effective problem-solving requires systematically applying ${keyPoint} principles to understand and address challenges methodically.`,
          };
          break;

        default: // best-practices
          question = {
            question: `What represents a best practice when working with ${subtopic} in ${topic}?`,
            options: [
              `Consistently applying ${keyPoint} while adapting to specific contexts`,
              "Following rigid rules without considering context",
              "Ignoring established practices",
              "Prioritizing speed over quality",
            ],
            correctAnswer: 0,
            explanation: `Best practices involve consistently applying ${keyPoint} while remaining flexible enough to adapt to specific contexts and requirements.`,
          };
      }

      questions.push(question);
    }

    return questions;
  }

  private generateBasicQuizQuestions(
    topic: string,
    subtopic: string,
    keyPoints: string[]
  ): GeminiQuizQuestion[] {
    // Legacy method for backward compatibility - now generates 5 questions
    return this.generateEnhancedBasicQuizQuestions(
      topic,
      subtopic,
      keyPoints,
      5
    );
  }
}

export const geminiAPI = new GeminiAPIService();
