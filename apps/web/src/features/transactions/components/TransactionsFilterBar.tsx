"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types/transactions.types";

type TypeFilter = "All" | TransactionType | "Transfer";

const TYPE_ITEMS: { id: TypeFilter; label: string }[] = [
  { id: "All",      label: "Todos" },
  { id: "Income",   label: "Receitas" },
  { id: "Expense",  label: "Despesas" },
  { id: "Transfer", label: "Transferências" },
];

type Props = {
  typeFilter: TypeFilter;
  search: string;
  onTypeFilterChange: (type: TypeFilter) => void;
  onSearchChange: (value: string) => void;
};

export const TransactionsFilterBar = ({ typeFilter, search, onTypeFilterChange, onSearchChange }: Props) => (
  <div className="flex flex-wrap items-center gap-3">
    {/* Type chips */}
    <div className="flex flex-wrap gap-2" role="tablist">
      {TYPE_ITEMS.map(({ id, label }) => {
        const active = typeFilter === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onTypeFilterChange(id)}
            className={cn(
              "h-8 rounded-full border px-3.5 text-[13px] font-medium transition-all outline-none",
              active
                ? "border-green/45 bg-green/15 text-green"
                : "border-border bg-surface text-text-sub hover:border-border-light hover:text-text",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>

    {/* Search */}
    <div
      className="border-border bg-surface focus-within:border-green/60 ml-auto flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors"
      style={{ minWidth: 200 }}
    >
      <Search size={13} className="text-text-muted shrink-0" />
      <input
        type="text"
        placeholder="Buscar por descrição..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="text-text placeholder:text-text-muted flex-1 bg-transparent text-[14px] focus:outline-none"
      />
    </div>
  </div>
);
