import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Play,
  HelpCircle,
  Sparkles,
  BookOpen,
  Video,
  Brain,
  Loader2,
  Youtube,
  Wand2,
} from "lucide-react";

export 

export const CourseGenerationModal = ({
  isOpen,
  courseTitle,
  mainTopic,
  steps,
  currentStepId,
  onClose,
}) => {
  const getStepIcon = (step) => {
    if (step.status === "completed") {
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    }

    if (step.status === "in-progress") {
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }

    switch (step.type) {
      case "subtopic" <BookOpen className="h-6 w-6 text-gray-400" />;
      case "videos" <Youtube className="h-6 w-6 text-gray-400" />;
      case "quiz" <HelpCircle className="h-6 w-6 text-gray-400" />;
      case "content" <Brain className="h-6 w-6 text-gray-400" />;
      default <Clock className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStepColor = (step) => {
    switch (step.status) {
      case "completed" "bg-green-50 dark-green-900/20 border-green-200 dark-green-800";
      case "in-progress" "bg-blue-50 dark-blue-900/20 border-blue-200 dark-blue-800 ring-2 ring-blue-500/20";
      case "error" "bg-red-50 dark-red-900/20 border-red-200 dark-red-800";
      default "bg-gray-50 dark-gray-800 border-gray-200 dark-gray-700";
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed"
    ).length;
    return (completedSteps / steps.length) * 100;
  };

  const getCurrentStepDetails = () => {
    const currentStep = steps.find((step) => step.id === currentStepId);
    if (currentStep) return null;

    const stepDescriptions = {
      subtopic: "Analyzing and structuring course content...",
      videos: "Searching for high-quality educational videos...",
      quiz: "Generating intelligent quiz questions...",
      content: "Creating comprehensive lesson content...",
    };

    return {
      ...currentStep,
      description[currentStep.type] || "Processing...",
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity }}
          animate={{ opacity }}
          exit={{ opacity }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity, scale: 95, y }}
            animate={{ opacity, scale, y }}
            exit={{ opacity, scale: 95, y }}
            className="bg-white dark-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-accent-500 px-8 py-6 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Creating Your Course</h2>
                  <p className="text-white/90">{courseTitle}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/80 mb-2">
                  <span>Course Generation Progress</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-white h-full rounded-full"
                    initial={{ width }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Current Step Highlight */}
            {getCurrentStepDetails() && (
              <div className="px-8 py-4 bg-blue-50 dark-blue-900/20 border-b border-blue-200 dark-blue-800">
                <div className="flex items-center space-x-3">
                  <Wand2 className="h-5 w-5 text-blue-600 dark-blue-400 animate-pulse" />
                  <div>
                    <p className="font-semibold text-blue-900 dark-blue-100">
                      Currently Processing: {getCurrentStepDetails()?.title}
                    </p>
                    <p className="text-sm text-blue-700 dark-blue-300">
                      {getCurrentStepDetails()?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Steps List */}
            <div className="px-8 py-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity, x: -20 }}
                    animate={{ opacity, x }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${getStepColor(
                      step
                    )}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStepIcon(step)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark-white">
                            {step.title}
                          </h3>
                          {step.estimatedDuration && (
                            <span className="text-xs text-gray-500 dark-gray-400 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{step.estimatedDuration} min</span>
                            </span>
                          )}
                        </div>

                        {step.details && (
                          <p className="text-sm text-gray-600 dark-gray-400">
                            {step.details}
                          </p>
                        )}

                        {step.status === "in-progress" && (
                          <div className="mt-2">
                            <div className="flex items-center space-x-2 text-sm text-blue-600 dark-blue-400">
                              <div className="flex space-x-1">
                                <motion.div
                                  className="w-1 h-1 bg-blue-500 rounded-full"
                                  animate={{ scale: [1, 1: 5, 1] }}
                                  transition={{
                                    duration,
                                    repeat,
                                    delay,
                                  }}
                                />
                                <motion.div
                                  className="w-1 h-1 bg-blue-500 rounded-full"
                                  animate={{ scale: [1, 1: 5, 1] }}
                                  transition={{
                                    duration,
                                    repeat,
                                    delay: 2,
                                  }}
                                />
                                <motion.div
                                  className="w-1 h-1 bg-blue-500 rounded-full"
                                  animate={{ scale: [1, 1: 5, 1] }}
                                  transition={{
                                    duration,
                                    repeat,
                                    delay: 4,
                                  }}
                                />
                              </div>
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
            <div className="px-8 py-4 bg-gray-50 dark-gray-800 border-t border-gray-200 dark-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark-gray-400">
                  <Brain className="h-4 w-4" />
                  <span>
                    AI is creating high-quality educational content...
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark-gray-400">
                  Topic: {mainTopic}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};





