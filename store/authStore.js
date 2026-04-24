import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      progress: null,
      score: null,
      skill: null,
      isAuthenticated: false,

      setAuth: (user, token, progress, score, skill) => {
        if (typeof window !== 'undefined' && token) {
          localStorage.setItem('genois_token', token);
        }
        set({
          user,
          token,
          progress: progress || null,
          score: score || null,
          skill: skill || null,
          isAuthenticated: true,
        });
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : updates })),

      updateProgress: (updates) =>
        set((state) => ({ progress: state.progress ? { ...state.progress, ...updates } : updates })),

      updateScore: (updates) =>
        set((state) => ({ score: state.score ? { ...state.score, ...updates } : updates })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('genois_token');
          localStorage.removeItem('genois_auth');
        }
        set({
          user: null,
          token: null,
          progress: null,
          score: null,
          skill: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'genois_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        progress: state.progress,
        score: state.score,
        skill: state.skill,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
