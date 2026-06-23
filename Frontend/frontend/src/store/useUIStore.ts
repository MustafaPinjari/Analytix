import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  layoutDensity: 'comfortable' | 'compact';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLayoutDensity: (density: 'comfortable' | 'compact') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'light',
      layoutDensity: 'comfortable',
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(nextTheme);
      },
      setTheme: (theme) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        set({ theme });
      },
      setLayoutDensity: (density) => set({ layoutDensity: density }),
    }),
    {
      name: 'analytix-ui-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme color class to HTML element on rehydration
        if (state) {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(state.theme);
        }
      },
    }
  )
);
