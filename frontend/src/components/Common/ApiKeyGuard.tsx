import React, { useState, useEffect } from 'react';
import { userApiKeyService } from '../../services/userApiKeyService';

interface ApiKeyGuardProps {
  children: React.ReactNode;
  requiredKeys?: ('gemini' | 'youtube')[];
  fallback?: React.ReactNode;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ 
  children, 
  requiredKeys = ['gemini', 'youtube'],
  fallback 
}) => {
  const [hasValidKeys, setHasValidKeys] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState<any>(null);

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      setLoading(true);
      
      // Get detailed status of API keys
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/api-keys/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        const status = result.data;
        setKeyStatus(status);
        
        // Check if required keys are valid
        const hasGemini = status.gemini.status === 'valid';
        const hasYoutube = status.youtube.status === 'valid';
        
        if (requiredKeys.includes('gemini') && !hasGemini) {
          setHasValidKeys(false);
          return;
        }
        
        if (requiredKeys.includes('youtube') && !hasYoutube && hasGemini) {
          setHasValidKeys(false);
          return;
        }
        
        if (requiredKeys.includes('gemini') && requiredKeys.includes('youtube')) {
          setHasValidKeys(hasGemini && hasYoutube);
        } else {
          setHasValidKeys(true);
        }
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

  // No longer showing toasts - validation is handled by the warning component on course pages

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If API keys are missing, show toast and return fallback or children
  // The toast will guide users to configure their keys
  if (!hasValidKeys) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // Return children anyway - the toast will inform the user
    // and the actual API calls will handle the missing keys gracefully
  }

  return <>{children}</>;
};

export default ApiKeyGuard;
