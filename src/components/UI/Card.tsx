import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = `
    bg-white/80 dark:bg-neutral-800/80 
    backdrop-blur-sm 
    rounded-xl 
    shadow-lg 
    border border-white/20 dark:border-neutral-700/50
    transition-all duration-200
    ${paddingClasses[padding]}
  `;

  const hoverClasses = hover ? 'hover:shadow-xl hover:bg-white/90 dark:hover:bg-neutral-800/90' : '';

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={`${baseClasses} ${hoverClasses} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};