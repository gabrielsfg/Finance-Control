"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Props = {
  filteredCount: number;
  filterMonth: number;
  filterYear: number;
  onCreateClick: () => void;
};

export const TransactionsHeader = ({ filteredCount, filterMonth, filterYear, onCreateClick }: Props) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Transações</h1>
      <p className="text-text-muted mt-0.5 text-[13px]">
        {filteredCount} transaç{filteredCount !== 1 ? "ões" : "ão"} em{" "}
        {MONTHS[filterMonth]} {filterYear}
      </p>
    </div>
    <Button size="sm" onClick={onCreateClick}>
      <Plus size={14} />
      Nova transação
    </Button>
  </div>
);
