import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  User, 
  LogOut, 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  Menu, 
  X,
  BookOpen,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { signOut } from '../../services/authService';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsProfileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/explore', label: 'Explore', icon: Search },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, authRequired: true },
  ];

  return (
    <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-200"
            >
              <Brain className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              CourseAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.authRequired && !user) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-200"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>

            {user ? (
              <>
                {/* Create Button */}
                <Link
                  to="/create"
                  className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-8 w-8 rounded-full ring-2 ring-primary-500/20"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="hidden sm:block text-neutral-700 dark:text-neutral-300 font-medium">
                      {user.name}
                    </span>
                  </motion.button>
                  
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2"
                      >
                        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {user.name}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {user.email}
                          </p>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-3 px-4 py-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors w-full text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                to="/signin"
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-neutral-200 dark:border-neutral-700 py-4"
            >
              <nav className="space-y-2">
                {navItems.map((item) => {
                  if (item.authRequired && !user) return null;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {user && (
                  <Link
                    to="/create"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Course</span>
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};