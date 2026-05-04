"use client";

import { useState } from "react";
import { Plus, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/features/budgets/components/BudgetCard";
import { BudgetsSummaryBar } from "@/features/budgets/components/BudgetsSummaryBar";
import { CreateBudgetModal } from "@/features/budgets/components/CreateBudgetModal";
import { EditBudgetModal } from "@/features/budgets/components/EditBudgetModal";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import type { Budget } from "@/lib/types/budgets.types";

export function BudgetsPage() {
  const { data: budgets, isLoading, isError } = useBudgets();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);

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

  const hasBudgets = !!budgets?.length;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Orçamentos</h1>
            <p className="text-text-muted mt-0.5 text-[13px]">
              {hasBudgets ? `${budgets!.length} orçamento${budgets!.length !== 1 ? "s" : ""}` : "Nenhum orçamento"}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            Novo orçamento
          </Button>
        </div>

        {hasBudgets ? (
          <>
            <BudgetsSummaryBar budgets={budgets!} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {budgets!.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} onEdit={setEditTarget} />
              ))}
            </div>
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
