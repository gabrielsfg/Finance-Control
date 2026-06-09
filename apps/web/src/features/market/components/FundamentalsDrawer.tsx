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
        className={cn(
          "bg-surface fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue shrink-0" />
              <p className="font-display text-text text-[16px] font-semibold">{ticker ?? "—"}</p>
            </div>
            {assetName && <p className="text-text-muted mt-0.5 truncate text-[12px]">{assetName}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text mt-0.5 shrink-0 transition-colors">
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
