"use client";

import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";
import type { AnalyticsFilter } from "./types/filters.types";

export type AnalyticsFilterMode = "expenses" | "investments" | "none";

type AnalyticsFilterContextValue = {
  filter: AnalyticsFilter;
  setFilter: Dispatch<SetStateAction<AnalyticsFilter>>;
  mode: AnalyticsFilterMode;
  /** Date-range bounds derived from the active filter (ISO `YYYY-MM-DD`). */
  start: string;
  finish: string;
  /** `filter.tagIds` collapsed to `undefined` when empty, for query params. */
  activeTagIds: number[] | undefined;
};

const AnalyticsFilterContext = createContext<AnalyticsFilterContextValue | null>(null);

export function AnalyticsFilterProvider({
  value,
  children,
}: {
  value: AnalyticsFilterContextValue;
  children: ReactNode;
}) {
  return (
    <AnalyticsFilterContext.Provider value={value}>{children}</AnalyticsFilterContext.Provider>
  );
}

export function useAnalyticsFilter(): AnalyticsFilterContextValue {
  const ctx = useContext(AnalyticsFilterContext);
  if (!ctx) {
    throw new Error("useAnalyticsFilter must be used within the analytics layout");
  }
  return ctx;
}
