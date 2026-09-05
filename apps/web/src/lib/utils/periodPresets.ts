/**
 * Date-period presets shared by every page that filters by period.
 *
 * One implementation of "what does 'últimos 6 meses' mean", so the overview, the
 * transactions list and anything added later cannot drift apart on the same label.
 */

export type PeriodPreset =
  /** The active budget's current cycle — the app's default window. */
  | "budget-cycle"
  | "current-month"
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "current-year"
  | "custom-range";

/**
 * The active budget's cycle, as the API reports it: `endDate` is EXCLUSIVE, because a
 * transaction dated on it belongs to the next cycle, which starts that day.
 */
export type BudgetCycle = { startDate: string; endDate: string };

export type PeriodValue = {
  preset: PeriodPreset;
  /** Only read when preset is "custom-range". */
  startDate: string;
  finishDate: string;
};

export const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "budget-cycle", label: "Ciclo do orçamento" },
  { id: "current-month", label: "Mês atual" },
  { id: "last-3-months", label: "Últimos 3 meses" },
  { id: "last-6-months", label: "Últimos 6 meses" },
  { id: "last-12-months", label: "Últimos 12 meses" },
  { id: "current-year", label: "Este ano" },
  { id: "custom-range", label: "Personalizado" },
];

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Exclusive cycle end → inclusive filter bound. */
export function toInclusiveEnd(exclusiveEndIso: string): string {
  const d = new Date(exclusiveEndIso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

export function buildPeriodRange(
  value: PeriodValue,
  cycle?: BudgetCycle | null,
): { start: string; finish: string } {
  const today = new Date();
  const monthsBack = (n: number) =>
    isoDate(new Date(today.getFullYear(), today.getMonth() - n, 1));

  switch (value.preset) {
    case "budget-cycle":
      // No active budget, or budgets not loaded yet: the calendar month is the only
      // window available.
      if (!cycle) return { start: monthsBack(0), finish: isoDate(today) };
      return { start: cycle.startDate, finish: toInclusiveEnd(cycle.endDate) };
    case "current-month":
      return { start: monthsBack(0), finish: isoDate(today) };
    case "last-3-months":
      return { start: monthsBack(2), finish: isoDate(today) };
    case "last-6-months":
      return { start: monthsBack(5), finish: isoDate(today) };
    case "last-12-months":
      return { start: monthsBack(11), finish: isoDate(today) };
    case "current-year":
      return { start: isoDate(new Date(today.getFullYear(), 0, 1)), finish: isoDate(today) };
    case "custom-range":
      return { start: value.startDate, finish: value.finishDate };
  }
}

export function periodPresetLabel(value: PeriodValue): string {
  if (value.preset === "custom-range") {
    const fmt = (iso: string) =>
      iso ? iso.split("-").reverse().join("/") : "—";
    return `${fmt(value.startDate)} → ${fmt(value.finishDate)}`;
  }
  return PERIOD_PRESETS.find((p) => p.id === value.preset)?.label ?? "Período";
}

export function defaultPeriod(): PeriodValue {
  const today = new Date();
  return {
    preset: "budget-cycle",
    startDate: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    finishDate: isoDate(today),
  };
}
