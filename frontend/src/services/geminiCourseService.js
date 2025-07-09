import { useAuthStore } from "../store/authStore";
import { geminiAPI } from "./geminiApi";
import { userApiKeyService } from "./userApiKeyService";
import toast from "react-hot-toast";

class GeminiCourseService {
  // This service orchestrates the entire course generation process.

  /**
   * Generates a complete course structure with video content and quizzes using the Gemini API.
   * @param {string} userPrompt - The user's initial prompt for the course.
   * @param {object} options - Callbacks and configuration for the generation process.
   * @returns {Promise<object>} The generated course data.
   */
  async generateCourseWithGemini(
    userPrompt,
    options = {}
  ) {
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

    console.log(`🧠 Starting Gemini-powered course generation for: "${userPrompt}"`);

    // Check for valid API keys before proceeding.
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
      console.log("🔍 Step 1: Extracting topic and subtopics with Gemini AI...");
      const extractedTopic = await geminiAPI.extractTopicAndStructure(userPrompt);
      console.log("✅ Topic extracted:", extractedTopic.mainTopic);
      console.log("📋 Subtopics:", extractedTopic.subtopics);

      // Step 2: Generate detailed course structure using Gemini
      console.log("🏗️ Step 2: Generating detailed course structure...");
      const courseStructure = await geminiAPI.generateCourseStructure(extractedTopic);
      console.log("✅ Course structure generated with", courseStructure.subtopics.length, "lessons");

      if (onStructureGenerated) {
        onStructureGenerated(courseStructure);
      }

      // Step 3: Enrich lessons with videos and quizzes
      console.log(" enriching lessons with videos and quizzes...");
      const enrichedLessons = await this.enrichLessonsWithContent(
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

      // Step 4: Create final course data object
      const courseData = {
        title: courseStructure.title,
        description: courseStructure.description,
        difficulty: courseStructure.difficulty,
        estimated_duration: courseStructure.totalDuration,
        tags: this.extractTags(courseStructure),
        is_published: false,
      };

      // Step 5: Calculate metadata for the generated course
      const totalVideos = enrichedLessons.reduce((sum, lesson) => sum + lesson.videos.length, 0);
      const totalArticles = enrichedLessons.reduce((sum, lesson) => sum + lesson.articles.length, 0);
      const totalQuizQuestions = enrichedLessons.reduce((sum, lesson) => sum + (lesson.quiz_questions?.length || 0), 0);
      const totalQuizzes = enrichedLessons.filter(lesson => lesson.quiz_questions && lesson.quiz_questions.length > 0).length;

      console.log(`🎉 Course generation completed successfully!`);
      console.log(`📊 Generated: ${enrichedLessons.length} lessons, ${totalVideos} videos, ${totalQuizQuestions} quiz questions across ${totalQuizzes} lessons`);

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
      toast.error("Failed to generate course. Please check your API keys and try again.");
      throw error;
    }
  }

  /**
   * Enriches lessons with videos, articles, and quizzes.
   * Note: Video fetching is mocked as the original dependency was removed.
   */
  async enrichLessonsWithContent(
    courseStructure,
    maxVideosPerSubtopic,
    includeQuizzes,
    questionsPerLesson,
    callbacks = {}
  ) {
    const enrichedLessons = [];
    const usedVideoIds = new Set();

    for (let i = 0; i < courseStructure.subtopics.length; i++) {
      const subtopic = courseStructure.subtopics[i];
      console.log(`🔄 Processing lesson ${i + 1}/${courseStructure.subtopics.length}: "${subtopic.title}"`);

      callbacks.onLessonStart?.(i, subtopic.title);

      try {
        callbacks.onLessonVideosStart?.(i);
        // MOCK VIDEO FETCHING
        console.log(` 🎬 Mock searching for videos...`);
        const videos = this.generateMockVideos(courseStructure.mainTopic, subtopic.title, maxVideosPerSubtopic);
        console.log(` ✅ Found ${videos.length} mock videos`);
        videos.forEach((video) => usedVideoIds.add(video.id));
        callbacks.onLessonVideosComplete?.(i);

        const articles = this.generateArticles(courseStructure.mainTopic, subtopic.title);

        let quizQuestions = [];
        if (includeQuizzes) {
          callbacks.onLessonQuizStart?.(i);
          console.log(` ❓ Generating AI quiz (${questionsPerLesson} questions)...`);
          try {
            const lessonContent = this.createLessonContentForQuiz(subtopic, courseStructure.mainTopic);
            const generatedQuiz = await geminiAPI.generateComprehensiveQuiz(
              courseStructure.mainTopic,
              subtopic.title,
              lessonContent,
              questionsPerLesson
            );
            quizQuestions = generatedQuiz.slice(0, questionsPerLesson).map((q, index) => ({
              id: `q-${index + 1}`,
              question: q.question,
              type: "multiple_choice",
              options: q.options,
              correct_answer: typeof q.correctAnswer === "number" ? q.options[q.correctAnswer] || q.options[0] : q.correctAnswer.toString(),
              explanation: q.explanation,
              difficulty: q.difficulty || "intermediate",
            }));
            console.log(` ✅ Generated ${quizQuestions.length} comprehensive AI quiz questions`);
          } catch (error) {
            console.error(` ❌ AI quiz generation failed, using fallback:`, error);
            quizQuestions = this.generateEnhancedBasicQuizQuestions(
              courseStructure.mainTopic,
              subtopic.title,
              subtopic.keyPoints,
              questionsPerLesson
            );
            console.log(` ✅ Generated ${quizQuestions.length} fallback quiz questions`);
          }
          callbacks.onLessonQuizComplete?.(i);
        }

        const lesson = {
          id: `lesson-${i + 1}`,
          course_id: "",
          title: subtopic.title,
          content: this.formatLessonContent(subtopic, courseStructure.mainTopic, videos),
          type: "article",
          order: subtopic.order,
          video_url: videos[0]?.embedUrl,
          videos,
          articles,
          estimatedDuration: subtopic.estimatedDuration,
          keyPoints: subtopic.keyPoints,
          subtopicTitle: subtopic.title,
          quiz_questions: quizQuestions,
          resources: articles.map((article) => ({
            id: `r-${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            type: "article",
          })),
          created_at: new Date().toISOString(),
        };

        enrichedLessons.push(lesson);
        callbacks.onLessonComplete?.(i);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay to avoid rate limiting
      } catch (error) {
        console.error(`❌ Failed to enrich lesson "${subtopic.title}":`, error);
      }
    }
    return enrichedLessons;
  }

  formatLessonContent(subtopic, mainTopic, videos) {
    let content = `# ${subtopic.title}\n\n## Overview\n${subtopic.description}\n\n`;
    if (subtopic.keyPoints && subtopic.keyPoints.length > 0) {
      content += `## Key Learning Points\n\n`;
      subtopic.keyPoints.forEach((point) => {
        content += `- ${point}\n`;
      });
      content += "\n";
    }
    if (videos.length > 0) {
      content += `## Video Resources\n\n`;
      videos.forEach((video, index) => {
        content += `### ${index + 1}. ${video.title}\n`;
        content += `**Channel:** ${video.channelTitle}\n\n`;
      });
    }
    content += `## Summary\n\nIn this lesson on ${subtopic.title}, you've explored essential concepts. Make sure to review the materials and complete the quiz.\n\n`;
    return content;
  }

  generateArticles(mainTopic, subtopic) {
    return [
      { title: `${subtopic} in ${mainTopic}: A Guide`, url: `#`, description: `In-depth exploration of ${subtopic}.` },
      { title: `Understanding ${subtopic}: Research`, url: `#`, description: `Academic perspective on ${subtopic}.` },
    ];
  }

  generateMockVideos(mainTopic, subtopic, count) {
    const videos = [];
    for (let i = 0; i < count; i++) {
      videos.push({
        id: `mock_video_${Math.random()}`,
        title: `Mock Video for ${subtopic} (${i + 1})`,
        channelTitle: "Mock Channel",
        embedUrl: ""
      });
    }
    return videos;
  }

  createLessonContentForQuiz(subtopic, mainTopic) {
    let content = `Topic: ${mainTopic}\n`;
    content += `Lesson: ${subtopic.title}\n\n`;
    content += `Description: ${subtopic.description}\n\n`;
    if (subtopic.keyPoints && subtopic.keyPoints.length > 0) {
      content += `Key Learning Points:\n`;
      subtopic.keyPoints.forEach((point) => {
        content += `- ${point}\n`;
      });
    }
    return content;
  }

  extractTags(courseStructure) {
    const tags = new Set();
    tags.add(courseStructure.mainTopic.toLowerCase().replace(/\s+/g, "-"));
    courseStructure.subtopics.forEach((subtopic) => {
      const subtopicWords = subtopic.title.toLowerCase().split(" ");
      subtopicWords.forEach((word) => {
        if (word.length > 3 && !["introduction", "fundamentals", "advanced"].includes(word)) {
          tags.add(word);
        }
      });
    });
    tags.add(courseStructure.difficulty);
    tags.add("education");
    tags.add("ai-generated");
    return Array.from(tags).slice(0, 10);
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

export const geminiCourseService = new GeminiCourseService();

// Export GeminiCourseData class for component use
export const GeminiCourseData = GeminiCourseService;
