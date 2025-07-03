import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => {
        const newTheme = !get().isDark;
        set({ isDark: newTheme });
        updateDocumentTheme(newTheme);
      },
      setTheme: (isDark: boolean) => {
        set({ isDark });
        updateDocumentTheme(isDark);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentTheme(state.isDark);
        }
      },
    }
  )
);

const updateDocumentTheme = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};