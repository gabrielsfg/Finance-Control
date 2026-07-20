"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionsFilters } from "./TransactionsFilters";
import type { TransactionsFilter } from "../types/filters.types";

type Props = {
  filteredCount: number;
  filter: TransactionsFilter;
  onFilterChange: (f: TransactionsFilter) => void;
  onCreateClick: () => void;
};

export const TransactionsHeader = ({ filteredCount, filter, onFilterChange, onCreateClick }: Props) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="font-display font-bold text-[var(--text)] text-[22px] tracking-[-0.02em]">Transações</h1>
      <p className="text-text-muted mt-0.5 text-[13px]">
        {filteredCount} transaç{filteredCount !== 1 ? "ões" : "ão"}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <TransactionsFilters filter={filter} onChange={onFilterChange} />
      <Button size="xl" onClick={onCreateClick}>
        <Plus />
        Nova transação
      </Button>
    </div>
  </div>
);
