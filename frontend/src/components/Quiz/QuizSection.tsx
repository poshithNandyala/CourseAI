import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Play
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizSectionProps {
  questions: QuizQuestion[];
  title: string;
  onComplete?: (score: number, totalQuestions: number) => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ 
  questions, 
  title, 
  onComplete 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent = userAnswers[currentQuestionIndex] !== undefined;
  const allQuestionsAnswered = questions.every((_, index) => userAnswers[index] !== undefined);

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (isLastQuestion && allQuestionsAnswered) {
      finishQuiz();
    } else if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
      total: questions.length,
      percentage,
      timeSpent
    };
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent! You have mastered this topic.';
    if (percentage >= 80) return 'Great job! You have a strong understanding.';
    if (percentage >= 70) return 'Good work! You understand most concepts.';
    if (percentage >= 60) return 'Not bad! Review the material and try again.';
    return 'Keep studying! Review the lessons and retake the quiz.';
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTimeSpent(0);
  };

  if (showResults) {
    const results = calculateResults();
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800"
      >
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400">Here are your results for {title}</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.percentage)}`}>
              {results.percentage}%
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {results.correct} out of {results.total} correct
            </div>
            <div className={`text-lg font-medium ${getScoreColor(results.percentage)}`}>
              {getScoreMessage(results.percentage)}
            </div>
          </div>
        </div>

        {/* Time Stats */}
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>{results.total} questions</span>
          </div>
        </div>

        {/* Detailed Results - ONLY SHOWN AFTER COMPLETION */}
        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Question Review</h3>
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correct_answer;
            
            return (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      {question.question}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">
                        Your answer: <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{userAnswer}</span>
                      </div>
                      {!isCorrect && (
                        <div className="text-gray-600 dark:text-gray-400">
                          Correct answer: <span className="text-green-600 dark:text-green-400">{question.correct_answer}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 italic">
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
            className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 flex items-center justify-center space-x-2"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800"
    >
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
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
          <span>{Object.keys(userAnswers).length}/{questions.length} answered</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
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
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      userAnswers[currentQuestionIndex] === option
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
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
          disabled={!hasAnsweredCurrent || (isLastQuestion && !allQuestionsAnswered)}
          className="flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isLastQuestion ? 'Finish Quiz' : 'Next'}</span>
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Quiz Instructions */}
      {!allQuestionsAnswered && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">
              Answer all {questions.length} questions to see your results and explanations
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};