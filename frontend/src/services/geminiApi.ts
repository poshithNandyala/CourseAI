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
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

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
Create a comprehensive course structure for: "${extractedTopic.mainTopic}"

Subtopics to cover: ${extractedTopic.subtopics.join(", ")}
Difficulty: ${extractedTopic.difficulty}
Duration: ${extractedTopic.estimatedDuration} hours

For each subtopic, provide:
1. Detailed description
2. 4-6 key learning points
3. Estimated duration (30-60 minutes)
4. 3-5 YouTube search terms for finding relevant videos
5. 30 comprehensive quiz questions with multiple choice answers

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
    lessonContent: string
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
        contentType
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

    // Programming/Development
    if (
      topicLower.includes("programming") ||
      topicLower.includes("coding") ||
      topicLower.includes("javascript") ||
      topicLower.includes("python") ||
      topicLower.includes("java") ||
      topicLower.includes("c++") ||
      topicLower.includes("react") ||
      topicLower.includes("web development") ||
      contentLower.includes("code") ||
      contentLower.includes("function") ||
      contentLower.includes("variable") ||
      contentLower.includes("syntax")
    ) {
      return "programming";
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

    // Science/Math
    if (
      topicLower.includes("math") ||
      topicLower.includes("science") ||
      topicLower.includes("physics") ||
      topicLower.includes("chemistry") ||
      topicLower.includes("biology") ||
      contentLower.includes("formula") ||
      contentLower.includes("equation") ||
      contentLower.includes("calculate")
    ) {
      return "science";
    }

    // Business/Marketing
    if (
      topicLower.includes("business") ||
      topicLower.includes("marketing") ||
      topicLower.includes("management") ||
      contentLower.includes("strategy") ||
      contentLower.includes("market") ||
      contentLower.includes("customer")
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
      contentLower.includes("cognitive")
    ) {
      return "psychology";
    }

    return "general";
  }

  private buildComprehensiveQuizPrompt(
    topic: string,
    lessonTitle: string,
    lessonContent: string,
    contentType: string
  ): string {
    const basePrompt = `
You are a world-class educational assessment expert and quiz creator with expertise in cognitive science and learning theory. Create 30 exceptional, high-quality multiple-choice questions about "${lessonTitle}" within the topic of "${topic}".

Lesson Content to Cover:
${lessonContent}

CRITICAL QUALITY REQUIREMENTS FOR TOP-NOTCH QUESTIONS:
- Create exactly 30 questions that comprehensively cover ALL aspects of the lesson systematically
- Questions should range from basic to advanced difficulty (10 basic, 15 intermediate, 5 advanced)
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
    keyPoints: string[]
  ): Promise<GeminiQuizQuestion[]> {
    if (!this.apiKey) {
      return this.generateEnhancedBasicQuizQuestions(
        topic,
        subtopic,
        keyPoints,
        30
      );
    }

    try {
      const prompt = `
You are an expert quiz creator and educational specialist. Create 30 comprehensive, high-quality multiple-choice questions about "${subtopic}" within the topic of "${topic}".

Key learning points to cover:
${keyPoints.map((point) => `- ${point}`).join("\n")}

CRITICAL QUALITY REQUIREMENTS:
- Create exactly 30 questions covering ALL aspects of the subtopic systematically
- Questions should range from basic to advanced difficulty (10 basic, 15 intermediate, 5 advanced)
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
    return data.candidates[0].content.parts[0].text;
  }

  private parseTopicExtraction(
    response: string,
    originalPrompt: string
  ): ExtractedTopic {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mainTopic:
            parsed.mainTopic || this.extractMainTopicFromPrompt(originalPrompt),
          subtopics: parsed.subtopics || [],
          difficulty: parsed.difficulty || "beginner",
          estimatedDuration: parsed.estimatedDuration || 6,
          prerequisites: parsed.prerequisites || [],
          learningObjectives: parsed.learningObjectives || [],
        };
      }
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
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
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
      }
    } catch (error) {
      console.error("Failed to parse course structure:", error);
    }

    return this.generateStructuredCourse(extractedTopic);
  }

  private parseQuizQuestions(
    response: string,
    topic: string,
    subtopic: string
  ): GeminiQuizQuestion[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to parse quiz questions:", error);
    }

    return this.generateBasicQuizQuestions(topic, subtopic, []);
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
