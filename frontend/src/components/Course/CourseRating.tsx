import React, { useState } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface CourseRatingProps {
  courseId: string;
  currentRating: number;
  ratingsCount: number;
  userRating?: number;
  onRatingSubmit: (rating: number) => Promise<void>;
  isLoggedIn: boolean;
}

export const CourseRating: React.FC<CourseRatingProps> = ({
  courseId: _courseId,
  currentRating,
  ratingsCount,
  userRating,
  onRatingSubmit,
  isLoggedIn,
}) => {
  const navigate = useNavigate();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const handleRatingClick = async (rating: number) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onRatingSubmit(rating);
      setShowRatingForm(false);
    } catch (error) {
      console.error("Rating submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= rating;
      const isHovered = interactive && hoveredRating !== null && starValue <= hoveredRating;

      return (
        <motion.button
          key={index}
          type="button"
          disabled={!interactive || isSubmitting}
          onClick={() => interactive && handleRatingClick(starValue)}
          onMouseEnter={() => interactive && setHoveredRating(starValue)}
          onMouseLeave={() => interactive && setHoveredRating(null)}
          className={`${
            interactive
              ? "cursor-pointer hover:scale-110 transition-transform"
              : "cursor-default"
          } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          whileHover={interactive ? { scale: 1.1 } : {}}
          whileTap={interactive ? { scale: 0.95 } : {}}
        >
          <Star
            size={interactive ? 24 : 16}
            className={`${
              isFilled || isHovered
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            } transition-colors duration-200`}
          />
        </motion.button>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Current Rating Display */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          {renderStars(currentRating)}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{currentRating.toFixed(1)}</span>
          <span>•</span>
          <span>{ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'}</span>
        </div>
      </div>

      {/* User Rating Section */}
      {isLoggedIn ? (
        userRating ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Your rating:
                </span>
                <div className="flex items-center space-x-1">
                  {renderStars(userRating)}
                </div>
              </div>
              <button
                onClick={() => setShowRatingForm(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Change rating
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setShowRatingForm(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
            >
              Rate this course
            </button>
          </div>
        )
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please <button 
              onClick={() => navigate('/signin')}
              className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
            >
              sign in
            </button> to rate this course.
          </p>
        </div>
      )}

      {/* Rating Form */}
      <AnimatePresence>
        {showRatingForm && isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Rate this course:
              </p>
              <div className="flex items-center space-x-2">
                {renderStars(hoveredRating || 0, true)}
                {hoveredRating && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {hoveredRating} star{hoveredRating > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                {isSubmitting && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Submitting...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
