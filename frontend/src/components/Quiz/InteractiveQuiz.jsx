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

/**
 * An interactive quiz component that displays questions, tracks answers,
 * and shows a results screen upon completion.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.questions - The array of question objects for the quiz.
 * @param {string} props.title - The title of the quiz.
 * @param {Function} props.onComplete - A callback function triggered when the quiz is finished.
 * @param {Array<object>} props.lessons - An array of lesson objects for multi-quiz navigation.
 * @param {number} props.selectedLessonIndex - The index of the currently active lesson.
 * @param {Function} props.onLessonChange - A callback to handle switching between lessons.
 */
export const InteractiveQuiz = ({
  questions,
  title,
  onComplete,
  lessons,
  selectedLessonIndex = 0,
  onLessonChange,
}) => {
  // State management for the quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [quizStarted, setQuizStarted] = useState(false);

  // Determine the questions for the current lesson, with a fallback to the main questions prop
  const currentLessonQuestions =
    lessons?.[selectedLessonIndex]?.quiz_questions ?? questions ?? [];

  // Determine the title for the current lesson's quiz
  const currentLessonTitle =
    lessons?.[selectedLessonIndex]?.title
      ? `${lessons[selectedLessonIndex].title} - Quiz`
      : title;

  // Reset the quiz state whenever the selected lesson changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setQuizStarted(false);
  }, [selectedLessonIndex]);

  // Derived state values for easier access in the component
  const currentQuestion = currentLessonQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentLessonQuestions.length - 1;
  const isCurrentQuestionAnswered = userAnswers[currentQuestionIndex] !== undefined;
  const totalAnswered = Object.keys(userAnswers).length;
  const allQuestionsAnswered = totalAnswered === currentLessonQuestions.length;

  // --- Event Handlers ---

  const handleStartQuiz = () => {
    setStartTime(Date.now());
    setQuizStarted(true);
  };

  const handleLessonSwitch = (lessonIndex) => {
    if (onLessonChange) {
      onLessonChange(lessonIndex);
    }
  };

  const handleAnswerSelect = (answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishQuiz();
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
    // Trigger the onComplete callback with the final score
    if (onComplete) {
      const finalResults = calculateResults();
      onComplete(finalResults.correct, finalResults.total);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTimeSpent(0);
    setQuizStarted(false);
  };

  // --- Calculation and Helper Functions ---

  const calculateResults = () => {
    let correct = 0;
    let categoryScores = { basic: { correct: 0, total: 0 }, intermediate: { correct: 0, total: 0 }, advanced: { correct: 0, total: 0 } };

    currentLessonQuestions.forEach((question, index) => {
      if (!question || !question.options) return; // Skip malformed questions

      const userAnswer = userAnswers[index];
      // Handle correct_answer being either an index or the string itself
      const correctAnswer = typeof question.correct_answer === 'number' ? question.options[question.correct_answer] : question.correct_answer;
      const isCorrect = userAnswer === correctAnswer;
      const difficulty = question.difficulty || "basic";

      if (isCorrect) correct++;

      const category = (difficulty === "easy" || difficulty === "basic") ? "basic" : (difficulty === "medium" || difficulty === "intermediate") ? "intermediate" : "advanced";
      categoryScores[category].total++;
      if (isCorrect) categoryScores[category].correct++;
    });

    const getScore = (cat) => (categoryScores[cat].total > 0 ? Math.round((categoryScores[cat].correct / categoryScores[cat].total) * 100) : 0);

    return {
      correct,
      total: currentLessonQuestions.length,
      percentage: currentLessonQuestions.length > 0 ? Math.round((correct / currentLessonQuestions.length) * 100) : 0,
      basicScore: getScore('basic'),
      intermediateScore: getScore('intermediate'),
      advancedScore: getScore('advanced'),
      timeSpent,
    };
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return "Outstanding! You have mastered this topic! 🎉";
    if (percentage >= 80) return "Excellent work! You have a strong understanding. 👏";
    if (percentage >= 70) return "Good job! You understand most concepts. 👍";
    if (percentage >= 60) return "Not bad. Review the material and try again. 📚";
    return "Keep studying. Review the lessons and retake the quiz. 💪";
  };

  const getPerformanceBadge = (percentage) => {
    if (percentage >= 90) return { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" };
    if (percentage >= 80) return { icon: Award, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    if (percentage >= 70) return { icon: Star, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" };
    return { icon: Brain, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" };
  };

  // --- Sub-components ---

  const LessonNavigation = () => {
    if (!lessons || lessons.length <= 1) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Lesson Quiz:</h3>
        <div className="flex flex-wrap gap-2">
          {lessons.map((lesson, index) => (
            <motion.button
              key={lesson.id || index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLessonSwitch(index)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${selectedLessonIndex === index
                  ? "bg-brand-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              <span>Lesson {index + 1}</span>
              {lesson.quiz_questions?.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3" />
                  <span className="text-xs">({lesson.quiz_questions.length})</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  // --- Conditional Rendering ---

  if (!quizStarted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Brain className="h-10 w-10 text-white" /></div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{currentLessonTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">Test your knowledge with {currentLessonQuestions.length} interactive questions.</p>
        </div>
        <LessonNavigation />
        <div className="text-center">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quiz Instructions:</h3>
            <div className="space-y-2 text-left text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-brand-500 rounded-full"></div><span>Answer all questions to see your results.</span></div>
              <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-brand-500 rounded-full"></div><span>You can go back and change your answers.</span></div>
              <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-brand-500 rounded-full"></div><span>Explanations are provided at the end.</span></div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStartQuiz} className="bg-gradient-to-r from-brand-500 to-accent-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center space-x-2 mx-auto">
            <Play className="h-5 w-5" /><span>Start Quiz</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (showResults) {
    const results = calculateResults();
    const badge = getPerformanceBadge(results.percentage);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
        <LessonNavigation />
        <div className="text-center mb-8">
          <div className={`${badge.bg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}><badge.icon className={`h-10 w-10 ${badge.color}`} /></div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400">Here are your results for {currentLessonTitle}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.percentage)}`}>{results.percentage}%</div>
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">{results.correct} out of {results.total} correct</div>
            <div className={`text-lg font-medium ${getScoreColor(results.percentage)}`}>{getScoreMessage(results.percentage)}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{results.basicScore}%</div><div className="text-sm text-green-700 dark:text-green-300">Basic</div></div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{results.intermediateScore}%</div><div className="text-sm text-yellow-700 dark:text-yellow-300">Intermediate</div></div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{results.advancedScore}%</div><div className="text-sm text-red-700 dark:text-red-300">Advanced</div></div>
        </div>
        <div className="space-y-3 mb-8 max-h-96 overflow-y-auto p-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Question Review</h3>
          {currentLessonQuestions.map((question, index) => {
            if (!question) return null; // Safety check
            const userAnswer = userAnswers[index];
            const correctAnswer = typeof question.correct_answer === 'number' ? question.options[question.correct_answer] : question.correct_answer;
            const isCorrect = userAnswer === correctAnswer;
            return (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full shrink-0 ${isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>{isCorrect ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white mb-2 break-words">{question.question}</p>
                    <div className="text-sm space-y-2">
                      <p className="text-gray-600 dark:text-gray-400">Your answer: <span className={`font-medium ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{userAnswer ?? "No answer"}</span></p>
                      {!isCorrect && <p className="text-gray-600 dark:text-gray-400">Correct answer: <span className="font-medium text-green-600 dark:text-green-400">{correctAnswer}</span></p>}
                      <p className="text-xs text-gray-500 dark:text-gray-500 italic p-2 bg-gray-100 dark:bg-gray-700 rounded">💡 {question.explanation || "No explanation available"}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex space-x-4"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={restartQuiz} className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 flex items-center justify-center space-x-2"><RotateCcw className="h-5 w-5" /><span>Retake Quiz</span></motion.button></div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800 text-center">
        <LessonNavigation />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Quiz Available</h3>
        <p className="text-gray-600 dark:text-gray-400">There are no questions for this lesson.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
      <LessonNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentLessonTitle}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"><span>Question {currentQuestionIndex + 1} of {currentLessonQuestions.length}</span></div>
        </div>
        <div className="bg-gradient-to-r from-brand-500 to-accent-500 p-3 rounded-xl"><Brain className="h-6 w-6 text-white" /></div>
      </div>
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2"><span>Progress</span><span>{totalAnswered}/{currentLessonQuestions.length} answered</span></div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><motion.div animate={{ width: `${(totalAnswered / currentLessonQuestions.length) * 100}%` }} transition={{ duration: 0.3 }} className="bg-gradient-to-r from-brand-500 to-accent-500 h-2 rounded-full" /></div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button key={index} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handleAnswerSelect(option)} className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${userAnswers[currentQuestionIndex] === option ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userAnswers[currentQuestionIndex] === option ? "border-brand-500 bg-brand-500" : "border-gray-300 dark:border-gray-600"}`}>{userAnswers[currentQuestionIndex] === option && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                    <span className="font-medium">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-between">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft className="h-5 w-5" /><span>Previous</span></motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNext} disabled={!isCurrentQuestionAnswered} className="flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <span>{isLastQuestion ? "Finish Quiz" : "Next"}</span><ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};
