"use client";

import { useEffect, useState } from "react";
import { RecurrencesHero } from "./components/RecurrencesHero";
import { RecurrencesTable } from "./components/RecurrencesTable";
import { RecurrencesByCategory } from "./components/RecurrencesByCategory";
import { RecurrenceDrawer } from "./components/RecurrenceDrawer";
import { RecurrenceEditDrawer, type EditTarget } from "./components/RecurrenceEditDrawer";
import { RecurrenceCreateDrawer } from "./components/RecurrenceCreateDrawer";
import { CancelRecurringDialog } from "./components/CancelRecurringDialog";
import { RecurrencesFilters } from "./components/RecurrencesFilters";
import { useRecurrencePage, useCancelRecurring, useReactivateRecurring } from "./hooks/useRecurrences";
import { useRecurrenceMetrics } from "./hooks/useRecurrenceMetrics";
import { useActiveBudget } from "@/features/budgets/hooks/useActiveBudget";
import { usePageNova, usePageFilter } from "@/lib/hooks/usePageHeader";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { defaultRecurrenceFilter } from "@/lib/types/recurrences.types";
import type { RecurrenceFilter, RecurringItem, InstallmentItem } from "@/lib/types/recurrences.types";

type DrawerItem =
  | { kind: "recurring"; item: RecurringItem }
  | { kind: "installment"; item: InstallmentItem };

export function RecurrencesPage() {
  const { data, isLoading } = useRecurrencePage();
  const cancelMutation = useCancelRecurring();
  const reactivateMutation = useReactivateRecurring();
  const { data: activeBudget } = useActiveBudget();

  const [filter, setFilter] = useState<RecurrenceFilter>(defaultRecurrenceFilter());
  const [drawer, setDrawer] = useState<DrawerItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelItem, setCancelItem] = useState<RecurringItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Sync filter period with the active budget period whenever it changes
  useEffect(() => {
    if (activeBudget) {
      setFilter(f => ({ ...f, startDate: activeBudget.startDate, endDate: activeBudget.endDate }));
    }
  }, [activeBudget?.startDate, activeBudget?.endDate]);

  usePageNova("Novo", () => setCreateOpen(true));
  usePageFilter(<RecurrencesFilters filter={filter} onChange={setFilter} />);

  const {
    filteredRecurring,
    filteredInstallments,
    subscriptionNetMonthly,
    installmentNetMonthly,
    subscriptionAnnual,
    nextDebit,
  } = useRecurrenceMetrics(data, filter);

  const showRecurring    = filter.typeFilter === "All" || filter.typeFilter === "Recurring";
  const showInstallments = filter.typeFilter === "All" || filter.typeFilter === "Installment";

  function openDrawer(item: DrawerItem) {
    setDrawer(item);
    setDrawerOpen(true);
  }

  function openEdit(target: EditTarget) {
    setEditTarget(target);
    setEditOpen(true);
  }

  function handleEditFromCard(target: EditTarget) {
    openEdit(target);
  }

  function handleEditFromDrawer(target: DrawerItem) {
    setDrawerOpen(false);
    setTimeout(() => openEdit(target as EditTarget), 250);
  }

  function closeEdit() {
    setEditOpen(false);
    setTimeout(() => setEditTarget(null), 300);
  }

  function handleCancelFromDrawer(item: RecurringItem) {
    setDrawerOpen(false);
    setTimeout(() => setCancelItem(item), 300);
  }

  function handleReactivate(item: RecurringItem) {
    reactivateMutation.mutate(item.id);
    setDrawerOpen(false);
  }

  function handleConfirmCancel() {
    if (!cancelItem) return;
    cancelMutation.mutate(cancelItem.id, {
      onSuccess: () => setCancelItem(null),
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="border-green h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  const activeRecurringCount    = filteredRecurring.filter(r => r.isActive).length;
  const activeInstallmentCount  = filteredInstallments.filter(i => i.remainingInstallments > 0).length;
  const pausedCount             = filteredRecurring.filter(r => !r.isActive).length;
  const activeCount             = activeRecurringCount + activeInstallmentCount;

  const periodLabel = (() => {
    const d = new Date(`${filter.startDate}T00:00:00`);
    const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  const subtitle = `${activeRecurringCount} assinatura${activeRecurringCount !== 1 ? "s" : ""} ativa${activeRecurringCount !== 1 ? "s" : ""} · ${activeInstallmentCount} parcelamento${activeInstallmentCount !== 1 ? "s" : ""} em aberto`;

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar title="Recorrências" subtitle={subtitle} />
    <div className="flex flex-col gap-6">

      {/* Totalizador — single hero card */}
      <RecurrencesHero
        committedMonthly={subscriptionNetMonthly + installmentNetMonthly}
        annual={subscriptionAnnual}
        monthlyIncome={data?.monthlyIncome ?? 0}
        activeCount={activeCount}
        pausedCount={pausedCount}
        nextDebit={nextDebit ? { description: nextDebit.description, daysUntil: nextDebit.daysUntil } : null}
      />

      {/* Recorrências — single table + por categoria */}
      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RecurrencesTable
            recurring={showRecurring ? filteredRecurring : []}
            installments={showInstallments ? filteredInstallments : []}
            periodLabel={periodLabel}
            onViewRecurring={item => openDrawer({ kind: "recurring", item })}
            onEditRecurring={item => handleEditFromCard({ kind: "recurring", item })}
            onCancelRecurring={item => setCancelItem(item)}
            onReactivateRecurring={handleReactivate}
            onViewInstallment={item => openDrawer({ kind: "installment", item })}
            onEditInstallment={item => handleEditFromCard({ kind: "installment", item })}
          />
        </div>
        <div className="lg:col-span-4">
          <RecurrencesByCategory
            recurring={showRecurring ? filteredRecurring : []}
            installments={showInstallments ? filteredInstallments : []}
          />
        </div>
      </div>

      {/* Drawer */}
      <RecurrenceDrawer
        open={drawerOpen}
        data={drawer}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEditFromDrawer}
        onCancel={handleCancelFromDrawer}
        onReactivate={handleReactivate}
      />

      {/* Edit drawer */}
      <RecurrenceEditDrawer
        open={editOpen}
        target={editTarget}
        onClose={closeEdit}
      />

      {/* Cancel dialog */}
      <CancelRecurringDialog
        item={cancelItem}
        loading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelItem(null)}
      />

      {/* Create drawer */}
      <RecurrenceCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
    </div>
  );
}
