"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types/transactions.types";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type TypeFilter = "All" | TransactionType;

type Props = {
  filterMonth: number;
  filterYear: number;
  typeFilter: TypeFilter;
  search: string;
  onNavigateMonth: (dir: -1 | 1) => void;
  onTypeFilterChange: (type: TypeFilter) => void;
  onSearchChange: (value: string) => void;
};

export const TransactionsFilterBar = ({
  filterMonth,
  filterYear,
  typeFilter,
  search,
  onNavigateMonth,
  onTypeFilterChange,
  onSearchChange,
}: Props) => (
  <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
    <div className="flex items-center gap-1">
      <button
        onClick={() => onNavigateMonth(-1)}
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
      >
        <ChevronLeft size={15} />
      </button>
      <span className="text-text font-500 min-w-[130px] text-center text-[14px]">
        {MONTHS[filterMonth]} {filterYear}
      </span>
      <button
        onClick={() => onNavigateMonth(1)}
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </div>

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
