"use client";

import { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateBudget } from "@/features/budgets/hooks/useBudgets";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { CreateSubCategoryModal } from "@/features/categories/components/CreateSubCategoryModal";
import type { Budget, BudgetRecurrence } from "@/lib/types/budgets.types";
import {
  StepIndicator,
  Step1,
  Step2,
  Step3,
  uid,
  type DraftArea,
} from "./budgetModalShared";
import { cn } from "@/lib/utils";

function budgetToDraftAreas(budget: Budget): DraftArea[] {
  const map = new Map<string, DraftArea>();
  for (const alloc of budget.allocations) {
    const key = alloc.areaName ?? "Área";
    if (!map.has(key)) {
      map.set(key, { id: uid(), name: key, allocations: [] });
    }
    map.get(key)!.allocations.push({
      id: uid(),
      subCategoryId: alloc.subCategoryId,
      subCategoryName: alloc.subCategoryName,
      subCategoryEmoji: alloc.subCategoryEmoji,
      categoryName: alloc.categoryName,
      categoryColor: alloc.categoryColor,
      expectedValue: alloc.allocated,
      allocationType: alloc.allocationType,
    });
  }
  return Array.from(map.values());
}

function startDayFromDate(dateStr: string): number {
  return parseInt(dateStr.split("-")[2], 10) || 1;
}

type Props = { budget: Budget | null; onClose: () => void };

export function EditBudgetModal({ budget, onClose }: Props) {
  const updateBudget = useUpdateBudget();
  const { data: subCategories = [] } = useSubCategories();
  const { data: categories = [] } = useCategories();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [recurrence, setRecurrence] = useState<BudgetRecurrence>("Monthly");
  const [startDayStr, setStartDayStr] = useState("1");
  const [areas, setAreas] = useState<DraftArea[]>([]);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);

  useEffect(() => {
    if (!budget) return;
    setStep(1);
    setName(budget.name);
    setRecurrence(budget.recurrence);
    setStartDayStr(String(startDayFromDate(budget.startDate)));
    setAreas(budgetToDraftAreas(budget));
  }, [budget?.id]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const startDay = Number(startDayStr);
  const startDayValid = startDayStr !== "" && startDay >= 1 && startDay <= 31;

  const handleSubmit = async () => {
    if (!budget) return;
    await updateBudget.mutateAsync({
      id: budget.id,
      data: {
        name,
        startDate: startDay,
        recurrence,
        isActive: true,
        areas: areas
          .filter((a) => a.allocations.length > 0)
          .map((a) => ({
            name: a.name || "Área",
            allocations: a.allocations.map((al) => ({
              subCategoryId: al.subCategoryId,
              expectedValue: al.expectedValue,
              allocationType: al.allocationType,
            })),
          })),
      },
    });
    handleClose();
  };

  const hasAllocs = areas.some((a) => a.allocations.length > 0);
  const open = !!budget;

  return (
    <>
      <div
        onClick={handleClose}
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto backdrop-blur-sm bg-black/40" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className={cn(
          "bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <h2 className="font-display font-600 text-text text-[17px]">Editar orçamento</h2>
          <button
            onClick={handleClose}
            title="Fechar"
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="border-border border-b px-6 py-4">
          <StepIndicator step={step} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <Step1
              name={name} setName={setName}
              recurrence={recurrence} setRecurrence={setRecurrence}
              startDayStr={startDayStr} setStartDayStr={setStartDayStr}
            />
          )}
          {step === 2 && (
            <Step2
              areas={areas}
              setAreas={setAreas}
              subCategories={subCategories}
              onNewSubCategory={() => setShowCreateSubCategory(true)}
            />
          )}
          {step === 3 && (
            <Step3 name={name} recurrence={recurrence} startDay={startDay} areas={areas} />
          )}
        </div>

        {/* Footer */}
        <div className="border-border shrink-0 border-t px-6 py-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                className="flex-1"
                disabled={step === 1 ? !name.trim() || !startDayValid : !hasAllocs}
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              >
                Próximo <ChevronRight size={14} />
              </Button>
            ) : (
              <Button className="flex-1" disabled={updateBudget.isPending} onClick={handleSubmit}>
                {updateBudget.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <CreateSubCategoryModal
        open={showCreateSubCategory}
        onClose={() => setShowCreateSubCategory(false)}
        categories={categories}
        zIndex={60}
      />
    </>
  );
}
