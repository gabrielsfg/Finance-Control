import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils/budgetPeriod";

/** The API sends an exclusive period end; display the day before. */
function periodDisplayEnd(periodEnd: string): Date {
  const d = parseLocalDate(periodEnd);
  d.setDate(d.getDate() - 1);
  return d;
}

/** Full label for selectors: "10 mai – 09 jun 2026". */
export function periodLabel(periodStart: string, periodEnd: string): string {
  const start = parseLocalDate(periodStart);
  const end = periodDisplayEnd(periodEnd);
  return `${format(start, "dd MMM", { locale: ptBR })} – ${format(end, "dd MMM yyyy", { locale: ptBR })}`;
}

/** Short x-axis label: "10 mai". */
export function periodShortLabel(periodStart: string): string {
  return format(parseLocalDate(periodStart), "dd MMM", { locale: ptBR });
}
