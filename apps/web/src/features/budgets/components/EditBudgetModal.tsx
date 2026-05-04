"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateBudget } from "@/features/budgets/hooks/useBudgets";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import type { Budget, BudgetRecurrence } from "@/lib/types/budgets.types";
import {
  StepIndicator,
  Step1,
  Step2,
  Step3,
  uid,
  type DraftArea,
} from "./budgetModalShared";

// Converts a Budget's flat allocation list back into DraftArea[] for editing.
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
      categoryName: alloc.categoryName,
      categoryColor: alloc.categoryColor,
      expectedValue: alloc.allocated,
      allocationType: "Expense",
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

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [recurrence, setRecurrence] = useState<BudgetRecurrence>("Monthly");
  const [startDay, setStartDay] = useState(1);
  const [areas, setAreas] = useState<DraftArea[]>([]);

  // Populate state whenever a different budget is opened
  useEffect(() => {
    if (!budget) return;
    setStep(1);
    setName(budget.name);
    setRecurrence(budget.recurrence);
    setStartDay(startDayFromDate(budget.startDate));
    setAreas(budgetToDraftAreas(budget));
  }, [budget?.id]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

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

  return (
    <Dialog open={!!budget} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90svh]">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Editar orçamento</DialogTitle>
        </DialogHeader>

        <StepIndicator step={step} />

        <div className="flex-1 overflow-y-auto px-0.5">
          {step === 1 && (
            <Step1
              name={name} setName={setName}
              recurrence={recurrence} setRecurrence={setRecurrence}
              startDay={startDay} setStartDay={setStartDay}
            />
          )}
          {step === 2 && (
            <Step2 areas={areas} setAreas={setAreas} subCategories={subCategories} />
          )}
          {step === 3 && (
            <Step3 name={name} recurrence={recurrence} startDay={startDay} areas={areas} />
          )}
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              size="sm"
              disabled={step === 1 ? !name.trim() : !hasAllocs}
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
            >
              Próximo <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" disabled={updateBudget.isPending} onClick={handleSubmit}>
              {updateBudget.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
