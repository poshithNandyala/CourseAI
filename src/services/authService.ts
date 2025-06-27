import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';

export const signInWithGoogle = async () => {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
      toast.error('Supabase configuration is missing. Please check your environment variables.');
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      throw error;
    }

    toast.success('Redirecting to Google...');
    return data;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Invalid login credentials')) {
      toast.error('Google authentication failed. Please try again.');
    } else if (error.message?.includes('network')) {
      toast.error('Network error. Please check your connection and try again.');
    } else if (error.message?.includes('Supabase not configured')) {
      toast.error('Authentication service not configured. Please contact support.');
    } else {
      toast.error(error.message || 'Failed to sign in with Google');
    }
    
    throw error;
  }
};

export const signInWithGitHub = async () => {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
      toast.error('Supabase configuration is missing. Please check your environment variables.');
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      throw error;
    }

    toast.success('Redirecting to GitHub...');
    return data;
  } catch (error: any) {
    console.error('GitHub sign-in error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Invalid login credentials')) {
      toast.error('GitHub authentication failed. Please try again.');
    } else if (error.message?.includes('network')) {
      toast.error('Network error. Please check your connection and try again.');
    } else if (error.message?.includes('Supabase not configured')) {
      toast.error('Authentication service not configured. Please contact support.');
    } else {
      toast.error(error.message || 'Failed to sign in with GitHub');
    }
    
    throw error;
  }
};

export const signOut = async () => {
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
  // Check if Supabase is configured before initializing
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    console.warn('Supabase not configured, skipping auth initialization');
    useAuthStore.getState().setLoading(false);
    return () => {}; // Return empty cleanup function
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
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
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
      
      // Only show error toast if it's not a configuration issue
      if (!error.message?.includes('Supabase not configured')) {
        toast.error('Authentication error occurred');
      }
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  });

  return () => subscription.unsubscribe();
};