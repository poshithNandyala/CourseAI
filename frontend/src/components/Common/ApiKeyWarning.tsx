import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Key, ArrowRight, Settings, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApiKeyWarningProps {
  onValidationChange?: (isValid: boolean, isLoading: boolean) => void;
}

const ApiKeyWarning: React.FC<ApiKeyWarningProps> = ({ onValidationChange }) => {
  const [hasValidKeys, setHasValidKeys] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState<any>(null);

  useEffect(() => {
    checkApiKeys();
  }, []);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(hasValidKeys === true, loading);
    }
  }, [hasValidKeys, loading, onValidationChange]);

  const checkApiKeys = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/api-keys/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        const status = result.data;
        setKeyStatus(status);
        
        const hasGemini = status.gemini.status === 'valid';
        const hasYoutube = status.youtube.status === 'valid';
        const bothValid = hasGemini && hasYoutube;
        
        console.log('🔍 API Key Status Check:', { 
          gemini: status.gemini.status, 
          youtube: status.youtube.status, 
          bothValid 
        });
        
        setHasValidKeys(bothValid);
      } else {
        console.log('🚫 API key status endpoint returned error');
        setHasValidKeys(false);
      }
    } catch (error) {
      console.error('❌ Failed to check API keys:', error);
      setHasValidKeys(false);
    } finally {
      setLoading(false);
    }
  };

  // If keys are valid, don't show the warning
  if (hasValidKeys) {
    return null;
  }

  // Show warning if loading or if keys are invalid/missing
  if (loading) {
    // Show a simple loading state while checking
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Checking API key configuration...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">
              🔑 Configure API Keys to Create Courses
            </h3>
            <p className="text-amber-800 dark:text-amber-200 mb-4">
              Both <strong>Gemini AI</strong> and <strong>YouTube Data API</strong> keys are required 
              to generate courses with real content and videos. Please configure them in Settings to continue.
            </p>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className={`p-3 rounded-lg border ${
                keyStatus?.gemini?.status === 'valid' 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20'
              }`}>
                <div className="flex items-center space-x-2">
                  {keyStatus?.gemini?.status === 'valid' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    keyStatus?.gemini?.status === 'valid' 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    🧠 Gemini AI API
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  keyStatus?.gemini?.status === 'valid' 
                    ? 'text-green-600 dark:text-green-300' 
                    : 'text-amber-600 dark:text-amber-300'
                }`}>
                  {keyStatus?.gemini?.status === 'valid' ? 'Ready to use' : 'Not configured'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                keyStatus?.youtube?.status === 'valid' 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20'
              }`}>
                <div className="flex items-center space-x-2">
                  {keyStatus?.youtube?.status === 'valid' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    keyStatus?.youtube?.status === 'valid' 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    📺 YouTube Data API
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  keyStatus?.youtube?.status === 'valid' 
                    ? 'text-green-600 dark:text-green-300' 
                    : 'text-amber-600 dark:text-amber-300'
                }`}>
                  {keyStatus?.youtube?.status === 'valid' ? 'Ready to use' : 'Not configured'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/settings"
                className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white no-underline shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                <Settings className="h-4 w-4" />
                <span>Configure API Keys</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <div className="text-sm text-amber-700 dark:text-amber-300 flex items-center">
                <span>Once configured, you'll be able to generate amazing courses instantly!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ApiKeyWarning;
