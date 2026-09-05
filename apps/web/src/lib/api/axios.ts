import axios from "axios";
import { clearPersistedQueryCache } from "@/lib/queryClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/**
 * Query-string builder for array parameters.
 *
 * Axios emits `tagIds[]=1&tagIds[]=2`. ASP.NET Core's model binder looks for the key
 * `tagIds` (repeated) or `tagIds[0]`, finds neither, and binds an EMPTY list — so the
 * filter is dropped with no error anywhere: the request succeeds, the response is just
 * unfiltered. Every multi-select filter in the app went out this way, which is why they
 * appeared to do nothing individually and nothing when combined.
 *
 * Repeated bare keys are what the binder wants, and they are equivalent for scalars, so
 * this is safe for every call site.
 */
function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    search.append(key, value instanceof Date ? value.toISOString() : String(value));
  };

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) value.forEach((item) => append(key, item));
    else append(key, value);
  }

  return search.toString();
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Required so the browser sends the HttpOnly refresh-token cookie
  // on cross-origin requests to the API domain.
  withCredentials: true,
  paramsSerializer: { serialize: serializeParams },
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
// `/legal` is here for the same reason even though it is not an auth route: it is
// anonymous, it is linked straight from the registration form, and a visitor reading
// the terms must never be logged out by a refresh attempted on their behalf.
function isAuthEndpoint(url: string): boolean {
  return (
    url.includes("/legal") ||
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

    // Auth routes are excluded from the recovery below, and not merely because
    // refreshing before /user/refresh would be circular: `logout()` itself issues a
    // request, so a 401 on that request re-enters this handler, which calls
    // `logout()` again, which requests again — forever. Every level sits awaiting
    // the next, so the redirect at the end of `logout()` is never reached and the
    // user is left on a dead session that never resolves into the login screen.
    const isRecoverable =
      error.response?.status === 401 &&
      // Absent on errors raised before a request was built; the retry below writes
      // to it, so it has to be present rather than merely optional-chained.
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url ?? "");

    if (isRecoverable) {
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
