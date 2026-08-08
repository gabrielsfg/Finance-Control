import axios from "axios";
import { clearPersistedQueryCache } from "@/lib/queryClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Required so the browser sends the HttpOnly refresh-token cookie
  // on cross-origin requests to the API domain.
  withCredentials: true,
});

// Singleton refresh promise — deduplicates concurrent refreshes so a burst of
// parallel requests (e.g. every query on a fresh page load) triggers exactly
// one /user/refresh call. Shared by the proactive (request) and reactive
// (401 response) paths below.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    // Raw axios (not the `api` instance) to avoid re-entering these interceptors.
    // The refresh token travels as an HttpOnly cookie — withCredentials sends it.
    refreshPromise = axios
      .post<{ accessToken: string }>(`${API_URL}/user/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token = res.data.accessToken;
        // Lazy import to avoid a circular dependency (store → api → store).
        const { useAuthStore } = require("@/lib/stores/authStore");
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Endpoints that carry no session of their own. Refreshing before them is pointless
// and, on a stale `isAuthenticated` flag, actively harmful: the failed refresh would
// log the visitor out mid-signup. `/user/login` also covers `/user/login/two-factor`,
// and `/user/verify-email` covers its `/resend`.
function isAuthEndpoint(url: string): boolean {
  return (
    url.includes("/user/refresh") ||
    url.includes("/user/login") ||
    url.includes("/user/register") ||
    url.includes("/user/logout") ||
    url.includes("/user/verify-email") ||
    url.includes("/user/forgot-password") ||
    url.includes("/user/reset-password")
  );
}

// Inject the access token on every request. On a fresh page load the token
// lives only in memory and is gone, so — rather than let every initial request
// 401 and then retry — we proactively refresh once (deduped) and attach the
// fresh token, so the first calls already succeed.
api.interceptors.request.use(async (config) => {
  const { useAuthStore } = require("@/lib/stores/authStore");
  const state = useAuthStore.getState();
  let token: string | null = state.accessToken;

  if (!token && state.isAuthenticated && !isAuthEndpoint(config.url ?? "")) {
    try {
      token = await refreshAccessToken();
    } catch {
      // Refresh failed — let the request go out and the 401 path below handle logout.
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — attempt refresh via HttpOnly cookie, retry once, then logout.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        const { useAuthStore } = require("@/lib/stores/authStore");
        clearPersistedQueryCache();
        await useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);
