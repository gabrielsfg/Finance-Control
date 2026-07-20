"use client";

import { useState, useMemo } from "react";
import { Loader2, Plus, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { BudgetCard } from "@/features/budgets/components/BudgetCard";
import { BudgetSummaryCard } from "@/features/budgets/components/BudgetSummaryCard";
import { BudgetsSummaryBar } from "@/features/budgets/components/BudgetsSummaryBar";
import { CreateBudgetModal } from "@/features/budgets/components/CreateBudgetModal";
import { EditBudgetModal } from "@/features/budgets/components/EditBudgetModal";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { parseLocalDate, shiftByRecurrence } from "@/lib/utils/budgetPeriod";
import { usePageNova, usePageFilter } from "@/lib/hooks/usePageHeader";
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

  // Period navigation lives in the topbar's filter slot.
  usePageFilter(
    period ? (
      <div className="flex items-center gap-2">
        {periodOffset > 0 && (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em]"
            style={{ background: "color-mix(in srgb, var(--brand-accent) 14%, transparent)", color: "var(--brand-accent)" }}
          >
            Futuro
          </span>
        )}
        <div className="flex h-[42px] items-center gap-1 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-1.5">
          <button
            onClick={() => setPeriodOffset((o) => o - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="min-w-[130px] text-center text-[13px] font-medium text-[var(--text)]">{period.label}</span>
          <button
            onClick={() => setPeriodOffset((o) => o + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    ) : null,
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-[var(--text-sub)]">Erro ao carregar orçamentos. Tente novamente.</p>
      </div>
    );
  }

  const active   = budgets?.filter((b) => b.isActive)  ?? [];
  const inactive = budgets?.filter((b) => !b.isActive) ?? [];
  const hasBudgets = !!budgets?.length;

  const subtitle = hasBudgets
    ? `${budgets!.length} orçamento${budgets!.length !== 1 ? "s" : ""}`
    : "Nenhum orçamento";

  return (
    <>
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Orçamentos" subtitle={subtitle} />

        <div className="flex flex-col gap-5">
          {hasBudgets ? (
            <>
              <BudgetsSummaryBar
                budgets={budgets!}
                daysInPeriod={period?.totalDays}
                dayOfPeriod={period?.dayOfPeriod}
              />

              {active.length > 0 && (
                <div className="flex flex-col gap-4">
                  {active.map((budget) => (
                    <div key={budget.id} className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
                      <div className="lg:col-span-8">
                        <BudgetCard budget={budget} onEdit={setEditTarget} />
                      </div>
                      <div className="lg:col-span-4">
                        <BudgetSummaryCard budget={budget} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {inactive.length > 0 && (
                <div>
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">
                    Orçamentos inativos
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
            <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] px-5 py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface2)] text-[var(--brand-accent)]">
                <Target size={24} strokeWidth={1.75} />
              </div>
              <h4 className="font-display text-[16px] font-bold text-[var(--text)]">Nenhum orçamento ainda</h4>
              <p className="mx-auto mt-1.5 max-w-[340px] text-[13.5px] text-[var(--text-sub)]">
                Crie um orçamento para acompanhar e controlar seus gastos do período.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
                style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
              >
                <Plus size={16} strokeWidth={2} />
                Criar orçamento
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateBudgetModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditBudgetModal budget={editTarget} onClose={() => setEditTarget(null)} />
    </>
  );
}
