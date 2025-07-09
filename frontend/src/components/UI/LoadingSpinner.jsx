import React from 'react';
import { motion } from 'framer-motion';

/**
 * A simple, customizable loading spinner component.
 *
 * @param {object} props - The component props.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the spinner.
 * @param {'primary' | 'secondary' | 'white'} [props.color='primary'] - The color of the spinner's border.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the spinner.
 */
export const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  // Maps size prop to corresponding Tailwind CSS classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Maps color prop to corresponding Tailwind CSS border color classes
  const colorClasses = {
    primary: 'border-brand-500',
    secondary: 'border-accent-500',
    white: 'border-white'
  };

  return (
    <motion.div
      // Animate the rotation of the spinner indefinitely
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      // Apply dynamic classes for size, color, and any additional custom classes
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-2 border-t-transparent rounded-full
        ${className}
      `}
    />
  );
};
