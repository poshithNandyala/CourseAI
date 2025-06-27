import React, { useEffect } from 'react';
import { Header } from './Header';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    // Initialize theme on mount
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Header />
      <main className="relative">{children}</main>
    </div>
  );
};