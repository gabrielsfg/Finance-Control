"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { AssistantLauncher } from "@/features/assistant/components/AssistantLauncher";
import { useUIStore } from "@/lib/stores/uiStore";
import { useEffect } from "react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useUIStore();
  const pathname = usePathname();

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
      <main className="min-w-0 flex-1 overflow-y-auto">
        {/* Re-keying on the route replays the entrance on every navigation.
            Opacity only — a transform here would become the containing block
            for the drawers' `position: fixed` panels while it runs. Fill mode is
            `backwards`, not `both`: a held opacity animation keeps a stacking context
            on this wrapper for good, which sank every page drawer (z-50) beneath the
            assistant launcher (z-30) — it sat on top of their bottom-right submit
            buttons and swallowed the clicks. Important because `.anim-fade` is
            unlayered CSS and would otherwise beat the utility. */}
        <div key={pathname} className="anim-fade h-full [animation-fill-mode:backwards]!">
          {children}
        </div>
      </main>
      <AssistantLauncher />
    </div>
  );
};
