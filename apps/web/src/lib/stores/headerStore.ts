import { create } from "zustand";
import type { ReactNode } from "react";

type HeaderState = {
  novaLabel: string | null;
  onNovaClick: (() => void) | null;
  filterNode: ReactNode | null;
  showSearch: boolean;
  setNova: (label: string, onClick: () => void) => void;
  clearNova: () => void;
  setFilterNode: (node: ReactNode | null) => void;
  setShowSearch: (v: boolean) => void;
};

export const useHeaderStore = create<HeaderState>()((set) => ({
  novaLabel: null,
  onNovaClick: null,
  filterNode: null,
  showSearch: false,
  setNova: (label, onClick) => set({ novaLabel: label, onNovaClick: onClick }),
  clearNova: () => set({ novaLabel: null, onNovaClick: null }),
  setFilterNode: (node) => set({ filterNode: node }),
  setShowSearch: (v) => set({ showSearch: v }),
}));
