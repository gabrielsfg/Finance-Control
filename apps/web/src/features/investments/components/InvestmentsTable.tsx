"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { Investment, InvestmentPortfolio } from "@/lib/types/investments.types";

const ASSET_TYPE_COLORS: Record<string, string> = {
  Acao:              "#00C98D",
  FundoInvestimento: "#4A9EFF",
  FII:               "#F5A623",
  Cripto:            "#F25F5C",
  Stock:             "#00D4A0",
  Reit:              "#7C6FE0",
  BDR:               "#F5CE42",
  ETF:               "#4A9EFF",
  ETFInternacional:  "#7C6FE0",
  TesouroDireto:     "#00C98D",
  RendaFixa:         "#4A9EFF",
  Outro:             "#8A95A3",
};

type Props = {
  portfolio: InvestmentPortfolio;
  onSelectInvestment: (inv: Investment) => void;
};

function InvestmentRow({
  inv,
  onSelectInvestment,
}: {
  inv: Investment;
  onSelectInvestment: (inv: Investment) => void;
}) {
  const isPositive = inv.totalReturn >= 0;
  const color = ASSET_TYPE_COLORS[inv.assetType] ?? "#8A95A3";

  return (
    <tr
      onClick={() => onSelectInvestment(inv)}
      className="border-border group cursor-pointer border-b last:border-0 transition-colors hover:bg-surface2/50"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {inv.ticker.slice(0, 2)}
          </div>
          <div>
            <p className="text-text text-[14px] font-medium">{inv.name}</p>
            <p className="text-text-muted text-[12px]">{inv.ticker}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-5 py-3.5 sm:table-cell">
        <span className="text-text-sub text-[13px]">{inv.assetClass}</span>
      </td>
      <td className="hidden px-5 py-3.5 text-right md:table-cell">
        <span className="font-mono text-text-sub text-[13px]">
          {inv.currentQuantity % 1 === 0 ? inv.currentQuantity : inv.currentQuantity.toFixed(4)}
        </span>
      </td>
      <td className="hidden px-5 py-3.5 text-right lg:table-cell">
        <span className="font-money text-text-sub text-[13px]">{formatCurrency(inv.averagePrice / 100)}</span>
      </td>
      <td className="hidden px-5 py-3.5 text-right lg:table-cell">
        <span className="font-money text-text text-[13px]">{formatCurrency(inv.currentPrice / 100)}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="font-money font-600 text-text text-[14px]">{formatCurrency(inv.currentValue / 100)}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <p className={cn("font-money font-600 text-[14px]", isPositive ? "text-green" : "text-red")}>
          {isPositive ? "+" : ""}{formatCurrency(inv.totalReturn / 100)}
        </p>
        <p className={cn("font-mono text-[11px]", isPositive ? "text-green" : "text-red")}>
          {formatPercent(inv.totalReturnPercent)}
        </p>
      </td>
    </tr>
  );
}

function ClassGroup({
  assetClass,
  investments,
  onSelectInvestment,
}: {
  assetClass: string;
  investments: Investment[];
  onSelectInvestment: (inv: Investment) => void;
}) {
  const [open, setOpen] = useState(true);

  const groupValue   = investments.reduce((s, i) => s + i.currentValue, 0);
  const groupReturn  = investments.reduce((s, i) => s + i.totalReturn, 0);
  const isPositive   = groupReturn >= 0;

  return (
    <>
      <tr
        className="border-border bg-surface2/40 cursor-pointer border-b transition-colors hover:bg-surface2/70"
        onClick={() => setOpen((v) => !v)}
      >
        <td colSpan={7} className="px-5 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {open ? (
                <ChevronDown size={14} className="text-text-muted" />
              ) : (
                <ChevronRight size={14} className="text-text-muted" />
              )}
              <span className="text-text text-[13px] font-semibold">{assetClass}</span>
              <span className="text-text-muted text-[12px]">
                {investments.length} {investments.length === 1 ? "ativo" : "ativos"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-money text-text text-[13px] font-medium">{formatCurrency(groupValue / 100)}</span>
              <span className={cn("font-money text-[12px]", isPositive ? "text-green" : "text-red")}>
                {isPositive ? "+" : ""}{formatCurrency(groupReturn / 100)}
              </span>
            </div>
          </div>
        </td>
      </tr>
      {open &&
        investments.map((inv) => (
          <InvestmentRow key={inv.id} inv={inv} onSelectInvestment={onSelectInvestment} />
        ))}
    </>
  );
}

export const InvestmentsTable = ({ portfolio, onSelectInvestment }: Props) => {
  const investments = portfolio.investments;

  const [search, setSearch]           = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const assetClasses = useMemo(() => {
    const classes = Array.from(new Set(investments.map((i) => i.assetClass))).sort();
    return classes;
  }, [investments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return investments.filter((inv) => {
      const matchSearch =
        !q ||
        inv.name.toLowerCase().includes(q) ||
        inv.ticker.toLowerCase().includes(q);
      const matchClass =
        classFilter === "all" || inv.assetClass === classFilter;
      return matchSearch && matchClass;
    });
  }, [investments, search, classFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Investment[]>();
    for (const inv of filtered) {
      const list = map.get(inv.assetClass) ?? [];
      list.push(inv);
      map.set(inv.assetClass, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const hasFilters = search !== "" || classFilter !== "all";

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border">
      {/* Header + filters */}
      <div className="p-5 pb-3">
        <SectionHeader title="Posições" subtitle={`${filtered.length} de ${investments.length} ativos`} />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou ticker..."
              className="border-border bg-surface2 text-text placeholder:text-text-muted h-8 w-full rounded-lg border py-1.5 pl-8 pr-8 text-[13px] outline-none focus:border-green/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X size={13} className="text-text-muted hover:text-text" />
              </button>
            )}
          </div>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border-border bg-surface2 text-text h-8 rounded-lg border px-3 text-[13px] outline-none focus:border-green/60 sm:w-auto"
          >
            <option value="all">Todas as classes</option>
            {assetClasses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setClassFilter("all"); }}
              className="text-text-muted hover:text-text flex items-center gap-1 text-[12px] transition-colors"
            >
              <X size={12} />
              Limpar
            </button>
          )}
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-border border-b">
            <th className="text-text-muted px-5 py-3 text-left text-[12px] font-medium">Ativo</th>
            <th className="text-text-muted hidden px-5 py-3 text-left text-[12px] font-medium sm:table-cell">Classe</th>
            <th className="text-text-muted hidden px-5 py-3 text-right text-[12px] font-medium md:table-cell">Qtd.</th>
            <th className="text-text-muted hidden px-5 py-3 text-right text-[12px] font-medium lg:table-cell">Preço médio</th>
            <th className="text-text-muted hidden px-5 py-3 text-right text-[12px] font-medium lg:table-cell">Preço atual</th>
            <th className="text-text-muted px-5 py-3 text-right text-[12px] font-medium">Valor atual</th>
            <th className="text-text-muted px-5 py-3 text-right text-[12px] font-medium">Retorno</th>
          </tr>
        </thead>
        <tbody>
          {grouped.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-text-muted py-10 text-center text-[13px]">
                {hasFilters ? "Nenhum ativo encontrado para os filtros selecionados." : "Nenhum ativo na carteira."}
              </td>
            </tr>
          ) : (
            grouped.map(([assetClass, items]) => (
              <ClassGroup
                key={assetClass}
                assetClass={assetClass}
                investments={items}
                onSelectInvestment={onSelectInvestment}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
