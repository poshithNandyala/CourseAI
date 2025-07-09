import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTheme = create()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => {
        const newTheme = !get().isDark;
        set({ isDark: newTheme });
        updateDocumentTheme(newTheme);
      },
      setTheme: (isDark) => {
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

const updateDocumentTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

