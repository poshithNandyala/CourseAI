// Gemini AI API service for intelligent course generation
import { userApiKeyService } from "./userApiKeyService";

class GeminiAPIService {
  baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest";

  constructor() {
    // API key is now retrieved dynamically before each call.
  }

  // Get user's API key dynamically
  async getApiKey() {
    return await userApiKeyService.getGeminiApiKey();
  }

  async extractTopicAndStructure(userPrompt) {
    try {
      await this.getApiKey(); // Check if API key exists
    } catch (error) {
      console.warn(
        "User's Gemini API key not configured, using intelligent parsing. Error:",
        error
      );
      return this.intelligentTopicExtraction(userPrompt);
    }

    try {
      const prompt = `
CRITICAL must stay EXACTLY on the topic requested. Do not deviate or generalize.

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
  "difficulty": "beginner",
  "estimatedDuration": 6,
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
}

EXAMPLE user asks "sex positions", main topic should be "sex positions" and subtopics should be specific types/categories of sex positions, NOT general relationship advice.

Create 6-12 logical subtopics that build upon each other within this EXACT topic.
`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseTopicExtraction(response, userPrompt);
    } catch (error) {
      console.error("Gemini API error for topic extraction:", error);
      return this.intelligentTopicExtraction(userPrompt);
    }
  }

  async generateCourseStructure(extractedTopic) {
    try {
      await this.getApiKey(); // Check if API key exists
    } catch (error) {
      console.warn("User's Gemini API key not configured, using fallback. Error:", error);
      return this.generateStructuredCourse(extractedTopic);
    }

    try {
      const prompt = `
CRITICAL EXACTLY focused on "${extractedTopic.mainTopic
        }". Do not deviate from this topic.

Create a comprehensive course structure for: "${extractedTopic.mainTopic}"

MANDATORY content must be directly about "${extractedTopic.mainTopic
        }" - do not generalize or suggest related topics.

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

  async generateComprehensiveQuiz(topic, lessonTitle, lessonContent, questionsPerLesson = 30) {
    try {
      await this.getApiKey(); // Check if API key exists
    } catch (error) {
      console.warn("User's Gemini API key not configured, using basic quiz. Error:", error);
      return this.generateBasicQuizQuestions(topic, lessonTitle, []);
    }

    try {
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

  detectContentType(topic, content) {
    const topicLower = topic.toLowerCase();
    const contentLower = content.toLowerCase();
    const combinedText = topicLower + " " + contentLower;

    if (combinedText.includes("c++") || combinedText.includes("cpp")) return "cpp";
    if (combinedText.includes("python") || combinedText.includes("def ") || combinedText.includes("import ")) return "python";
    if (combinedText.includes("javascript") || combinedText.includes("react") || combinedText.includes("node")) return "javascript";
    if (combinedText.includes("java") && !combinedText.includes("javascript")) return "java";
    if (combinedText.includes("programming") || combinedText.includes("coding")) return "programming";
    if (combinedText.includes("data science") || combinedText.includes("machine learning")) return "datascience";
    if (combinedText.includes("math") || combinedText.includes("calculus") || combinedText.includes("algebra")) return "mathematics";
    if (combinedText.includes("physics")) return "physics";
    if (combinedText.includes("chemistry")) return "chemistry";
    if (combinedText.includes("biology")) return "biology";
    if (combinedText.includes("dance") || combinedText.includes("music") || combinedText.includes("art")) return "arts";
    if (combinedText.includes("business") || combinedText.includes("marketing")) return "business";
    if (combinedText.includes("psychology")) return "psychology";
    return "general";
  }

  buildComprehensiveQuizPrompt(topic, lessonTitle, lessonContent, contentType, questionsPerLesson = 30) {
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
      case "cpp": {
        const cppCodeBasedCount = Math.floor(questionsPerLesson * 0.6);
        specificInstructions = `
C++ PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include ${cppCodeBasedCount} code-based questions with REAL, EXECUTABLE C++ code snippets
- Focus on C++ specific features, objects, inheritance, polymorphism, templates, STL
- Add syntax, logic, and output prediction questions with ACTUAL C++ CODE
- Include debugging scenarios with REAL buggy C++ code examples
- Ask about memory management, pointers, references, and RAII principles
- Test understanding of OOP concepts specific to C++
- Include questions about C++ standard library (iostream, vector, string, algorithms)
- Test knowledge of C++ specific features like operator overloading, friend functions, virtual functions

MANDATORY C++ CODE EXAMPLES (Include these types). Output Prediction with C++ Code: "What will this C++ code output?\\n\`\`\`cpp\\n#include <iostream>\\nusing namespace std;\\nclass Base {\\npublic:\\n    virtual void show() { cout << \\"Base\\"; }\\n};\\nclass Derived : public Base {\\npublic:\\n    void show() override { cout << \\"Derived\\"; }\\n};\\nint main() {\\n    Base* ptr = new Derived();\\n    ptr->show();\\n    delete ptr;\\n    return 0;\\n}\\n\`\`\`"

2. Memory Management: "What's the issue with this C++ code?\\n\`\`\`cpp\\nint* createArray(int size) {\\n    int* arr = new int[size];\\n    for(int i = 0; i < size; i++) {\\n        arr[i] = i * 2;\\n    }\\n    return arr;\\n}\\nint main() {\\n    int* myArray = createArray(10);\\n    // Use array\\n    return 0;\\n}\\n\`\`\`"

3. STL and Templates: "What does this C++ template code do?\\n\`\`\`cpp\\ntemplate<typename T>\\nT maximum(T a, T b) {\\n    return (a > b) ? a : b;\\n}\\nint main() {\\n    cout << maximum<int>(5, 10) << endl;\\n    cout << maximum<double>(3.7, 2.1) << endl;\\n    return 0;\\n}\\n\`\`\`"

4. Class and Object Concepts: "In this C++ class, what will happen?\\n\`\`\`cpp\\nclass Rectangle {\\nprivate:\\n    int width, height;\\npublic:\\n    Rectangle(int w, int h) : width(w), height(h) {}\\n    int area() const { return width * height; }\\n    Rectangle operator+(const Rectangle& other) {\\n        return Rectangle(width + other.width, height + other.height);\\n    }\\n};\\n\`\`\`"

5. Inheritance and Polymorphism: "Which method will be called?\\n\`\`\`cpp\\nclass Animal {\\npublic:\\n    virtual void makeSound() { cout << \\"Animal sound\\"; }\\n};\\nclass Dog : public Animal {\\npublic:\\n    void makeSound() override { cout << \\"Woof\\"; }\\n};\\nAnimal* pet = new Dog();\\npet->makeSound();\\n\`\`\`"

6. Pointer and Reference Questions: "What's the difference between these declarations?"
7. Exception Handling: "How should this C++ code handle exceptions?"
8. Constructor/Destructor concepts: "What happens in this object lifecycle?"

FOCUS ON C++ SPECIFICS, Objects, Inheritance, Polymorphism, Templates, STL, Memory Management, Operator Overloading, Virtual Functions, Friend Functions, Exception Handling`;
        break;
      }

      case "python":
        specificInstructions = `
PYTHON PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 18-20 code-based questions with REAL, EXECUTABLE Python code snippets
- Focus on Python specific features comprehensions, decorators, generators, context managers
- Add syntax, logic, and output prediction questions with ACTUAL Python CODE
- Include debugging scenarios with REAL buggy Python code examples
- Test understanding of Python data structures, dictionaries, sets, tuples
- Include questions about Python libraries, numpy, matplotlib (if applicable)
- Test knowledge of Python OOP, file handling, and exception handling
- Include questions about Python-specific concepts like duck typing, LEGB scope

MANDATORY PYTHON CODE EXAMPLES (Include these types). List Comprehensions: "What will this Python code output?\\n\`\`\`python\\nnumbers = [1, 2, 3, 4, 5]\\nsquared_evens = [x**2 for x in numbers if x % 2 == 0]\\nprint(squared_evens)\\n\`\`\`"

2. Dictionary and Functions: "What's the output?\\n\`\`\`python\\ndef update_scores(scores, **kwargs):\\n    scores.update(kwargs)\\n    return scores\\n\\nplayer_scores = {'Alice': 10, 'Bob': 15}\\nresult = update_scores(player_scores, Charlie=20, Alice=25)\\nprint(player_scores)\\nprint(result)\\n\`\`\`"

3. Decorators: "What does this decorator do?\\n\`\`\`python\\ndef timer(func):\\n    def wrapper(*args, **kwargs):\\n        import time\\n        start = time.time()\\n        result = func(*args, **kwargs)\\n        print(f'Time: {time.time() - start}')\\n        return result\\n    return wrapper\\n\`\`\`"

4. Exception Handling: "What will happen with this code?"
5. Class and Inheritance: "How does Python multiple inheritance work?"
6. File Operations: "What's the best practice for file handling?"
7. Lambda and Map/Filter: "What does this functional programming code do?"
8. Generator Functions: "How do yield and generators work?"

FOCUS ON PYTHON SPECIFICS/Dict Comprehensions, Decorators, Generators, Context Managers, Duck Typing, Exception Handling, File Operations`;
        break;

      case "javascript":
        specificInstructions = `
JAVASCRIPT PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 18-20 code-based questions with REAL, EXECUTABLE JavaScript code snippets
- Focus on JavaScript specific features, promises, async/await, prototype chain
- Add syntax, logic, and output prediction questions with ACTUAL JavaScript CODE
- Include debugging scenarios with REAL buggy JavaScript code examples
- Test understanding of DOM manipulation, event handling, and asynchronous programming
- Include questions about ES6+ features functions, destructuring, template literals
- Test knowledge of JavaScript frameworks like React (if applicable)
- Include questions about scope, hoisting, and JavaScript's event loop

MANDATORY JAVASCRIPT CODE EXAMPLES (Include these types). Closures and Scope: "What will this JavaScript code output?\\n\`\`\`javascript\\nfunction createCounter() {\\n    let count = 0;\\n    return function() {\\n        count++;\\n        return count;\\n    };\\n}\\nconst counter1 = createCounter();\\nconst counter2 = createCounter();\\nconsole.log(counter1()); // ?\\nconsole.log(counter1()); // ?\\nconsole.log(counter2()); // ?\\n\`\`\`"

2. Promises and Async: "What's the output order?\\n\`\`\`javascript\\nconsole.log('1');\\nsetTimeout(() => console.log('2'), 0);\\nPromise.resolve().then(() => console.log('3'));\\nconsole.log('4');\\n\`\`\`"

3. Array Methods: "What does this code return?\\n\`\`\`javascript\\nconst numbers = [1, 2, 3, 4, 5];\\nconst result = numbers\\n    .filter(n => n % 2 === 0)\\n    .map(n => n * 3)\\n    .reduce((sum, n) => sum + n, 0);\\nconsole.log(result);\\n\`\`\`"

4. Object Destructuring: "What values are extracted?"
5. This Context: "What does 'this' refer to in different contexts?"
6. Event Loop: "How does JavaScript handle asynchronous operations?"
7. Prototype Chain: "How does JavaScript inheritance work?"
8. Arrow Functions vs Regular Functions: "What's the difference?"

FOCUS ON JAVASCRIPT SPECIFICS, Promises, Async/Await, Prototypes, Event Loop, ES6+ Features, DOM Manipulation`;
        break;

      case "java":
        specificInstructions = `
JAVA PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 18-20 code-based questions with REAL, EXECUTABLE Java code snippets
- Focus on Java specific features: OOP, Collections Framework, Generics, Streams, Lambda expressions.
- Add syntax, logic, and output prediction questions with ACTUAL Java CODE.
- Include debugging scenarios with REAL buggy Java code examples.
- Test understanding of JVM, garbage collection, and exception handling.

MANDATORY JAVA CODE EXAMPLES (Include these types):
1. Inheritance and Polymorphism: "What is the output of this Java code?\\n\`\`\`java\\nclass Animal {\\n    void makeSound() { System.out.println(\\"Animal sound\\"); }\\n    void sleep() { System.out.println(\\"Sleeping\\"); }\\n}\\nclass Dog extends Animal {\\n    void makeSound() { System.out.println(\\"Woof\\"); }\\n}\\npublic class Main {\\n    public static void main(String[] args) {\\n        Animal pet = new Dog();\\n        pet.makeSound();\\n        pet.sleep();\\n    }\\n}\\n\`\`\`"

2. Collections Framework: "What's the output?\\n\`\`\`java\\nimport java.util.*;\\nArrayList<Integer> numbers = new ArrayList<>();\\nnumbers.add(10);\\nnumbers.add(20);\\nnumbers.add(10);\\nSet<Integer> uniqueNumbers = new HashSet<>(numbers);\\nSystem.out.println(uniqueNumbers.size());\\n\`\`\`"

FOCUS ON JAVA SPECIFICS, OOP, Collections, Generics, Streams, Exception Handling`;
        break;

      case "programming":
        specificInstructions = `
GENERAL PROGRAMMING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 practical, language-agnostic questions about algorithms, data structures, and design patterns.
- Focus on problem-solving, logic, and computational thinking.
- Include questions about time/space complexity analysis (Big O notation).
- Test understanding of software development lifecycle, testing, and debugging.

PREMIUM PROGRAMMING EXAMPLES (Include these types):
1. Data Structures: "Which data structure is most efficient for implementing a LIFO (Last-In, First-Out) behavior? A) Queue B) Stack C) Linked List D) Hash Map"
2. Algorithms: "What is the time complexity of a binary search algorithm on a sorted array of size N? A) O(1) B) O(log N) C) O(N) D) O(N²)"
3. Algorithm Analysis with Real Performance Impact: "Which approach has better time complexity for processing 1 million records?\\nOption A HashMap lookup\\nOption B search through array\\nOption C search on sorted array\\nOption D traversal"
4. Best Practices and Code Quality: "Which code follows best practices for error handling?"
5. Practical Implementation with Real-World Context: "Complete this function to implement a rate limiter for an API endpoint"
6. Architecture and Design Patterns: "Which design pattern is most appropriate for this scenario?"
7. Security and Performance: "What security vulnerability exists in this code?"
8. Testing and Debugging: "What test cases would you write for this function?"

MAKE IT PROFESSIONAL-GRADE - Use actual syntax, industry standards, and real-world scenarios that senior developers encounter`;
        break;

      case "arts":
        specificInstructions = `
ARTS/DANCE/MUSIC-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include PRACTICAL technique and rhythm coordination questions that test professional-level understanding
- Ask about SPECIFIC music selection for movements with BPM examples and genre characteristics
- Test knowledge of styles with REAL-WORLD performance scenarios and cultural context

PREMIUM PRACTICAL EXAMPLES (Include these types). Advanced Music Selection: "For a contemporary dance piece expressing emotional transformation, which musical elements are most crucial? A) Consistent 4/4 time signature with 120-140 BPM B) Dynamic tempo changes with instrumental crescendos C) Repetitive electronic beats with minimal variation D) Classical structure with predictable phrasing"
2. Complex Step Sequences: "In advanced salsa dancing, when executing a cross-body lead with inside turn, what is the critical timing element? A) Leader's right hand guides on beat 1 B) Follower begins turn on beat 5 C) Connection is maintained through beats 2-3 D) Eye contact is established on beat 7"
MAKE QUESTIONS PROFESSIONAL-GRADE - Focus on artistry, technique, cultural understanding, and real performance situations that serious dancers and choreographers encounter`;
        break;

      case "datascience":
        specificInstructions = `
DATA SCIENCE/MACHINE LEARNING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 practical data science questions with REAL datasets and scenarios
- Focus on data analysis, machine learning algorithms, and statistical concepts
- Include questions about data preprocessing, feature engineering, and model evaluation
- Test understanding of Python libraries, numpy, scikit-learn, matplotlib

MANDATORY DATA SCIENCE EXAMPLES (Include these types). Data Analysis: "Given this dataset, what does this pandas code do?\\n\`\`\`python\\nimport pandas as pd\\ndf = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})\\nresult = df.groupby('A').agg({'B': ['mean', 'sum']})\\nprint(result)\\n\`\`\`"
2. Machine Learning: "Which algorithm is best for this classification problem with 1000 features and 100 samples?"
3. Statistical Analysis: "What does a p-value of 0.03 indicate in this hypothesis test?"
FOCUS ON Analysis, Machine Learning, Statistics, Python Libraries, Model Evaluation, Data Ethics`;
        break;

      case "mathematics":
        specificInstructions = `
MATHEMATICS-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 mathematical problems with REAL calculations and formulas
- Focus on problem-solving, step-by-step solutions, and mathematical reasoning
- Include questions about algebra, calculus, geometry, statistics (as applicable)

MANDATORY MATHEMATICS EXAMPLES (Include these types). Calculus: "Find the derivative of f(x) = 3x³ - 2x² + 5x - 1. A) 9x² - 4x + 5 B) 9x² - 4x + 5x C) 3x² - 2x + 5 D) 9x² - 4x"
2. Algebra: "Solve for x: 2(x + 3) = 4x - 8. A) x = 7 B) x = 5 C) x = 3 D) x = 1"
FOCUS ON Problem-solving, Calculations, Mathematical Reasoning, Real-world Applications`;
        break;

      case "physics":
        specificInstructions = `
PHYSICS-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 physics problems with REAL calculations and formulas
- Focus on mechanics, thermodynamics, electromagnetism, waves, and modern physics

MANDATORY PHYSICS EXAMPLES (Include these types). Mechanics: "A 10 kg object moves at 5 m/s. What's its kinetic energy? A) 125 J B) 250 J C) 50 J D) 25 J"
2. Force and Motion: "F = ma. If F = 20 N and a = 4 m/s², what's the mass? A) 5 kg B) 80 kg C) 16 kg D) 24 kg"
FOCUS ON Problem-solving, Calculations, Physics Laws, Real-world Applications, Units and Measurements`;
        break;

      case "chemistry":
        specificInstructions = `
CHEMISTRY-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 chemistry problems with REAL chemical equations and calculations
- Focus on atomic structure, chemical bonding, reactions, and stoichiometry

MANDATORY CHEMISTRY EXAMPLES (Include these types). Stoichiometry: "In the reaction 2H₂ + O₂ → 2H₂O, how many moles of water form from 4 moles of H₂? A) 2 mol B) 4 mol C) 8 mol D) 1 mol"
2. Atomic Structure: "How many electrons does a neutral carbon atom have? A) 6 B) 12 C) 14 D) 8"
FOCUS ON Equations, Calculations, Periodic Table, Chemical Bonding, Real-world Applications`;
        break;

      case "biology":
        specificInstructions = `
BIOLOGY-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include 15-18 biology questions covering cell biology, genetics, ecology, evolution
- Focus on biological processes, systems, and scientific understanding

MANDATORY BIOLOGY EXAMPLES (Include these types). Cell Biology: "What organelle is responsible for protein synthesis? A) Nucleus B) Ribosome C) Mitochondria D) Golgi apparatus"
2. Genetics: "In a cross between Aa × Aa, what's the probability of AA offspring? A) 25% B) 50% C) 75% D) 100%"
FOCUS ON Processes, Systems, Genetics, Evolution, Ecology, Human Biology, Scientific Method`;
        break;

      case "science":
        specificInstructions = `
SCIENCE/MATH-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include ACTUAL calculation and formula-based questions with REAL NUMBERS and units
- Ask about REAL-WORLD applications with specific, measurable scenarios

PREMIUM PRACTICAL EXAMPLES (Include these types). Complex Calculations: "A projectile is launched at 45° with initial velocity 30 m/s. If air resistance is negligible, what is the maximum height reached? A) 11.5 m B) 23.0 m C) 45.9 m D) 91.8 m"
2. Multi-Step Formula Application: "A gas sample at 25°C and 1 atm pressure occupies 2.5 L. If heated to 75°C at constant pressure, what is the new volume? A) 2.9 L B) 3.0 L C) 3.1 L D) 7.5 L"
INCLUDE ACTUAL NUMBERS, units, and professional-level calculations that test quantitative reasoning and scientific thinking`;
        break;

      case "business":
        specificInstructions = `
BUSINESS/MARKETING-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include detailed case study and scenario-based questions with specific business contexts
- Ask about strategy implementation and decision-making with real market conditions

PREMIUM BUSINESS EXAMPLES (Include these types). Strategic Decision Making: "A SaaS company with 15% monthly churn rate and $50 customer acquisition cost faces declining growth. Which strategy should be prioritized? A) Increase marketing spend by 200% B) Focus on customer retention and product improvements C) Reduce pricing by 30% to increase volume D) Expand to new geographic markets immediately"
2. Financial Analysis: "A marketing campaign costs $50,000 and generates 500 new customers with an average lifetime value of $200. What is the ROI? A) 100% B) 200% C) 300% D) 400%"
MAKE QUESTIONS BUSINESS-REALISTIC - Include specific numbers, real market conditions, and strategic decisions that executives and managers face`;
        break;

      case "psychology":
        specificInstructions = `
PSYCHOLOGY-SPECIFIC REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include complex behavioral scenario questions with detailed case studies
- Ask about psychological principles and their applications in real clinical/research settings

PREMIUM PSYCHOLOGY EXAMPLES (Include these types). Clinical Case Analysis: "A client presents with persistent worry about work performance, difficulty sleeping, and muscle tension lasting 8 months. They report no specific triggers and symptoms occur across multiple life domains. Which diagnosis is most likely? A) Generalized Anxiety Disorder B) Panic Disorder C) Social Anxiety Disorder D) Adjustment Disorder with Anxiety"
2. Therapeutic Intervention: "For a client with PTSD using avoidance behaviors, which evidence-based treatment approach is most effective? A) Cognitive Behavioral Therapy with exposure therapy B) Psychodynamic therapy focusing on childhood experiences C) Humanistic therapy emphasizing self-acceptance D) Behavioral therapy using only relaxation techniques"
MAKE QUESTIONS CLINICALLY RELEVANT - Include specific diagnostic criteria, evidence-based practices, and real scenarios that psychology professionals encounter`;
        break;

      default:
        specificInstructions = `
GENERAL REQUIREMENTS FOR EXCEPTIONAL QUESTIONS:
- Include conceptual understanding questions that test deep comprehension
- Ask about practical applications with specific, measurable scenarios
- Test problem-solving abilities with complex, multi-step challenges

PREMIUM GENERAL EXAMPLES (Include these types). Conceptual Application: "When implementing ${topic} in a large organization, which factor is most critical for success? A) Technical expertise alone B) Stakeholder buy-in and change management C) Budget allocation D) Timeline compression"
2. Problem-Solving: "In a complex ${topic} project facing multiple constraints, which approach would you prioritize? A) Address technical challenges first B) Resolve resource limitations C) Conduct thorough stakeholder analysis and priority mapping D) Implement quick wins to build momentum"
MAKE QUESTIONS THOUGHT-PROVOKING - Focus on higher-order thinking skills and real-world application`;
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
    "difficulty": "basic"
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

  async generateQuizQuestions(topic, subtopic, keyPoints, questionsPerLesson = 30) {
    try {
      await this.getApiKey();
    } catch (error) {
      console.warn("User's Gemini API key not configured, using enhanced quiz. Error:", error);
      return this.generateEnhancedBasicQuizQuestions(topic, subtopic, keyPoints, questionsPerLesson);
    }

    try {
      const prompt = `
You are an expert quiz creator. Create ${questionsPerLesson} comprehensive, high-quality multiple-choice questions about "${subtopic}" within the topic of "${topic}".
Key learning points to cover:
${keyPoints.map((point) => `- ${point}`).join("\n")}
CRITICAL QUALITY REQUIREMENTS:
- Create exactly ${questionsPerLesson} questions.
- Each question must have 4 meaningful answer options with only one correct.
- Provide detailed explanations for correct answers.
Respond with JSON array in this exact format:
[
  {
    "question": "Detailed question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation."
  }
]
`;
      const response = await this.callGeminiAPI(prompt);
      return this.parseQuizQuestions(response, topic, subtopic);
    } catch (error) {
      console.error("Gemini API error for basic quiz generation:", error);
      return this.generateEnhancedBasicQuizQuestions(topic, subtopic, keyPoints, 30);
    }
  }

  async callGeminiAPI(prompt) {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const rawResponse = data.candidates[0].content.parts[0].text;
    console.log("🔍 Raw Gemini API response:", rawResponse.substring(0, 200) + "...");
    return rawResponse;
  }

  parseJsonResponse(rawResponse) {
    try {
      console.log("🔄 Attempting to parse JSON from raw response");
      let cleanResponse = rawResponse.trim().replace(/^```json\s*|```\s*$/g, '');
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error("❌ JSON parsing failed:", error);
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  processApiResponse(rawResponse, expectedType = "course") {
    console.log(`🚀 Processing API response for type: ${expectedType}`);
    if (typeof rawResponse === "object") {
      return this.extractSpecificDataStructure(rawResponse, expectedType);
    }
    return this.extractJsonData(rawResponse, expectedType);
  }

  extractJsonData(rawResponse, expectedType = "course") {
    try {
      const parsed = this.parseJsonResponse(rawResponse);
      if (
        (expectedType === "course" && this.isValidCourseData(parsed)) ||
        (expectedType === "quiz" && this.isValidQuizData(parsed)) ||
        (expectedType === "topic" && this.isValidTopicData(parsed))
      ) {
        return parsed;
      }
      return this.extractSpecificDataStructure(parsed, expectedType);
    } catch (error) {
      console.error(`❌ Failed to extract ${expectedType} JSON data:`, error);
      throw error;
    }
  }

  isValidCourseData(data) {
    return data && (data.course || data.title || (Array.isArray(data.subtopics) && data.subtopics.length > 0));
  }

  isValidQuizData(data) {
    return data && (Array.isArray(data) || (data.questions && Array.isArray(data.questions)));
  }

  isValidTopicData(data) {
    return data && (data.mainTopic || data.topic || (data.subtopics && Array.isArray(data.subtopics)));
  }

  extractSpecificDataStructure(data, type) {
    switch (type) {
      case "course": return data.course || data.courseStructure || data;
      case "quiz": return data.questions || data.quiz || (Array.isArray(data) ? data : [data]);
      case "topic": return data.topic || data.extraction || data;
      default: return data;
    }
  }

  parseTopicExtraction(response, originalPrompt) {
    try {
      console.log("🔍 Parsing topic extraction from response");
      const parsed = this.extractJsonData(response, "topic");
      return {
        mainTopic: parsed.mainTopic || parsed.topic || this.extractMainTopicFromPrompt(originalPrompt),
        subtopics: parsed.subtopics || [],
        difficulty: parsed.difficulty || "beginner",
        estimatedDuration: parsed.estimatedDuration || 6,
        prerequisites: parsed.prerequisites || [],
        learningObjectives: parsed.learningObjectives || [],
      };
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return this.intelligentTopicExtraction(originalPrompt);
    }
  }

  parseCourseStructure(response, extractedTopic) {
    try {
      console.log("🔍 Parsing course structure from response");
      const parsed = this.extractJsonData(response, "course");
      return {
        title: parsed.title || `Complete ${extractedTopic.mainTopic} Course`,
        description: parsed.description || `Learn ${extractedTopic.mainTopic}`,
        mainTopic: parsed.mainTopic || extractedTopic.mainTopic,
        subtopics: parsed.subtopics || [],
        totalDuration: parsed.totalDuration || extractedTopic.estimatedDuration * 60,
        difficulty: parsed.difficulty || extractedTopic.difficulty,
        prerequisites: parsed.prerequisites || extractedTopic.prerequisites,
        learningObjectives: parsed.learningObjectives || extractedTopic.learningObjectives,
      };
    } catch (error) {
      console.error("Failed to parse course structure:", error);
      return this.generateStructuredCourse(extractedTopic);
    }
  }

  parseQuizQuestions(response, topic, subtopic) {
    try {
      const parsed = this.extractJsonData(response, "quiz");
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated = this.validateAndFormatQuestions(parsed);
        if (validated.length > 0) return validated;
      }
    } catch (error) {
      console.log("JSON parsing failed, attempting text extraction...", error);
    }
    return this.generateBasicQuizQuestions(topic, subtopic, []);
  }

  validateAndFormatQuestions(parsed) {
    return parsed
      .filter(q => q && typeof q === "object" && q.question && Array.isArray(q.options))
      .map((q, index) => {
        const options = (q.options || []).map(opt => this.normalizeText(String(opt)));
        while (options.length < 4) options.push(`Option ${options.length + 1}`);

        let correctAnswerIndex = 0;
        if (typeof q.correctAnswer === 'number') {
          correctAnswerIndex = Math.max(0, Math.min(3, q.correctAnswer));
        } else if (typeof q.correct_answer === 'number') {
          correctAnswerIndex = Math.max(0, Math.min(3, q.correct_answer));
        } else if (typeof q.correctAnswer === 'string') {
          const foundIndex = options.findIndex(opt => opt === q.correctAnswer);
          if (foundIndex !== -1) correctAnswerIndex = foundIndex;
        }

        return {
          question: this.normalizeText(q.question),
          options: options.slice(0, 4),
          correctAnswer: correctAnswerIndex,
          explanation: this.normalizeText(q.explanation || `The correct answer is provided.`),
        };
      })
      .filter(q => q.question.length > 5 && q.options.length === 4);
  }

  normalizeText(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim();
  }

  intelligentTopicExtraction(prompt) {
    const promptLower = prompt.toLowerCase();
    let mainTopic = "General Course";
    let subtopics = [];
    let difficulty = "beginner";

    if (promptLower.includes("psychology")) {
      mainTopic = "Psychology";
      subtopics = ["Intro to Psychology", "Cognitive Psychology", "Social Psychology"];
    } else if (promptLower.includes("machine learning")) {
      mainTopic = "Machine Learning";
      subtopics = ["Supervised Learning", "Unsupervised Learning", "Neural Networks"];
    } else {
      mainTopic = prompt.split(" ").slice(0, 2).join(" ") || "Custom Course";
      subtopics = [`Intro to ${mainTopic}`, `Core Concepts`, `Advanced Topics`];
    }

    if (promptLower.includes("advanced")) difficulty = "advanced";
    else if (promptLower.includes("intermediate")) difficulty = "intermediate";

    return {
      mainTopic,
      subtopics,
      difficulty,
      estimatedDuration: subtopics.length * 0.75,
      prerequisites: [`Basic computer literacy`],
      learningObjectives: [`Understand core ${mainTopic} concepts`],
    };
  }

  generateStructuredCourse(extractedTopic) {
    const subtopics = extractedTopic.subtopics.map((subtopic, index) => ({
      title: subtopic,
      description: `Comprehensive coverage of ${subtopic}.`,
      order: index + 1,
      keyPoints: [`Understanding ${subtopic} fundamentals`, `Key concepts`],
      estimatedDuration: 45,
      searchTerms: [`${extractedTopic.mainTopic} ${subtopic} tutorial`],
      quizQuestions: this.generateBasicQuizQuestions(extractedTopic.mainTopic, subtopic, []),
    }));

    return {
      title: `Complete ${extractedTopic.mainTopic} Course`,
      description: `Master ${extractedTopic.mainTopic} with this comprehensive course.`,
      mainTopic: extractedTopic.mainTopic,
      subtopics,
      totalDuration: extractedTopic.estimatedDuration * 60,
      difficulty: extractedTopic.difficulty,
      prerequisites: extractedTopic.prerequisites,
      learningObjectives: extractedTopic.learningObjectives,
    };
  }

  async generateLessonSummary(lessonTitle, lessonContent) {
    try {
      await this.getApiKey();
    } catch (error) {
      console.warn("User's Gemini API key not configured, using basic summary.", error);
      return this.generateBasicSummary(lessonTitle, lessonContent);
    }

    try {
      const prompt = `
Create a comprehensive, 3-4 sentence summary for a lesson titled "${lessonTitle}".
Content: "${lessonContent}"
Start with "In this lesson on ${lessonTitle}, you will learn..." and focus on 3-5 specific, practical learning outcomes.
`;
      const response = await this.callGeminiAPI(prompt);
      return this.parseSummaryResponse(response, lessonTitle, lessonContent);
    } catch (error) {
      console.error("Gemini API error for lesson summary:", error);
      return this.generateBasicSummary(lessonTitle, lessonContent);
    }
  }

  parseSummaryResponse(response, lessonTitle, lessonContent) {
    try {
      const cleanResponse = response.trim();
      if (cleanResponse.toLowerCase().startsWith("in this lesson")) {
        return cleanResponse;
      }
    } catch (error) {
      console.error("Failed to parse summary response:", error);
    }
    return this.generateBasicSummary(lessonTitle, lessonContent);
  }

  generateBasicSummary(lessonTitle, lessonContent) {
    return `In this lesson on ${lessonTitle}, you will explore key concepts and practical skills. By the end, you'll have a solid understanding of the topic.`;
  }

  generateEnhancedBasicQuizQuestions(topic, subtopic, keyPoints, count = 10) {
    const questions = [];
    const questionTypes = ["conceptual", "practical", "analytical", "application"];

    for (let i = 0; i < count; i++) {
      const questionType = questionTypes[i % questionTypes.length];
      const keyPoint = keyPoints[i % keyPoints.length] || `core principles of ${subtopic}`;

      let questionData = {};

      switch (questionType) {
        case "conceptual":
          questionData = {
            question: `What is the primary focus of ${subtopic} in ${topic}?`,
            options: [keyPoint, "A related but incorrect concept", "A vaguely related idea", "A completely wrong idea"],
            correctAnswer: 0,
            explanation: `${subtopic} primarily focuses on ${keyPoint}.`,
          };
          break;
        case "practical":
          questionData = {
            question: `How would you practically implement ${subtopic} concepts?`,
            options: [`Apply ${keyPoint} following best practices`, "Use only theoretical knowledge", "Rely on intuition", "Copy existing solutions"],
            correctAnswer: 0,
            explanation: `Practical implementation requires applying ${keyPoint}.`,
          };
          break;
        default: // analytical/application
          questionData = {
            question: `In which scenario would ${subtopic} principles be most effectively applied?`,
            options: [`When ${keyPoint} can be systematically implemented`, "In purely theoretical research", "Only in lab conditions", "When avoiding constraints"],
            correctAnswer: 0,
            explanation: `${subtopic} principles are most effective when ${keyPoint} can be implemented.`,
          };
      }
      questions.push(questionData);
    }
    return questions;
  }

  generateBasicQuizQuestions(topic, subtopic, keyPoints) {
    return this.generateEnhancedBasicQuizQuestions(topic, subtopic, keyPoints, 5);
  }
}

export const geminiAPI = new GeminiAPIService();
