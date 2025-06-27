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
    console.log('👤 Setting user:', user?.email || 'null');
    set({ user });
  },
  setLoading: (loading) => {
    console.log('⏳ Setting loading:', loading);
    set({ loading });
  },
}));