import React, { useState } from "react";
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
} from "lucide-react";

>;
  selectedLessonIndex?;
  onLessonChange?: (lessonIndex) => void;
}

export const QuizSection = ({
  questions,
  title,
  onComplete,
  lessons,
  selectedLessonIndex = 0,
  onLessonChange,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState>({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent = userAnswers[currentQuestionIndex] == undefined;
  const allQuestionsAnswered = questions.every(
    (_, index) => userAnswers[index] == undefined
  );

  const handleAnswerSelect = (answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex],
    }));
  };

  const handleNext = () => {
    if (isLastQuestion && allQuestionsAnswered) {
      finishQuiz();
    } else if (isLastQuestion) {
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

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      if (userAnswer === question.correct_answer) {
        correct++;
      }
    });

    const percentage = Math.round((correct / questions.length) * 100);

    return {
      correct,
      total: length,
      percentage,
      timeSpent,
    };
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-600 dark-green-400";
    if (percentage >= 60) return "text-yellow-600 dark-yellow-400";
    return "text-red-600 dark-red-400";
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return "Excellent You have mastered this topic.";
    if (percentage >= 80) return "Great job You have a strong understanding.";
    if (percentage >= 70) return "Good work You understand most concepts.";
    if (percentage >= 60) return "Not bad Review the material and try again.";
    return "Keep studying Review the lessons and retake the quiz.";
  };

  const handleLessonSwitch = (lessonIndex) => {
    if (onLessonChange) {
      // Reset quiz state when switching lessons
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
      onLessonChange(lessonIndex);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTimeSpent(0);
  };

  // Horizontal Lesson Navigation Component
  const LessonNavigation = () => {
    if (lessons || lessons.length === 0) return null;

    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark-gray-800 dark-gray-700 rounded-2xl p-6 mb-6 border border-gray-200 dark-gray-600">
        <h3 className="text-sm font-semibold text-gray-700 dark-gray-300 mb-3 text-center">
          Select Lesson:
        </h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {lessons.map((lesson, index) => (
            <motion.button
              key={lesson.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLessonSwitch(index)}
              className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-sm ${
                selectedLessonIndex === index
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg ring-2 ring-brand-300"
                  : "bg-white dark-gray-600 text-gray-700 dark-gray-200 hover-gray-50 dark-gray-500 border border-gray-300 dark-gray-500"
              }`}
            >
              <span>Lesson {index + 1}</span>
              {lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
                <span className="text-xs opacity-75 bg-black/10 px-2 py-1 rounded-full">
                  {lesson.quiz_questions.length}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  if (showResults) {
    const results = calculateResults();

    return (
      <motion.div
        initial={{ opacity, scale: 0.95 }}
        animate={{ opacity, scale }}
        className="bg-white dark-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark-gray-800"
      >
        {/* Horizontal Lesson Navigation */}
        <LessonNavigation />

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark-white mb-2">
            Quiz Complete
          </h2>
          <p className="text-gray-600 dark-gray-400">
            Here are your results for {title}
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-50 dark-gray-800 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div
              className={`text-6xl font-bold mb-2 ${getScoreColor(
                results.percentage
              )}`}
            >
              {results.percentage}%
            </div>
            <div className="text-lg text-gray-600 dark-gray-400 mb-2">
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

        {/* Time Stats */}
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark-gray-400 mb-6">
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
        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-gray-900 dark-white mb-4">
            Question Review
          </h3>
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correct_answer;

            return (
              <div
                key={index}
                className="p-4 bg-gray-50 dark-gray-800 rounded-xl"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-1 rounded-full ${
                      isCorrect
                        ? "bg-green-100 dark-green-900/30"
                        : "bg-red-100 dark-red-900/30"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark-white mb-2">
                      {question.question}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-600 dark-gray-400">
                        Your answer:{" "}
                        <span
                          className={
                            isCorrect
                              ? "text-green-600 dark-green-400"
                              : "text-red-600 dark-red-400"
                          }
                        >
                          {userAnswer}
                        </span>
                      </div>
                      {isCorrect && (
                        <div className="text-gray-600 dark-gray-400">
                          Correct answer:{" "}
                          <span className="text-green-600 dark-green-400">
                            {question.correct_answer}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark-gray-500 italic">
                        {question.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={restartQuiz}
            className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover-brand-600 hover-accent-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Retake Quiz</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete?.(results: correct, results.total)}
            className="flex-1 bg-gray-100 dark-gray-800 text-gray-700 dark-gray-300 px-6 py-3 rounded-xl font-semibold hover-gray-200 dark-gray-700 transition-all duration-200"
          >
            Continue Learning
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity, y }}
      animate={{ opacity, y }}
      className="bg-white dark-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark-gray-800"
    >
      {/* Horizontal Lesson Navigation */}
      <LessonNavigation />

      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark-white mb-2">
            {title}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark-gray-400">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
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
        <div className="flex justify-between text-sm text-gray-500 dark-gray-400 mb-2">
          <span>Progress</span>
          <span>
            {Object.keys(userAnswers).length}/{questions.length} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 dark-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width }}
            animate={{
              width: `${
                (Object.keys(userAnswers).length / questions.length) * 100
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
          initial={{ opacity, x }}
          animate={{ opacity, x }}
          exit={{ opacity, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark-white mb-6">
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
                      ? "border-brand-500 bg-brand-50 dark-brand-900/20 text-brand-700 dark-brand-300"
                      : "border-gray-200 dark-gray-700 hover-gray-300 dark-gray-600 text-gray-700 dark-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        userAnswers[currentQuestionIndex] === option
                          ? "border-brand-500 bg-brand-500"
                          : "border-gray-300 dark-gray-600"
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
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark-gray-800 text-gray-700 dark-gray-300 rounded-xl font-semibold hover-gray-200 dark-gray-700 transition-all duration-200 disabled-50 disabled-not-allowed"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={
            hasAnsweredCurrent || (isLastQuestion && allQuestionsAnswered)
          }
          className="flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover-brand-600 hover-accent-600 transition-all duration-200 disabled-50 disabled-not-allowed"
        >
          <span>{isLastQuestion ? "Finish Quiz" : "Next"}</span>
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Quiz Instructions */}
      {allQuestionsAnswered && (
        <div className="mt-6 p-4 bg-blue-50 dark-blue-900/20 rounded-xl border border-blue-200 dark-blue-800">
          <div className="flex items-center space-x-2 text-blue-700 dark-blue-300">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">
              Answer all {questions.length} questions to see your results and
              explanations
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};




