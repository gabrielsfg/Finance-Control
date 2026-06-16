"use client";

import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/lib/stores/uiStore";
import { useEffect } from "react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [theme]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};
