import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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

export const sendSignupVerification = async (email: string, password: string, name: string) => {
  console.log('📝 Sending signup verification:', email);
  
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
    console.log('🔗 Sending verification to:', `${API_BASE_URL}/verification/send-signup-verification`);
    
    const response = await fetch(`${API_BASE_URL}/verification/send-signup-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fullname: name.trim(),
        email: email.trim(),
        username: email.split('@')[0].toLowerCase(),
        password
      }),
    });

    const data = await response.json();
    console.log('📡 Verification response:', { status: response.status, success: data.success });

    if (!response.ok) {
      console.error('❌ Verification send error:', data.message);
      toast.error(data.message || 'Failed to send verification code');
      throw new Error(data.message || 'Failed to send verification code');
    }

    if (data.success) {
      console.log('✅ Verification email sent:', data.data.email);
      toast.success('Verification code sent to your email!');
      return { 
        email: data.data.email, 
        expiresIn: data.data.expires_in,
        message: data.data.message 
      };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Verification send error:', error);
    if (error.message.includes('fetch')) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

export const verifySignupCode = async (email: string, code: string) => {
  console.log('🔍 Verifying signup code:', email);
  
  if (!email || !code) {
    toast.error('Email and verification code are required');
    throw new Error('Missing required fields');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/verification/verify-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    console.log('📡 Verification response:', { status: response.status, success: data.success });

    if (!response.ok) {
      console.error('❌ Code verification error:', data.message);
      toast.error(data.message || 'Verification failed');
      throw new Error(data.message || 'Verification failed');
    }

    if (data.success && data.data.user) {
      console.log('✅ Email verified and account created:', data.data.user.email);
      
      const user: User = {
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.fullname,
        avatar_url: data.data.user.avatar_url,
        provider: data.data.user.provider || 'email',
        created_at: data.data.user.created_at || new Date().toISOString(),
        accessToken: data.data.accessToken
      };

      setUserAndNavigate(user);
      toast.success('Account verified and created successfully!');
      return { user, session: null };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Code verification error:', error);
    throw error;
  }
};

export const resendVerificationCode = async (email: string, type: string = 'signup') => {
  console.log('🔄 Resending verification code:', email);
  
  try {
    const response = await fetch(`${API_BASE_URL}/verification/resend-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || 'Failed to resend code');
      throw new Error(data.message || 'Failed to resend code');
    }

    if (data.success) {
      toast.success('New verification code sent!');
      return data.data;
    }

    throw new Error('Failed to resend code');
  } catch (error: any) {
    console.error('Resend code error:', error);
    throw error;
  }
};

export const sendPasswordResetVerification = async (email: string) => {
  console.log('🔑 Sending password reset verification:', email);
  
  if (!email || !email.includes('@')) {
    toast.error('Please enter a valid email address');
    throw new Error('Invalid email');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/verification/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || 'Failed to send reset code');
      throw new Error(data.message || 'Failed to send reset code');
    }

    if (data.success) {
      toast.success('Password reset code sent to your email!');
      return data.data;
    }

    throw new Error('Failed to send reset code');
  } catch (error: any) {
    console.error('Password reset send error:', error);
    throw error;
  }
};

export const verifyPasswordResetCode = async (email: string, code: string) => {
  console.log('🔍 Verifying password reset code:', email);
  
  if (!email || !code) {
    toast.error('Email and verification code are required');
    throw new Error('Missing required fields');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/verification/verify-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || 'Verification failed');
      throw new Error(data.message || 'Verification failed');
    }

    if (data.success) {
      toast.success('Code verified! You can now set a new password.');
      return data.data;
    }

    throw new Error('Verification failed');
  } catch (error: any) {
    console.error('Password reset verification error:', error);
    throw error;
  }
};
