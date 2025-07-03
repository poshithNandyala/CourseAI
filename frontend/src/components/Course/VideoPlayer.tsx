import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink, Clock, Eye, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnailUrl: string;
    channelTitle: string;
    viewCount: number;
    embedUrl: string;
    watchUrl: string;
  };
  autoplay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, autoplay = false }) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-soft border border-gray-200 dark:border-gray-800 ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Video Player Area */}
      <div className={`relative bg-gray-900 ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
        {isPlaying ? (
          <div className="relative w-full h-full">
            <iframe
              src={`${video.embedUrl}&autoplay=1&modestbranding=1&rel=0&showinfo=0`}
              title={video.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* Custom Controls Overlay */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFullscreen}
                className="bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-all duration-200"
              >
                <Maximize className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full group cursor-pointer" onClick={handlePlayClick}>
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-200">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 hover:bg-red-700 rounded-full p-6 shadow-lg"
              >
                <Play className="h-12 w-12 text-white ml-1" />
              </motion.div>
            </div>
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm font-medium">
              {video.duration}
            </div>
            <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
              HD
            </div>
          </div>
        )}
      </div>

      {/* Video Info - Only show if not fullscreen - FIXED TEXT COLORS */}
      {!isFullscreen && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {video.title}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span className="font-medium text-gray-700 dark:text-gray-300">{video.channelTitle}</span>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{video.viewCount.toLocaleString()} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{video.duration}</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
            {video.description}
          </p>

          <div className="flex space-x-3">
            {!isPlaying && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlayClick}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Play Video</span>
              </motion.button>
            )}
            
            <a
              href={video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>YouTube</span>
            </a>
          </div>
        </div>
      )}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFullscreen}
          className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg hover:bg-opacity-70 transition-all duration-200 z-10"
        >
          <ExternalLink className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
};