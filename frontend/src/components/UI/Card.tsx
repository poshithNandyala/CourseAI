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
    bg-white dark:bg-gray-900 
    rounded-2xl 
    shadow-soft 
    border border-gray-200 dark:border-gray-800
    transition-all duration-200
    ${paddingClasses[padding]}
  `;

  const hoverClasses = hover ? 'hover:shadow-soft-lg hover:border-brand-200 dark:hover:border-brand-800' : '';

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