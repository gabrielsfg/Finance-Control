import { QueryClient } from "@tanstack/react-query";

// localStorage key under which the dehydrated React Query cache is persisted.
export const PERSIST_CACHE_KEY = "controle-query-cache";

// Bump when the shape of any persisted query changes so stale snapshots are
// discarded on the next load instead of hydrating incompatible data.
export const PERSIST_BUSTER = "v1";

let browserQueryClient: QueryClient | undefined;

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        // gcTime must outlive maxAge of the persister, otherwise persisted
        // queries get garbage-collected and can't be restored.
        gcTime: 1000 * 60 * 60 * 24,
        retry: 1,
      },
    },
  });

// Singleton on the browser, fresh on the server (SSR has no shared client).
export const getQueryClient = (): QueryClient => {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
};

// Wipe both the in-memory and the persisted cache. Called on login/logout so
// one user's financial data never outlives their session or bleeds into the
// next account on a shared machine.
export const clearPersistedQueryCache = (): void => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PERSIST_CACHE_KEY);
  }
  browserQueryClient?.clear();
};
