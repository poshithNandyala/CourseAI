import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  ArrowRight,
  ArrowLeft,
  Play,
  Award,
  Star,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string | number;
  explanation: string;
  difficulty?: string;
}

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  title: string;
  onComplete?: (score: number, totalQuestions: number) => void;
  lessons?: Array<{
    id: string;
    title: string;
    quiz_questions: QuizQuestion[];
  }>;
  selectedLessonIndex?: number;
  onLessonChange?: (lessonIndex: number) => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  questions,
  title,
  onComplete,
  lessons,
  selectedLessonIndex = 0,
  onLessonChange,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [quizStarted, setQuizStarted] = useState(false);

  // Get current lesson's questions (either from lessons prop or fallback to questions prop)
  const currentLessonQuestions =
    lessons && lessons[selectedLessonIndex]?.quiz_questions
      ? lessons[selectedLessonIndex].quiz_questions
      : questions;

  // Get current lesson title
  const currentLessonTitle =
    lessons && lessons[selectedLessonIndex]?.title
      ? `${lessons[selectedLessonIndex].title} - Quiz`
      : title;

  // Reset quiz state when lesson changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setQuizStarted(false);
  }, [selectedLessonIndex]);

  const currentQuestion = currentLessonQuestions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === currentLessonQuestions.length - 1;
  const hasAnsweredCurrent = userAnswers[currentQuestionIndex] !== undefined;
  const allQuestionsAnswered = currentLessonQuestions.every(
    (_, index) => userAnswers[index] !== undefined
  );
  const totalAnswered = Object.keys(userAnswers).length;

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleLessonSwitch = (lessonIndex: number) => {
    if (onLessonChange) {
      // Reset quiz state when switching lessons
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
      setQuizStarted(false);
      onLessonChange(lessonIndex);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion && allQuestionsAnswered) {
      finishQuiz();
    } else if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const finishQuiz = () => {
    const endTime = Date.now();
    setTimeSpent(Math.floor((endTime - startTime) / 1000));
    setShowResults(true);
  };

  const calculateResults = () => {
    let correct = 0;
    let basicCorrect = 0,
      intermediateCorrect = 0,
      advancedCorrect = 0;
    let basicTotal = 0,
      intermediateTotal = 0,
      advancedTotal = 0;

    currentLessonQuestions.forEach((question, index) => {
      try {
        const userAnswer = userAnswers[index];

        // Enhanced handling of correct answers with better validation
        let correctAnswer: string;

        if (typeof question.correct_answer === "number") {
          // Handle numeric index (0, 1, 2, 3)
          const answerIndex = Math.max(0, Math.min(3, question.correct_answer));
          correctAnswer = question.options[answerIndex] || question.options[0];
        } else if (typeof question.correct_answer === "string") {
          // Handle string answer
          correctAnswer = question.correct_answer;
        } else if (typeof (question as any).correctAnswer === "number") {
          // Alternative property name
          const answerIndex = Math.max(
            0,
            Math.min(3, (question as any).correctAnswer)
          );
          correctAnswer = question.options[answerIndex] || question.options[0];
        } else if (typeof (question as any).correctAnswer === "string") {
          correctAnswer = (question as any).correctAnswer;
        } else {
          // Fallback to first option if no valid answer found
          console.warn(
            `Invalid correct answer format for question ${index + 1}:`,
            question
          );
          correctAnswer = question.options[0];
        }

        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) correct++;

        // Use actual difficulty from question or fallback to distribution
        const difficulty =
          question.difficulty ||
          (index < currentLessonQuestions.length / 3
            ? "basic"
            : index < (currentLessonQuestions.length * 2) / 3
            ? "intermediate"
            : "advanced");

        if (difficulty === "basic" || difficulty === "easy") {
          basicTotal++;
          if (isCorrect) basicCorrect++;
        } else if (difficulty === "intermediate" || difficulty === "medium") {
          intermediateTotal++;
          if (isCorrect) intermediateCorrect++;
        } else {
          advancedTotal++;
          if (isCorrect) advancedCorrect++;
        }
      } catch (error) {
        console.error(
          `Error processing question ${index + 1}:`,
          error,
          question
        );
        // Continue processing other questions
      }
    });

    const percentage =
      currentLessonQuestions.length > 0
        ? Math.round((correct / currentLessonQuestions.length) * 100)
        : 0;

    return {
      correct,
      total: currentLessonQuestions.length,
      percentage,
      basicScore:
        basicTotal > 0 ? Math.round((basicCorrect / basicTotal) * 100) : 0,
      intermediateScore:
        intermediateTotal > 0
          ? Math.round((intermediateCorrect / intermediateTotal) * 100)
          : 0,
      advancedScore:
        advancedTotal > 0
          ? Math.round((advancedCorrect / advancedTotal) * 100)
          : 0,
      timeSpent,
    };
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90)
      return "Outstanding! You have mastered this topic! 🎉";
    if (percentage >= 80)
      return "Excellent work! You have a strong understanding! 👏";
    if (percentage >= 70) return "Good job! You understand most concepts! 👍";
    if (percentage >= 60)
      return "Not bad! Review the material and try again! 📚";
    return "Keep studying! Review the lessons and retake the quiz! 💪";
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90)
      return {
        icon: Trophy,
        color: "text-yellow-500",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
      };
    if (percentage >= 80)
      return {
        icon: Award,
        color: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/30",
      };
    if (percentage >= 70)
      return {
        icon: Star,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/30",
      };
    return {
      icon: Target,
      color: "text-gray-500",
      bg: "bg-gray-100 dark:bg-gray-900/30",
    };
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTimeSpent(0);
    setQuizStarted(false);
  };

  // Horizontal Lesson Navigation Component
  const LessonNavigation = () => {
    if (!lessons || lessons.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Lesson:
        </h3>
        <div className="flex flex-wrap gap-2">
          {lessons.map((lesson, index) => (
            <motion.button
              key={lesson.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLessonSwitch(index)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedLessonIndex === index
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span>Lesson {index + 1}</span>
              {lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3" />
                  <span className="text-xs">
                    ({lesson.quiz_questions.length})
                  </span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  // Quiz Start Screen
  if (!quizStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800"
      >
        <div className="text-center">
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {currentLessonTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            Test your knowledge with {currentLessonQuestions.length} interactive
            questions
          </p>
        </div>

        {/* Horizontal Lesson Navigation */}
        <LessonNavigation />

        <div className="text-center">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quiz Instructions:
            </h3>
            <div className="space-y-2 text-left text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>
                  Answer all {currentLessonQuestions.length} questions to see
                  your results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>
                  You can navigate between questions and change answers
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>Detailed explanations will be shown at the end</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>Take your time - there's no time limit</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartQuiz}
            className="mx-auto flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
          >
            <Play className="h-5 w-5" />
            <span>Start Quiz</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Quiz Results Screen
  if (showResults) {
    const results = calculateResults();
    const badge = getPerformanceBadge(results.percentage);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800"
      >
        {/* Horizontal Lesson Navigation */}
        <LessonNavigation />

        <div className="text-center mb-8">
          <div
            className={`${badge.bg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <badge.icon className={`h-10 w-10 ${badge.color}`} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here are your results for {currentLessonTitle}
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div
              className={`text-6xl font-bold mb-2 ${getScoreColor(
                results.percentage
              )}`}
            >
              {results.percentage}%
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {results.correct} out of {results.total} correct
            </div>
            <div
              className={`text-lg font-medium ${getScoreColor(
                results.percentage
              )}`}
            >
              {getScoreMessage(results.percentage)}
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {results.basicScore}%
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Basic Questions
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {results.intermediateScore}%
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Intermediate Questions
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {results.advancedScore}%
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Advanced Questions
            </div>
          </div>
        </div>

        {/* Time and Stats */}
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>
              {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>{results.total} questions</span>
          </div>
        </div>

        {/* Detailed Results - ONLY SHOWN AFTER COMPLETION */}
        <div className="space-y-3 mb-8 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Question Review ({currentLessonQuestions.length} Questions)
          </h3>
          {currentLessonQuestions.map((question, index) => {
            try {
              const userAnswer = userAnswers[index];

              // Enhanced handling with better validation
              let correctAnswer: string;

              if (typeof question.correct_answer === "number") {
                const answerIndex = Math.max(
                  0,
                  Math.min(3, question.correct_answer)
                );
                correctAnswer =
                  question.options[answerIndex] || question.options[0];
              } else if (typeof question.correct_answer === "string") {
                correctAnswer = question.correct_answer;
              } else if (typeof (question as any).correctAnswer === "number") {
                const answerIndex = Math.max(
                  0,
                  Math.min(3, (question as any).correctAnswer)
                );
                correctAnswer =
                  question.options[answerIndex] || question.options[0];
              } else if (typeof (question as any).correctAnswer === "string") {
                correctAnswer = (question as any).correctAnswer;
              } else {
                console.warn(
                  `Invalid correct answer format for question ${index + 1}:`,
                  question
                );
                correctAnswer = question.options[0];
              }

              const isCorrect = userAnswer === correctAnswer;

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-1 rounded-full shrink-0 ${
                        isCorrect
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                          Q{index + 1}
                        </span>
                        {question.difficulty && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              question.difficulty === "basic"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : question.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {question.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white mb-2 break-words">
                        {question.question}
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="text-gray-600 dark:text-gray-400">
                          Your answer:{" "}
                          <span
                            className={`font-medium ${
                              isCorrect
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {userAnswer || "No answer"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="text-gray-600 dark:text-gray-400">
                            Correct answer:{" "}
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {correctAnswer}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 italic p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          💡{" "}
                          {question.explanation || "No explanation available"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.error(
                `Error rendering question ${index + 1}:`,
                error,
                question
              );
              return (
                <div
                  key={index}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Question {index + 1} - Error loading
                    </span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    This question couldn't be displayed properly due to a
                    parsing error.
                  </p>
                </div>
              );
            }
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={restartQuiz}
            className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-indigo-700"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Retake Quiz</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete?.(results.correct, results.total)}
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Continue Learning
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Quiz Questions Screen
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800"
    >
      {/* Horizontal Lesson Navigation */}
      <LessonNavigation />

      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentLessonTitle}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Question {currentQuestionIndex + 1} of{" "}
              {currentLessonQuestions.length}
            </span>
            <span className="text-xs">Answer all questions to see results</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-brand-500 to-accent-500 p-3 rounded-xl">
          <Brain className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>
            {totalAnswered}/{currentLessonQuestions.length} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${
                (totalAnswered / currentLessonQuestions.length) * 100
              }%`,
            }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-brand-500 to-accent-500 h-2 rounded-full"
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                    userAnswers[currentQuestionIndex] === option
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        userAnswers[currentQuestionIndex] === option
                          ? "border-brand-500 bg-brand-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {userAnswers[currentQuestionIndex] === option && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={
            !hasAnsweredCurrent || (isLastQuestion && !allQuestionsAnswered)
          }
          className="flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isLastQuestion ? "Finish Quiz" : "Next"}</span>
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Quiz Instructions */}
      {!allQuestionsAnswered && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">
              Answer all {currentLessonQuestions.length} questions to see your
              results and explanations
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
