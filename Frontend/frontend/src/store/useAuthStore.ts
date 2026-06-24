import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setOrganization: (orgId: string, role?: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true, error: null }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, error: null }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      setOrganization: (orgId, role) => set((state) => {
        if (!state.user) return {};
        return {
          user: {
            ...state.user,
            organizationId: orgId,
            ...(role ? { role } : {}),
          }
        };
      }),
    }),
    {
      name: 'analytix-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
