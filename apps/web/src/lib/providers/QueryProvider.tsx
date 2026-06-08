"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";
import { getQueryClient, PERSIST_CACHE_KEY, PERSIST_BUSTER } from "@/lib/queryClient";

// Only reference/master data is persisted to disk — it rarely changes, is cheap
// to re-validate in the background, and lets these pages paint instantly on
// reload. Volatile or PII-heavy data (transactions, dashboard, analytics,
// profile) is intentionally left out so it never lands in localStorage.
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
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: PERSIST_CACHE_KEY,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h — drop snapshots older than a day
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
