import { Course, Lesson } from "../types";
import { useAuthStore } from "../store/authStore";
import { geminiAPI, GeminiCourseStructure } from "./geminiApi";
import { supabaseYouTubeService, YouTubeVideo } from "./supabaseYouTubeService";
import { userApiKeyService } from "./userApiKeyService";
import toast from "react-hot-toast";

export interface GeminiCourseData {
  course: Partial<Course>;
  lessons: GeminiLesson[];
  metadata: {
    totalDuration: number;
    videoCount: number;
    articleCount: number;
    quizCount: number;
    difficulty: string;
    mainTopic: string;
    subtopicsCount: number;
  };
}

export interface GeminiLesson extends Lesson {
  videos: YouTubeVideo[];
  articles: any[];
  estimatedDuration: number;
  keyPoints: string[];
  subtopicTitle: string;
}

class GeminiCourseService {
  private isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return (
      url &&
      key &&
      !url.includes("your_supabase_project_url") &&
      !key.includes("your_supabase_anon_key") &&
      url.startsWith("http")
    );
  }

  async generateCourseWithGemini(
    userPrompt: string,
    options: {
      maxVideosPerSubtopic?: number;
      includeQuizzes?: boolean;
      questionsPerLesson?: number;
      onStructureGenerated?: (structure: any) => void;
      onLessonStart?: (lessonIndex: number, lessonTitle: string) => void;
      onLessonVideosStart?: (lessonIndex: number) => void;
      onLessonVideosComplete?: (lessonIndex: number) => void;
      onLessonQuizStart?: (lessonIndex: number) => void;
      onLessonQuizComplete?: (lessonIndex: number) => void;
      onLessonComplete?: (lessonIndex: number) => void;
    } = {}
  ): Promise<GeminiCourseData> {
    const {
      maxVideosPerSubtopic = 3,
      includeQuizzes = true,
      questionsPerLesson = 10,
      onStructureGenerated,
      onLessonStart,
      onLessonVideosStart,
      onLessonVideosComplete,
      onLessonQuizStart,
      onLessonQuizComplete,
      onLessonComplete,
    } = options;

    console.log(
      `🧠 Starting Gemini-powered course generation for: "${userPrompt}"`
    );

    // Check if user has valid API keys
    try {
      const hasValidKeys = await userApiKeyService.hasValidApiKeys();
      if (!hasValidKeys) {
        console.log("❌ API keys are required");
        throw new Error("API keys are required");
      }
      console.log("✅ User API keys validated");
    } catch (error) {
      console.log("❌ API keys not configured");
      throw error;
    }

    try {
      // Step 1: Extract topic and structure using Gemini
      console.log(
        "🔍 Step 1: Extracting topic and subtopics with Gemini AI..."
      );
      const extractedTopic = await geminiAPI.extractTopicAndStructure(
        userPrompt
      );
      console.log("✅ Topic extracted:", extractedTopic.mainTopic);
      console.log("📋 Subtopics:", extractedTopic.subtopics);

      // Step 2: Generate detailed course structure using Gemini
      console.log("🏗️ Step 2: Generating detailed course structure...");
      let courseStructure;
      try {
        courseStructure = await geminiAPI.generateCourseStructure(
          extractedTopic
        );
        console.log(
          "✅ Course structure generated with",
          courseStructure.subtopics.length,
          "lessons"
        );
      } catch (error) {
        if (error instanceof Error && error.message === "API_KEY_INVALID") {
          throw new Error("INVALID_API_KEY: Please check your Gemini API key in settings");
        }
        if (error instanceof Error && error.message === "API_KEY_MISSING") {
          throw new Error("MISSING_API_KEY: Please add your Gemini API key in settings");
        }
        throw error;
      }

      // Notify about structure generation
      if (onStructureGenerated) {
        onStructureGenerated(courseStructure);
      }

      // Step 3: Fetch REAL YouTube videos for each subtopic
      console.log(
        "🎥 Step 3: Fetching REAL YouTube videos for each subtopic..."
      );
      const enrichedLessons = await this.enrichLessonsWithRealVideos(
        courseStructure,
        maxVideosPerSubtopic,
        includeQuizzes,
        questionsPerLesson,
        {
          onLessonStart,
          onLessonVideosStart,
          onLessonVideosComplete,
          onLessonQuizStart,
          onLessonQuizComplete,
          onLessonComplete,
        }
      );

      // Step 4: Create course data
      const courseData: Partial<Course> = {
        title: courseStructure.title,
        description: courseStructure.description,
        difficulty: courseStructure.difficulty,
        estimated_duration: courseStructure.totalDuration,
        tags: this.extractTags(courseStructure),
        is_published: false,
      };

      // Step 5: Calculate metadata
      const totalVideos = enrichedLessons.reduce(
        (sum, lesson) => sum + lesson.videos.length,
        0
      );
      const totalArticles = enrichedLessons.reduce(
        (sum, lesson) => sum + lesson.articles.length,
        0
      );
      const totalQuizQuestions = enrichedLessons.reduce(
        (sum, lesson) => sum + (lesson.quiz_questions?.length || 0),
        0
      );
      const totalQuizzes = enrichedLessons.filter(
        (lesson) => lesson.quiz_questions && lesson.quiz_questions.length > 0
      ).length;

      console.log(`🎉 Course generation completed successfully!`);
      console.log(
        `📊 Generated: ${enrichedLessons.length} lessons, ${totalVideos} REAL videos, ${totalQuizQuestions} quiz questions across ${totalQuizzes} lessons`
      );

      return {
        course: courseData,
        lessons: enrichedLessons,
        metadata: {
          totalDuration: courseStructure.totalDuration,
          videoCount: totalVideos,
          articleCount: totalArticles,
          quizCount: totalQuizzes,
          difficulty: courseStructure.difficulty,
          mainTopic: courseStructure.mainTopic,
          subtopicsCount: courseStructure.subtopics.length,
        },
      };
    } catch (error) {
      console.error("❌ Gemini course generation failed:", error);
      toast.error(
        "Failed to generate course. Please check your API keys and try again."
      );
      throw error;
    }
  }

  private async enrichLessonsWithRealVideos(
    courseStructure: GeminiCourseStructure,
    maxVideosPerSubtopic: number,
    includeQuizzes: boolean,
    questionsPerLesson: number,
    callbacks?: {
      onLessonStart?: (lessonIndex: number, lessonTitle: string) => void;
      onLessonVideosStart?: (lessonIndex: number) => void;
      onLessonVideosComplete?: (lessonIndex: number) => void;
      onLessonQuizStart?: (lessonIndex: number) => void;
      onLessonQuizComplete?: (lessonIndex: number) => void;
      onLessonComplete?: (lessonIndex: number) => void;
    }
  ): Promise<GeminiLesson[]> {
    const enrichedLessons: GeminiLesson[] = [];
    const usedVideoIds = new Set<string>(); // Track used videos across all lessons

    for (let i = 0; i < courseStructure.subtopics.length; i++) {
      const subtopic = courseStructure.subtopics[i];
      console.log(
        `🔄 Processing lesson ${i + 1}/${courseStructure.subtopics.length}: "${
          subtopic.title
        }"`
      );

      // Notify lesson start
      if (callbacks?.onLessonStart) {
        callbacks.onLessonStart(i, subtopic.title);
      }

      try {
        // Notify video search start
        if (callbacks?.onLessonVideosStart) {
          callbacks.onLessonVideosStart(i);
        }

        // Fetch REAL YouTube videos using the Supabase service
        console.log(`  🎬 Searching for REAL videos...`);
        const videos = await supabaseYouTubeService.searchAndStoreVideosUnique(
          courseStructure.mainTopic,
          subtopic.title,
          maxVideosPerSubtopic,
          usedVideoIds
        );
        console.log(`  ✅ Found ${videos.length} unique REAL YouTube videos`);

        // Add video IDs to used set
        videos.forEach((video) => usedVideoIds.add(video.id));

        // Notify video search complete
        if (callbacks?.onLessonVideosComplete) {
          callbacks.onLessonVideosComplete(i);
        }

        // Generate articles (mock for now, can be enhanced with real article APIs)
        const articles = this.generateArticles(
          courseStructure.mainTopic,
          subtopic.title
        );

        // Generate comprehensive quiz questions using Gemini AI
        let quizQuestions: any[] = [];
        if (includeQuizzes) {
          // Notify quiz generation start
          if (callbacks?.onLessonQuizStart) {
            callbacks.onLessonQuizStart(i);
          }

          console.log(
            `  ❓ Generating comprehensive AI quiz (${questionsPerLesson} questions)...`
          );
          console.log(
            `  📝 Topic: ${courseStructure.mainTopic}, Lesson: ${subtopic.title}`
          );
          try {
            const lessonContent = this.createLessonContentForQuiz(
              subtopic,
              courseStructure.mainTopic
            );
            console.log(
              `  📄 Lesson content length: ${lessonContent.length} characters`
            );
            const generatedQuiz = await geminiAPI.generateComprehensiveQuiz(
              courseStructure.mainTopic,
              subtopic.title,
              lessonContent,
              questionsPerLesson
            );
            console.log(`  🤖 AI returned ${generatedQuiz.length} questions`);

            quizQuestions = generatedQuiz
              .slice(0, questionsPerLesson)
              .map((q, index) => ({
                id: `q-${index + 1}`,
                question: q.question,
                type: "multiple_choice" as const,
                options: q.options,
                correct_answer:
                  typeof q.correctAnswer === "number"
                    ? q.options[q.correctAnswer] || q.options[0]
                    : q.correctAnswer.toString(),
                explanation: q.explanation,
                difficulty: (q as any).difficulty || "intermediate",
              }));

            console.log(
              `  ✅ Generated ${quizQuestions.length} comprehensive AI quiz questions`
            );
          } catch (error) {
            console.error(
              `  ❌ AI quiz generation failed, using enhanced fallback:`,
              error
            );
            // Enhanced fallback with specified number of questions
            console.log(
              `  🔄 Attempting enhanced fallback quiz generation (${questionsPerLesson} questions)...`
            );

            try {
              // Generate basic quiz using Gemini without comprehensive mode
              const basicQuizContent = `${subtopic.title}: ${
                subtopic.description
              }\nKey Points: ${subtopic.keyPoints.join(", ")}`;
              const basicQuiz = await geminiAPI.generateQuizQuestions(
                courseStructure.mainTopic,
                subtopic.title,
                subtopic.keyPoints,
                questionsPerLesson
              );

              if (basicQuiz.length > 0) {
                quizQuestions = basicQuiz
                  .slice(0, questionsPerLesson)
                  .map((q, index) => ({
                    id: `q-${index + 1}`,
                    question: q.question,
                    type: "multiple_choice" as const,
                    options: q.options,
                    correct_answer: q.correctAnswer,
                    explanation: q.explanation,
                    difficulty: "intermediate",
                  }));
                console.log(
                  `  ✅ Generated ${quizQuestions.length} basic AI quiz questions`
                );
              } else {
                throw new Error("Basic AI quiz generation also failed");
              }
            } catch (aiError) {
              console.error(
                `  ❌ Both AI methods failed, using manual fallback:`,
                aiError
              );
              // Final fallback to enhanced manual generation - FORCE specified number of questions
              console.log(
                `  🔧 Forcing ${questionsPerLesson} questions with enhanced manual generation...`
              );

              // Generate the specified number of questions directly using the enhanced method
              const enhancedQuestions = [];
              const questionTypes = [
                "concept",
                "practical",
                "analysis",
                "application",
                "scenario",
              ];

              for (let q = 0; q < questionsPerLesson; q++) {
                const type = questionTypes[q % questionTypes.length];
                const keyPoint =
                  subtopic.keyPoints[q % subtopic.keyPoints.length] ||
                  `Understanding ${subtopic.title}`;

                enhancedQuestions.push({
                  id: `q-${q + 1}`,
                  question: `[${type.toUpperCase()}] How does ${keyPoint} apply in ${
                    courseStructure.mainTopic
                  }? (Question ${q + 1}/${questionsPerLesson})`,
                  type: "multiple_choice" as const,
                  options: [
                    `By implementing ${keyPoint} systematically`,
                    "By ignoring practical considerations",
                    "Through theoretical study only",
                    "By avoiding implementation details",
                  ],
                  correct_answer: 0,
                  explanation: `${keyPoint} requires systematic implementation with practical considerations for effective results in ${courseStructure.mainTopic}.`,
                  difficulty:
                    q < Math.floor(questionsPerLesson * 0.3)
                      ? "basic"
                      : q < Math.floor(questionsPerLesson * 0.8)
                      ? "intermediate"
                      : "advanced",
                });
              }

              quizQuestions = enhancedQuestions;
              console.log(
                `  ✅ FORCED generation of ${quizQuestions.length} enhanced manual quiz questions`
              );
            }
          }

          // Notify quiz generation complete
          if (callbacks?.onLessonQuizComplete) {
            callbacks.onLessonQuizComplete(i);
          }
        }

        // Create lesson with STORED video information
        const lesson: GeminiLesson = {
          id: `lesson-${i + 1}`,
          course_id: "",
          title: subtopic.title,
          content: this.formatLessonContent(
            subtopic,
            courseStructure.mainTopic,
            videos
          ),
          type: "article", // Always article type, quiz is separate
          order: subtopic.order,
          video_url: videos[0]?.embedUrl,
          videos, // Store complete video information
          articles,
          estimatedDuration: subtopic.estimatedDuration,
          keyPoints: subtopic.keyPoints,
          subtopicTitle: subtopic.title,
          quiz_questions: quizQuestions,
          resources: articles.map((article) => ({
            id: `r-${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            type: "article" as const,
          })),
          created_at: new Date().toISOString(),
        };

        enrichedLessons.push(lesson);

        // Notify lesson completion
        if (callbacks?.onLessonComplete) {
          callbacks.onLessonComplete(i);
        }

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Failed to enrich lesson "${subtopic.title}":`, error);
        // Continue with minimal content rather than failing completely
        const lesson: GeminiLesson = {
          id: `lesson-${i + 1}`,
          course_id: "",
          title: subtopic.title,
          content: this.formatLessonContent(
            subtopic,
            courseStructure.mainTopic,
            []
          ),
          type: "article",
          order: subtopic.order,
          video_url: undefined,
          videos: [],
          articles: [],
          estimatedDuration: subtopic.estimatedDuration,
          keyPoints: subtopic.keyPoints,
          subtopicTitle: subtopic.title,
          quiz_questions: [],
          resources: [],
          created_at: new Date().toISOString(),
        };
        enrichedLessons.push(lesson);
      }
    }

    return enrichedLessons;
  }

  private formatLessonContent(
    subtopic: any,
    mainTopic: string,
    videos: YouTubeVideo[]
  ): string {
    let content = `# ${subtopic.title}\n\n`;

    content += `## Overview\n${subtopic.description}\n\n`;

    // Key Learning Points
    if (subtopic.keyPoints.length > 0) {
      content += `## Key Learning Points\n\n`;
      subtopic.keyPoints.forEach((point: string) => {
        content += `- ${point}\n`;
      });
      content += "\n";
    }

    // Video Resources - Store video information for database
    if (videos.length > 0) {
      content += `## Video Resources\n\n`;
      videos.forEach((video, index) => {
        content += `### ${index + 1}. ${video.title}\n`;
        content += `**Channel:** ${video.channelTitle}\n`;
        content += `**Duration:** ${video.duration}\n`;
        content += `**Views:** ${video.viewCount.toLocaleString()}\n`;
        content += `**Relevance Score:** ${video.relevanceScore.toFixed(
          1
        )}/100\n\n`;
        content += `${video.description.slice(0, 200)}...\n\n`;
        // Don't include direct links in content - videos will be embedded via stored data
      });
    }

    // Summary
    content += `## Summary\n\n`;
    content += `In this lesson on ${subtopic.title}, you've explored the essential concepts that form the foundation of this important area in ${mainTopic}. `;
    content += `The carefully selected videos provide comprehensive coverage from multiple perspectives, ensuring you gain a well-rounded understanding. `;
    content += `Make sure to watch all recommended videos and complete the quiz to test your knowledge before proceeding to the next lesson.\n\n`;

    return content;
  }

  private generateArticles(mainTopic: string, subtopic: string): any[] {
    return [
      {
        title: `${subtopic} in ${mainTopic}: A Comprehensive Guide`,
        url: `https://www.example.com/${subtopic
          .toLowerCase()
          .replace(/\s+/g, "-")}-guide`,
        description: `In-depth exploration of ${subtopic} concepts and applications in ${mainTopic}`,
        source: "Educational Resource",
        readingTime: "8 min read",
      },
      {
        title: `Understanding ${subtopic}: Research and Practice`,
        url: `https://www.example.com/${subtopic
          .toLowerCase()
          .replace(/\s+/g, "-")}-research`,
        description: `Academic perspective on ${subtopic} with latest research findings`,
        source: "Academic Journal",
        readingTime: "12 min read",
      },
      {
        title: `${subtopic} Explained: Practical Applications`,
        url: `https://www.example.com/${subtopic
          .toLowerCase()
          .replace(/\s+/g, "-")}-practical`,
        description: `Practical guide to understanding and applying ${subtopic} principles`,
        source: "Professional Blog",
        readingTime: "6 min read",
      },
    ];
  }

  private createLessonContentForQuiz(subtopic: any, mainTopic: string): string {
    let content = `Topic: ${mainTopic}\n`;
    content += `Lesson: ${subtopic.title}\n\n`;
    content += `Description: ${subtopic.description}\n\n`;

    if (subtopic.keyPoints && subtopic.keyPoints.length > 0) {
      content += `Key Learning Points:\n`;
      subtopic.keyPoints.forEach((point: string) => {
        content += `- ${point}\n`;
      });
    }

    return content;
  }

  private extractTags(courseStructure: GeminiCourseStructure): string[] {
    const tags = new Set<string>();

    // Add main topic
    tags.add(courseStructure.mainTopic.toLowerCase().replace(/\s+/g, "-"));

    // Add subtopic-based tags
    courseStructure.subtopics.forEach((subtopic) => {
      const subtopicWords = subtopic.title.toLowerCase().split(" ");
      subtopicWords.forEach((word) => {
        if (
          word.length > 3 &&
          !["introduction", "fundamentals", "advanced"].includes(word)
        ) {
          tags.add(word);
        }
      });
    });

    // Add difficulty and general tags
    tags.add(courseStructure.difficulty);
    tags.add("education");
    tags.add("online-course");
    tags.add("ai-generated");

    return Array.from(tags).slice(0, 10);
  }

  async saveCourseToDatabase(courseData: GeminiCourseData): Promise<Course> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("User must be authenticated");

    console.log("💾 Saving course with video data to Supabase...");

    if (!this.isSupabaseConfigured()) {
      // Return mock course for demo
      const mockCourse: Course = {
        id: Math.random().toString(36).substr(2, 9),
        title: courseData.course.title || "Untitled Course",
        description: courseData.course.description || "No description",
        creator_id: user.id,
        creator: { name: user.name, avatar_url: user.avatar_url },
        is_published: false,
        difficulty: courseData.course.difficulty || "beginner",
        estimated_duration: courseData.metadata.totalDuration,
        tags: courseData.course.tags || [],
        likes_count: 0,
        rating: 0,
        ratings_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        summary: courseData.course.description || "",
        generated_content: courseData
      };

      toast.success("Course saved successfully! (Demo mode)");
      return mockCourse;
    }

    try {
      // Create course in database
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          ...courseData.course,
          creator_id: user.id,
          summary: courseData.course.description || "",
          generated_content: courseData
        })
        .select(
          `
          *,
          creator:users(name, avatar_url)
        `
        )
        .single();

      if (courseError) throw courseError;

      // Create lessons in database with ALL video information stored
      const lessonsToInsert = courseData.lessons.map((lesson) => ({
        course_id: course.id,
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        order: lesson.order,
        video_url: lesson.video_url,
        quiz_questions: lesson.quiz_questions,
        resources: lesson.resources,
        // Store complete video data in the video_data column
        video_data: lesson.videos,
      }));

      const { error: lessonsError } = await supabase
        .from("lessons")
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      console.log("✅ Course with video data saved successfully to Supabase");
      toast.success("Course saved successfully to database!");
      return course;
    } catch (error) {
      console.error("❌ Error saving course with video data:", error);
      toast.error("Failed to save course to database");
      throw error;
    }
  }

  async publishCourse(courseId: string): Promise<void> {
    if (!this.isSupabaseConfigured()) {
      toast.success("Course published successfully! (Demo mode)");
      return;
    }

    try {
      const { error } = await supabase
        .from("courses")
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      if (error) throw error;

      toast.success("Course published! It's now discoverable by other users.");
    } catch (error) {
      console.error("Error publishing course:", error);
      toast.error("Failed to publish course");
      throw error;
    }
  }
}

export const geminiCourseService = new GeminiCourseService();
