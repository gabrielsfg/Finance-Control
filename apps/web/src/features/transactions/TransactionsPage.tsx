"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { ExportCsvButton, type ExportState } from "@/components/shared/ExportCsvButton";
import { transactionsApi } from "@/lib/api/transactions";
import { exportTransactionsToCsv } from "@/features/transactions/utils/transactionsCsv";
import { TransactionsFilters } from "@/features/transactions/components/TransactionsFilters";
import { TransactionsSummary } from "@/features/transactions/components/TransactionsSummary";
import { TransactionsList } from "@/features/transactions/components/TransactionsList";
import { TransactionsPagination } from "@/features/transactions/components/TransactionsPagination";
import { TransactionDrawer, type DrawerMode } from "@/features/transactions/components/TransactionDrawer";
import { DeleteTransactionModal } from "@/features/transactions/components/DeleteTransactionModal";
import { ImportDrawer } from "@/features/import/components/ImportDrawer";
import { ImportReview, ImportDone } from "@/features/import/components/ImportReview";
import { useImportFlow } from "@/features/import/hooks/useImportFlow";
import { useTransactionsFiltered } from "@/features/transactions/hooks/useTransactions";
import { defaultTxFilter, buildTxDateRange, activeTxDateLabel } from "@/features/transactions/utils/filterDates";
import { usePageNova, usePageFilter, usePageSearch, usePageImport } from "@/lib/hooks/usePageHeader";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useActiveBudget } from "@/features/budgets/hooks/useActiveBudget";
import { useTags } from "@/features/transactions/hooks/useTags";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { parseLocalDate } from "@/lib/utils/budgetPeriod";
import { formatCurrency } from "@/lib/utils/formatCurrency";
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

/**
 * `useSearchParams` can't resolve during the static prerender (`?date=` /
 * `?new=` only exist per request), so the reader has to sit under a Suspense
 * boundary for Next to fall back to on the server and hydrate on the client.
 * Same shape as MarketRankingPage.
 */
export function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [filter, setFilter] = useState<TransactionsFilter>(() => initFilterFromParam(dateParam));
  const [filterDay, setFilterDay] = useState<string | null>(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [exportState, setExportState] = useState<ExportState>("idle");
  const [drawerOpen, setDrawerOpen] = useState(() => searchParams.get("new") === "1");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(() =>
    searchParams.get("new") === "1" ? "create" : "create",
  );
  const [drawerTransaction, setDrawerTransaction] = useState<TransactionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionItem | null>(null);

  const importFlow = useImportFlow();

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();
  const { data: budgetsRaw  = [] } = useBudgets();
  const { data: tagsRaw     = [] } = useTags();

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
      emoji: s.emoji,
    })), [subcatsRaw]);

  const metaAccounts = useMemo(() =>
    accountsRaw.map(a => ({ id: a.id, name: a.name })), [accountsRaw]);

  const metaBudgets = useMemo(() =>
    budgetsRaw.map(b => ({ id: b.id, name: b.name })), [budgetsRaw]);

  const metaTags = useMemo(() =>
    tagsRaw.map(t => ({ id: t.id, name: t.name })), [tagsRaw]);

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
  usePageImport(importFlow.open);
  usePageSearch(
    (q) => { setSearchQuery(q); setPage(1); },
    "Buscar por descrição, tag, categoria ou conta...",
  );

  // The default period follows the budget, not the calendar. Resolved here rather than
  // baked into the filter state because the budgets load after the first render, and a
  // filter that rewrote itself once they arrived would fight anything the user had
  // already changed.
  const { data: activeBudgetPeriod } = useActiveBudget();
  const { start, finish } = buildTxDateRange(filter, activeBudgetPeriod);

  /**
   * Every filter goes to the server, none of them to the loaded page. The list is
   * paginated, so filtering client-side only ever filtered the rows that happened to be
   * in hand — the totals came from the whole period while the table showed a subset of
   * one page, and page 2 could hold matches nobody ever saw.
   *
   * Shared with the export, which sends the same object minus the paging.
   */
  const queryFilters = {
    // A day picked from the calendar is just a one-day range.
    startDate: filterDay ?? start,
    finishDate: filterDay ?? finish,
    budgetIds: filter.budgetIds.length > 0 ? filter.budgetIds : undefined,
    accountIds: filter.accountIds.length > 0 ? filter.accountIds : undefined,
    categoryIds: filter.categoryIds.length > 0 ? filter.categoryIds : undefined,
    subCategoryIds: filter.subCategoryIds.length > 0 ? filter.subCategoryIds : undefined,
    tagIds: filter.tagIds.length > 0 ? filter.tagIds : undefined,
    type: filter.typeFilter !== "All" ? filter.typeFilter : undefined,
    minValue: filter.minValue ?? undefined,
    maxValue: filter.maxValue ?? undefined,
    search: searchQuery.trim() || undefined,
    sortField: filter.sortField,
    sortOrder: filter.sortOrder,
  };

  // Exporting the loaded page would hand the user a slice of what they asked for, which
  // in a reconciliation file is worse than no export at all.
  async function handleExport() {
    setExportState("loading");
    try {
      const rows = await transactionsApi.exportFiltered(queryFilters);
      exportTransactionsToCsv(rows);
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  }

  // Day subtotals only mean "the day" while the date range is the sole filter. Search,
  // type, category, account, budget, tag and value bounds all narrow what lands in a day,
  // and a subtotal over a narrowed day is a number the user cannot reconcile against
  // anything.
  const onlyDateFilter =
    !searchQuery.trim() &&
    filter.typeFilter === "All" &&
    filter.categoryIds.length === 0 &&
    filter.subCategoryIds.length === 0 &&
    filter.accountIds.length === 0 &&
    filter.budgetIds.length === 0 &&
    filter.tagIds.length === 0 &&
    filter.minValue === null &&
    filter.maxValue === null;

  usePageFilter(
    <div className="flex items-center gap-2">
      <TransactionsFilters filter={filter} onChange={handleFilterChange} />
      <ExportCsvButton state={exportState} onClick={handleExport} />
    </div>
  );

  const { data: response, isLoading, isError } = useTransactionsFiltered({
    ...queryFilters,
    page,
    pageSize,
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

    if (filter.minValue !== null || filter.maxValue !== null) {
      const min = filter.minValue === null ? null : formatCurrency(filter.minValue / 100);
      const max = filter.maxValue === null ? null : formatCurrency(filter.maxValue / 100);
      chips.push({
        id: "valueRange",
        label: min && max ? `${min} – ${max}` : min ? `A partir de ${min}` : `Até ${max}`,
        onRemove: () => { setFilter(f => ({ ...f, minValue: null, maxValue: null })); setPage(1); },
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

    for (const id of filter.tagIds) {
      const tag = metaTags.find(t => t.id === id);
      if (tag) chips.push({
        id: `tag-${id}`,
        label: `#${tag.name}`,
        onRemove: () => {
          setFilter(f => ({ ...f, tagIds: f.tagIds.filter(x => x !== id) }));
          setPage(1);
        },
      });
    }

    if (filterDay) {
      const label = parseLocalDate(filterDay).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      chips.push({
        id: "filterDay",
        label,
        onRemove: () => { setFilterDay(null); setPage(1); },
      });
    }

    return chips;
  }, [filter, filterDay, metaCategories, metaSubcategories, metaAccounts, metaBudgets, metaTags]);

  // ── Import steps that replace the page content ─────────────────────────────
  if (importFlow.step === "review") {
    return <ImportReview flow={importFlow} />;
  }

  if (importFlow.step === "done") {
    return <ImportDone flow={importFlow} />;
  }

  // ── Normal transactions view ───────────────────────────────────────────────
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
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar
          title="Transações"
          subtitle={`${totalItems} transaç${totalItems !== 1 ? "ões" : "ão"}`}
        />
      <div className="flex flex-col gap-5">
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeChips.map(chip => (
              <div
                key={chip.id}
                className="border-border bg-surface2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px]"
              >
                {chip.color && (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chip.color }} />
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

        <TransactionsSummary
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          previousTotalIncome={previousTotalIncome}
          previousTotalExpense={previousTotalExpense}
          previousBalance={previousBalance}
        />

        <TransactionsList
          transactions={items}
          subcategoryMeta={metaSubcategories}
          grouped={onlyDateFilter}
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
      <ImportDrawer flow={importFlow} />
    </>
  );
}
