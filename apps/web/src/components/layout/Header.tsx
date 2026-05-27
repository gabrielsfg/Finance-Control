"use client";

import { Bell, Plus, Sun, Moon, PanelLeft, FileUp } from "lucide-react";
import { useUIStore } from "@/lib/stores/uiStore";
import { useHeaderStore } from "@/lib/stores/headerStore";
import { GlobalSearch } from "./GlobalSearch";

export const Header = () => {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { novaLabel, onNovaClick, filterNode, showSearch, onImportClick } = useHeaderStore();

  return (
    <header className="border-border bg-surface flex h-[58px] shrink-0 items-center gap-3 border-b px-4">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        title="Alternar sidebar"
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] transition-colors"
        aria-label="Alternar sidebar"
      >
        <PanelLeft size={17} strokeWidth={1.75} />
      </button>

      {/* Search — only on pages that opt in */}
      {showSearch && <GlobalSearch />}

      <div className="ml-auto flex items-center gap-2">
        {/* Import button — shown only on pages that opt in */}
        {onImportClick && (
          <button
            onClick={onImportClick}
            title="Importar extrato"
            className="text-text-sub hover:bg-surface2 hover:text-text flex h-9 items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] font-medium transition-colors"
          >
            <FileUp size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Importar</span>
          </button>
        )}

        {/* Page filter slot */}
        {filterNode}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Alternar tema"
          className="text-text-sub hover:bg-surface2 hover:text-text flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun size={16} strokeWidth={1.75} />
          ) : (
            <Moon size={16} strokeWidth={1.75} />
          )}
        </button>

        {/* Notifications */}
        <button title="Notificações" className="text-text-sub hover:bg-surface2 hover:text-text relative flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors">
          <Bell size={16} strokeWidth={1.75} />
          <span className="bg-green absolute top-2 right-2 h-1.5 w-1.5 rounded-full" />
        </button>

        {/* Nova CTA — shown only when a page registers it */}
        {onNovaClick && (
          <button
            onClick={onNovaClick}
            className="bg-green hover:bg-green/90 font-600 inline-flex h-9 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] font-medium text-black transition-colors"
          >
            <Plus size={15} strokeWidth={2} />
            <span className="hidden sm:inline">{novaLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};
