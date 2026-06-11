"use client";

import { useMemo } from "react";
import type { RecurrenceFilter, RecurrencePageData, RecurringItem, InstallmentItem } from "@/lib/types/recurrences.types";

type NextDebit = {
  date: Date;
  description: string;
  value: number;
  daysUntil: number;
};

type RecurrenceMetrics = {
  filteredRecurring: RecurringItem[];
  filteredInstallments: InstallmentItem[];
  totalRemainingInstallments: number;
  subscriptionNetMonthly: number;
  installmentNetMonthly: number;
  subscriptionAnnual: number;
  installmentRemainingNet: number;
  nextDebit: NextDebit | null;
};

const RECURRENCE_DAYS: Record<string, number> = {
  Daily: 1, WorkDay: 1, Weekly: 7, Biweekly: 14,
  Monthly: 30, Quarterly: 90, Semiannually: 180, Annually: 365,
};

const CALENDAR_MONTH_STEPS: Record<string, number> = {
  Monthly: 1, Quarterly: 3, Semiannually: 6, Annually: 12,
};

function nextOccurrenceByCalendar(start: Date, today: Date, monthsStep: number): Date {
  const next = new Date(start);
  while (next < today) next.setMonth(next.getMonth() + monthsStep);
  return next;
}

function nextOccurrenceByDays(start: Date, today: Date, step: number): Date {
  const next = new Date(start);
  while (next < today) next.setDate(next.getDate() + step);
  return next;
}

export function useRecurrenceMetrics(
  data: RecurrencePageData | undefined,
  filter: RecurrenceFilter,
): RecurrenceMetrics {
  const filteredRecurring = useMemo<RecurringItem[]>(() => {
    if (!data) return [];
    const firstDay = new Date(filter.startDate);
    const lastDay = new Date(filter.endDate);
    return data.recurring.filter((r) => {
      const start = new Date(r.startDate);
      const end = r.endDate ? new Date(r.endDate) : null;
      if (start > lastDay) return false;
      if (!r.isActive && end && end < firstDay) return false;
      if (filter.subCategoryIds.length > 0 && !filter.subCategoryIds.includes(r.subCategoryId)) return false;
      else if (filter.subCategoryIds.length === 0 && filter.categoryIds.length > 0 && !filter.categoryIds.includes(r.categoryId)) return false;
      if (filter.accountIds.length > 0 && !filter.accountIds.includes(r.accountId)) return false;
      return true;
    });
  }, [data, filter]);

  const filteredInstallments = useMemo<InstallmentItem[]>(() => {
    if (!data) return [];
    const firstDay = new Date(filter.startDate);
    const lastDay = new Date(filter.endDate);
    return data.installments.filter((inst) => {
      const start = new Date(inst.transactionDate);
      const endMonth = new Date(start);
      endMonth.setMonth(endMonth.getMonth() + inst.totalInstallments - 1);
      if (start > lastDay) return false;
      if (endMonth < firstDay) return false;
      if (filter.subCategoryIds.length > 0 && !filter.subCategoryIds.includes(inst.subCategoryId)) return false;
      else if (filter.subCategoryIds.length === 0 && filter.categoryIds.length > 0 && !filter.categoryIds.includes(inst.categoryId)) return false;
      if (filter.accountIds.length > 0 && !filter.accountIds.includes(inst.accountId)) return false;
      return true;
    });
  }, [data, filter]);

  const totalRemainingInstallments = useMemo(
    () => filteredInstallments.reduce((s, i) => s + i.remainingAmount, 0),
    [filteredInstallments],
  );

  const subscriptionNetMonthly = useMemo(
    () =>
      filteredRecurring
        .filter((r) => r.isActive)
        .reduce((s, r) => s + (r.type === "Income" ? r.value : -r.value), 0),
    [filteredRecurring],
  );

  const installmentNetMonthly = useMemo(
    () =>
      filteredInstallments
        .filter((i) => i.remainingInstallments > 0)
        .reduce((s, i) => s + (i.type === "Income" ? i.value : -i.value), 0),
    [filteredInstallments],
  );

  const subscriptionAnnual = useMemo(() => {
    const now = new Date();
    return filteredRecurring
      .filter((r) => r.isActive)
      .reduce((s, r) => {
        const start = new Date(r.startDate);
        const months = Math.max(
          12,
          (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1,
        );
        return s + r.value * months * (r.type === "Income" ? 1 : -1);
      }, 0);
  }, [filteredRecurring]);

  const installmentRemainingNet = useMemo(
    () =>
      filteredInstallments
        .filter((i) => i.remainingInstallments > 0)
        .reduce((s, i) => s + i.remainingAmount * (i.type === "Income" ? 1 : -1), 0),
    [filteredInstallments],
  );

  const nextDebit = useMemo<NextDebit | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    type Candidate = { date: Date; description: string; value: number };
    const candidates: Candidate[] = [];

    for (const r of filteredRecurring) {
      if (!r.isActive) continue;
      const start = new Date(r.startDate);
      start.setHours(0, 0, 0, 0);
      const monthsStep = CALENDAR_MONTH_STEPS[r.recurrence];
      const next = monthsStep !== undefined
        ? nextOccurrenceByCalendar(start, today, monthsStep)
        : nextOccurrenceByDays(start, today, RECURRENCE_DAYS[r.recurrence] ?? 1);
      candidates.push({ date: next, description: r.description, value: r.value });
    }

    for (const inst of filteredInstallments) {
      if (inst.remainingInstallments === 0) continue;
      const start = new Date(inst.transactionDate);
      const next = new Date(today.getFullYear(), today.getMonth(), start.getDate());
      if (next < today) next.setMonth(next.getMonth() + 1);
      candidates.push({ date: next, description: inst.description, value: inst.value });
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
    const best = candidates[0];
    const daysUntil = Math.round((best.date.getTime() - today.getTime()) / 86_400_000);
    return { date: best.date, description: best.description, value: best.value, daysUntil };
  }, [filteredRecurring, filteredInstallments]);

  return {
    filteredRecurring,
    filteredInstallments,
    totalRemainingInstallments,
    subscriptionNetMonthly,
    installmentNetMonthly,
    subscriptionAnnual,
    installmentRemainingNet,
    nextDebit,
  };
}
