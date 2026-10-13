import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth is the httpOnly `genois_token` cookie alone. Nothing writes the token
// to localStorage any more; this clears the copy older builds left behind so a
// script on the page cannot read it. The copy inside `genois_auth` is dropped
// by the persist migration below.
if (typeof window !== 'undefined') {
  try { localStorage.removeItem('genois_token'); } catch {}
}

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      progress: null,
      score: null,
      skill: null,
      isAuthenticated: false,

      // `token` is kept in memory for the signature's sake but never written to
      // localStorage and never persisted — callers pass null.
      setAuth: (user, token, progress, score, skill) => {
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
      // v1: `token` is no longer persisted. migrate() strips it from v0 state,
      // and persist re-saves the migrated state, erasing the stored copy.
      version: 1,
      migrate: (persisted) => {
        if (persisted && typeof persisted === 'object') {
          const { token, ...rest } = persisted;
          return rest;
        }
        return persisted;
      },
      partialize: (state) => ({
        user: state.user,
        progress: state.progress,
        score: state.score,
        skill: state.skill,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
