"use client";

import { Plus, ShoppingBag, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/lib/types/profile.types";

const PRIORITY_CONFIG = {
  High: { label: "Alta", className: "bg-red/12 text-red" },
  Medium: { label: "Média", className: "bg-orange/12 text-orange" },
  Low: { label: "Baixa", className: "bg-surface2 text-text-muted" },
};

type Props = { items: WishlistItem[] };

export const WishlistCard = ({ items }: Props) => (
  <div className="border-border bg-surface rounded-xl border p-5">
    <SectionHeader
      title="Wishlist"
      subtitle={`${items.length} item${items.length !== 1 ? "s" : ""}`}
      actionLabel="Adicionar"
      action={() => {}}
    />

    {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="bg-surface2 mb-3 flex h-11 w-11 items-center justify-center rounded-[12px]">
          <ShoppingBag size={20} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-text text-[14px] font-medium">Nenhum item na wishlist</p>
        <p className="text-text-muted mt-1 text-[13px]">Adicione itens que deseja comprar no futuro.</p>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const priority = PRIORITY_CONFIG[item.priority];
          const hasCurrentPrice = item.currentPrice !== null;
          const pct = hasCurrentPrice ? Math.min((item.targetPrice / item.currentPrice!) * 100, 100) : 0;
          const reached = hasCurrentPrice && item.currentPrice! <= item.targetPrice;

          return (
            <div key={item.id} className="border-border rounded-xl border p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-text truncate text-[14px] font-medium">{item.name}</p>
                    {item.url && <ExternalLink size={12} className="text-text-muted shrink-0" />}
                  </div>
                  <p className="text-text-muted mt-0.5 text-[12px]">Meta: {formatCurrency(item.targetPrice / 100)}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", priority.className)}>
                  {priority.label}
                </span>
              </div>

              {hasCurrentPrice && (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-text-muted">Preço atual: {formatCurrency(item.currentPrice! / 100)}</span>
                    {reached ? (
                      <span className="text-green font-medium">✓ Meta atingida!</span>
                    ) : (
                      <span className="text-text-muted">{pct.toFixed(0)}%</span>
                    )}
                  </div>
                  <ProgressBar value={item.targetPrice} max={item.currentPrice!} height={4} color={reached ? "#00C98D" : "#4A9EFF"} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);
