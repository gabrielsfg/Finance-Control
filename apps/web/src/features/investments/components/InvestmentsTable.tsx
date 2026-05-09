"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
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
  const isPositive = inv.totalReturn >= 0;
  const color      = ASSET_TYPE_COLORS[inv.assetType] ?? "#8A95A3";
  const pct        = portfolioValue > 0 ? (inv.currentValue / portfolioValue) * 100 : 0;

  return (
    <tr
      onClick={() => onSelectInvestment(inv)}
      className="border-border group cursor-pointer border-b last:border-0 transition-colors odd:bg-surface even:bg-surface2/70 hover:bg-surface2"
    >
      <td className={cn("px-4 py-3", W.chevronName)}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {inv.ticker.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-text truncate text-[13px] font-medium">{inv.name}</p>
            <p className="text-text-muted text-[11px]">{inv.ticker}</p>
          </div>
        </div>
      </td>
      <td className={cn("px-4 py-3 text-right", W.qty)}>
        <span className="font-mono text-text-sub text-[13px]">
          {inv.currentQuantity % 1 === 0
            ? inv.currentQuantity.toLocaleString("pt-BR")
            : inv.currentQuantity.toFixed(4)}
        </span>
      </td>
      <td className={cn("px-4 py-3 text-right", W.price)}>
        <span className="font-money text-text-sub text-[13px]">{formatCurrency(inv.currentPrice / 100)}</span>
      </td>
      <td className={cn("px-4 py-3 text-right", W.changePct)}>
        <span className={cn("font-mono text-[13px] font-medium", isPositive ? "text-green" : "text-red")}>
          {formatPercentNeutral(Math.abs(inv.totalReturnPercent))}
        </span>
      </td>
      <td className={cn("px-4 py-3 text-right", W.changeR)}>
        <span className={cn("font-money text-[13px] font-medium", isPositive ? "text-green" : "text-red")}>
          {formatCurrency(Math.abs(inv.totalReturn) / 100)}
        </span>
      </td>
      <td className={cn("px-4 py-3 text-right", W.rentab)}>
        <span className={cn("font-mono text-[13px] font-medium", isPositive ? "text-green" : "text-red")}>
          {formatPercentNeutral(Math.abs(inv.totalReturnPercent))}
        </span>
      </td>
      <td className={cn("px-4 py-3 text-right", W.balance)}>
        <span className="font-money font-600 text-text text-[13px]">{formatCurrency(inv.currentValue / 100)}</span>
      </td>
      <td className={cn("px-4 py-3 text-right", W.pct)}>
        <span className="font-mono text-text-sub text-[12px]">{pct.toFixed(1)}%</span>
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

  const isEmpty       = investments.length === 0;
  const groupValue    = investments.reduce((s, i) => s + i.currentValue, 0);
  const groupInvested = investments.reduce((s, i) => s + i.totalInvested, 0);
  const groupReturn   = investments.reduce((s, i) => s + i.totalReturn, 0);
  const groupYield    = groupInvested > 0 ? (groupReturn / groupInvested) * 100 : 0;
  const groupPct      = portfolioValue > 0 ? (groupValue / portfolioValue) * 100 : 0;
  const isPositive    = groupReturn >= 0;

  return (
    <div className={cn("border-border bg-surface overflow-hidden rounded-xl border", isEmpty && "opacity-50")}>
      <button
        onClick={() => !isEmpty && setOpen((v) => !v)}
        className={cn(
          "w-full text-left transition-colors",
          !isEmpty && "hover:bg-surface2/40",
          isEmpty ? "cursor-default" : "cursor-pointer",
          open && !isEmpty && "border-border border-b",
        )}
      >
        <table className="w-full table-fixed">
          <tbody>
            <tr>
              <td className={cn("px-4 py-4", W.chevronName)}>
                <div className="flex items-center gap-2">
                  {isEmpty ? (
                    <ChevronRight size={14} className="text-text-muted/40 shrink-0" />
                  ) : open ? (
                    <ChevronDown size={14} className="text-text-muted shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-text-muted shrink-0" />
                  )}
                  <p className="text-text text-[14px] font-semibold">{assetClass}</p>
                </div>
              </td>

              <td className={cn("px-4 py-4 text-right", W.qty)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">Ativos</p>
                <p className="text-text mt-0.5 text-[13px] font-medium">{investments.length}</p>
              </td>

              <td className={cn("px-4 py-4 text-right", W.price)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">Valor total</p>
                <p className="font-money text-text mt-0.5 text-[13px] font-medium">
                  {isEmpty ? "—" : formatCurrency(groupValue / 100)}
                </p>
              </td>

              <td className={cn("px-4 py-4 text-right", W.changePct)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">Variação</p>
                {isEmpty ? (
                  <p className="font-mono mt-0.5 text-[13px] font-medium text-text-muted">—</p>
                ) : (
                  <p className={cn("font-mono mt-0.5 text-[13px] font-medium", isPositive ? "text-green" : "text-red")}>
                    {formatPercentNeutral(Math.abs(groupYield))}
                  </p>
                )}
              </td>

              <td className={cn("px-4 py-4 text-right", W.changeR)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">Variação (R$)</p>
                {isEmpty ? (
                  <p className="font-money mt-0.5 text-[13px] font-medium text-text-muted">—</p>
                ) : (
                  <p className={cn("font-money mt-0.5 text-[13px] font-medium", isPositive ? "text-green" : "text-red")}>
                    {formatCurrency(Math.abs(groupReturn) / 100)}
                  </p>
                )}
              </td>

              <td className={cn("px-4 py-4 text-right", W.rentab)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">Rentab.</p>
                {isEmpty ? (
                  <p className="font-mono mt-0.5 text-[13px] font-medium text-text-muted">—</p>
                ) : (
                  <p className={cn("font-mono mt-0.5 text-[13px] font-medium", isPositive ? "text-green" : "text-red")}>
                    {formatPercentNeutral(Math.abs(groupYield))}
                  </p>
                )}
              </td>

              <td className={cn("px-4 py-4 text-right", W.balance)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">Saldo</p>
                <p className={cn("font-money mt-0.5 text-[13px] font-medium", isEmpty ? "text-text-muted" : "text-text")}>
                  {isEmpty ? "—" : formatCurrency(groupValue / 100)}
                </p>
              </td>

              <td className={cn("px-4 py-4 text-right", W.pct)}>
                <p className="text-text-muted text-[10px] uppercase tracking-[0.05em]">% Cart.</p>
                <p className="font-mono text-text-sub mt-0.5 text-[13px]">
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
            <tr className="border-border bg-surface2 border-b">
              <th className={cn("px-4 py-2.5 text-left text-[11px] font-medium text-text-muted", W.chevronName)}>Ativo</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.qty)}>Qtd.</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.price)}>Preço atual</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.changePct)}>Variação</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.changeR)}>Variação (R$)</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.rentab)}>Rentab.</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.balance)}>Saldo</th>
              <th className={cn("px-4 py-2.5 text-right text-[11px] font-medium text-text-muted", W.pct)}>% Cart.</th>
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

  const q = search.trim().toLowerCase();
  const filteredIds = q
    ? new Set(
        investments
          .filter((inv) => inv.name.toLowerCase().includes(q) || inv.ticker.toLowerCase().includes(q))
          .map((inv) => inv.id)
      )
    : null;

  const visibleSet = new Set(visibleTypes);

  return (
    <div className="flex flex-col gap-4">
      {ASSET_CLASSES.map(({ assetClass, types }) => {
        if (!types.some((t) => visibleSet.has(t))) return null;

        const items = investments.filter(
          (inv) => types.includes(inv.assetType) && visibleSet.has(inv.assetType) &&
            (filteredIds === null || filteredIds.has(inv.id))
        );

        if (filteredIds !== null && items.length === 0) return null;

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
