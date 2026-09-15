"use client";

import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency } from "@/lib/utils/index";
import type { SavingsAreaImpact } from "@/lib/types/analytics.types";

type Props = { areas: SavingsAreaImpact[] };

export function SavingsAreaImpactCard({ areas }: Props) {
  // API sends areas sorted by deviation (actual − planned) descending. A savings area
  // cannot be the worst one: investing 5k against a 1k plan is the plan going right.
  const worstAreaId = areas.find((a) => !a.isSavings && a.actualExpense > a.plannedExpense)?.areaId;

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Impacto por Área"
        subtitle="Áreas do orçamento que mais desviaram do planejado"
      />

      {areas.length === 0 ? (
        <ChartEmptyState message="Nenhuma área com despesas planejadas" />
      ) : (
        <div className="flex flex-col gap-4">
          {areas.map((area) => {
            const deviation = area.actualExpense - area.plannedExpense;
            const pct = area.plannedExpense > 0 ? Math.min(area.actualExpense / area.plannedExpense, 1) : 1;
            const over = deviation > 0;
            // On a savings area the reading flips: over the plan is money kept, under it
            // is the contribution that did not happen.
            const good = area.isSavings ? over : !over;
            const deviationColor =
              deviation === 0 ? "var(--text-muted)" : good ? "var(--green)" : "var(--red)";
            return (
              <div key={area.areaId}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-text truncate text-[13px]">{area.name}</span>
                    {area.areaId === worstAreaId && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] text-[var(--clay)]"
                        style={{ backgroundColor: "color-mix(in srgb, var(--clay) 14%, transparent)" }}
                      >
                        maior impacto
                      </span>
                    )}
                    {area.isSavings && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] text-[var(--moss)]"
                        style={{ backgroundColor: "color-mix(in srgb, var(--moss) 14%, transparent)" }}
                      >
                        economia
                      </span>
                    )}
                  </div>
                  <span className="font-money shrink-0 text-[12px]" style={{ color: deviationColor }}>
                    {deviation === 0
                      ? "no plano"
                      : `${formatCurrency(Math.abs(deviation) / 100)} ${
                          area.isSavings
                            ? over
                              ? "a mais guardado"
                              : "a menos guardado"
                            : over
                              ? "acima"
                              : "abaixo"
                        }`}
                  </span>
                </div>
                <div className="bg-surface2 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct * 100}%`, backgroundColor: good ? "var(--green)" : "var(--red)" }}
                  />
                </div>
                <p className="text-text-muted mt-1 text-[11px]">
                  {formatCurrency(area.actualExpense / 100)} de {formatCurrency(area.plannedExpense / 100)}{" "}
                  {area.isSavings ? "planejados para guardar" : "planejados"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
