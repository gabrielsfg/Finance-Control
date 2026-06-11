"use client";

import { useState, useMemo } from "react";
import { Loader2, Plus, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/features/budgets/components/BudgetCard";
import { BudgetsSummaryBar } from "@/features/budgets/components/BudgetsSummaryBar";
import { CreateBudgetModal } from "@/features/budgets/components/CreateBudgetModal";
import { EditBudgetModal } from "@/features/budgets/components/EditBudgetModal";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { parseLocalDate, shiftByRecurrence } from "@/lib/utils/budgetPeriod";
import { usePageNova } from "@/lib/hooks/usePageHeader";
import type { Budget, BudgetRecurrence } from "@/lib/types/budgets.types";

function computePeriod(startDate: string, recurrence: BudgetRecurrence, offset: number) {
  const now = new Date();
  const start = shiftByRecurrence(parseLocalDate(startDate), recurrence, offset);
  const end = shiftByRecurrence(new Date(start), recurrence, 1);

  const fmt = (d: Date) => format(d, "d MMM", { locale: ptBR });
  const label = `${fmt(start)} – ${fmt(end)}`;

  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  const dayOfPeriod = offset === 0
    ? Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000))
    : offset < 0 ? totalDays : 1;

  return { start, end, label, totalDays, dayOfPeriod, referenceDate: format(start, "yyyy-MM-dd") };
}

export function BudgetsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);
  const [periodOffset, setPeriodOffset] = useState(0);

  usePageNova("Novo orçamento", () => setShowCreate(true));

  // Load without referenceDate first to get the active budget and its recurrence config.
  const { data: baseBudgets, isLoading, isError } = useBudgets();
  const activeBudget = baseBudgets?.find((b) => b.isActive);

  // Derive the referenceDate for the selected offset period.
  const period = useMemo(() => {
    if (!activeBudget) return null;
    return computePeriod(activeBudget.startDate, activeBudget.recurrence, periodOffset);
  }, [activeBudget, periodOffset]);

  // Fetch budgets for the selected period (skipped when offset === 0 — baseBudgets already covers it).
  const { data: shiftedBudgets } = useBudgets(periodOffset !== 0 ? period?.referenceDate : undefined);
  const budgets = periodOffset !== 0 ? shiftedBudgets ?? baseBudgets : baseBudgets;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar orçamentos. Tente novamente.</p>
      </div>
    );
  }

  const active   = budgets?.filter((b) => b.isActive)  ?? [];
  const inactive = budgets?.filter((b) => !b.isActive) ?? [];
  const hasBudgets = !!budgets?.length;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Orçamentos</h1>
            <p className="text-text-muted mt-0.5 text-[13px]">
              {hasBudgets ? `${budgets!.length} orçamento${budgets!.length !== 1 ? "s" : ""}` : "Nenhum orçamento"}
            </p>
          </div>
          {/* Period navigation — only shown when there's an active budget */}
          {period && (
            <div className="flex items-center gap-2">
              {periodOffset > 0 && (
                <span className="bg-purple/15 text-purple rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  Futuro
                </span>
              )}
              <div className="border-border bg-surface flex items-center gap-1 rounded-xl border px-2 py-1.5">
                <button
                  onClick={() => setPeriodOffset((o) => o - 1)}
                  className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-surface2"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-text min-w-[140px] text-center text-[13px] font-medium">{period.label}</span>
                <button
                  onClick={() => setPeriodOffset((o) => o + 1)}
                  className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-surface2"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {hasBudgets ? (
          <>
            <BudgetsSummaryBar
              budgets={budgets!}
              daysInPeriod={period?.totalDays}
              dayOfPeriod={period?.dayOfPeriod}
            />

            {/* Active budgets */}
            {active.length > 0 && (
              <div className="flex flex-col gap-4">
                {active.map((budget) => (
                  <BudgetCard key={budget.id} budget={budget} onEdit={setEditTarget} />
                ))}
              </div>
            )}

            {/* Inactive budgets */}
            {inactive.length > 0 && (
              <div>
                <p className="text-text-muted mb-3 text-[12px] font-medium uppercase tracking-[0.06em]">
                  Orçamentos Inativos
                </p>
                <div className="flex flex-col gap-4">
                  {inactive.map((budget) => (
                    <BudgetCard key={budget.id} budget={budget} onEdit={setEditTarget} inactive />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <div className="bg-surface2 mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]">
              <Target size={22} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="font-500 text-text text-[15px]">Nenhum orçamento criado</p>
            <p className="text-text-muted mt-1 text-[13px]">
              Crie um orçamento para acompanhar e controlar seus gastos mensais.
            </p>
            <Button size="sm" className="mt-5" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              Criar orçamento
            </Button>
          </div>
        )}
      </div>

      <CreateBudgetModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditBudgetModal budget={editTarget} onClose={() => setEditTarget(null)} />
    </>
  );
}
