"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Layers, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RecurrencesHeader } from "./components/RecurrencesHeader";
import { RecurringList } from "./components/RecurringList";
import { InstallmentList } from "./components/InstallmentList";
import { RecurrenceDrawer } from "./components/RecurrenceDrawer";
import { CancelRecurringDialog } from "./components/CancelRecurringDialog";
import { useRecurrencePage, useCancelRecurring } from "./hooks/useRecurrences";
import { defaultRecurrenceFilter } from "@/lib/types/recurrences.types";
import type { RecurrenceFilter, RecurringItem, InstallmentItem } from "@/lib/types/recurrences.types";

type DrawerItem =
  | { kind: "recurring"; item: RecurringItem }
  | { kind: "installment"; item: InstallmentItem };

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export function RecurrencesPage() {
  const { data, isLoading } = useRecurrencePage();
  const cancelMutation = useCancelRecurring();

  const [filter, setFilter] = useState<RecurrenceFilter>(defaultRecurrenceFilter());
  const [drawer, setDrawer] = useState<DrawerItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cancelItem, setCancelItem] = useState<RecurringItem | null>(null);

  // Filter recurring: show active + cancelled that were still active in selected month
  const filteredRecurring = useMemo(() => {
    if (!data) return [];

    const firstDayOfMonth = new Date(filter.year, filter.month - 1, 1);
    const lastDayOfMonth  = new Date(filter.year, filter.month, 0);

    return data.recurring.filter(r => {
      const start = new Date(r.startDate);
      const end   = r.endDate ? new Date(r.endDate) : null;

      // must have started by end of the selected month
      if (start > lastDayOfMonth) return false;

      // if inactive, only show if it was still active at some point during the month
      if (!r.isActive && end && end < firstDayOfMonth) return false;

      // category filter
      if (filter.categoryIds.length > 0 && !filter.categoryIds.includes(r.categoryId)) return false;

      // account filter
      if (filter.accountIds.length > 0 && !filter.accountIds.includes(r.accountId)) return false;

      return true;
    });
  }, [data, filter]);

  const filteredInstallments = useMemo(() => {
    if (!data) return [];

    return data.installments.filter(inst => {
      // active installments or completed ones that were in progress during the month
      const start = new Date(inst.transactionDate);
      const endMonth = new Date(start);
      endMonth.setMonth(endMonth.getMonth() + inst.totalInstallments - 1);
      const firstDayOfMonth = new Date(filter.year, filter.month - 1, 1);
      const lastDayOfMonth  = new Date(filter.year, filter.month, 0);

      if (start > lastDayOfMonth) return false;
      if (endMonth < firstDayOfMonth) return false;

      if (filter.categoryIds.length > 0 && !filter.categoryIds.includes(inst.categoryId)) return false;
      if (filter.accountIds.length > 0 && !filter.accountIds.includes(inst.accountId)) return false;

      return true;
    });
  }, [data, filter]);

  const showRecurring    = filter.typeFilter === "All" || filter.typeFilter === "Recurring";
  const showInstallments = filter.typeFilter === "All" || filter.typeFilter === "Installment";

  const totalRemainingInstallments = useMemo(
    () => filteredInstallments.reduce((s, i) => s + i.remainingAmount, 0),
    [filteredInstallments]
  );

  function openDrawer(item: DrawerItem) {
    setDrawer(item);
    setDrawerOpen(true);
  }

  function handleCancelFromDrawer(item: RecurringItem) {
    setDrawerOpen(false);
    setTimeout(() => setCancelItem(item), 300);
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

  return (
    <div className="flex flex-col gap-6">
      <RecurrencesHeader
        recurringCount={activeRecurringCount}
        installmentCount={activeInstallmentCount}
        filter={filter}
        onFilterChange={setFilter}
        onCreateRecurring={() => {}}
        onCreateInstallment={() => {}}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Assinaturas/mês"
          value={(data?.subscriptionMonthlyAmount ?? 0) / 100}
          icon={RefreshCw}
          iconColor="#7C6FE0"
        />
        <StatCard
          label="Parcelamentos/mês"
          value={(data?.installmentMonthlyAmount ?? 0) / 100}
          icon={Layers}
          iconColor="#4A9EFF"
        />
        <StatCard
          label="Total comprometido"
          value={(data?.totalMonthlyAmount ?? 0) / 100}
          icon={Wallet}
          iconColor="#F25F5C"
          showNegative
        />
      </div>

      {/* Lists — 2 col when both showing */}
      {filter.typeFilter === "All" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecurringList
            items={filteredRecurring}
            totalMonthly={data?.subscriptionMonthlyAmount ?? 0}
            onView={item => openDrawer({ kind: "recurring", item })}
            onEdit={item => openDrawer({ kind: "recurring", item })}
            onCancel={item => setCancelItem(item)}
          />
          <InstallmentList
            items={filteredInstallments}
            totalMonthly={data?.installmentMonthlyAmount ?? 0}
            totalRemaining={totalRemainingInstallments}
            onView={item => openDrawer({ kind: "installment", item })}
            onEdit={item => openDrawer({ kind: "installment", item })}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {showRecurring && (
            <RecurringList
              items={filteredRecurring}
              totalMonthly={data?.subscriptionMonthlyAmount ?? 0}
              onView={item => openDrawer({ kind: "recurring", item })}
              onEdit={item => openDrawer({ kind: "recurring", item })}
              onCancel={item => setCancelItem(item)}
            />
          )}
          {showInstallments && (
            <InstallmentList
              items={filteredInstallments}
              totalMonthly={data?.installmentMonthlyAmount ?? 0}
              totalRemaining={totalRemainingInstallments}
              onView={item => openDrawer({ kind: "installment", item })}
              onEdit={item => openDrawer({ kind: "installment", item })}
            />
          )}
        </div>
      )}

      {/* Drawer */}
      <RecurrenceDrawer
        open={drawerOpen}
        data={drawer}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => {}}
        onCancel={handleCancelFromDrawer}
      />

      {/* Cancel dialog */}
      <CancelRecurringDialog
        item={cancelItem}
        loading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelItem(null)}
      />
    </div>
  );
}
