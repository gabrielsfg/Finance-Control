"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90svh]">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Novo orçamento</DialogTitle>
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
            <Button size="sm" disabled={createBudget.isPending} onClick={handleSubmit}>
              {createBudget.isPending ? "Criando..." : "Criar orçamento"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
