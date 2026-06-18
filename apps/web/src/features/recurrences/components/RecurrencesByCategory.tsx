"use client";

import { getCategoryColor } from "@/lib/config/categoryColors";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import { Money } from "@/components/shared/Money";
import type { RecurringItem, InstallmentItem } from "@/lib/types/recurrences.types";

type Props = {
  recurring: RecurringItem[];
  installments: InstallmentItem[];
};

/** Monthly committed expense, grouped by category, with share-of-total bars. */
export function RecurrencesByCategory({ recurring, installments }: Props) {
  const map = new Map<string, { name: string; color: string; total: number }>();
  const add = (name: string, colorRaw: string | null, value: number) => {
    const color = getCategoryColor(colorRaw, name);
    const cur = map.get(name) ?? { name, color, total: 0 };
    cur.total += value;
    map.set(name, cur);
  };

  for (const r of recurring) if (r.isActive && r.type === "Expense") add(r.categoryName, r.categoryColor, r.value);
  for (const i of installments) if (i.remainingInstallments > 0 && i.type === "Expense") add(i.categoryName, i.categoryColor, i.value);

  const cats = Array.from(map.values()).sort((a, b) => b.total - a.total);
  const total = cats.reduce((s, c) => s + c.total, 0);

  return (
    <Card className="flex flex-col">
      <CardHead title="Por categoria" />

      {cats.length === 0 ? (
        <p className="py-10 text-center font-mono text-[13px] text-[var(--text-sub)]">Sem recorrências de despesa</p>
      ) : (
        <>
          <div className="flex flex-col">
            {cats.map((c) => {
              const pct = total > 0 ? (c.total / total) * 100 : 0;
              return (
                <div key={c.name} className="grid grid-cols-[minmax(96px,1fr)_minmax(60px,1.4fr)_auto] items-center gap-3 py-[9px]">
                  <div className="flex min-w-0 items-center gap-2 text-[13.5px]">
                    <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="truncate text-[var(--text)]">{c.name}</span>
                  </div>
                  <div className="h-[10px] overflow-hidden rounded-full bg-[var(--surface2)]">
                    <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-8 text-right font-mono text-[11px] tabular-nums text-[var(--text-sub)]">{pct.toFixed(0)}%</span>
                    <Money cents={c.total} className="text-[13px]" />
                  </div>
                </div>
              );
            })}
          </div>

          <LedgerRule />
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-[var(--text-sub)]">Total mensal</span>
            <Money cents={total} className="text-[15px]" />
          </div>
        </>
      )}
    </Card>
  );
}
