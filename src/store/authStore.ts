import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  setUser: (user) => {
    console.log('Setting user:', user?.email || 'null');
    set({ user });
  },
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => {
    console.log('Setting loading:', loading);
    set({ loading });
  },
}));