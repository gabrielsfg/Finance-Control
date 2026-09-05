import type { BudgetRecurrence } from "@/lib/types/budgets.types";

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Splits a "YYYY-MM" string into [year, month] (month is 1-based). */
export function parseMonthYear(monthStr: string): [number, number] {
  const [year, month] = monthStr.split("-").map(Number);
  return [year, month];
}

export function shiftByRecurrence(date: Date, recurrence: BudgetRecurrence, direction: number): Date {
  const d = new Date(date);
  switch (recurrence) {
    case "Weekly":       d.setDate(d.getDate() + 7 * direction); break;
    case "Biweekly":    d.setDate(d.getDate() + 14 * direction); break;
    case "Monthly":     d.setMonth(d.getMonth() + direction); break;
    case "Semiannually":d.setMonth(d.getMonth() + 6 * direction); break;
    case "Annually":    d.setFullYear(d.getFullYear() + direction); break;
  }
  return d;
}
