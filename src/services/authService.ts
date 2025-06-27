import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';

// Check if we're using the mock client
const isMockClient = !import.meta.env.VITE_SUPABASE_URL || 
                    !import.meta.env.VITE_SUPABASE_ANON_KEY || 
                    import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_project_url') || 
                    import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your_supabase_anon_key') ||
                    !import.meta.env.VITE_SUPABASE_URL.startsWith('http');

export const signInWithEmail = async (email: string, password: string) => {
  if (isMockClient) {
    toast.error('Supabase is not configured. Please set up your environment variables.');
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Email sign-in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }

    toast.success('Successfully signed in!');
    return data;
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    toast.error(error.message || 'Failed to sign in');
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (isMockClient) {
    toast.error('Supabase is not configured. Please set up your environment variables.');
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name: name,
        }
      }
    });

    if (error) {
      console.error('Email sign-up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    }

    if (data.user && !data.session) {
      toast.success('Please check your email to confirm your account!');
    } else {
      toast.success('Account created successfully!');
    }

    return data;
  } catch (error: any) {
    console.error('Email sign-up error:', error);
    toast.error(error.message || 'Failed to create account');
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (isMockClient) {
    toast.error('Supabase is not configured. Please set up your environment variables.');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    }

    toast.success('Password reset email sent! Check your inbox.');
  } catch (error: any) {
    console.error('Password reset error:', error);
    toast.error(error.message || 'Failed to send reset email');
    throw error;
  }
};

export const signInWithGoogle = async () => {
  if (isMockClient) {
    toast.error('Supabase is not configured. Please set up your environment variables.');
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      throw error;
    }

    toast.success('Redirecting to Google...');
    return data;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    toast.error(error.message || 'Failed to sign in with Google');
    throw error;
  }
};

export const signInWithGitHub = async () => {
  if (isMockClient) {
    toast.error('Supabase is not configured. Please set up your environment variables.');
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      toast.error(error.message || 'Failed to sign in with GitHub');
      throw error;
    }

    toast.success('Redirecting to GitHub...');
    return data;
  } catch (error: any) {
    console.error('GitHub sign-in error:', error);
    toast.error(error.message || 'Failed to sign in with GitHub');
    throw error;
  }
};

export const signOut = async () => {
  if (isMockClient) {
    useAuthStore.getState().setUser(null);
    toast.success('Successfully signed out');
    return;
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    useAuthStore.getState().setUser(null);
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Sign-out error:', error);
    toast.error(error.message || 'Failed to sign out');
    throw error;
  }
};

const createOrUpdateUser = async (supabaseUser: any) => {
  try {
    const userData: Omit<User, 'created_at'> = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || 
            supabaseUser.user_metadata?.display_name ||
            supabaseUser.email!.split('@')[0],
      avatar_url: supabaseUser.user_metadata?.avatar_url || 
                  supabaseUser.user_metadata?.picture || 
                  undefined,
      provider: supabaseUser.app_metadata?.provider || 'email',
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Database error when creating/updating user:', error);
      throw error;
    }

    useAuthStore.getState().setUser(data);
    return data;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

export const initializeAuth = () => {
  // If using mock client, just set loading to false and return immediately
  if (isMockClient) {
    console.warn('Supabase not configured - running in demo mode');
    // Immediately set loading to false and clear user
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setUser(null);
    return () => {}; // Return empty unsubscribe function
  }

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    useAuthStore.getState().setLoading(true);

    try {
      if (session?.user) {
        // Check if user exists in our users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching user:', fetchError);
          throw fetchError;
        }

        if (!existingUser) {
          // Create new user if doesn't exist
          console.log('Creating new user in database');
          await createOrUpdateUser(session.user);
        } else {
          // Update existing user data
          console.log('User found in database:', existingUser.email);
          useAuthStore.getState().setUser(existingUser);
        }
      } else {
        console.log('No session, clearing user');
        useAuthStore.getState().setUser(null);
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      useAuthStore.getState().setUser(null);
      toast.error('Authentication error occurred');
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  });

  return () => subscription.unsubscribe();
};