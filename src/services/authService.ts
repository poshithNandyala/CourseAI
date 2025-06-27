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

// Create demo user for testing
const createDemoUser = (email: string, name?: string, provider: 'email' | 'google' | 'github' = 'email'): User => {
  const demoUser: User = {
    id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
    email,
    name: name || email.split('@')[0],
    avatar_url: provider === 'google' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' : undefined,
    provider,
    created_at: new Date().toISOString(),
  };
  
  // Store in localStorage for persistence
  localStorage.setItem('demo_user', JSON.stringify(demoUser));
  console.log('💾 Demo user stored:', demoUser.email);
  return demoUser;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    // Demo mode - simulate successful login
    const demoUser = createDemoUser(email);
    useAuthStore.getState().setUser(demoUser);
    toast.success('Successfully signed in! (Demo mode)');
    return { user: demoUser, session: null };
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

    if (data.user) {
      // Create or update user in our database
      await createOrUpdateUser(data.user);
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
    // Demo mode - simulate successful signup
    const demoUser = createDemoUser(email, name);
    useAuthStore.getState().setUser(demoUser);
    toast.success('Account created successfully! (Demo mode)');
    return { user: demoUser, session: null };
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
    } else if (data.user) {
      await createOrUpdateUser(data.user);
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
    toast.success('Password reset email sent! (Demo mode)');
    return;
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
    // Demo mode - simulate Google login
    console.log('🔄 Demo Google login starting...');
    const demoUser = createDemoUser('demo@google.com', 'Google User', 'google');
    
    // Set user immediately
    useAuthStore.getState().setUser(demoUser);
    console.log('✅ Demo Google user set in store');
    
    toast.success('Successfully signed in with Google! (Demo mode)');
    return { user: demoUser, session: null };
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
    // Demo mode - simulate GitHub login
    console.log('🔄 Demo GitHub login starting...');
    const demoUser = createDemoUser('demo@github.com', 'GitHub User', 'github');
    
    // Set user immediately
    useAuthStore.getState().setUser(demoUser);
    console.log('✅ Demo GitHub user set in store');
    
    toast.success('Successfully signed in with GitHub! (Demo mode)');
    return { user: demoUser, session: null };
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
    
    // Clear demo user from localStorage
    localStorage.removeItem('demo_user');
    console.log('🧹 Demo user cleared from localStorage');
    
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
  
  // If Supabase is not configured, check for demo user
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured - running in demo mode');
    
    // Check for existing demo user
    const demoUserData = localStorage.getItem('demo_user');
    if (demoUserData) {
      try {
        const demoUser = JSON.parse(demoUserData);
        console.log('✅ Found demo user:', demoUser.email);
        useAuthStore.getState().setUser(demoUser);
      } catch (error) {
        console.error('Error parsing demo user:', error);
        localStorage.removeItem('demo_user');
      }
    }
    
    setTimeout(() => {
      useAuthStore.getState().setLoading(false);
    }, 500);
    
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