import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

type UIState = {
  sidebarCollapsed: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "dark",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleTheme: () =>
        set((s) => ({
          theme: s.theme === "dark" ? "light" : "dark",
        })),
    }),
    { name: "controle-ui" },
  ),
);
