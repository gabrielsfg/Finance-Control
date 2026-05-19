"use client";

import { TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type Props = {
  monthlyIncome:      number;
  subscriptionAmount: number;
  installmentAmount:  number;
};

export function IncomeCommitmentCard({
  monthlyIncome,
  subscriptionAmount,
  installmentAmount,
}: Props) {
  const noIncome = monthlyIncome <= 0;

  const subPct  = noIncome ? 0 : (subscriptionAmount / monthlyIncome) * 100;
  const instPct = noIncome ? 0 : (installmentAmount  / monthlyIncome) * 100;
  const totalCommittedPct = subPct + instPct;
  const freePct = Math.max(0, 100 - totalCommittedPct);

  // For visual bar, clamp committed sections to 100% total even when over-committed
  const overcommitted = totalCommittedPct > 100;
  const visSubPct  = overcommitted ? (subPct  / totalCommittedPct) * 100 : subPct;
  const visInstPct = overcommitted ? (instPct / totalCommittedPct) * 100 : instPct;

  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-text text-[14px] font-semibold">
            Comprometimento da Renda Mensal
          </span>
          {overcommitted && (
            <span className="text-red border-red/25 bg-red/8 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
              <TrendingDown size={10} />
              Acima da renda
            </span>
          )}
        </div>
        <span className="text-text-muted text-[12px]">
          Renda:{" "}
          {noIncome ? (
            <span className="text-text-muted">não definida</span>
          ) : (
            <span className="font-money text-text">{formatCurrency(monthlyIncome / 100)}</span>
          )}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="bg-surface3 flex h-2.5 w-full overflow-hidden rounded-full">
        {!noIncome && (
          <>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${visSubPct}%`, backgroundColor: "var(--purple)" }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${visInstPct}%`, backgroundColor: "var(--blue)" }}
            />
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <LegendItem
          color="var(--purple)"
          label="Assinaturas"
          pct={subPct}
          disabled={noIncome}
        />
        <LegendItem
          color="var(--blue)"
          label="Parcelamentos"
          pct={instPct}
          disabled={noIncome}
        />
        <LegendItem
          color="var(--surface3)"
          label="Livre"
          pct={freePct}
          disabled={noIncome}
          neutral
        />
      </div>

      {noIncome && (
        <p className="text-text-muted text-[12px]">
          Defina sua renda mensal no orçamento ativo para visualizar o comprometimento.
        </p>
      )}
    </div>
  );
}

function LegendItem({
  color, label, pct, disabled, neutral,
}: {
  color:    string;
  label:    string;
  pct:      number;
  disabled?: boolean;
  neutral?:  boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn("h-2.5 w-2.5 shrink-0 rounded-[3px]", neutral && "border-border border")}
        style={{ backgroundColor: color }}
      />
      <span className={cn("text-[12px]", disabled ? "text-text-muted" : "text-text-sub")}>
        {label} {disabled ? "—" : `(${pct.toFixed(1)}%)`}
      </span>
    </div>
  );
}
