"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, AlertCircle, TrendingUp, Building2, BarChart2, BookOpen, Briefcase, ExternalLink, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useFundamentals } from "@/features/market/hooks/useMarket";
import type { Fundamentals } from "@/lib/types/market.types";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 2): string | null {
  if (n == null) return null;
  return n.toFixed(decimals);
}

function fmtPct(n: number | null | undefined): string | null {
  if (n == null) return null;
  const pct = n * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function fmtBig(n: number | null | undefined): string | null {
  if (n == null) return null;
  const abs = Math.abs(n);
  if (abs >= 1e12) return `R$ ${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `R$ ${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `R$ ${(n / 1e6).toFixed(2)}M`;
  return `R$ ${n.toLocaleString("pt-BR")}`;
}

function fmtInt(n: number | null | undefined): string | null {
  if (n == null) return null;
  return n.toLocaleString("pt-BR");
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d ? `${d}/${m}/${y}` : iso;
}

function pctColor(n: number | null | undefined): string {
  if (n == null) return "text-text-sub";
  return (n >= 0) ? "text-green" : "text-red";
}

type Item = { label: string; value: string | null; valueClass?: string };

// ── sub-components ────────────────────────────────────────────────────────────

// Card grid that renders only the metrics that have a value.
function MetricGrid({ items }: { items: Item[] }) {
  const present = items.filter((i) => i.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {present.map((i) => (
        <div key={i.label} className="flex flex-col gap-0.5 rounded-xl bg-surface2 px-4 py-3">
          <p className="text-text-muted text-[10px] uppercase tracking-[0.06em]">{i.label}</p>
          <p className={cn("font-money text-[15px] font-semibold text-text", i.valueClass)}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}

// Bordered card of label/value rows; hidden entirely when no row has a value.
function RowsCard({ title, rows }: { title: string; rows: Item[] }) {
  const present = rows.filter((r) => r.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="border-border rounded-xl border px-4 py-2">
      <p className="text-text-muted mb-1 text-[11px] uppercase tracking-[0.06em]">{title}</p>
      {present.map((r) => (
        <div key={r.label} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
          <span className="text-text-muted text-[13px]">{r.label}</span>
          <span className={cn("font-money text-[13px] font-medium text-text", r.valueClass)}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── tabs ──────────────────────────────────────────────────────────────────────

type Tab = "indicators" | "balance" | "income" | "company";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "indicators", label: "Indicadores", icon: TrendingUp },
  { id: "balance",    label: "Balanço",     icon: BarChart2 },
  { id: "income",     label: "DRE",         icon: BookOpen },
  { id: "company",    label: "Empresa",     icon: Briefcase },
];

function DividendsBlock({ f }: { f: Fundamentals }) {
  if (!f.recentDividends || f.recentDividends.length === 0) return null;
  return (
    <div className="border-border rounded-xl border px-4 py-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Coins size={12} className="text-green" />
        <p className="text-text-muted text-[11px] uppercase tracking-[0.06em]">Proventos recentes</p>
      </div>
      {f.recentDividends.map((d, i) => (
        <div key={i} className="flex items-center justify-between border-b border-border py-2 last:border-0">
          <div className="flex flex-col">
            <span className="text-text text-[13px]">{d.paymentDate ? fmtDate(d.paymentDate) : "—"}</span>
            <span className="text-text-muted text-[10px]">{d.label}</span>
          </div>
          <span className="font-money text-green text-[13px]">{formatCurrency(d.rate)}</span>
        </div>
      ))}
    </div>
  );
}

function IndicatorsTab({ f }: { f: Fundamentals }) {
  return (
    <div className="flex flex-col gap-4">
      <MetricGrid items={[
        { label: "P/L",     value: fmt(f.priceToEarnings) },
        { label: "P/VP",    value: fmt(f.priceToBook) },
        { label: "ROE",     value: fmtPct(f.returnOnEquity), valueClass: pctColor(f.returnOnEquity) },
        { label: "ROA",     value: fmtPct(f.returnOnAssets), valueClass: pctColor(f.returnOnAssets) },
        { label: "DY (12m)", value: fmtPct(f.dividendYield), valueClass: "text-green" },
        { label: "LPA",     value: fmt(f.earningsPerShare) },
        { label: "VPA",     value: f.bookValue != null ? formatCurrency(f.bookValue) : null },
        { label: "Beta",    value: fmt(f.beta) },
        { label: "D/PL",    value: fmt(f.debtToEquity) },
      ]} />

      <RowsCard title="Margens" rows={[
        { label: "Margem Bruta",       value: fmtPct(f.grossMargin),     valueClass: pctColor(f.grossMargin) },
        { label: "Margem EBITDA",      value: fmtPct(f.ebitdaMargin),    valueClass: pctColor(f.ebitdaMargin) },
        { label: "Margem Operacional", value: fmtPct(f.operatingMargin), valueClass: pctColor(f.operatingMargin) },
        { label: "Margem Líquida",     value: fmtPct(f.profitMargin),    valueClass: pctColor(f.profitMargin) },
      ]} />

      <RowsCard title="Valuation" rows={[
        { label: "Market Cap",     value: fmtBig(f.marketCap) },
        { label: "EV",             value: fmtBig(f.enterpriseValue) },
        { label: "EBITDA",         value: fmtBig(f.ebitda) },
        { label: "Free Cash Flow", value: fmtBig(f.freeCashflow) },
      ]} />

      <DividendsBlock f={f} />
    </div>
  );
}

function BalanceTab({ f }: { f: Fundamentals }) {
  return (
    <div className="flex flex-col gap-4">
      <MetricGrid items={[
        { label: "Ativos Totais",   value: fmtBig(f.totalAssets) },
        { label: "Passivos Totais", value: fmtBig(f.totalLiabilities) },
        { label: "Patrimônio Líq.", value: fmtBig(f.totalStockholderEquity) },
        { label: "Caixa",           value: fmtBig(f.cash) },
      ]} />

      <RowsCard title="Dívida" rows={[
        { label: "Dívida LP",     value: fmtBig(f.longTermDebt) },
        { label: "Dívida Total",  value: fmtBig(f.totalDebt) },
        { label: "Caixa Líquido", value: fmtBig(f.totalCash) },
        { label: "D/PL",          value: fmt(f.debtToEquity) },
      ]} />
    </div>
  );
}

function IncomeTab({ f }: { f: Fundamentals }) {
  return (
    <div className="flex flex-col gap-4">
      <MetricGrid items={[
        { label: "Receita (12m)", value: fmtBig(f.annualRevenue) },
        { label: "Lucro Bruto",   value: fmtBig(f.annualGrossProfit) },
        { label: "EBITDA",        value: fmtBig(f.ebitda) },
        { label: "Lucro Líquido", value: fmtBig(f.annualNetIncome) },
      ]} />

      <RowsCard title="Margens" rows={[
        { label: "Margem Bruta",   value: fmtPct(f.grossMargin),  valueClass: pctColor(f.grossMargin) },
        { label: "Margem EBITDA",  value: fmtPct(f.ebitdaMargin), valueClass: pctColor(f.ebitdaMargin) },
        { label: "Margem Líquida", value: fmtPct(f.profitMargin), valueClass: pctColor(f.profitMargin) },
        { label: "Free Cash Flow", value: fmtBig(f.freeCashflow) },
      ]} />
    </div>
  );
}

function CompanyTab({ f }: { f: Fundamentals }) {
  return (
    <div className="flex flex-col gap-4">
      <RowsCard title="Perfil" rows={[
        { label: "Setor",      value: f.sector },
        { label: "Segmento",   value: f.industry },
        { label: "Administrador", value: f.administratorName },
        { label: "Funcionários",  value: fmtInt(f.fullTimeEmployees) },
        { label: "Cotas/ações", value: fmtInt(f.sharesOutstanding) },
      ]} />

      {f.website && (
        <div className="border-border rounded-xl border px-4 py-2">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-text-muted text-[13px]">Website</span>
            <a
              href={f.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue text-[13px] hover:underline"
            >
              {f.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {f.businessSummary && (
        <div className="border-border rounded-xl border p-4">
          <p className="text-text-muted mb-2 text-[11px] uppercase tracking-[0.06em]">Sobre</p>
          <p className="text-text-sub text-[12px] leading-relaxed">{f.businessSummary}</p>
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type Props = {
  ticker: string | null;
  assetName?: string;
  onClose: () => void;
};

export const FundamentalsDrawer = ({ ticker, assetName, onClose }: Props) => {
  const [tab, setTab] = useState<Tab>("indicators");
  const { data, isLoading, isError } = useFundamentals(ticker);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset tab when a different ticker opens
  useEffect(() => { setTab("indicators"); }, [ticker]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const open = !!ticker;

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
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-b border-border px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue shrink-0" />
              <p className="font-display font-semibold text-text text-[16px]">
                {ticker ?? "—"}
              </p>
            </div>
            {assetName && (
              <p className="text-text-muted text-[12px] mt-0.5 truncate">{assetName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text shrink-0 mt-0.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-3 pt-2 shrink-0">
          <div className="flex gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[12px] font-medium transition-colors",
                  tab === id
                    ? "bg-surface2 text-text border border-b-0 border-border"
                    : "text-text-muted hover:text-text-sub",
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading && (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={22} className="text-green animate-spin" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle size={28} className="text-red" />
              <p className="text-text-sub text-[14px]">Não foi possível carregar os fundamentalistas.</p>
              <p className="text-text-muted text-[12px]">
                Verifique se a conta Brapi tem plano Pro ativo e se o token está configurado.
              </p>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {tab === "indicators" && <IndicatorsTab f={data} />}
              {tab === "balance"    && <BalanceTab f={data} />}
              {tab === "income"     && <IncomeTab f={data} />}
              {tab === "company"    && <CompanyTab f={data} />}

              <p className="mt-6 text-center text-[10px] text-text-muted">
                Fonte: Brapi · Atualizado às {new Date(data.fetchedAt).toLocaleString("pt-BR")}
              </p>
            </>
          )}

          {!isLoading && !isError && !data && !ticker && (
            <div className="flex h-48 items-center justify-center">
              <p className="text-text-muted text-[13px]">Selecione um ativo para ver os fundamentos.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
