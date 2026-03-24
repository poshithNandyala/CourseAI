import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Key, ArrowRight, Settings, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userApiKeyService } from '../../services/userApiKeyService';

interface ApiKeyValidatorProps {
  children: React.ReactNode;
  onValidationChange?: (isValid: boolean) => void;
  showWarning?: boolean;
}

const ApiKeyValidator: React.FC<ApiKeyValidatorProps> = ({ 
  children, 
  onValidationChange,
  showWarning = true
}) => {
  const [hasValidKeys, setHasValidKeys] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState<any>(null);

  useEffect(() => {
    checkApiKeys();
  }, []);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(hasValidKeys === true);
    }
  }, [hasValidKeys, onValidationChange]);

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
        
        setHasValidKeys(hasGemini && hasYoutube);
      } else {
        setHasValidKeys(false);
      }
    } catch (error) {
      console.error('Failed to check API keys:', error);
      setHasValidKeys(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!hasValidKeys && showWarning) {
    return (
      <div className="space-y-6">
        {/* API Key Configuration Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center shadow-soft-lg"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-2xl">
              <Key className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                API Keys Required
              </h3>
              <p className="text-lg text-amber-800 dark:text-amber-200 max-w-2xl">
                You need to configure both <strong>Gemini AI</strong> and <strong>YouTube Data API</strong> keys to create courses with real content.
              </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
              <div className={`p-4 rounded-xl border-2 ${
                keyStatus?.gemini?.status === 'valid' 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center space-x-2">
                  {keyStatus?.gemini?.status === 'valid' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-medium ${
                    keyStatus?.gemini?.status === 'valid' 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    Gemini AI API
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  keyStatus?.gemini?.status === 'valid' 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {keyStatus?.gemini?.status === 'valid' ? 'Configured' : 'Not configured'}
                </p>
              </div>

              <div className={`p-4 rounded-xl border-2 ${
                keyStatus?.youtube?.status === 'valid' 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center space-x-2">
                  {keyStatus?.youtube?.status === 'valid' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-medium ${
                    keyStatus?.youtube?.status === 'valid' 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    YouTube Data API
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  keyStatus?.youtube?.status === 'valid' 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {keyStatus?.youtube?.status === 'valid' ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>

            <Link
              to="/settings"
              className="inline-flex items-center space-x-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-white no-underline shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
            >
              <Settings className="h-5 w-5" />
              <span>Configure API Keys</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <p className="text-sm text-amber-700 dark:text-amber-300">
              Once configured, this message will disappear automatically.
            </p>
          </div>
        </motion.div>

        {/* Disabled Content */}
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiKeyValidator;
