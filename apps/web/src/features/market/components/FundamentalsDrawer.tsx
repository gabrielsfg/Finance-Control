"use client";

import { useRef } from "react";
import { X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FundamentalsPanel } from "@/features/market/components/FundamentalsPanel";

type Props = {
  ticker: string | null;
  assetName?: string;
  onClose: () => void;
};

export const FundamentalsDrawer = ({ ticker, assetName, onClose }: Props) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const open = !!ticker;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer */}
      <div
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="shrink-0 text-[var(--brand-accent)]" />
              <p className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{ticker ?? "—"}</p>
            </div>
            {assetName && <p className="mt-0.5 truncate text-[12px] text-[var(--text-sub)]">{assetName}</p>}
          </div>
          <button onClick={onClose} className="mt-0.5 shrink-0 text-[var(--text-sub)] transition-colors hover:text-[var(--text)]">
            <X size={18} />
          </button>
        </div>

        {/* Content — reuses the inline panel without its outer card chrome */}
        <div className="flex-1 overflow-y-auto">
          {ticker && <FundamentalsPanel ticker={ticker} bare />}
        </div>
      </div>
    </>
  );
};
