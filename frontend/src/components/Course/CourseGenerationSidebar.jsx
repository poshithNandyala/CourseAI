import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Play,
  HelpCircle,
  Sparkles,
  BookOpen,
  Video,
  Brain,
  Loader2,
  Youtube,
  Wand2,
  X,
} from "lucide-react";

/**
 * A sidebar component to display the real-time progress of AI course generation.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isVisible - Whether the sidebar is visible.
 * @param {boolean} [props.isMinimized=false] - Whether the sidebar is in its minimized state.
 * @param {string} props.courseTitle - The title of the course being generated.
 * @param {string} props.mainTopic - The main topic of the course.
 * @param {Array<object>} props.subtopics - The list of subtopics for the course.
 * @param {Array<object>} props.steps - The array of generation steps with their status.
 * @param {string} props.currentStep - The ID of the current step in progress.
 * @param {Function} props.onClose - Callback function to close/minimize the sidebar.
 * @param {Function} props.onToggle - Callback function to toggle the minimized state.
 */
export const CourseGenerationSidebar = ({
  isVisible,
  isMinimized = false,
  courseTitle,
  mainTopic,
  subtopics,
  steps,
  currentStep,
  onClose,
  onToggle,
}) => {
  // Determines the icon for a given step based on its type and status.
  const getStepIcon = (step) => {
    if (step.status === "completed") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (step.status === "in-progress") {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    switch (step.type) {
      case "extracting": return <Wand2 className="h-4 w-4 text-gray-400" />;
      case "structure": return <Brain className="h-4 w-4 text-gray-400" />;
      case "lesson": return <BookOpen className="h-4 w-4 text-gray-400" />;
      case "videos": return <Youtube className="h-4 w-4 text-gray-400" />;
      case "quiz": return <HelpCircle className="h-4 w-4 text-gray-400" />;
      default: return <Sparkles className="h-4 w-4 text-gray-400" />;
    }
  };

  // Determines the background and border color for a step.
  const getStepColor = (step) => {
    switch (step.status) {
      case "completed": return "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800";
      case "in-progress": return "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20";
      default: return "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700";
    }
  };

  // Calculates the overall progress percentage.
  const getProgressPercentage = () => {
    if (!steps || steps.length === 0) return 0;
    const completedSteps = steps.filter(
      (step) => step.status === "completed"
    ).length;
    return (completedSteps / steps.length) * 100;
  };

  // Gets the title of the current step in progress.
  const getCurrentStepTitle = () => {
    const current = steps.find((step) => step.status === "in-progress");
    return current?.title || "Processing...";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={`fixed right-4 top-4 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? "w-16 h-16 cursor-pointer" : "bottom-4 w-80"
            }`}
          onClick={isMinimized ? onToggle : undefined}
        >
          {isMinimized ? (
            /* Minimized State */
            <div className="w-full h-full bg-gradient-to-r from-brand-500 to-accent-500 flex items-center justify-center text-white rounded-2xl">
              <Wand2 className="h-6 w-6" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <h3 className="font-semibold text-sm">Course Generation</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">{mainTopic}</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-brand-500 to-accent-500 h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Current Step */}
              {steps.some((step) => step.status === "in-progress") && (
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      {getCurrentStepTitle()}
                    </span>
                  </div>
                </div>
              )}

              {/* Steps List */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border transition-all duration-200 ${getStepColor(
                        step
                      )}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStepIcon(step)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-medium text-gray-900 dark:text-white leading-tight">
                            {step.title}
                          </h5>

                          {step.status === "in-progress" && (
                            <div className="mt-1">
                              <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                                <motion.div
                                  className="w-1 h-1 bg-blue-500 rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                                <span>Processing...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <Sparkles className="h-3 w-3" />
                  <span>AI is creating your course...</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export RealGenerationStep for component use
export const RealGenerationStep = CourseGenerationSidebar;
