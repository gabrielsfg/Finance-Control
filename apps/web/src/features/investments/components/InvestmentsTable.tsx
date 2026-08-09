"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Money } from "@/components/shared/Money";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import { filterInvestments } from "@/features/investments/utils/filterInvestments";
import type { AssetType, Investment, InvestmentPortfolio } from "@/lib/types/investments.types";

const ASSET_CLASSES: { assetClass: string; types: AssetType[] }[] = [
  { assetClass: "Ações",               types: ["Acao"] },
  { assetClass: "FIIs",                types: ["FII"] },
  { assetClass: "ETFs",                types: ["ETF"] },
  { assetClass: "ETFs Internacionais", types: ["ETFInternacional"] },
  { assetClass: "Stocks",              types: ["Stock"] },
  { assetClass: "REITs",               types: ["Reit"] },
  { assetClass: "BDRs",                types: ["BDR"] },
  { assetClass: "Fundos",              types: ["FundoInvestimento"] },
  { assetClass: "Criptomoedas",        types: ["Cripto"] },
  { assetClass: "Tesouro Direto",      types: ["TesouroDireto"] },
  { assetClass: "Renda Fixa",          types: ["RendaFixa"] },
  { assetClass: "Moedas",              types: ["Moeda"] },
  { assetClass: "Índices",             types: ["Index"] },
  { assetClass: "Outros",              types: ["Outro"] },
];

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
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
  Moeda:             "#14B8A6",
  Index:             "#8A95A3",
  Outro:             "#8A95A3",
};

const W = {
  chevronName: "w-[220px] min-w-[220px]",
  qty:         "w-[80px]  min-w-[80px]   hidden md:table-cell",
  price:       "w-[110px] min-w-[110px]  hidden lg:table-cell",
  changePct:   "w-[110px] min-w-[110px]",
  changeR:     "w-[120px] min-w-[120px]  hidden sm:table-cell",
  rentab:      "w-[100px] min-w-[100px]  hidden md:table-cell",
  balance:     "w-[130px] min-w-[130px]",
  pct:         "w-[80px]  min-w-[80px]   hidden sm:table-cell",
};

type Props = {
  portfolio: InvestmentPortfolio;
  search: string;
  visibleTypes: AssetType[];
  onSelectInvestment: (inv: Investment) => void;
};

function InvestmentRow({
  inv,
  portfolioValue,
  onSelectInvestment,
}: {
  inv: Investment;
  portfolioValue: number;
  onSelectInvestment: (inv: Investment) => void;
}) {
  const isRentabPositive  = inv.totalReturn >= 0;
  const isDayPositive     = inv.dayChangeAbs >= 0;
  const hasDayChange      = inv.previousClose !== null && inv.previousClose > 0;
  const color             = ASSET_TYPE_COLORS[inv.assetType] ?? "#8A95A3";
  const pct               = portfolioValue > 0 ? (inv.currentValue / portfolioValue) * 100 : 0;

  return (
    <tr
      onClick={() => onSelectInvestment(inv)}
      className="group cursor-pointer border-b border-[var(--border-color)] transition-colors last:border-0 hover:bg-[var(--surface2)]"
    >
      <td className={cn("px-[14px] py-[13px]", W.chevronName)}>
        <div className="flex items-center gap-2.5">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: color }} />
          <div className="min-w-0">
            <p className="truncate font-mono text-[13px] font-semibold tracking-[-0.01em] text-[var(--text)]">{inv.ticker}</p>
            <p className="truncate text-[12px] text-[var(--text-sub)]">{inv.name}</p>
          </div>
        </div>
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.qty)}>
        <span className="font-mono text-[13px] tabular-nums text-[var(--text-sub)]">
          {inv.currentQuantity % 1 === 0
            ? inv.currentQuantity.toLocaleString("pt-BR")
            : inv.currentQuantity.toFixed(4)}
        </span>
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.price)}>
        <Money cents={inv.currentPrice} className="text-[13px] text-[var(--text-sub)]" />
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.changePct)}>
        {hasDayChange ? (
          <span className={cn("font-mono text-[13px] font-medium tabular-nums", isDayPositive ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
            {formatPercentNeutral(Math.abs(inv.dayChangePct))}
          </span>
        ) : (
          <span className="font-mono text-[13px] text-[var(--text-muted)]">—</span>
        )}
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.changeR)}>
        {hasDayChange ? (
          <Money cents={inv.dayChangeAbs} sign className="text-[13px]" />
        ) : (
          <span className="font-mono text-[13px] text-[var(--text-muted)]">—</span>
        )}
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.rentab)}>
        <span className={cn("font-mono text-[13px] font-medium tabular-nums", isRentabPositive ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
          {formatPercentNeutral(Math.abs(inv.totalReturnPercent))}
        </span>
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.balance)}>
        <Money cents={inv.currentValue} className="text-[13px]" />
      </td>
      <td className={cn("px-[14px] py-[13px] text-right", W.pct)}>
        <span className="font-mono text-[12px] tabular-nums text-[var(--text-sub)]">{pct.toFixed(1)}%</span>
      </td>
    </tr>
  );
}

function ClassCard({
  assetClass,
  investments,
  portfolioValue,
  onSelectInvestment,
}: {
  assetClass: string;
  investments: Investment[];
  portfolioValue: number;
  onSelectInvestment: (inv: Investment) => void;
}) {
  const [open, setOpen] = useState(true);

  const isEmpty          = investments.length === 0;
  const groupValue       = investments.reduce((s, i) => s + i.currentValue, 0);
  const groupInvested    = investments.reduce((s, i) => s + i.totalInvested, 0);
  const groupReturn      = investments.reduce((s, i) => s + i.totalReturn, 0);
  const groupYield       = groupInvested > 0 ? (groupReturn / groupInvested) * 100 : 0;
  const groupPct         = portfolioValue > 0 ? (groupValue / portfolioValue) * 100 : 0;
  const isRentabPositive = groupReturn >= 0;

  // Day change: only sum assets that have previousClose data
  const withDayChange    = investments.filter(i => i.previousClose !== null && i.previousClose > 0);
  const groupDayChangeAbs = withDayChange.reduce((s, i) => s + i.dayChangeAbs, 0);
  const groupDayInvested  = withDayChange.reduce((s, i) => s + i.totalInvested, 0);
  const groupDayChangePct = groupDayInvested > 0
    ? withDayChange.reduce((s, i) => s + i.dayChangePct * (i.totalInvested / groupDayInvested), 0)
    : 0;
  const hasDayChange     = withDayChange.length > 0;
  const isDayPositive    = groupDayChangeAbs >= 0;

  return (
    <div
      className={cn("overflow-hidden rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)]", isEmpty && "opacity-50")}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <button
        onClick={() => !isEmpty && setOpen((v) => !v)}
        className={cn(
          "w-full text-left transition-colors",
          !isEmpty && "hover:bg-[var(--surface2)]",
          isEmpty ? "cursor-default" : "cursor-pointer",
          open && !isEmpty && "border-b border-[var(--border-color)]",
        )}
      >
        <table className="w-full table-fixed">
          <tbody>
            <tr>
              <td className={cn("px-[18px] py-[18px]", W.chevronName)}>
                <div className="flex items-center gap-2">
                  {isEmpty ? (
                    <ChevronRight size={15} className="shrink-0 text-[var(--text-muted)] opacity-40" />
                  ) : open ? (
                    <ChevronDown size={15} className="shrink-0 text-[var(--text-sub)]" />
                  ) : (
                    <ChevronRight size={15} className="shrink-0 text-[var(--text-sub)]" />
                  )}
                  <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">{assetClass}</p>
                </div>
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.qty)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Ativos</p>
                <p className="mt-1 font-mono text-[13px] font-medium tabular-nums text-[var(--text)]">{investments.length}</p>
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.price)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Valor total</p>
                {isEmpty ? <p className="mt-1 font-mono text-[13px] text-[var(--text-muted)]">—</p> : <Money cents={groupValue} className="mt-1 text-[13px]" />}
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.changePct)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Variação</p>
                {isEmpty || !hasDayChange ? (
                  <p className="mt-1 font-mono text-[13px] font-medium text-[var(--text-muted)]">—</p>
                ) : (
                  <p className={cn("mt-1 font-mono text-[13px] font-medium tabular-nums", isDayPositive ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
                    {formatPercentNeutral(Math.abs(groupDayChangePct))}
                  </p>
                )}
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.changeR)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Variação (R$)</p>
                {isEmpty || !hasDayChange ? (
                  <p className="mt-1 font-mono text-[13px] font-medium text-[var(--text-muted)]">—</p>
                ) : (
                  <Money cents={groupDayChangeAbs} sign className="mt-1 text-[13px]" />
                )}
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.rentab)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Rentab.</p>
                {isEmpty ? (
                  <p className="mt-1 font-mono text-[13px] font-medium text-[var(--text-muted)]">—</p>
                ) : (
                  <p className={cn("mt-1 font-mono text-[13px] font-medium tabular-nums", isRentabPositive ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
                    {formatPercentNeutral(Math.abs(groupYield))}
                  </p>
                )}
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.balance)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Saldo</p>
                {isEmpty ? <p className="mt-1 font-mono text-[13px] text-[var(--text-muted)]">—</p> : <Money cents={groupValue} className="mt-1 text-[13px]" />}
              </td>

              <td className={cn("px-[14px] py-[18px] text-right", W.pct)}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)]">% Cart.</p>
                <p className="mt-1 font-mono text-[13px] tabular-nums text-[var(--text-sub)]">
                  {isEmpty ? "—" : `${groupPct.toFixed(1)}%`}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </button>

      {open && !isEmpty && (
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className={cn("px-[14px] py-[11px] text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.chevronName)}>Ativo</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.qty)}>Qtd.</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.price)}>Preço atual</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.changePct)}>Variação</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.changeR)}>Variação (R$)</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.rentab)}>Rentab.</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.balance)}>Saldo</th>
              <th className={cn("px-[14px] py-[11px] text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]", W.pct)}>% Cart.</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => (
              <InvestmentRow
                key={inv.id}
                inv={inv}
                portfolioValue={portfolioValue}
                onSelectInvestment={onSelectInvestment}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export const InvestmentsTable = ({ portfolio, search, visibleTypes, onSelectInvestment }: Props) => {
  const { investments, currentValue: portfolioValue } = portfolio;

  // Shared with the CSV export — see filterInvestments.
  const visibleInvestments = filterInvestments(investments, { search, visibleTypes });
  const isSearching = search.trim().length > 0;
  const visibleSet = new Set(visibleTypes);

  return (
    <div className="flex flex-col gap-4">
      {ASSET_CLASSES.map(({ assetClass, types }) => {
        if (!types.some((t) => visibleSet.has(t))) return null;

        const items = visibleInvestments.filter((inv) => types.includes(inv.assetType));

        if (isSearching && items.length === 0) return null;

        return (
          <ClassCard
            key={assetClass}
            assetClass={assetClass}
            investments={items}
            portfolioValue={portfolioValue}
            onSelectInvestment={onSelectInvestment}
          />
        );
      })}
    </div>
  );
};
