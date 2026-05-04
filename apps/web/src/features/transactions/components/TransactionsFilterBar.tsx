"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types/transactions.types";

type TypeFilter = "All" | TransactionType;

type Props = {
  typeFilter: TypeFilter;
  search: string;
  onTypeFilterChange: (type: TypeFilter) => void;
  onSearchChange: (value: string) => void;
};

export const TransactionsFilterBar = ({ typeFilter, search, onTypeFilterChange, onSearchChange }: Props) => (
  <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
    <div className="bg-surface2 flex rounded-lg p-0.5">
      {(["All", "Income", "Expense"] as TypeFilter[]).map((t) => (
        <button
          key={t}
          onClick={() => onTypeFilterChange(t)}
          className={cn(
            "rounded-md px-3 py-1 text-[13px] transition-colors",
            typeFilter === t ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text-sub",
          )}
        >
          {t === "All" ? "Todos" : t === "Income" ? "Receitas" : "Despesas"}
        </button>
      ))}
    </div>

    <div
      className="border-border bg-surface2 focus-within:border-green flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors"
      style={{ minWidth: 160 }}
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
