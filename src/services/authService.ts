import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';

export const signInWithGoogle = async () => {
  try {
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

    if (error) throw error;

    toast.success('Redirecting to Google...');
    return data;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    toast.error(error.message || 'Failed to sign in with Google');
    throw error;
  }
};

export const signInWithGitHub = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) throw error;

    toast.success('Redirecting to GitHub...');
    return data;
  } catch (error: any) {
    console.error('GitHub sign-in error:', error);
    toast.error(error.message || 'Failed to sign in with GitHub');
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

    if (error) throw error;

    useAuthStore.getState().setUser(data);
    return data;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

export const initializeAuth = () => {
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          throw fetchError;
        }

        if (!existingUser) {
          // Create new user if doesn't exist
          await createOrUpdateUser(session.user);
        } else {
          // Update existing user data
          useAuthStore.getState().setUser(existingUser);
        }
      } else {
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