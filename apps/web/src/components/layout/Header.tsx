"use client";

import { Bell, Plus, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/uiStore";

export const Header = () => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <header className="border-border bg-surface flex h-14 shrink-0 items-center gap-3 border-b px-6">
      {/* Search */}
      <div className="border-border bg-surface2 text-text-muted focus-within:border-green flex flex-1 items-center gap-2 rounded-[8px] border px-3 py-2 transition-colors">
        <Search size={14} strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar transações, contas..."
          className="text-text placeholder:text-text-muted flex-1 bg-transparent font-sans text-[14px] focus:outline-none"
        />
      </div>

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
        <Button size="sm" className="bg-green font-600 hover:bg-green/90 gap-1.5 text-black">
          <Plus size={14} strokeWidth={2} />
          <span className="hidden sm:inline">Nova</span>
        </Button>
      </div>
    </header>
  );
};
