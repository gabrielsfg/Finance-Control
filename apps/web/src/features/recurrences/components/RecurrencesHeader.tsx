"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecurrencesFilters } from "./RecurrencesFilters";
import type { RecurrenceFilter } from "@/lib/types/recurrences.types";

type Props = {
  recurringCount: number;
  installmentCount: number;
  filter: RecurrenceFilter;
  onFilterChange: (f: RecurrenceFilter) => void;
  onCreateRecurring: () => void;
  onCreateInstallment: () => void;
};

export function RecurrencesHeader({
  recurringCount,
  installmentCount,
  filter,
  onFilterChange,
  onCreateRecurring,
  onCreateInstallment,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display font-bold text-[var(--text)] text-[22px] tracking-[-0.02em]">Recorrências</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">
          {recurringCount} assinatura{recurringCount !== 1 ? "s" : ""} ativa{recurringCount !== 1 ? "s" : ""} · {installmentCount} parcelamento{installmentCount !== 1 ? "s" : ""} em aberto
        </p>
      </div>
      <div className="flex items-center gap-2">
        <RecurrencesFilters filter={filter} onChange={onFilterChange} />
        <Button size="xl" variant="secondary" onClick={onCreateInstallment}>
          <Plus />
          Parcelamento
        </Button>
        <Button size="xl" onClick={onCreateRecurring}>
          <Plus />
          Assinatura
        </Button>
      </div>
    </div>
  );
}
