import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => {
    console.log('👤 Setting user in store:', user?.email || 'null');
    set({ user });
    
    // Log the current state after setting
    const currentState = get();
    console.log('📊 Current auth state:', {
      hasUser: !!currentState.user,
      userEmail: currentState.user?.email,
      loading: currentState.loading
    });
  },
  setLoading: (loading) => {
    console.log('⏳ Setting loading state:', loading);
    set({ loading });
  },
}));