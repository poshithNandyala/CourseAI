import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, User, LogOut, Plus, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../services/authService';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CourseAI
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/explore"
              className={`text-gray-600 hover:text-purple-600 transition-colors ${
                isActive('/explore') ? 'text-purple-600 font-medium' : ''
              }`}
            >
              Explore
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-gray-600 hover:text-purple-600 transition-colors ${
                    isActive('/dashboard') ? 'text-purple-600 font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/create"
                  className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:block text-gray-700 font-medium">{user.name}</span>
                </motion.button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};