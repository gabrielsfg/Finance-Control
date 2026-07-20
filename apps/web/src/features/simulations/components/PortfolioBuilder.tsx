"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, Plus, Trash2, Scale, AlertCircle, History } from "lucide-react";
import { cn, matchesSearch, assetTypeKeywords } from "@/lib/utils";
import type { AvailableBenchmark } from "@/lib/api/simulation";
import type { AssetCategory, PortfolioAsset } from "@/lib/types/simulation";
import { ASSET_CATEGORY_LABELS, BENCHMARK_LABELS, BENCHMARK_SEARCH_KEYWORDS } from "@/lib/types/simulation";
import type { Benchmark } from "@/lib/types/simulation";

const inputCls =
  "h-9 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 font-mono text-[13px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

export const MAX_ASSETS = 10;
export const MIN_ASSETS = 2;

// Paleta estável para identificar cada ativo nos gráficos/legendas
export const PORTFOLIO_COLORS = [
  "var(--moss)", "var(--brand-cobalt)", "#7c6fe0", "var(--clay)",
  "var(--gold)", "#00d4a0", "#f25f5c", "#9b8cff",
  "#3ddc97", "#ff8fab",
];

const FIXED_BENCHMARKS: Benchmark[] = ["CDI", "SELIC", "IPCA+6", "IPCA+5", "IPCA+4", "IBOVESPA", "IFIX", "SP500_BRL"];

export function makeEmptyAsset(): PortfolioAsset {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    ticker: "",
    name: "",
    weightPct: 0,
    category: "acoes",
    annualRatePct: undefined,
  };
}

// Maps a DB asset type string to a fiscal category for the projection tax engine.
function categoryFromAssetType(assetType: string): AssetCategory {
  const t = assetType.toLowerCase();
  if (t.includes("crypto") || t.includes("cripto")) return "cripto";
  if (t.includes("fii") || t.includes("real")) return "fii";
  if (t.includes("fund")) return "fundo_longo_prazo";
  if (t.includes("bdr") || t.includes("stock_us") || t.includes("etf")) return "internacional";
  return "acoes";
}

type AssetOption = { ticker: string; name: string; meta?: AvailableBenchmark; fixed?: boolean };

// Dropdown de seleção de ativo/benchmark com busca (índices fixos + tickers do banco)
const AssetPicker = ({
  value,
  onSelect,
  options,
  loading,
  taken,
}: {
  value: string;
  onSelect: (opt: AssetOption) => void;
  options: AssetOption[];
  loading: boolean;
  taken: Set<string>;
}) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter(o => {
      const typeKeywords = o.fixed
        ? BENCHMARK_SEARCH_KEYWORDS[o.ticker as Benchmark]
        : assetTypeKeywords(o.meta?.assetType);
      const label = o.fixed ? BENCHMARK_LABELS[o.ticker as Benchmark] : "";
      return matchesSearch(query, o.ticker, o.name, label, typeKeywords);
    });
  }, [options, query]);

  const fixedOpts  = filtered.filter(o => o.fixed);
  const tickerOpts = filtered.filter(o => !o.fixed);

  const selected = options.find(o => o.ticker === value);
  const label = selected ? (selected.fixed ? BENCHMARK_LABELS[selected.ticker as Benchmark] : `${selected.ticker} — ${selected.name}`) : "Selecionar ativo";

  const renderOpt = (opt: AssetOption) => {
    const isTaken = taken.has(opt.ticker) && opt.ticker !== value;
    return (
      <button
        key={opt.ticker}
        disabled={isTaken}
        onClick={() => { onSelect(opt); setOpen(false); setQuery(""); }}
        className={cn(
          "flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] transition-colors",
          isTaken ? "opacity-35 cursor-not-allowed" : "hover:bg-[var(--surface2)]",
        )}
      >
        <div className="flex flex-col min-w-0">
          <span className={cn("text-[var(--text-sub)] truncate", value === opt.ticker && "text-[var(--text)]")}>
            <span className="font-medium">{opt.fixed ? BENCHMARK_LABELS[opt.ticker as Benchmark] : opt.ticker}</span>
            {!opt.fixed && opt.name ? <span className="text-[var(--text-sub)]"> — {opt.name}</span> : null}
          </span>
          {opt.meta && (
            <span className="text-[10px] text-[var(--text-sub)]">{opt.meta.monthsAvailable} meses · desde {opt.meta.earliestDate.slice(0, 7)}</span>
          )}
        </div>
        {value === opt.ticker && <Check size={12} className="text-[var(--brand-accent)] shrink-0" />}
        {isTaken && <span className="text-[10px] text-[var(--text-sub)] shrink-0">já na carteira</span>}
      </button>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--brand-accent)]/50"
      >
        <span className={cn("truncate", !selected && "text-[var(--text-sub)]")}>{label}</span>
        <ChevronDown size={14} className={cn("text-[var(--text-sub)] transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] shadow-lg" style={{ minWidth: 260 }}>
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-2 py-2">
            <Search size={12} className="text-[var(--text-sub)] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar benchmark ou ticker..."
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--text-sub)]"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-px">
            {fixedOpts.length > 0 && (
              <>
                <p className="px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-sub)]">Índices de referência</p>
                {fixedOpts.map(renderOpt)}
              </>
            )}
            {tickerOpts.length > 0 && (
              <>
                <p className="px-2.5 py-1 mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-sub)]">
                  Ativos com histórico na base
                  {loading && <span className="ml-1 normal-case font-normal">(carregando...)</span>}
                </p>
                {tickerOpts.map(renderOpt)}
              </>
            )}
            {filtered.length === 0 && (
              <p className="px-2.5 py-3 text-[12px] text-[var(--text-sub)] text-center">Nenhum resultado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryPicker = ({ value, onChange }: { value: AssetCategory; onChange: (v: AssetCategory) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-9 w-full items-center justify-between gap-1.5 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--text)] transition-colors hover:border-[var(--brand-accent)]/50"
      >
        <span className="truncate">{ASSET_CATEGORY_LABELS[value]}</span>
        <ChevronDown size={13} className={cn("text-[var(--text-sub)] transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 flex w-full min-w-[220px] flex-col gap-px rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] p-1.5 shadow-lg">
          {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false); }}
              className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--surface2)]"
            >
              <span className={cn("text-[var(--text-sub)]", value === k && "text-[var(--text)]")}>{v}</span>
              {value === k && <Check size={12} className="text-[var(--brand-accent)] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export function PortfolioBuilder({
  assets,
  onChange,
  mode,
  availableBenchmarks,
  loadingBenchmarks,
  suggestedPeriod,
}: {
  assets: PortfolioAsset[];
  onChange: (assets: PortfolioAsset[]) => void;
  mode: "backtest" | "projection";
  availableBenchmarks: AvailableBenchmark[];
  loadingBenchmarks: boolean;
  suggestedPeriod?: string | null;
}) {
  const options = useMemo<AssetOption[]>(() => {
    const fixed: AssetOption[] = FIXED_BENCHMARKS.map(b => ({ ticker: b, name: BENCHMARK_LABELS[b], fixed: true }));
    const tickers: AssetOption[] = availableBenchmarks.map(m => ({ ticker: m.ticker, name: m.name, meta: m }));
    return [...fixed, ...tickers];
  }, [availableBenchmarks]);

  const taken = useMemo(() => new Set(assets.map(a => a.ticker).filter(Boolean)), [assets]);
  const totalWeight = assets.reduce((s, a) => s + (a.weightPct || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.5;

  const update = (id: string, patch: Partial<PortfolioAsset>) =>
    onChange(assets.map(a => (a.id === id ? { ...a, ...patch } : a)));

  const remove = (id: string) => onChange(assets.filter(a => a.id !== id));

  const add = () => {
    if (assets.length >= MAX_ASSETS) return;
    onChange([...assets, makeEmptyAsset()]);
  };

  const distributeEqually = () => {
    const n = assets.length;
    if (n === 0) return;
    const base = Math.floor((100 / n) * 100) / 100;
    const remainder = Math.round((100 - base * n) * 100) / 100;
    onChange(assets.map((a, i) => ({ ...a, weightPct: i === 0 ? Math.round((base + remainder) * 100) / 100 : base })));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Cabeçalho de colunas */}
      <div className={cn(
        "hidden gap-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-sub)] sm:grid",
        mode === "projection"
          ? "grid-cols-[1fr_120px_90px_70px_32px]"
          : "grid-cols-[1fr_90px_32px]",
      )}>
        <span>Ativo</span>
        {mode === "projection" && <span>Categoria fiscal</span>}
        {mode === "projection" && <span className="text-right">Taxa a.a.</span>}
        <span className="text-right">Peso %</span>
        <span />
      </div>

      {assets.map((a) => (
        <div
          key={a.id}
          className={cn(
            "grid grid-cols-1 gap-2 sm:items-center",
            mode === "projection"
              ? "sm:grid-cols-[1fr_120px_90px_70px_32px]"
              : "sm:grid-cols-[1fr_90px_32px]",
          )}
        >
          <AssetPicker
            value={a.ticker}
            options={options}
            loading={loadingBenchmarks}
            taken={taken}
            onSelect={(opt) =>
              update(a.id, {
                ticker: opt.ticker,
                name: opt.fixed ? BENCHMARK_LABELS[opt.ticker as Benchmark] : opt.name,
                category: opt.meta ? categoryFromAssetType(opt.meta.assetType) : a.category,
              })
            }
          />

          {mode === "projection" && (
            <CategoryPicker value={a.category} onChange={(v) => update(a.id, { category: v })} />
          )}

          {mode === "projection" && (
            <div className="relative">
              <input
                className={cn(inputCls, "text-right tabular-nums pr-3")}
                value={a.annualRatePct ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".");
                  update(a.id, { annualRatePct: v === "" ? undefined : parseFloat(v) });
                }}
                placeholder="12"
                inputMode="decimal"
              />
              {suggestedPeriod && a.annualRatePct !== undefined && (
                <div
                  className="pointer-events-none absolute -top-2 -right-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                  style={{ background: "color-mix(in srgb, var(--brand-accent) 15%, transparent)" }}
                  title={`Taxa sugerida com base no histórico de ${suggestedPeriod}`}
                >
                  <History size={9} className="text-[var(--brand-accent)]" />
                  <span className="text-[9px] font-semibold text-[var(--brand-accent)]">{suggestedPeriod}</span>
                </div>
              )}
            </div>
          )}

          <input
            className={cn(inputCls, "text-right tabular-nums")}
            value={a.weightPct || ""}
            onChange={(e) => {
              const v = e.target.value.replace(",", ".");
              update(a.id, { weightPct: v === "" ? 0 : parseFloat(v) });
            }}
            placeholder="0"
            inputMode="decimal"
          />

          <button
            onClick={() => remove(a.id)}
            disabled={assets.length <= MIN_ASSETS}
            title={assets.length <= MIN_ASSETS ? `Mínimo de ${MIN_ASSETS} ativos` : "Remover ativo"}
            className="flex h-9 w-8 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:text-[var(--clay)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={add}
          disabled={assets.length >= MAX_ASSETS}
          className="flex items-center gap-1.5 rounded-[13px] border px-3 py-1.5 text-[12px] font-medium text-[var(--brand-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "color-mix(in srgb, var(--brand-accent) 30%, transparent)", background: "color-mix(in srgb, var(--brand-accent) 10%, transparent)" }}
        >
          <Plus size={13} /> Adicionar ativo
        </button>
        <button
          onClick={distributeEqually}
          className="flex items-center gap-1.5 rounded-[13px] border border-[var(--border-color)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
        >
          <Scale size={13} /> Distribuir igualmente
        </button>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-[var(--text-sub)]">{assets.length}/{MAX_ASSETS} ativos</span>
      </div>

      {/* Barra de soma de pesos */}
      <div className="mt-1">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-sub)]">Alocação total</span>
          <span className={cn("font-mono font-semibold tabular-nums", weightOk ? "text-[var(--moss)]" : "text-[var(--gold)]")}>
            {totalWeight.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface2)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(totalWeight, 100)}%`, backgroundColor: weightOk ? "var(--moss)" : "var(--gold)" }}
          />
        </div>
        {!weightOk && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--gold)]">
            <AlertCircle size={11} className="shrink-0" />
            A soma dos pesos deve ser 100% (faltam {(100 - totalWeight).toFixed(1)}%).
          </p>
        )}
      </div>
    </div>
  );
}
