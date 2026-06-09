import axios from "axios";
import { clearPersistedQueryCache } from "@/lib/queryClient";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  // Required so the browser sends the HttpOnly refresh-token cookie
  // on cross-origin requests to the API domain.
  withCredentials: true,
});

// Inject access token on every request
api.interceptors.request.use((config) => {
  // Import lazily to avoid circular dependency (store → api → store)
  const { useAuthStore } = require("@/lib/stores/authStore");
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — attempt refresh via HttpOnly cookie, retry once, then logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // The refresh token travels as an HttpOnly cookie — no body needed.
        // withCredentials ensures the browser attaches it automatically.
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/user/refresh`,
          {},
          { withCredentials: true },
        );

        const { useAuthStore } = require("@/lib/stores/authStore");
        useAuthStore.getState().setAccessToken(data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        const { useAuthStore } = require("@/lib/stores/authStore");
        clearPersistedQueryCache();
        await useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
