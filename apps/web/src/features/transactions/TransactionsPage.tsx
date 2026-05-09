"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { TransactionsFilters } from "@/features/transactions/components/TransactionsFilters";
import { TransactionsSummary } from "@/features/transactions/components/TransactionsSummary";
import { TransactionsList } from "@/features/transactions/components/TransactionsList";
import { TransactionsPagination } from "@/features/transactions/components/TransactionsPagination";
import { TransactionDrawer, type DrawerMode } from "@/features/transactions/components/TransactionDrawer";
import { DeleteTransactionModal } from "@/features/transactions/components/DeleteTransactionModal";
import { useTransactionsFiltered } from "@/features/transactions/hooks/useTransactions";
import { defaultTxFilter, buildTxDateRange, activeTxDateLabel } from "@/features/transactions/utils/filterDates";
import { usePageNova, usePageFilter, usePageSearch } from "@/lib/hooks/usePageHeader";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { TransactionsFilter } from "@/features/transactions/types/filters.types";
import type { TransactionItem } from "@/lib/types/transactions.types";

function initFilterFromParam(dateParam: string | null): TransactionsFilter {
  const base = defaultTxFilter();
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return base;
  return { ...base, preset: "custom-range", startDate: dateParam, finishDate: dateParam };
}

const TYPE_FILTER_LABELS: Record<TransactionsFilter["typeFilter"], string> = {
  All: "Todos",
  Income: "Receitas",
  Expense: "Despesas",
  Transfer: "Transferências",
};

export function TransactionsPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [filter, setFilter] = useState<TransactionsFilter>(() => initFilterFromParam(dateParam));
  const [filterDay, setFilterDay] = useState<string | null>(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(() => searchParams.get("new") === "1");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(() =>
    searchParams.get("new") === "1" ? "create" : "create",
  );
  const [drawerTransaction, setDrawerTransaction] = useState<TransactionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionItem | null>(null);

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();
  const { data: budgetsRaw  = [] } = useBudgets();

  const metaCategories = useMemo(() =>
    Array.from(
      new Map(subcatsRaw.map(s => [s.categoryId, {
        id: s.categoryId,
        name: s.categoryName,
        color: getCategoryColor(s.categoryColor, s.categoryName),
      }])).values()
    ), [subcatsRaw]);

  const metaSubcategories = useMemo(() =>
    subcatsRaw.map(s => ({
      id: s.id,
      name: s.name,
      color: getCategoryColor(s.categoryColor, s.categoryName),
    })), [subcatsRaw]);

  const metaAccounts = useMemo(() =>
    accountsRaw.map(a => ({ id: a.id, name: a.name })), [accountsRaw]);

  const metaBudgets = useMemo(() =>
    budgetsRaw.map(b => ({ id: b.id, name: b.name })), [budgetsRaw]);

  function handleFilterChange(f: TransactionsFilter) {
    setFilter(f);
    setFilterDay(null);
    setPage(1);
  }

  usePageNova("Nova transação", () => {
    setDrawerMode("create");
    setDrawerTransaction(null);
    setDrawerOpen(true);
  });
  usePageSearch();
  usePageFilter(
    <TransactionsFilters filter={filter} onChange={handleFilterChange} />
  );

  const { start, finish } = buildTxDateRange(filter);

  const { data: response, isLoading, isError } = useTransactionsFiltered({
    startDate: start,
    finishDate: finish,
    budgetIds: filter.budgetIds.length > 0 ? filter.budgetIds : undefined,
    accountIds: filter.accountIds.length > 0 ? filter.accountIds : undefined,
    categoryIds: filter.categoryIds.length > 0 ? filter.categoryIds : undefined,
    subCategoryIds: filter.subCategoryIds.length > 0 ? filter.subCategoryIds : undefined,
    page,
    pageSize,
    sortField: filter.sortField,
    sortOrder: filter.sortOrder,
  });

  const items = response?.page.items ?? [];
  const totalIncome = response?.totalIncome ?? 0;
  const totalExpense = response?.totalExpense ?? 0;
  const balance = response?.balance ?? 0;
  const previousTotalIncome = response?.previousTotalIncome;
  const previousTotalExpense = response?.previousTotalExpense;
  const previousBalance = response?.previousBalance;
  const totalPages = response?.page.totalPages ?? 1;
  const totalItems = response?.page.totalItems ?? 0;
  const rowCount = response?.page.rowCount ?? 0;

  // Client-side typeFilter and filterDay filtering (applied on top of server items)
  const visibleItems = useMemo(() => {
    return items.filter((t) => {
      if (filterDay && t.transactionDate !== filterDay) return false;
      if (filter.typeFilter === "Transfer" && t.recurringTransactionId === null && t.parentTransactionId === null) return false;
      if (filter.typeFilter !== "All" && filter.typeFilter !== "Transfer" && t.type !== filter.typeFilter) return false;
      return true;
    });
  }, [items, filterDay, filter.typeFilter]);

  // ── Active filter chips ────────────────────────────────────────────────────
  type Chip = { id: string; label: string; color?: string; onRemove: () => void };

  const activeChips = useMemo<Chip[]>(() => {
    const chips: Chip[] = [];

    if (filter.preset !== "current-month") {
      chips.push({
        id: "preset",
        label: activeTxDateLabel(filter),
        onRemove: () => { setFilter(f => ({ ...f, preset: "current-month" })); setPage(1); },
      });
    }

    if (filter.typeFilter !== "All") {
      chips.push({
        id: "typeFilter",
        label: TYPE_FILTER_LABELS[filter.typeFilter],
        onRemove: () => { setFilter(f => ({ ...f, typeFilter: "All" })); setPage(1); },
      });
    }

    for (const id of filter.categoryIds) {
      const cat = metaCategories.find(c => c.id === id);
      if (cat) chips.push({
        id: `cat-${id}`,
        label: cat.name,
        color: cat.color,
        onRemove: () => {
          setFilter(f => ({ ...f, categoryIds: f.categoryIds.filter(x => x !== id) }));
          setPage(1);
        },
      });
    }

    for (const id of filter.subCategoryIds) {
      const sub = metaSubcategories.find(s => s.id === id);
      if (sub) chips.push({
        id: `sub-${id}`,
        label: sub.name,
        color: sub.color,
        onRemove: () => {
          setFilter(f => ({ ...f, subCategoryIds: f.subCategoryIds.filter(x => x !== id) }));
          setPage(1);
        },
      });
    }

    for (const id of filter.accountIds) {
      const acc = metaAccounts.find(a => a.id === id);
      if (acc) chips.push({
        id: `acc-${id}`,
        label: acc.name,
        onRemove: () => {
          setFilter(f => ({ ...f, accountIds: f.accountIds.filter(x => x !== id) }));
          setPage(1);
        },
      });
    }

    for (const id of filter.budgetIds) {
      const bud = metaBudgets.find(b => b.id === id);
      if (bud) chips.push({
        id: `bud-${id}`,
        label: bud.name,
        onRemove: () => {
          setFilter(f => ({ ...f, budgetIds: f.budgetIds.filter(x => x !== id) }));
          setPage(1);
        },
      });
    }

    if (filterDay) {
      const [y, m, d] = filterDay.split("-").map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      chips.push({
        id: "filterDay",
        label,
        onRemove: () => { setFilterDay(null); setPage(1); },
      });
    }

    return chips;
  }, [filter, filterDay, metaCategories, metaSubcategories, metaAccounts, metaBudgets]);

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
        {/* Page title */}
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Transações</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">
            {totalItems} transaç{totalItems !== 1 ? "ões" : "ão"}
          </p>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activeChips.map(chip => (
                <div
                  key={chip.id}
                  className="border-border bg-surface2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px]"
                >
                  {chip.color && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: chip.color }}
                    />
                  )}
                  <span className="text-text-sub">{chip.label}</span>
                  <button
                    onClick={chip.onRemove}
                    className="text-text-muted hover:text-red ml-0.5 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <TransactionsSummary
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          previousTotalIncome={previousTotalIncome}
          previousTotalExpense={previousTotalExpense}
          previousBalance={previousBalance}
        />

        <TransactionsList
          transactions={visibleItems}
          subcategoryMeta={metaSubcategories}
          onView={(t) => {
            setDrawerTransaction(t);
            setDrawerMode("detail");
            setDrawerOpen(true);
          }}
          onEdit={(t) => {
            setDrawerTransaction(t);
            setDrawerMode("edit");
            setDrawerOpen(true);
          }}
          onDelete={setDeleteTarget}
        />

        <TransactionsPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          rowCount={rowCount}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      <TransactionDrawer
        open={drawerOpen}
        mode={drawerMode}
        transaction={drawerTransaction}
        onClose={() => setDrawerOpen(false)}
        onDeleteRequest={(t) => {
          setDrawerOpen(false);
          setDeleteTarget(t);
        }}
      />
      <DeleteTransactionModal transaction={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
