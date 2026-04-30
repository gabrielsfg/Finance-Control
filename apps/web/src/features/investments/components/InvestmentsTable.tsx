"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { Investment } from "@/lib/types/investments.types";

type Props = { investments: Investment[] };

export const InvestmentsTable = ({ investments }: Props) => (
  <div className="border-border bg-surface overflow-hidden rounded-xl border">
    <div className="p-5 pb-0">
      <SectionHeader title="Posições" subtitle={`${investments.length} ativos`} />
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
        {investments.map((inv) => {
          const isPositive = inv.return >= 0;
          return (
            <tr key={inv.id} className="border-border group border-b last:border-0 transition-colors hover:bg-surface2/50">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-bold text-white" style={{ backgroundColor: inv.color }}>
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
                <span className="font-mono text-text-sub text-[13px]">{inv.quantity}</span>
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
                  {isPositive ? "+" : ""}{formatCurrency(inv.return / 100)}
                </p>
                <p className={cn("font-mono text-[11px]", isPositive ? "text-green" : "text-red")}>
                  {formatPercent(inv.returnPercent)}
                </p>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
