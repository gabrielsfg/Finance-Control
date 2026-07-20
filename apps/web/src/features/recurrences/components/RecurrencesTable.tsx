"use client";

import { useMemo } from "react";
import { Pencil, X, RotateCcw, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { Card, CardHead } from "@/components/shared/Card";
import { Money } from "@/components/shared/Money";
import type { RecurringItem, InstallmentItem } from "@/lib/types/recurrences.types";

const RECURRENCE_LABELS: Record<string, string> = {
  Daily: "Diário", WorkDay: "Dia útil", Weekly: "Semanal", Biweekly: "Quinzenal",
  Monthly: "Mensal", Quarterly: "Trimestral", Semiannually: "Semestral", Annually: "Anual",
};
const RECURRENCE_DAYS: Record<string, number> = {
  Daily: 1, WorkDay: 1, Weekly: 7, Biweekly: 14, Monthly: 30, Quarterly: 90, Semiannually: 180, Annually: 365,
};
const CAL_STEPS: Record<string, number> = { Monthly: 1, Quarterly: 3, Semiannually: 6, Annually: 12 };

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function nextRecurringDate(startIso: string, recurrence: string, today: Date): Date {
  const next = startOfDay(new Date(startIso));
  const monthsStep = CAL_STEPS[recurrence];
  if (monthsStep !== undefined) {
    while (next < today) next.setMonth(next.getMonth() + monthsStep);
  } else {
    const step = RECURRENCE_DAYS[recurrence] ?? 1;
    while (next < today) next.setDate(next.getDate() + step);
  }
  return next;
}

function nextInstallmentDate(transactionDateIso: string, today: Date): Date {
  const start = new Date(transactionDateIso);
  const next = new Date(today.getFullYear(), today.getMonth(), start.getDate());
  next.setHours(0, 0, 0, 0);
  if (next < today) next.setMonth(next.getMonth() + 1);
  return next;
}

type StatusTone = "ok" | "soon" | "due" | "muted" | "info";
const TONE_STYLE: Record<StatusTone, { bg: string; color: string }> = {
  ok:   { bg: "color-mix(in srgb, var(--moss) 15%, transparent)", color: "var(--moss)" },
  soon: { bg: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" },
  due:  { bg: "color-mix(in srgb, var(--clay) 14%, transparent)", color: "var(--clay)" },
  muted:{ bg: "var(--surface2)", color: "var(--text-sub)" },
  info: { bg: "color-mix(in srgb, var(--brand-accent) 14%, transparent)", color: "var(--brand-accent)" },
};

function StatusPill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const s = TONE_STYLE[tone];
  return (
    <span
      className="inline-block rounded-full px-[9px] py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em]"
      style={{ background: s.bg, color: s.color }}
    >
      {children}
    </span>
  );
}

type Row = {
  key: string;
  name: string;
  sub: string;
  categoryName: string;
  color: string;
  frequency: string;
  next: Date | null;
  value: number;
  type: "Income" | "Expense";
  active: boolean;
  statusLabel: string;
  statusTone: StatusTone;
  actions: React.ReactNode;
};

type Props = {
  recurring: RecurringItem[];
  installments: InstallmentItem[];
  periodLabel: string;
  onViewRecurring: (item: RecurringItem) => void;
  onEditRecurring: (item: RecurringItem) => void;
  onCancelRecurring: (item: RecurringItem) => void;
  onReactivateRecurring: (item: RecurringItem) => void;
  onViewInstallment: (item: InstallmentItem) => void;
  onEditInstallment: (item: InstallmentItem) => void;
};

const ACTION_BTN =
  "flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]";

export function RecurrencesTable({
  recurring,
  installments,
  periodLabel,
  onViewRecurring,
  onEditRecurring,
  onCancelRecurring,
  onReactivateRecurring,
  onViewInstallment,
  onEditInstallment,
}: Props) {
  const rows = useMemo<Row[]>(() => {
    const today = startOfDay(new Date());
    const out: Row[] = [];

    for (const r of recurring) {
      const color = getCategoryColor(r.categoryColor, r.categoryName);
      const next = r.isActive ? nextRecurringDate(r.startDate, r.recurrence, today) : null;
      const daysUntil = next ? Math.round((next.getTime() - today.getTime()) / 86_400_000) : null;

      let statusLabel = "ativa";
      let statusTone: StatusTone = "ok";
      if (!r.isActive) {
        statusLabel = "pausada";
        statusTone = "muted";
      } else if (daysUntil !== null) {
        if (daysUntil <= 0) { statusLabel = "vence hoje"; statusTone = "due"; }
        else if (daysUntil <= 3) { statusLabel = `vence em ${daysUntil}d`; statusTone = "due"; }
        else if (daysUntil <= 7) { statusLabel = `em ${daysUntil}d`; statusTone = "soon"; }
        else { statusLabel = "em dia"; statusTone = "ok"; }
      }

      out.push({
        key: `r-${r.id}`,
        name: r.description,
        sub: [r.subCategoryName, r.accountName].filter(Boolean).join(" · "),
        categoryName: r.categoryName,
        color,
        frequency: RECURRENCE_LABELS[r.recurrence] ?? r.recurrence,
        next,
        value: r.value,
        type: r.type,
        active: r.isActive,
        statusLabel,
        statusTone,
        actions: r.isActive ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onEditRecurring(r); }} title="Editar" className={ACTION_BTN}>
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCancelRecurring(r); }}
              title="Pausar / cancelar"
              className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--clay)] opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onReactivateRecurring(r); }}
            title="Reativar"
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--moss)] opacity-80 transition-opacity hover:opacity-100"
          >
            <RotateCcw size={13} />
          </button>
        ),
      });
    }

    for (const i of installments) {
      if (i.remainingInstallments <= 0) continue;
      const color = getCategoryColor(i.categoryColor, i.categoryName);
      const next = nextInstallmentDate(i.transactionDate, today);
      out.push({
        key: `i-${i.id}`,
        name: i.description,
        sub: [i.subCategoryName, i.accountName].filter(Boolean).join(" · "),
        categoryName: i.categoryName,
        color,
        frequency: "Parcelado",
        next,
        value: i.value,
        type: i.type,
        active: true,
        statusLabel: `${i.paidInstallments}/${i.totalInstallments}`,
        statusTone: "info",
        actions: (
          <button onClick={(e) => { e.stopPropagation(); onEditInstallment(i); }} title="Editar" className={ACTION_BTN}>
            <Pencil size={13} />
          </button>
        ),
      });
    }

    // Active first, then by soonest next date.
    return out.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const at = a.next?.getTime() ?? Infinity;
      const bt = b.next?.getTime() ?? Infinity;
      return at - bt;
    });
  }, [recurring, installments, onEditRecurring, onCancelRecurring, onReactivateRecurring, onEditInstallment]);

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

  return (
    <Card className="flex flex-col p-[16px_6px_8px]">
      <div className="px-[10px]">
        <CardHead title="Recorrências" right={<span className="font-mono text-[12px] tabular-nums text-[var(--text-sub)]">{periodLabel}</span>} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface2)] text-[var(--brand-accent)]">
            <RefreshCw size={22} strokeWidth={1.75} />
          </div>
          <p className="font-display text-[15px] font-bold text-[var(--text)]">Nenhuma recorrência</p>
          <p className="mt-1 text-[13px] text-[var(--text-sub)]">Adicione suas contas fixas e parcelamentos.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Recorrência", "Categoria", "Frequência", "Próximo", "Valor", "Status", ""].map((h, idx) => (
                  <th
                    key={h || "act"}
                    className={cn(
                      "border-b border-[var(--border-color)] px-[14px] pb-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-sub)] whitespace-nowrap",
                      idx === 4 ? "text-right" : "text-left",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.key}
                  onClick={() => (row.key.startsWith("r-")
                    ? onViewRecurring(recurring.find((r) => `r-${r.id}` === row.key)!)
                    : onViewInstallment(installments.find((it) => `i-${it.id}` === row.key)!))}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-[var(--surface2)]",
                    !row.active && "opacity-55",
                  )}
                >
                  <td className={cn("px-[14px] py-[13px] align-middle", i < rows.length - 1 && "border-b border-[var(--border-color)]")}>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-[var(--text)]">{row.name}</div>
                      {row.sub && <div className="truncate font-mono text-[11px] text-[var(--text-sub)]">{row.sub}</div>}
                    </div>
                  </td>
                  <td className={cn("px-[14px] py-[13px] align-middle", i < rows.length - 1 && "border-b border-[var(--border-color)]")}>
                    <span className="inline-flex items-center gap-[7px] text-[12.5px] text-[var(--text)]">
                      <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: row.color }} />
                      {row.categoryName}
                    </span>
                  </td>
                  <td className={cn("px-[14px] py-[13px] align-middle font-mono text-[12px] text-[var(--text-sub)]", i < rows.length - 1 && "border-b border-[var(--border-color)]")}>
                    {row.frequency}
                  </td>
                  <td className={cn("px-[14px] py-[13px] align-middle font-mono text-[12px] text-[var(--text-sub)]", i < rows.length - 1 && "border-b border-[var(--border-color)]")}>
                    {fmtDate(row.next)}
                  </td>
                  <td className={cn("px-[14px] py-[13px] text-right align-middle", i < rows.length - 1 && "border-b border-[var(--border-color)]")}>
                    <Money cents={row.type === "Income" ? row.value : -row.value} className="text-[14px]" />
                  </td>
                  <td className={cn("px-[14px] py-[13px] align-middle", i < rows.length - 1 && "border-b border-[var(--border-color)]")}>
                    <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>
                  </td>
                  <td className={cn("px-[14px] py-[13px] text-right align-middle", i < rows.length - 1 && "border-b border-[var(--border-color)]")} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">{row.actions}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
