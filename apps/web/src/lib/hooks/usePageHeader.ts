"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useHeaderStore } from "@/lib/stores/headerStore";

export function usePageNova(label: string, onClick: () => void) {
  const setNova = useHeaderStore((s) => s.setNova);
  const clearNova = useHeaderStore((s) => s.clearNova);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    setNova(label, () => onClickRef.current());
    return () => clearNova();
    // label intentionally only: re-register when label changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);
}

export function usePageFilter(node: ReactNode) {
  const setFilterNode = useHeaderStore((s) => s.setFilterNode);

  // Update on every render — Header reads from store, minimal overhead
  useEffect(() => {
    setFilterNode(node);
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => setFilterNode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function usePageSearch() {
  const setShowSearch = useHeaderStore((s) => s.setShowSearch);
  useEffect(() => {
    setShowSearch(true);
    return () => setShowSearch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
