import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";
import { clearPersistedQueryCache } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/types/auth.types";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user?: AuthUser) => void;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      login: (accessToken, user) => {
        clearPersistedQueryCache();
        set({ accessToken, user: user ?? null, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // logout even if API call fails
        }
        clearPersistedQueryCache();
        set({ accessToken: null, user: null, isAuthenticated: false });
      },

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "controle-auth",
      // Only persist the flag — tokens and PII stay in memory only.
      // On reload the 401→refresh flow silently restores the accessToken
      // using the HttpOnly refresh-token cookie sent automatically by the browser.
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
);
