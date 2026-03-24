import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Key, 
  Shield, 
  Trash2, 
  Camera, 
  Eye, 
  EyeOff, 
  Save, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Mail,
  Lock,
  ExternalLink,
  Github,
  Chrome
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface User {
  id: string;
  fullname: string;
  email: string;
  avatar_url?: string;
  auth_provider?: 'local' | 'google' | 'github';
  created_at: string;
}

interface ApiKeyStatus {
  configured: boolean;
  status: 'not_set' | 'valid' | 'invalid' | 'quota_exceeded';
  lastValidated?: string;
}

interface ApiKeysStatus {
  gemini: ApiKeyStatus;
  youtube: ApiKeyStatus;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfessionalSettings: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'api-keys' | 'security' | 'danger'>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState({
    geminiApiKey: '',
    youtubeApiKey: ''
  });
  const [apiKeysStatus, setApiKeysStatus] = useState<ApiKeysStatus | null>(null);
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    youtube: false
  });
  const [editingKeys, setEditingKeys] = useState({
    gemini: false,
    youtube: false
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullname: '',
    email: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
    fetchApiKeysStatus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        const userData = result.data;
        setUser(userData);
        setProfileData({
          fullname: userData.fullname || '',
          email: userData.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeysStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setApiKeysStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys status:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      
      // Update avatar if changed
      if (avatarFile) {
        console.log('📤 Uploading avatar:', avatarFile.name, `(${(avatarFile.size / 1024 / 1024).toFixed(2)}MB)`);
        
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const avatarResponse = await fetch(`${API_BASE_URL}/users/avatar`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        if (!avatarResponse.ok) {
          const errorData = await avatarResponse.json().catch(() => ({ message: 'Failed to update avatar' }));
          console.error('❌ Avatar upload failed:', errorData);
          throw new Error(errorData.message || 'Failed to update avatar');
        }
        
        const avatarResult = await avatarResponse.json();
        console.log('✅ Avatar uploaded successfully:', avatarResult.data?.avatar_url);
      }
      
      // Update profile data (only fullname, email cannot be changed)
      const response = await fetch(`${API_BASE_URL}/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ fullname: profileData.fullname })
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        setAvatarFile(null);
        setPreviewUrl(null);
        await fetchUserProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async (keyType?: 'gemini' | 'youtube') => {
    let keysToSave: any = {};
    
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
      } else {
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

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE MY ACCOUNT';
    const userInput = prompt(
      `This action cannot be undone. All your courses, progress, and data will be permanently deleted.\n\nType "${confirmText}" to confirm:`
    );
    
    if (userInput !== confirmText) {
      toast.error('Account deletion cancelled');
      return;
    }
    
    try {
      setSaving(true);
      
      // Note: This endpoint needs to be implemented in the backend
      const response = await fetch(`${API_BASE_URL}/users/delete-account`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Account deleted successfully');
        logout();
        navigate('/');
      } else {
        toast.error('Failed to delete account. Please contact support.');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setSaving(false);
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

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Chrome className="h-5 w-5 text-blue-500" />;
      case 'github':
        return <Github className="h-5 w-5 text-gray-800 dark:text-gray-200" />;
      default:
        return <Mail className="h-5 w-5 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-3">
                <img
                  src={previewUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.email)}&background=6366f1&color=ffffff`}
                  alt={user.fullname || user.email}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.fullname || user.email}
                  </div>
                  <div className="flex items-center space-x-1">
                    {getProviderIcon(user.auth_provider || 'local')}
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.auth_provider || 'local'} account
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className={`h-5 w-5 ${tab.id === 'danger' ? 'text-red-500' : ''}`} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === 'profile' && user && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-800/30 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit Profile</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <img
                            src={previewUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.email)}&background=6366f1&color=ffffff&size=120`}
                            alt={user.fullname || user.email}
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-brand-100 dark:ring-brand-900/30"
                          />
                          {isEditing && (
                            <label className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-2 rounded-xl cursor-pointer hover:bg-brand-600 transition-colors shadow-lg" title="Change profile picture">
                              <Camera className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                                title="Upload new profile picture"
                                aria-label="Upload new profile picture"
                              />
                            </label>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {user.fullname || user.email}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {getProviderIcon(user.auth_provider || 'local')}
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {user.auth_provider || 'local'} Account
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Profile Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.fullname}
                            onChange={(e) => setProfileData(prev => ({ ...prev, fullname: e.target.value }))}
                            disabled={!isEditing}
                            placeholder="Enter your full name"
                            title="Your full name"
                            aria-label="Full name"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled={true}
                            placeholder="Email address (read-only)"
                            title="Email address cannot be changed"
                            aria-label="Email address (read-only)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Email cannot be changed as it's linked to your authentication
                          </p>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="flex items-center space-x-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Save className="h-4 w-4" />
                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setProfileData({
                                fullname: user.fullname || '',
                                email: user.email || ''
                              });
                              setAvatarFile(null);
                              setPreviewUrl(null);
                            }}
                            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* API Keys Tab */}
                {activeTab === 'api-keys' && (
                  <motion.div
                    key="api-keys"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">API Keys Management</h2>
                    
                    {/* Current Status */}
                    {apiKeysStatus && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Gemini AI API</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {apiKeysStatus.gemini.status === 'valid' ? 'Valid & Active' : 
                                   apiKeysStatus.gemini.status === 'invalid' ? 'Invalid Key' :
                                   apiKeysStatus.gemini.status === 'quota_exceeded' ? 'Quota Exceeded' : 'Not Configured'}
                                </p>
                              </div>
                              {getStatusIcon(apiKeysStatus.gemini)}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">YouTube Data API</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {apiKeysStatus.youtube.status === 'valid' ? 'Valid & Active' : 
                                   apiKeysStatus.youtube.status === 'invalid' ? 'Invalid Key' :
                                   apiKeysStatus.youtube.status === 'quota_exceeded' ? 'Quota Exceeded' : 'Not Configured'}
                                </p>
                              </div>
                              {getStatusIcon(apiKeysStatus.youtube)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Setup Instructions */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Setup Instructions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center space-x-2">
                            <span>🧠</span>
                            <span>Gemini AI API Key</span>
                          </h4>
                          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center underline text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">AI Studio <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                            <li>2. Sign in with your Google account</li>
                            <li>3. Create a new API key</li>
                            <li>4. Copy and paste it below</li>
                          </ol>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                          <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center space-x-2">
                            <span>📺</span>
                            <span>YouTube Data API Key</span>
                          </h4>
                          <ol className="text-sm text-red-800 dark:text-red-200 space-y-1">
                            <li>1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center underline text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200">Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                            <li>2. Create/select a project</li>
                            <li>3. Enable YouTube Data API v3</li>
                            <li>4. Create credentials (API key)</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* API Key Management */}
                    <div className="space-y-6">
                      {/* Gemini API Key */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">Gemini AI API Key</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {apiKeysStatus?.gemini.configured ? 'Configured' : 'Not configured'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {apiKeysStatus?.gemini.configured && getStatusIcon(apiKeysStatus.gemini)}
                            {!editingKeys.gemini && apiKeysStatus?.gemini.configured && (
                              <button
                                onClick={() => setEditingKeys(prev => ({ ...prev, gemini: true }))}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Edit Gemini API key"
                                aria-label="Edit Gemini API key"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {!apiKeysStatus?.gemini.configured || editingKeys.gemini ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type={showKeys.gemini ? 'text' : 'password'}
                                value={apiKeys.geminiApiKey}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                                placeholder="Enter your Gemini API key"
                                title="Gemini API key"
                                aria-label="Gemini API key"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-600 dark:text-white pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title={showKeys.gemini ? 'Hide Gemini API key' : 'Show Gemini API key'}
                                aria-label={showKeys.gemini ? 'Hide Gemini API key' : 'Show Gemini API key'}
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
                                {apiKeysStatus?.gemini.configured ? 'Update' : 'Save'} Gemini Key
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
                            Key configured and {apiKeysStatus.gemini.status === 'valid' ? 'valid & active' : 
                                              apiKeysStatus.gemini.status === 'invalid' ? 'invalid' :
                                              apiKeysStatus.gemini.status === 'quota_exceeded' ? 'quota exceeded' : 'not configured'}
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
                              <h4 className="font-medium text-gray-900 dark:text-white">YouTube Data API Key</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {apiKeysStatus?.youtube.configured ? 'Configured' : 'Not configured'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {apiKeysStatus?.youtube.configured && getStatusIcon(apiKeysStatus.youtube)}
                            {!editingKeys.youtube && apiKeysStatus?.youtube.configured && (
                              <button
                                onClick={() => setEditingKeys(prev => ({ ...prev, youtube: true }))}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Edit YouTube API key"
                                aria-label="Edit YouTube API key"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {!apiKeysStatus?.youtube.configured || editingKeys.youtube ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type={showKeys.youtube ? 'text' : 'password'}
                                value={apiKeys.youtubeApiKey}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, youtubeApiKey: e.target.value }))}
                                placeholder="Enter your YouTube API key"
                                title="YouTube API key"
                                aria-label="YouTube API key"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-600 dark:text-white pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKeys(prev => ({ ...prev, youtube: !prev.youtube }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title={showKeys.youtube ? 'Hide YouTube API key' : 'Show YouTube API key'}
                                aria-label={showKeys.youtube ? 'Hide YouTube API key' : 'Show YouTube API key'}
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
                                {apiKeysStatus?.youtube.configured ? 'Update' : 'Save'} YouTube Key
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
                            Key configured and {apiKeysStatus.youtube.status === 'valid' ? 'valid & active' : 
                                              apiKeysStatus.youtube.status === 'invalid' ? 'invalid' :
                                              apiKeysStatus.youtube.status === 'quota_exceeded' ? 'quota exceeded' : 'not configured'}
                          </div>
                        )}
                      </div>

                      {/* Ready to Create Notice */}
                      {apiKeysStatus && apiKeysStatus.gemini.status === 'valid' && apiKeysStatus.youtube.status === 'valid' && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            <div>
                              <h4 className="font-semibold text-green-900 dark:text-green-100">All Set!</h4>
                              <p className="text-green-700 dark:text-green-300">
                                Your API keys are configured and valid. You can now create AI-powered courses.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/create')}
                            className="mt-4 inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            <span>Start Creating Courses</span>
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Security Settings</h2>
                    
                    {user?.auth_provider === 'local' ? (
                      <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                            <Lock className="h-5 w-5" />
                            <span>Change Password</span>
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.current ? 'text' : 'password'}
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                  placeholder="Enter current password"
                                  title="Current password"
                                  aria-label="Current password"
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-600 dark:text-white pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  title={showPasswords.current ? 'Hide current password' : 'Show current password'}
                                  aria-label={showPasswords.current ? 'Hide current password' : 'Show current password'}
                                >
                                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.new ? 'text' : 'password'}
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password"
                                  title="New password"
                                  aria-label="New password"
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-600 dark:text-white pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  title={showPasswords.new ? 'Hide new password' : 'Show new password'}
                                  aria-label={showPasswords.new ? 'Hide new password' : 'Show new password'}
                                >
                                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.confirm ? 'text' : 'password'}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                  title="Confirm new password"
                                  aria-label="Confirm new password"
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-600 dark:text-white pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  title={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                                  aria-label={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <button
                              onClick={handleChangePassword}
                              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                              className="w-full bg-brand-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {saving ? 'Changing Password...' : 'Change Password'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <div className="flex items-center space-x-3">
                          {getProviderIcon(user?.auth_provider || 'local')}
                          <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">OAuth Account</h3>
                            <p className="text-blue-700 dark:text-blue-300">
                              You signed in with {user?.auth_provider}. Password changes are managed through your {user?.auth_provider} account.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && (
                  <motion.div
                    key="danger"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Danger Zone</h2>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                            Delete Account
                          </h3>
                          <p className="text-red-700 dark:text-red-300 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <ul className="text-sm text-red-600 dark:text-red-400 mb-6 space-y-1">
                            <li>• All your courses will be permanently deleted</li>
                            <li>• Your learning progress will be lost</li>
                            <li>• Your API keys will be removed from our servers</li>
                            <li>• Your profile and account data will be permanently deleted</li>
                          </ul>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={saving}
                            className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {saving ? 'Deleting Account...' : 'Delete My Account'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSettings;
