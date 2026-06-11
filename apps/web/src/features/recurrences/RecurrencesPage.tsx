"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Layers, Wallet, Bell } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RecurringList } from "./components/RecurringList";
import { InstallmentList } from "./components/InstallmentList";
import { RecurrenceDrawer } from "./components/RecurrenceDrawer";
import { RecurrenceEditDrawer, type EditTarget } from "./components/RecurrenceEditDrawer";
import { RecurrenceCreateDrawer } from "./components/RecurrenceCreateDrawer";
import { CancelRecurringDialog } from "./components/CancelRecurringDialog";
import { RecurrencesFilters } from "./components/RecurrencesFilters";
import { useRecurrencePage, useCancelRecurring, useReactivateRecurring } from "./hooks/useRecurrences";
import { useRecurrenceMetrics } from "./hooks/useRecurrenceMetrics";
import { useActiveBudget } from "@/features/budgets/hooks/useActiveBudget";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { usePageNova, usePageFilter } from "@/lib/hooks/usePageHeader";
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
    totalRemainingInstallments,
    subscriptionNetMonthly,
    installmentNetMonthly,
    subscriptionAnnual,
    installmentRemainingNet,
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

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Recorrências</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">
          {activeRecurringCount} assinatura{activeRecurringCount !== 1 ? "s" : ""} ativa{activeRecurringCount !== 1 ? "s" : ""} · {activeInstallmentCount} parcelamento{activeInstallmentCount !== 1 ? "s" : ""} em aberto
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assinaturas/mês"
          value={subscriptionNetMonthly / 100}
          icon={RefreshCw}
          iconColor="#7C6FE0"
          subText={`${formatCurrency(Math.abs(subscriptionAnnual) / 100)} ao ano`}
        />
        <StatCard
          label="Parcelamentos/mês"
          value={installmentNetMonthly / 100}
          icon={Layers}
          iconColor="#4A9EFF"
          subText={`${installmentRemainingNet >= 0 ? "+" : "-"}${formatCurrency(Math.abs(installmentRemainingNet) / 100)} restante`}
        />
        <StatCard
          label="Total comprometido"
          value={(subscriptionNetMonthly + installmentNetMonthly) / 100}
          icon={Wallet}
          iconColor="#F25F5C"
          subText={
            (data?.monthlyIncome ?? 0) > 0
              ? `${(((subscriptionNetMonthly + installmentNetMonthly) / data!.monthlyIncome) * 100).toFixed(1)}% da renda mensal`
              : undefined
          }
        />

        {/* Next debit card */}
        <div className="border-border bg-surface rounded-xl border p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">Próximo vencimento</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: "#F5A62318" }}>
              <Bell size={15} strokeWidth={1.75} style={{ color: "#F5A623" }} />
            </div>
          </div>
          {nextDebit ? (
            <>
              <p className="font-money font-600 text-[22px]" style={{ color: "#F5A623" }}>
                Dia {nextDebit.date.getDate()}
              </p>
              <p className="text-text-muted mt-1.5 truncate text-[12px]">
                {nextDebit.description}
                {nextDebit.daysUntil === 0
                  ? " · hoje"
                  : nextDebit.daysUntil === 1
                  ? " · amanhã"
                  : ` · em ${nextDebit.daysUntil}d`}
              </p>
            </>
          ) : (
            <p className="font-money font-600 text-text-muted text-[22px]">—</p>
          )}
        </div>
      </div>

      {/* Income commitment bar */}
      {(data?.monthlyIncome ?? 0) > 0 && (() => {
        const income = data!.monthlyIncome / 100;
        const subscriptions = Math.abs(subscriptionNetMonthly) / 100;
        const installments  = Math.abs(installmentNetMonthly)  / 100;
        const subPct   = Math.min((subscriptions / income) * 100, 100);
        const instPct  = Math.min((installments  / income) * 100, Math.max(0, 100 - subPct));
        const freePct  = Math.max(0, 100 - subPct - instPct);

        return (
          <div className="border-border bg-surface rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-text text-[14px] font-semibold">Comprometimento da Renda Mensal</span>
              <span className="text-text-muted text-[12px]">
                Renda:{" "}
                <span className="font-money text-text">{formatCurrency(income)}</span>
              </span>
            </div>

            {/* Segmented bar */}
            <div className="bg-surface3 flex h-2.5 overflow-hidden rounded-full">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${subPct}%`, backgroundColor: "#7C6FE0" }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${instPct}%`, backgroundColor: "#4A9EFF" }}
              />
            </div>

            {/* Legend */}
            <div className="mt-2.5 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#7C6FE0" }} />
                <span className="text-text-sub text-[12px]">Assinaturas ({subPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#4A9EFF" }} />
                <span className="text-text-sub text-[12px]">Parcelamentos ({instPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="bg-surface3 h-2.5 w-2.5 rounded-sm" />
                <span className="text-text-sub text-[12px]">Livre ({freePct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lists — 2 col when both showing */}
      {filter.typeFilter === "All" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecurringList
            items={filteredRecurring}
            totalMonthly={data?.subscriptionMonthlyAmount ?? 0}
            onView={item => openDrawer({ kind: "recurring", item })}
            onEdit={item => handleEditFromCard({ kind: "recurring", item })}
            onCancel={item => setCancelItem(item)}
            onReactivate={handleReactivate}
          />
          <InstallmentList
            items={filteredInstallments}
            totalMonthly={data?.installmentMonthlyAmount ?? 0}
            totalRemaining={totalRemainingInstallments}
            onView={item => openDrawer({ kind: "installment", item })}
            onEdit={item => handleEditFromCard({ kind: "installment", item })}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {showRecurring && (
            <RecurringList
              items={filteredRecurring}
              totalMonthly={data?.subscriptionMonthlyAmount ?? 0}
              expanded
              onView={item => openDrawer({ kind: "recurring", item })}
              onEdit={item => handleEditFromCard({ kind: "recurring", item })}
              onCancel={item => setCancelItem(item)}
              onReactivate={handleReactivate}
            />
          )}
          {showInstallments && (
            <InstallmentList
              items={filteredInstallments}
              totalMonthly={data?.installmentMonthlyAmount ?? 0}
              totalRemaining={totalRemainingInstallments}
              expanded
              onView={item => openDrawer({ kind: "installment", item })}
              onEdit={item => handleEditFromCard({ kind: "installment", item })}
            />
          )}
        </div>
      )}

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
  );
}
