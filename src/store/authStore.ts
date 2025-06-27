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
    
    // Force a re-render by updating the store
    if (user) {
      console.log('✅ User successfully set in store');
    } else {
      console.log('🚪 User cleared from store');
    }
  },
  setLoading: (loading) => {
    console.log('⏳ Setting loading:', loading);
    set({ loading });
  },
}));