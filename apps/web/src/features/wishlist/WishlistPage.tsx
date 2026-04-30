"use client";

import { useState } from "react";
import { Loader2, Plus, ShoppingBag, ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/features/wishlist/hooks/useWishlist";
import type { WishlistItem } from "@/lib/types/profile.types";

const PRIORITY_CONFIG = {
  High: { label: "Alta", className: "bg-red/12 text-red" },
  Medium: { label: "Média", className: "bg-orange/12 text-orange" },
  Low: { label: "Baixa", className: "bg-surface2 text-text-muted" },
};

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

// ── Price evolution tooltip ──────────────────────────────────────────────────
const PriceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-1.5 shadow-md">
      <p className="text-text-muted mb-0.5 text-[11px]">{label}</p>
      <p className="font-money text-text text-[12px]">{formatCurrency(payload[0].value / 100)}</p>
    </div>
  );
};

// ── Single item card ──────────────────────────────────────────────────────────
const WishlistItemCard = ({ item }: { item: WishlistItem }) => {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_CONFIG[item.priority];

  const hasCurrentPrice = item.currentPrice !== null;
  const reached = hasCurrentPrice && item.currentPrice! <= item.targetPrice;
  const pricePct = hasCurrentPrice
    ? Math.min((item.targetPrice / item.currentPrice!) * 100, 100)
    : 0;

  const firstPrice = item.priceHistory[0]?.price ?? item.currentPrice;
  const lastPrice = item.currentPrice ?? item.priceHistory.at(-1)?.price;
  const priceDrop =
    firstPrice && lastPrice ? firstPrice - lastPrice : null;
  const priceDropPct =
    firstPrice && priceDrop ? (priceDrop / firstPrice) * 100 : null;

  const chartData = item.priceHistory.map((h) => ({
    label: new Date(h.date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    price: h.price,
  }));

  return (
    <div className="border-border bg-surface rounded-xl border overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-surface2/40 flex w-full items-start gap-3 p-4 text-left transition-colors"
      >
        <div className="flex flex-1 min-w-0 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-text truncate text-[14px] font-medium">{item.name}</p>
                {item.url && <ExternalLink size={12} className="text-text-muted shrink-0" />}
              </div>
              {item.notes && (
                <p className="text-text-muted mt-0.5 truncate text-[12px]">{item.notes}</p>
              )}
            </div>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", priority.className)}>
              {priority.label}
            </span>
          </div>

          {/* Price row */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-text-muted text-[11px]">Meta</p>
              <p className="font-money text-text text-[13px]">{formatCurrency(item.targetPrice / 100)}</p>
            </div>
            {hasCurrentPrice && (
              <div>
                <p className="text-text-muted text-[11px]">Atual</p>
                <p className={cn("font-money text-[13px]", reached ? "text-green" : "text-text")}>
                  {formatCurrency(item.currentPrice! / 100)}
                </p>
              </div>
            )}
            {priceDrop !== null && priceDrop > 0 && priceDropPct !== null && (
              <div className="ml-auto flex items-center gap-1">
                <TrendingDown size={13} className="text-green" />
                <span className="text-green text-[12px] font-medium">
                  -{priceDropPct.toFixed(1)}% desde o início
                </span>
              </div>
            )}
            {priceDrop !== null && priceDrop < 0 && priceDropPct !== null && (
              <div className="ml-auto flex items-center gap-1">
                <TrendingUp size={13} className="text-red" />
                <span className="text-red text-[12px] font-medium">
                  +{Math.abs(priceDropPct).toFixed(1)}% desde o início
                </span>
              </div>
            )}
          </div>

          {/* Progress toward target */}
          {hasCurrentPrice && (
            <div className="mt-1">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-text-muted">
                  {reached ? "Meta atingida!" : `${pricePct.toFixed(0)}% do preço-meta`}
                </span>
                {!reached && (
                  <span className="text-text-muted">
                    Faltam {formatCurrency((item.currentPrice! - item.targetPrice) / 100)}
                  </span>
                )}
              </div>
              <ProgressBar
                value={item.targetPrice}
                max={item.currentPrice!}
                height={4}
                color={reached ? "#00C98D" : "#4A9EFF"}
              />
            </div>
          )}
        </div>
      </button>

      {/* Price evolution chart — expandable */}
      {expanded && chartData.length > 0 && (
        <div className="border-border border-t px-4 pb-4 pt-3">
          <p className="text-text-muted mb-3 text-[12px] font-medium uppercase tracking-[0.06em]">
            Evolução de Preço
          </p>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A9EFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4A9EFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<PriceTooltip />} />
                <ReferenceLine
                  y={item.targetPrice}
                  stroke="var(--green)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#4A9EFF"
                  strokeWidth={2}
                  fill={`url(#grad-${item.id})`}
                  dot={{ r: 3, fill: "#4A9EFF" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-text-muted mt-1 text-[11px]">
            Linha verde = preço-meta ({formatCurrency(item.targetPrice / 100)})
          </p>
        </div>
      )}

      {expanded && chartData.length === 0 && (
        <div className="border-border border-t px-4 py-3">
          <p className="text-text-muted text-[12px]">Nenhum histórico de preço registrado ainda.</p>
        </div>
      )}
    </div>
  );
};

// ── Add item modal ────────────────────────────────────────────────────────────
const AddItemModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60" onClick={onClose} />
    <div className="border-border bg-surface relative w-full max-w-md rounded-2xl border p-6 shadow-xl">
      <h2 className="font-display font-700 text-text mb-5 text-[18px]">Novo Item</h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-text-muted mb-1 block text-[12px]">Nome *</label>
          <input
            placeholder="Ex: iPhone 16 Pro"
            className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-[12px]">Preço-meta (R$) *</label>
            <input
              type="number"
              placeholder="0,00"
              className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
            />
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-[12px]">Preço atual (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
            />
          </div>
        </div>

        <div>
          <label className="text-text-muted mb-1 block text-[12px]">Prioridade</label>
          <select className="border-border bg-surface2 text-text h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60">
            <option value="High">Alta</option>
            <option value="Medium">Média</option>
            <option value="Low">Baixa</option>
          </select>
        </div>

        <div>
          <label className="text-text-muted mb-1 block text-[12px]">Link (opcional)</label>
          <input
            placeholder="https://..."
            className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
          />
        </div>

        <div>
          <label className="text-text-muted mb-1 block text-[12px]">Notas (opcional)</label>
          <input
            placeholder="Observações sobre o item..."
            className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="border-border text-text-sub hover:bg-surface2 flex-1 rounded-lg border py-2 text-[13px] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onClose}
          className="bg-green text-black flex-1 rounded-lg py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
        >
          Adicionar
        </button>
      </div>
    </div>
  </div>
);

// ── Summary stats ─────────────────────────────────────────────────────────────
const WishlistStats = ({ items }: { items: WishlistItem[] }) => {
  const totalTarget = items.reduce((s, i) => s + i.targetPrice, 0);
  const reachedCount = items.filter(
    (i) => i.currentPrice !== null && i.currentPrice <= i.targetPrice,
  ).length;
  const highPriority = items.filter((i) => i.priority === "High").length;

  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Total itens", value: String(items.length) },
        { label: "Meta total", value: formatCurrency(totalTarget / 100) },
        { label: "Metas atingidas", value: `${reachedCount}/${items.filter((i) => i.currentPrice !== null).length}` },
      ].map(({ label, value }) => (
        <div key={label} className="border-border bg-surface rounded-xl border p-4">
          <p className="text-text-muted text-[12px]">{label}</p>
          <p className="font-money text-text mt-1 text-[18px] font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export function WishlistPage() {
  const { data, isLoading, isError } = useWishlist();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar wishlist. Tente novamente.</p>
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Wishlist</h1>
            <p className="text-text-muted mt-0.5 text-[13px]">
              {data.length} item{data.length !== 1 ? "s" : ""} · clique para ver evolução de preço
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-green text-black flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90 shrink-0"
          >
            <Plus size={15} />
            Novo item
          </button>
        </div>

        <WishlistStats items={data} />

        {sorted.length === 0 ? (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <div className="bg-surface2 mb-3 flex h-12 w-12 items-center justify-center rounded-[14px]">
              <ShoppingBag size={22} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-text text-[15px] font-medium">Nenhum item na wishlist</p>
            <p className="text-text-muted mt-1 text-[13px]">Adicione itens que deseja comprar no futuro.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-green text-black mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
            >
              <Plus size={14} />
              Adicionar item
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((item) => (
              <WishlistItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
