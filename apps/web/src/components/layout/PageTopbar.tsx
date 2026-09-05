"use client";

import { Sun, Moon, Plus, FileUp } from "lucide-react";
import type { ReactNode } from "react";
import { useUIStore } from "@/lib/stores/uiStore";
import { useHeaderStore } from "@/lib/stores/headerStore";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * Controls belonging to a flow that has taken over the page — import review, say —
   * rendered in the primary-action slot on the far right so the title and the buttons
   * land exactly where every other page puts them.
   *
   * They REPLACE the store-driven controls rather than stacking with them: the header
   * store still holds the underlying page's verbs, and a review screen offering "Nova
   * transação" and the transaction filters would be offering dead ends. Theme and
   * notifications stay — those belong to the shell, not to the page.
   */
  actions?: ReactNode;
};

export function PageTopbar({ title, subtitle, actions }: Props) {
  const { theme, toggleTheme } = useUIStore();
  const { novaLabel, onNovaClick, filterNode, showSearch, onImportClick } = useHeaderStore();
  const showStoreActions = !actions;

  return (
    <header className="flex items-end gap-5 pt-[26px] pb-[30px]">
      <div>
        <h1 className="font-display font-bold text-[var(--text)] text-[clamp(22px,2.5vw,30px)] tracking-[-0.025em] leading-[1.02]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-[6px] text-[14px]" style={{ color: "var(--text-sub)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {showStoreActions && showSearch && <GlobalSearch />}

        {showStoreActions && onImportClick && (
          <button
            onClick={onImportClick}
            title="Importar extrato"
            className="flex h-[42px] items-center gap-2 rounded-[13px] border px-3 text-[13px] font-medium transition-all hover:-translate-y-[1px]"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)", color: "var(--text-sub)" }}
          >
            <FileUp size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Importar</span>
          </button>
        )}

        {showStoreActions && filterNode}

        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          title="Alternar tema"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] border transition-all hover:-translate-y-[1px]"
          style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
        >
          {theme === "dark" ? (
            <Sun size={19} strokeWidth={1.7} className="text-[var(--text)]" />
          ) : (
            <Moon size={19} strokeWidth={1.7} className="text-[var(--text)]" />
          )}
        </button>

        <NotificationBell />

        {actions}

        {showStoreActions && onNovaClick && (
          <button
            onClick={onNovaClick}
            className="inline-flex h-[42px] items-center gap-2 rounded-[13px] px-[18px] text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
            style={{
              background: "var(--brand-cobalt)",
              boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)",
            }}
          >
            <Plus size={17} strokeWidth={2} />
            {novaLabel}
          </button>
        )}
      </div>
    </header>
  );
}
