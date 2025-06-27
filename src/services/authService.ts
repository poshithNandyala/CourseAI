import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return url && 
         key && 
         !url.includes('your_supabase_project_url') && 
         !key.includes('your_supabase_anon_key') &&
         url.startsWith('http');
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Demo mode: Please configure Supabase to enable authentication');
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Successfully signed in!');
    return data;
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Demo mode: Please configure Supabase to enable authentication');
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
      toast.error(error.message);
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
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Demo mode: Please configure Supabase to enable authentication');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Password reset email sent!');
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    toast.error('Demo mode: Please configure Supabase to enable authentication');
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
      toast.error(error.message);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signInWithGitHub = async () => {
  if (!isSupabaseConfigured()) {
    toast.error('Demo mode: Please configure Supabase to enable authentication');
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
      toast.error(error.message);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('GitHub sign-in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    
    useAuthStore.getState().setUser(null);
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Sign-out error:', error);
    toast.error('Failed to sign out');
    throw error;
  }
};

const createOrUpdateUser = async (supabaseUser: any): Promise<User> => {
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
      console.error('Database error:', error);
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
  console.log('🔐 Initializing authentication...');
  
  // If Supabase is not configured, set loading to false immediately
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured - running in demo mode');
    setTimeout(() => {
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setUser(null);
    }, 1000); // Brief delay to show loading screen
    return () => {}; // Return empty cleanup function
  }

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user');
    
    try {
      if (session?.user) {
        // Check if user exists in database
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
          console.log('👤 Creating new user in database');
          await createOrUpdateUser(session.user);
        } else {
          console.log('✅ User found in database:', existingUser.email);
          useAuthStore.getState().setUser(existingUser);
        }
      } else {
        console.log('🚪 No session, clearing user');
        useAuthStore.getState().setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      useAuthStore.getState().setUser(null);
      toast.error('Authentication error occurred');
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  });

  return () => subscription.unsubscribe();
};