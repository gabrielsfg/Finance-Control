"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { TransactionsHeader } from "@/features/transactions/components/TransactionsHeader";
import { TransactionsFilterBar } from "@/features/transactions/components/TransactionsFilterBar";
import { TransactionsSummary } from "@/features/transactions/components/TransactionsSummary";
import { TransactionsTable } from "@/features/transactions/components/TransactionsTable";
import { TransactionsPagination } from "@/features/transactions/components/TransactionsPagination";
import { CreateTransactionModal } from "@/features/transactions/components/CreateTransactionModal";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { DeleteTransactionModal } from "@/features/transactions/components/DeleteTransactionModal";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { TransactionItem, TransactionType } from "@/lib/types/transactions.types";

type TypeFilter = "All" | TransactionType;

function parseDateLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const PAGE_SIZE = 12;

export function TransactionsPage() {
  const { data: allTransactions, isLoading, isError } = useTransactions();

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TransactionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionItem | null>(null);

  const navigateMonth = (dir: -1 | 1) => {
    setPage(1);
    setFilterMonth((m) => {
      const next = m + dir;
      if (next < 0) { setFilterYear((y) => y - 1); return 11; }
      if (next > 11) { setFilterYear((y) => y + 1); return 0; }
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions.filter((t) => {
      const d = parseDateLocal(t.transactionDate);
      if (d.getMonth() !== filterMonth || d.getFullYear() !== filterYear) return false;
      if (typeFilter !== "All" && t.type !== typeFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTransactions, filterMonth, filterYear, typeFilter, search]);

  const totalIncome = filtered.filter((t) => t.type === "Income").reduce((s, t) => s + t.value, 0);
  const totalExpense = filtered.filter((t) => t.type === "Expense").reduce((s, t) => s + t.value, 0);
  const balance = totalIncome - totalExpense;

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          filterMonth={filterMonth}
          filterYear={filterYear}
          onCreateClick={() => setCreateOpen(true)}
        />

        <TransactionsFilterBar
          filterMonth={filterMonth}
          filterYear={filterYear}
          typeFilter={typeFilter}
          search={search}
          onNavigateMonth={navigateMonth}
          onTypeFilterChange={(t) => { setTypeFilter(t); setPage(1); }}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
        />

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
