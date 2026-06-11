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

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Returns the current active period dates for a budget (startDate, endDate as ISO strings). */
export function computeActivePeriod(startDate: string, recurrence: BudgetRecurrence): { startDate: string; endDate: string } {
  const start = parseLocalDate(startDate);
  const end = shiftByRecurrence(new Date(start), recurrence, 1);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}
