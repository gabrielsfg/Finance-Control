"use client";

import { useState } from "react";
import {
  Loader2, AlertCircle, TrendingUp, BarChart2, BookOpen, Briefcase, ExternalLink, Coins,
} from "lucide-react";
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
  if (n == null) return "text-[var(--text-sub)]";
  return (n >= 0) ? "text-[var(--moss)]" : "text-[var(--clay)]";
}

type Item = { label: string; value: string | null; valueClass?: string };

function MetricGrid({ items }: { items: Item[] }) {
  const present = items.filter((i) => i.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {present.map((i) => (
        <div key={i.label} className="flex flex-col gap-0.5 rounded-[13px] bg-[var(--surface2)] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-sub)]">{i.label}</p>
          <p className={cn("font-mono text-[15px] font-semibold tabular-nums text-[var(--text)]", i.valueClass)}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function RowsCard({ title, rows }: { title: string; rows: Item[] }) {
  const present = rows.filter((r) => r.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="rounded-[13px] border border-[var(--border-color)] px-4 py-2">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">{title}</p>
      {present.map((r) => (
        <div key={r.label} className="flex items-center justify-between border-b border-[var(--border-color)] py-2.5 last:border-0">
          <span className="text-[13px] text-[var(--text-sub)]">{r.label}</span>
          <span className={cn("font-mono text-[13px] font-medium tabular-nums text-[var(--text)]", r.valueClass)}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function DividendsBlock({ f }: { f: Fundamentals }) {
  if (!f.recentDividends || f.recentDividends.length === 0) return null;
  return (
    <div className="rounded-[13px] border border-[var(--border-color)] px-4 py-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Coins size={12} className="text-[var(--moss)]" />
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Proventos recentes</p>
      </div>
      {f.recentDividends.map((d, i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--border-color)] py-2 last:border-0">
          <div className="flex flex-col">
            <span className="text-[13px] text-[var(--text)]">{d.paymentDate ? fmtDate(d.paymentDate) : "—"}</span>
            <span className="font-mono text-[10px] tracking-[0.04em] text-[var(--text-sub)]">{d.label}</span>
          </div>
          <span className="font-mono text-[13px] tabular-nums text-[var(--moss)]">{formatCurrency(d.rate)}</span>
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

function IndicatorsTab({ f }: { f: Fundamentals }) {
  return (
    <div className="flex flex-col gap-4">
      <MetricGrid items={[
        { label: "P/L",     value: fmt(f.priceToEarnings) },
        { label: "P/VP",    value: fmt(f.priceToBook) },
        { label: "ROE",     value: fmtPct(f.returnOnEquity), valueClass: pctColor(f.returnOnEquity) },
        { label: "ROA",     value: fmtPct(f.returnOnAssets), valueClass: pctColor(f.returnOnAssets) },
        { label: "DY (12m)", value: fmtPct(f.dividendYield), valueClass: "text-[var(--moss)]" },
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
        { label: "Setor",         value: f.sector },
        { label: "Segmento",      value: f.industry },
        { label: "Administrador", value: f.administratorName },
        { label: "Funcionários",  value: fmtInt(f.fullTimeEmployees) },
        { label: "Cotas/ações",   value: fmtInt(f.sharesOutstanding) },
      ]} />
      {f.website && (
        <div className="rounded-[13px] border border-[var(--border-color)] px-4 py-2">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-[var(--text-sub)]">Website</span>
            <a href={f.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[13px] text-[var(--brand-accent)] hover:underline">
              {f.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}
      {f.businessSummary && (
        <div className="rounded-[13px] border border-[var(--border-color)] p-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Sobre</p>
          <p className="text-[12px] leading-relaxed text-[var(--text-sub)]">{f.businessSummary}</p>
        </div>
      )}
    </div>
  );
}

// ── panel ──────────────────────────────────────────────────────────────────────

export function FundamentalsPanel({ ticker, bare = false }: { ticker: string; bare?: boolean }) {
  const [tab, setTab] = useState<Tab>("indicators");
  const { data, isLoading, isError } = useFundamentals(ticker);

  return (
    <div
      className={cn(!bare && "rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)]")}
      style={!bare ? { boxShadow: "var(--shadow-sm)" } : undefined}
    >
      <div className="flex gap-0.5 border-b border-[var(--border-color)] px-3 pt-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-t-[9px] border border-transparent px-3 py-2 text-[12px] font-medium transition-colors",
              tab === id
                ? "border-[var(--border-color)] border-b-0 bg-[var(--surface2)] text-[var(--text)]"
                : "text-[var(--text-sub)] hover:text-[var(--text)]",
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {isLoading && (
          <div className="flex h-48 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[var(--brand-accent)]" />
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle size={28} className="text-[var(--clay)]" />
            <p className="text-[14px] text-[var(--text-sub)]">Não foi possível carregar os fundamentos.</p>
            <p className="text-[12px] text-[var(--text-sub)]">
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
            <p className="mt-6 text-center font-mono text-[10px] tracking-[0.04em] text-[var(--text-sub)]">
              Fonte: Brapi · Atualizado às {new Date(data.fetchedAt).toLocaleString("pt-BR")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
