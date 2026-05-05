"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, X, CalendarDays } from "lucide-react";
import { TransactionsHeader } from "@/features/transactions/components/TransactionsHeader";
import { TransactionsFilterBar } from "@/features/transactions/components/TransactionsFilterBar";
import { TransactionsSummary } from "@/features/transactions/components/TransactionsSummary";
import { TransactionsTable } from "@/features/transactions/components/TransactionsTable";
import { TransactionsPagination } from "@/features/transactions/components/TransactionsPagination";
import { CreateTransactionModal } from "@/features/transactions/components/CreateTransactionModal";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { DeleteTransactionModal } from "@/features/transactions/components/DeleteTransactionModal";
import { useTransactionsFiltered } from "@/features/transactions/hooks/useTransactions";
import { defaultTxFilter, buildTxDateRange } from "@/features/transactions/utils/filterDates";
import type { TransactionsFilter } from "@/features/transactions/types/filters.types";
import type { TransactionItem, TransactionType } from "@/lib/types/transactions.types";

type TypeFilter = "All" | TransactionType;

function parseDateLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function initFilterFromParam(dateParam: string | null): TransactionsFilter {
  const base = defaultTxFilter();
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return base;
  // Use custom-range covering only that day
  return { ...base, preset: "custom-range", startDate: dateParam, finishDate: dateParam };
}

const PAGE_SIZE = 12;

export function TransactionsPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [filter, setFilter] = useState<TransactionsFilter>(() => initFilterFromParam(dateParam));
  const [filterDay, setFilterDay] = useState<string | null>(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(() => searchParams.get("new") === "1");
  const [editTarget, setEditTarget] = useState<TransactionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionItem | null>(null);

  const { start, finish } = buildTxDateRange(filter);

  const { data: allTransactions, isLoading, isError } = useTransactionsFiltered({
    startDate: start,
    finishDate: finish,
    budgetIds: filter.budgetIds.length > 0 ? filter.budgetIds : undefined,
    accountIds: filter.accountIds.length > 0 ? filter.accountIds : undefined,
    categoryIds: filter.categoryIds.length > 0 ? filter.categoryIds : undefined,
    subCategoryIds: filter.subCategoryIds.length > 0 ? filter.subCategoryIds : undefined,
  });

  const filtered = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions.filter((t) => {
      if (filterDay && t.transactionDate !== filterDay) return false;
      if (typeFilter !== "All" && t.type !== typeFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTransactions, filterDay, typeFilter, search]);

  const totalIncome = filtered.filter((t) => t.type === "Income").reduce((s, t) => s + t.value, 0);
  const totalExpense = filtered.filter((t) => t.type === "Expense").reduce((s, t) => s + t.value, 0);
  const balance = totalIncome - totalExpense;

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(f: TransactionsFilter) {
    setFilter(f);
    setFilterDay(null);
    setPage(1);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar transações. Tente novamente.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <TransactionsHeader
          filteredCount={filtered.length}
          filter={filter}
          onFilterChange={handleFilterChange}
          onCreateClick={() => setCreateOpen(true)}
        />

        <TransactionsFilterBar
          typeFilter={typeFilter}
          search={search}
          onTypeFilterChange={(t) => { setTypeFilter(t); setPage(1); }}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
        />

        {filterDay && (
          <div className="flex items-center gap-2">
            <div className="border-border bg-surface2 flex items-center gap-2 rounded-lg border px-3 py-1.5">
              <CalendarDays size={13} className="text-green shrink-0" />
              <span className="text-text-sub text-[12px]">{formatDayLabel(filterDay)}</span>
              <button
                type="button"
                onClick={() => { setFilterDay(null); setPage(1); }}
                className="text-text-muted hover:text-text ml-1 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <TransactionsSummary
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
        />

        <TransactionsTable
          transactions={paginated}
          search={search}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />

        <TransactionsPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <CreateTransactionModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditTransactionModal transaction={editTarget} onClose={() => setEditTarget(null)} />
      <DeleteTransactionModal transaction={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
