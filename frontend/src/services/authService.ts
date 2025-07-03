import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Test backend connection
const testBackendConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Backend connection successful');
      return true;
    }
    throw new Error('Health check failed');
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    toast.error('Cannot connect to server. Please make sure the backend is running on port 8000.');
    return false;
  }
};

// Set user and handle navigation
const setUserAndNavigate = (user: User) => {
  console.log('🔄 Setting user and preparing navigation:', user.email);
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setLoading(false);
  
  // Store token in localStorage for persistence
  if (user.accessToken) {
    localStorage.setItem('accessToken', user.accessToken);
  }
  
  setTimeout(() => {
    console.log('✅ User state should be updated, navigation ready');
  }, 50);
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log('📧 Email sign-in attempt:', email);
  
  // Test backend connection first
  const isConnected = await testBackendConnection();
  if (!isConnected) {
    throw new Error('Backend server is not accessible');
  }
  
  // Basic validation
  if (!email || !email.includes('@')) {
    toast.error('Please enter a valid email address');
    throw new Error('Invalid email');
  }
  
  if (!password || password.length < 6) {
    toast.error('Password must be at least 6 characters');
    throw new Error('Invalid password');
  }

  try {
    console.log('🔗 Attempting to connect to:', `${API_BASE_URL}/users/login`);
    
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.trim(),
        password
      }),
    });

    const data = await response.json();
    console.log('📡 Login response:', { status: response.status, success: data.success });

    if (!response.ok) {
      console.error('❌ Email sign-in error:', data.message);
      toast.error(data.message || 'Sign in failed');
      throw new Error(data.message || 'Sign in failed');
    }

    if (data.success && data.data.user) {
      console.log('✅ Email sign-in successful:', data.data.user.email);
      
      const user: User = {
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.fullname,
        avatar_url: data.data.user.avatar_url,
        provider: 'email',
        created_at: data.data.user.createdAt || new Date().toISOString(),
        accessToken: data.data.accessToken
      };

      setUserAndNavigate(user);
      toast.success('Successfully signed in!');
      return { user, session: null };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    if (error.message.includes('fetch')) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  console.log('📝 Email sign-up attempt:', email);
  
  // Test backend connection first
  const isConnected = await testBackendConnection();
  if (!isConnected) {
    throw new Error('Backend server is not accessible');
  }
  
  // Basic validation
  if (!email || !email.includes('@')) {
    toast.error('Please enter a valid email address');
    throw new Error('Invalid email');
  }
  
  if (!password || password.length < 6) {
    toast.error('Password must be at least 6 characters');
    throw new Error('Invalid password');
  }
  
  if (!name || name.trim().length < 2) {
    toast.error('Please enter your full name');
    throw new Error('Invalid name');
  }

  try {
    console.log('🔗 Attempting to connect to:', `${API_BASE_URL}/users/register`);
    
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fullname: name.trim(),
        email: email.trim(),
        username: email.split('@')[0].toLowerCase(),
        password
      }),
    });

    const data = await response.json();
    console.log('📡 Signup response:', { status: response.status, success: data.success });

    if (!response.ok) {
      console.error('❌ Email sign-up error:', data.message);
      toast.error(data.message || 'Sign up failed');
      throw new Error(data.message || 'Sign up failed');
    }

    if (data.success && data.data) {
      console.log('✅ Email sign-up successful:', data.data.email);
      
      toast.success('Account created successfully! You can now sign in.');
      return { user: data.data, session: null };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Email sign-up error:', error);
    if (error.message.includes('fetch')) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

export const signOut = async () => {
  console.log('🚪 Sign-out attempt');
  
  try {
    // Clear user state immediately
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
    
    // Call backend logout
    const token = localStorage.getItem('accessToken');
    if (token) {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
    }
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    
    console.log('✅ User signed out successfully');
    toast.success('Successfully signed out');
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
    
  } catch (error: any) {
    console.error('Sign-out error:', error);
    // Still clear local state even if there's an error
    useAuthStore.getState().setUser(null);
    localStorage.removeItem('accessToken');
    toast.success('Signed out');
    
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      localStorage.removeItem('accessToken');
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        id: data.data._id,
        email: data.data.email,
        name: data.data.fullname,
        avatar_url: data.data.avatar_url,
        provider: 'email',
        created_at: data.data.createdAt || new Date().toISOString(),
        accessToken: token
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('accessToken');
    return null;
  }
};

export const initializeAuth = async () => {
  console.log('🔐 Initializing authentication...');
  
  try {
    useAuthStore.getState().setLoading(true);
    
    const user = await getCurrentUser();
    if (user) {
      console.log('✅ Found existing user session:', user.email);
      useAuthStore.getState().setUser(user);
    } else {
      console.log('ℹ️ No existing user session found');
    }
  } catch (error) {
    console.error('❌ Auth initialization error:', error);
  } finally {
    useAuthStore.getState().setLoading(false);
    console.log('✅ Auth initialization complete');
  }
};