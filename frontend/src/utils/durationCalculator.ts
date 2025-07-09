import { Lesson } from "../types";

/**
 * Parse YouTube duration format (PT#M#S) to seconds
 */
export const parseYouTubeDuration = (duration: string): number => {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Convert seconds to human-readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${Math.round(remainingSeconds)}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

/**
 * Calculate exact duration of a single lesson from video data
 */
export const calculateLessonDuration = (lesson: Lesson): number => {
  let totalSeconds = 0;
  
  // Check video_data first (new format)
  if (lesson.video_data && Array.isArray(lesson.video_data)) {
    lesson.video_data.forEach((video: any) => {
      if (video.duration) {
        totalSeconds += parseYouTubeDuration(video.duration);
      }
    });
  }
  
  // Fallback to videos array (old format)
  if (totalSeconds === 0 && lesson.videos && Array.isArray(lesson.videos)) {
    lesson.videos.forEach((video: any) => {
      if (video.duration) {
        totalSeconds += parseYouTubeDuration(video.duration);
      }
    });
  }
  
  return totalSeconds;
};

/**
 * Calculate exact duration of entire course from all lessons
 */
export const calculateCourseDuration = (lessons: Lesson[]): number => {
  return lessons.reduce((total, lesson) => {
    return total + calculateLessonDuration(lesson);
  }, 0);
};

/**
 * Get course duration statistics
 */
export const getCourseDurationStats = (lessons: Lesson[]) => {
  const totalSeconds = calculateCourseDuration(lessons);
  const totalVideos = lessons.reduce((count, lesson) => {
    const videoData = lesson.video_data || lesson.videos || [];
    return count + videoData.length;
  }, 0);
  
  return {
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    totalHours: Math.round(totalSeconds / 3600 * 10) / 10, // Round to 1 decimal place
    formattedDuration: formatDuration(totalSeconds),
    totalVideos,
    averageVideoLength: totalVideos > 0 ? Math.round(totalSeconds / totalVideos) : 0
  };
};

/**
 * Compare estimated vs actual duration
 */
export const compareDurations = (estimatedMinutes: number, actualSeconds: number) => {
  const actualMinutes = actualSeconds / 60;
  const difference = actualMinutes - estimatedMinutes;
  const percentageDiff = estimatedMinutes > 0 ? (difference / estimatedMinutes) * 100 : 0;
  
  return {
    estimatedMinutes,
    actualMinutes: Math.round(actualMinutes),
    difference: Math.round(difference),
    percentageDiff: Math.round(percentageDiff),
    isActualLonger: actualMinutes > estimatedMinutes,
    accuracy: Math.max(0, 100 - Math.abs(percentageDiff))
  };
};
