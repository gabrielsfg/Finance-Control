import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";
import { clearPersistedQueryCache } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/types/auth.types";
import { RETURN_TO_PARAM } from "@/lib/utils/returnTo";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user?: AuthUser) => void;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
};

// Re-entry guard. `logout()` issues a request of its own, and anything that reacts
// to that request failing by logging out again would recurse without ever reaching
// the redirect. Module scope, not store state, because it must not be persisted.
let loggingOut = false;

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
        if (loggingOut) return;
        loggingOut = true;

        // Tear the local session down first. Whatever the request below does, the app
        // must stop presenting itself as authenticated — otherwise a failed logout
        // leaves every query still firing against a session that no longer works.
        clearPersistedQueryCache();
        set({ accessToken: null, user: null, isAuthenticated: false });

        try {
          await authApi.logout();
        } catch {
          // Expected whenever the session is already dead server-side or the API is
          // unreachable. The redirect below is not conditional on it.
        }

        // `expired` tells the middleware not to bounce us straight back into the app:
        // the refresh-token cookie can outlive this call (request never landed, API
        // down), and without the flag a dead session traps the user in a redirect loop.
        //
        // A session that dies on the MCP consent page keeps its place: the AI client is
        // waiting on that exact URL, and landing on the dashboard after signing back in
        // would silently abandon the connection. Everywhere else a voluntary logout
        // looks the same as an expired one, so nothing else is carried over.
        const { pathname, search } = window.location;
        const returnTo = pathname.startsWith("/oauth/")
          ? `&${RETURN_TO_PARAM}=${encodeURIComponent(pathname + search)}`
          : "";
        window.location.href = `/login?expired=1${returnTo}`;
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
