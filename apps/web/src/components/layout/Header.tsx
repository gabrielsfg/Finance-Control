"use client";

import { Bell, Plus, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/lib/stores/uiStore";
import { GlobalSearch } from "./GlobalSearch";

export const Header = () => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <header className="border-border bg-surface flex h-14 shrink-0 items-center gap-3 border-b px-6">
      {/* Search */}
      <GlobalSearch />

      <div className="flex items-center gap-2">
        {/* Date badge */}
        <span className="text-text-muted hidden font-mono text-[13px] sm:block">
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun size={15} strokeWidth={1.75} />
          ) : (
            <Moon size={15} strokeWidth={1.75} />
          )}
        </button>

        {/* Notifications */}
        <button className="text-text-sub hover:bg-surface2 hover:text-text relative flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors">
          <Bell size={15} strokeWidth={1.75} />
          <span className="bg-green absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" />
        </button>

        {/* CTA */}
        <Link
          href="/transactions?new=1"
          className="bg-green hover:bg-green/90 font-600 inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-black transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
          <span className="hidden sm:inline">Nova</span>
        </Link>
      </div>
    </header>
  );
};
