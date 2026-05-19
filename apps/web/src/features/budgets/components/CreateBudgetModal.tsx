"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateBudget } from "@/features/budgets/hooks/useBudgets";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import type { BudgetRecurrence } from "@/lib/types/budgets.types";
import {
  StepIndicator,
  Step1,
  Step2,
  Step3,
  type DraftArea,
} from "./budgetModalShared";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onClose: () => void };

export function CreateBudgetModal({ open, onClose }: Props) {
  const createBudget = useCreateBudget();
  const { data: subCategories = [] } = useSubCategories();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [recurrence, setRecurrence] = useState<BudgetRecurrence>("Monthly");
  const [startDay, setStartDay] = useState(1);
  const [areas, setAreas] = useState<DraftArea[]>([]);

  const handleClose = () => {
    setStep(1); setName(""); setRecurrence("Monthly"); setStartDay(1); setAreas([]);
    onClose();
  };

  const handleSubmit = async () => {
    await createBudget.mutateAsync({
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
    });
    handleClose();
  };

  const hasAllocs = areas.some((a) => a.allocations.length > 0);

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
          <h2 className="font-display font-600 text-text text-[17px]">Novo orçamento</h2>
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
                disabled={step === 1 ? !name.trim() : !hasAllocs}
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              >
                Próximo <ChevronRight size={14} />
              </Button>
            ) : (
              <Button className="flex-1" disabled={createBudget.isPending} onClick={handleSubmit}>
                {createBudget.isPending ? "Criando..." : "Criar orçamento"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
