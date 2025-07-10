import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Maximize2, Loader, CheckCircle, AlertCircle } from "lucide-react";
import { useGenerationStore } from "../../store/generationStore";
import { useNavigate } from "react-router-dom";

export const GlobalGenerationIndicator: React.FC = () => {
  const navigate = useNavigate();
  const {
    isGenerating,
    generationProgress,
    generationSteps,
    currentStepId,
    showGenerationSidebar,
    setShowGenerationSidebar,
    isGenerationMinimized,
    setIsGenerationMinimized,
    isGenerationComplete,
    shouldRedirectToCourseBuilder,
    setShouldRedirectToCourseBuilder,
    resetGenerationState,
  } = useGenerationStore();

  // Auto-redirect to course builder when generation is complete
  useEffect(() => {
    if (isGenerationComplete && shouldRedirectToCourseBuilder && !window.location.pathname.includes('/create')) {
      console.log("🚀 Course generation complete - redirecting to course builder");
      setShouldRedirectToCourseBuilder(false);
      navigate('/create');
    }
  }, [isGenerationComplete, shouldRedirectToCourseBuilder, navigate, setShouldRedirectToCourseBuilder]);

  // Only show if we're generating and not already on the course builder page, OR if generation is complete but we need to redirect
  const shouldShow = (isGenerating || (isGenerationComplete && shouldRedirectToCourseBuilder)) && !window.location.pathname.includes('/create');

  const handleViewDetails = () => {
    navigate('/create');
  };

  const handleClose = () => {
    // Only allow closing if generation is complete
    const hasCompletedSteps = generationSteps.some(step => step.status === 'completed');
    const hasErrors = generationSteps.some(step => step.status === 'error');
    
    if (hasCompletedSteps || hasErrors) {
      resetGenerationState();
    }
  };

  const completedSteps = generationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = generationSteps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const currentStep = generationSteps.find(step => step.id === currentStepId);
  const hasErrors = generationSteps.some(step => step.status === 'error');

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : isGenerationComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Loader className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {hasErrors ? "Generation Error" : isGenerationComplete ? "Course Complete!" : "Generating Course..."}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleViewDetails}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="View Details"
            >
              <Maximize2 className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Close"
              disabled={isGenerating && !hasErrors}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{completedSteps}/{totalSteps} steps</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Current Step */}
          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {currentStep.title}
                </span>
              </div>
              {generationProgress && (
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                  {generationProgress}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleViewDetails}
              className={`flex-1 px-3 py-2 text-sm text-white rounded-md transition-colors ${
                isGenerationComplete 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerationComplete ? 'View Course' : 'View Details'}
            </button>
            {hasErrors && (
              <button
                onClick={handleClose}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
