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
  // setFilterNode is stable (Zustand), so this is safe to include in deps
  const setFilterNode = useHeaderStore.getState().setFilterNode;

  useEffect(() => {
    setFilterNode(node);
  });

  useEffect(() => {
    return () => setFilterNode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function usePageSearch(): void;
export function usePageSearch(onChange: (query: string) => void, placeholder?: string): void;
export function usePageSearch(onChange?: (query: string) => void, placeholder?: string): void {
  const setShowSearch = useHeaderStore((s) => s.setShowSearch);
  const setLocalSearch = useHeaderStore((s) => s.setLocalSearch);
  const clearLocalSearch = useHeaderStore((s) => s.clearLocalSearch);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (onChangeRef.current) {
      setLocalSearch((q) => onChangeRef.current!(q), placeholder);
      return () => clearLocalSearch();
    } else {
      setShowSearch(true);
      return () => setShowSearch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function usePageImport(onClick: () => void) {
  const setImport = useHeaderStore((s) => s.setImport);
  const clearImport = useHeaderStore((s) => s.clearImport);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    setImport(() => onClickRef.current());
    return () => clearImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
