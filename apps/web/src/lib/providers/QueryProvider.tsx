"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";
import { getQueryClient, PERSIST_CACHE_KEY, PERSIST_BUSTER } from "@/lib/queryClient";

// Only reference/master data is persisted — it rarely changes, is cheap to
// re-validate in the background, and lets these pages paint instantly on reload.
// sessionStorage is used instead of localStorage so the cache is automatically
// cleared when the tab closes, avoiding stale financial data on shared machines.
const PERSISTED_QUERY_ROOTS = new Set([
  "categories",
  "subcategories",
  "tags",
  "accounts",
  "investments",
]);

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(getQueryClient);

  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
      key: PERSIST_CACHE_KEY,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const root = query.queryKey[0];
            return (
              query.state.status === "success" &&
              typeof root === "string" &&
              PERSISTED_QUERY_ROOTS.has(root)
            );
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
