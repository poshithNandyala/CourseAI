import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Save, Trash2, ExternalLink, ArrowLeft, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface ApiKeyStatus {
  configured: boolean;
  status: 'not_set' | 'valid' | 'invalid' | 'quota_exceeded';
  lastValidated?: string;
}

interface ApiKeysStatus {
  gemini: ApiKeyStatus;
  youtube: ApiKeyStatus;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiKeys, setApiKeys] = useState({
    geminiApiKey: '',
    youtubeApiKey: ''
  });
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    youtube: false
  });
  const [editingKeys, setEditingKeys] = useState({
    gemini: false,
    youtube: false
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ApiKeysStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingKeys, setExistingKeys] = useState({
    gemini: '',
    youtube: ''
  });

  useEffect(() => {
    fetchApiKeysStatus();
  }, []);

  const fetchApiKeysStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api-keys/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setStatus(result.data);
        
        // Set existing keys placeholders (for UI purposes)
        setExistingKeys({
          gemini: result.data.gemini.configured ? '••••••••••••••••••••••••••••••••••••••••' : '',
          youtube: result.data.youtube.configured ? '••••••••••••••••••••••••••••••••••••••••' : ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch API keys status:', error);
      toast.error('Failed to load API keys status');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKeys = async (keyType?: 'gemini' | 'youtube') => {
    // Determine which keys to save
    const keysToSave: any = {};
    
    if (keyType === 'gemini') {
      if (!apiKeys.geminiApiKey.trim()) {
        toast.error('Please provide a Gemini API key');
        return;
      }
      keysToSave.geminiApiKey = apiKeys.geminiApiKey;
    } else if (keyType === 'youtube') {
      if (!apiKeys.youtubeApiKey.trim()) {
        toast.error('Please provide a YouTube API key');
        return;
      }
      keysToSave.youtubeApiKey = apiKeys.youtubeApiKey;
    } else {
      // Save both keys
      if (!apiKeys.geminiApiKey.trim() && !apiKeys.youtubeApiKey.trim()) {
        toast.error('Please provide at least one API key');
        return;
      }
      keysToSave = apiKeys;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/api-keys/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(keysToSave)
      });

      const result = await response.json();
      
      if (response.ok) {
        const keyName = keyType === 'gemini' ? 'Gemini' : keyType === 'youtube' ? 'YouTube' : 'API';
        toast.success(`${keyName} API key${keyType ? '' : 's'} updated successfully!`);
        
        // Clear input fields and reset editing state
        if (keyType === 'gemini') {
          setApiKeys(prev => ({ ...prev, geminiApiKey: '' }));
          setEditingKeys(prev => ({ ...prev, gemini: false }));
        } else if (keyType === 'youtube') {
          setApiKeys(prev => ({ ...prev, youtubeApiKey: '' }));
          setEditingKeys(prev => ({ ...prev, youtube: false }));
        } else {
          setApiKeys({ geminiApiKey: '', youtubeApiKey: '' });
          setEditingKeys({ gemini: false, youtube: false });
        }
        
        await fetchApiKeysStatus();
        
        // Navigate based on where they came from
        const from = location.state?.from;
        if (from === '/create' || (!from && (result.data?.gemini?.valid && result.data?.youtube?.valid))) {
          toast.success('🎉 Ready to create courses! Redirecting...');
          setTimeout(() => navigate('/create'), 1500);
        }
      } else {
        // Show specific errors for each key
        if (result.data?.gemini?.error) {
          toast.error(`Gemini API: ${result.data.gemini.error}`);
        }
        if (result.data?.youtube?.error) {
          toast.error(`YouTube API: ${result.data.youtube.error}`);
        }
        if (!result.data?.gemini?.error && !result.data?.youtube?.error) {
          toast.error(result.message || 'Failed to update API keys');
        }
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKeys = async () => {
    if (!confirm('Are you sure you want to delete all your API keys? This will prevent you from creating new courses.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api-keys/delete`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('API keys deleted successfully');
        await fetchApiKeysStatus();
      } else {
        toast.error('Failed to delete API keys');
      }
    } catch (error) {
      console.error('Failed to delete API keys:', error);
      toast.error('Failed to delete API keys');
    }
  };

  const getStatusIcon = (apiStatus: ApiKeyStatus) => {
    switch (apiStatus.status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'quota_exceeded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (apiStatus: ApiKeyStatus) => {
    switch (apiStatus.status) {
      case 'valid':
        return 'Valid & Active';
      case 'invalid':
        return 'Invalid Key';
      case 'quota_exceeded':
        return 'Quota Exceeded';
      default:
        return 'Not Configured';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Key className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">API Keys Settings</h1>
                  <p className="text-indigo-100">Configure your own Gemini and YouTube API keys</p>
                </div>
              </div>
              {location.state?.from && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center space-x-2 text-white hover:text-indigo-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Current Status */}
            {status && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Gemini AI API</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getStatusText(status.gemini)}</p>
                      </div>
                      {getStatusIcon(status.gemini)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">YouTube Data API</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getStatusText(status.youtube)}</p>
                      </div>
                      {getStatusIcon(status.youtube)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Setup Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Setup Instructions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gemini Setup */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🧠 Gemini AI API Key</h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">AI Studio <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                    <li>2. Sign in with your Google account</li>
                    <li>3. Create a new API key</li>
                    <li>4. Copy and paste it below</li>
                  </ol>
                </div>

                {/* YouTube Setup */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">📺 YouTube Data API Key</h3>
                  <ol className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    <li>1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                    <li>2. Create/select a project</li>
                    <li>3. Enable YouTube Data API v3</li>
                    <li>4. Create credentials (API key)</li>
                  </ol>
                </div>
              </div>
            </motion.div>

            {/* API Key Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage API Keys</h2>
              
              {/* Gemini API Key */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Gemini AI API Key</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {status?.gemini.configured ? 'Configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status?.gemini.configured && getStatusIcon(status.gemini)}
                    {!editingKeys.gemini && status?.gemini.configured && (
                      <button
                        onClick={() => setEditingKeys(prev => ({ ...prev, gemini: true }))}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {!status?.gemini.configured || editingKeys.gemini ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showKeys.gemini ? 'text' : 'password'}
                        value={apiKeys.geminiApiKey}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                        placeholder="Enter your Gemini API key"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showKeys.gemini ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveApiKeys('gemini')}
                        disabled={saving || !apiKeys.geminiApiKey.trim()}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {status?.gemini.configured ? 'Update' : 'Save'} Gemini Key
                      </button>
                      {editingKeys.gemini && (
                        <button
                          onClick={() => {
                            setEditingKeys(prev => ({ ...prev, gemini: false }));
                            setApiKeys(prev => ({ ...prev, geminiApiKey: '' }));
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Key configured and {getStatusText(status.gemini).toLowerCase()}
                  </div>
                )}
              </div>

              {/* YouTube API Key */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Key className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">YouTube Data API Key</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {status?.youtube.configured ? 'Configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status?.youtube.configured && getStatusIcon(status.youtube)}
                    {!editingKeys.youtube && status?.youtube.configured && (
                      <button
                        onClick={() => setEditingKeys(prev => ({ ...prev, youtube: true }))}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {!status?.youtube.configured || editingKeys.youtube ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showKeys.youtube ? 'text' : 'password'}
                        value={apiKeys.youtubeApiKey}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, youtubeApiKey: e.target.value }))}
                        placeholder="Enter your YouTube API key"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys(prev => ({ ...prev, youtube: !prev.youtube }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showKeys.youtube ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveApiKeys('youtube')}
                        disabled={saving || !apiKeys.youtubeApiKey.trim()}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {status?.youtube.configured ? 'Update' : 'Save'} YouTube Key
                      </button>
                      {editingKeys.youtube && (
                        <button
                          onClick={() => {
                            setEditingKeys(prev => ({ ...prev, youtube: false }));
                            setApiKeys(prev => ({ ...prev, youtubeApiKey: '' }));
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Key configured and {getStatusText(status.youtube).toLowerCase()}
                  </div>
                )}
              </div>

              {/* Global Actions */}
              {status && (status.gemini.configured || status.youtube.configured) && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {status.gemini.configured && status.youtube.configured && (
                      <button
                        onClick={() => navigate('/create')}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                      >
                        <span>🎉 Start Creating Courses</span>
                      </button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteApiKeys}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>Delete All Keys</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Important Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4"
            >
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Important Notes</h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• Your API keys are encrypted and stored securely</li>
                <li>• Both keys are required to create AI-powered courses</li>
                <li>• You are responsible for your own API usage and costs</li>
                <li>• Keys are validated automatically when saved</li>
                <li>• Delete your account to permanently remove stored keys</li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
