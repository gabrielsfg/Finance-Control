"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "@/lib/stores/uiStore";
import { useEffect } from "react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
