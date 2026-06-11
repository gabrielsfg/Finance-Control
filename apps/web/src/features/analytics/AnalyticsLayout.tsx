"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePageFilter } from "@/lib/hooks/usePageHeader";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { AnalyticsFilterProvider, type AnalyticsFilterMode } from "./AnalyticsFilterContext";
import type { AnalyticsFilter } from "./types/filters.types";
import { defaultFilter, buildDateRange } from "./utils/filterDates";

/** Maps the active analytics route to the filter mode its page expects. */
function modeForPath(pathname: string): AnalyticsFilterMode {
  const segment = pathname.split("/")[2] ?? ""; // "" → gastos (bare route)
  if (segment === "investimentos") return "investments";
  if (segment === "projecoes") return "none";
  if (segment === "economia") return "none"; // has its own budget/period selectors
  return "expenses"; // gastos + patrimonio
}

/**
 * Wraps every `/analytics/*` route. Owns the filter state so it survives
 * navigation between sub-pages, registers the header filter control, and
 * exposes the derived date range via context.
 */
export function AnalyticsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState<AnalyticsFilter>(defaultFilter());

  const mode = modeForPath(pathname);
  const { start, finish } = buildDateRange(filter);
  const activeTagIds = filter.tagIds.length > 0 ? filter.tagIds : undefined;

  usePageFilter(<AnalyticsFilters filter={filter} onChange={setFilter} mode={mode} />);

  return (
    <AnalyticsFilterProvider value={{ filter, setFilter, mode, start, finish, activeTagIds }}>
      {children}
    </AnalyticsFilterProvider>
  );
}
