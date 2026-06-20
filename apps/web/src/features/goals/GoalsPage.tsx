"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Plus, Target, ShoppingBag, TrendingUp, ExternalLink,
  Trash2, X, ChevronRight, Calendar as CalendarIcon,
  PlusCircle, ArrowUpRight, ArrowDownRight, ShoppingCart,
  Wallet, ArrowRightLeft, Link as LinkIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Money, BigMoney } from "@/components/shared/Money";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { FlowRow } from "@/components/shared/FlowBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import {
  useGoals,
  useGoalDetail,
  useGoalInvestmentTransactions,
  useCreateGoal,
  useDeleteGoal,
  useContributeGoal,
  useWithdrawGoal,
  usePurchaseGoal,
} from "@/features/goals/hooks/useGoals";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { usePageNova, usePageSearch } from "@/lib/hooks/usePageHeader";
import type { Goal, GoalDetail, GoalType, GoalPriority, CreateGoalRequest } from "@/lib/types/goal.types";
import type { AssetType } from "@/lib/types/investments.types";
import type { Category } from "@/lib/types/categories.types";

// ── Shared drawer constants ────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-shadow h-11 rounded-[13px] px-3.5 text-[15px] focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

const TRIGGER_CLASS =
  "w-full border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text)] !h-11 rounded-[13px] px-3.5 text-[15px]";

const LABEL_CLASS =
  "mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-sub)]";

const DRAWER_BACKDROP =
  "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300";

const DRAWER_PANEL_BASE =
  "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l shadow-2xl transition-transform duration-300 ease-in-out";

/** Inline so the panel background is guaranteed opaque (the arbitrary `bg-[var(--surface)]`
 *  utility is unreliable for these fixed panels — matches TransactionDrawer/AccountDrawer). */
const DRAWER_PANEL_STYLE = { background: "var(--surface)", borderColor: "var(--border-color)" } as const;

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function DatePickerField({
  value,
  onChange,
  placeholder,
  allowClear,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  useEffect(() => {
    if (open && parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [open, value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${month}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);
  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : placeholder ?? "Selecionar data";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          INPUT_CLASS,
          "flex items-center justify-between gap-2 text-left",
          !value && "text-[var(--text-muted)]",
        )}
      >
        <span className="flex items-center gap-2.5">
          <CalendarIcon size={15} className="shrink-0 text-[var(--text-muted)]" />
          <span className={cn("text-[15px]", value ? "text-[var(--text)]" : "text-[var(--text-muted)]")}>{label}</span>
        </span>
        {allowClear && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange(""); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange(""); } }}
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-[70] rounded-[16px] border border-[var(--border-color)] bg-[var(--surface)] p-4 shadow-2xl" style={{ minWidth: 280 }}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <span className="text-[13px] font-semibold text-[var(--text)]">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-1 text-center font-mono text-[10px] font-medium text-[var(--text-muted)]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} />;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <div key={dateStr} className="flex items-center justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => { onChange(dateStr); setOpen(false); }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] tabular-nums transition-all",
                      isSelected
                        ? "bg-[var(--brand-cobalt)] font-bold text-white"
                        : isToday
                          ? "border border-[var(--border-color)] font-semibold text-[var(--text)]"
                          : "text-[var(--text-sub)] hover:bg-[var(--surface2)] hover:text-[var(--text)]",
                    )}
                  >
                    {parseInt(dateStr.slice(8))}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Status/priority pill — `.st-pill` look from quantia.css. Tinted bg + full-color text. */
const ST_PILL = "font-mono text-[10.5px] tracking-[0.06em] uppercase px-[9px] py-[3px] rounded-full shrink-0";

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; color: string }> = {
  High:   { label: "Alta",   color: "var(--clay)" },
  Medium: { label: "Média",  color: "var(--gold)" },
  Low:    { label: "Baixa",  color: "var(--text-sub)" },
};

function priorityPillStyle(priority: GoalPriority): React.CSSProperties {
  const color = PRIORITY_CONFIG[priority].color;
  return { background: `color-mix(in srgb, ${color} 15%, transparent)`, color };
}

const PRIORITY_ORDER: Record<GoalPriority, number> = { High: 0, Medium: 1, Low: 2 };

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  Acao:              "Ações BR",
  Stock:             "Ações Internacionais",
  FII:               "Fundos Imobiliários (FII)",
  Reit:              "REITs",
  ETF:               "ETF Nacional",
  ETFInternacional:  "ETF Internacional",
  BDR:               "BDR",
  FundoInvestimento: "Fundo de Investimento",
  TesouroDireto:     "Tesouro Direto",
  RendaFixa:         "Renda Fixa / CDI",
  Moeda:             "Moedas",
  Index:             "Índice",
  Cripto:            "Cripto",
  Outro:             "Outro",
};

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  Acao:              "#F5A623",
  Stock:             "#E879A0",
  FII:               "#4A9EFF",
  Reit:              "#00D4A0",
  ETF:               "#7C6FE0",
  ETFInternacional:  "#7C6FE0",
  BDR:               "#F5CE42",
  FundoInvestimento: "#00C98D",
  TesouroDireto:     "#00C98D",
  RendaFixa:         "#00C98D",
  Moeda:             "#14B8A6",
  Index:             "#8A95A3",
  Cripto:            "#F25F5C",
  Outro:             "#8A95A3",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthsElapsed(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(
    (now.getFullYear() - created.getFullYear()) * 12 + now.getMonth() - created.getMonth(),
    1,
  );
}

function monthsUntil(targetDate: string): number {
  return Math.max(
    Math.round((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)),
    0,
  );
}

const SUFFICIENCY_COLOR: Record<"ok" | "over" | "under", string> = {
  over:  "var(--moss)",
  ok:    "var(--brand-accent)",
  under: "var(--gold)",
};

/** Shared "Conquistada em" footer for achieved goal cards. */
function AchievedFooter({ achievedAt, targetDate }: { achievedAt: string; targetDate: string }) {
  const achievedDate = new Date(achievedAt);
  const target       = new Date(targetDate);
  const diffDays     = Math.round((target.getTime() - achievedDate.getTime()) / 86400000);
  const dateLabel    = achievedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  let statusText: string;
  let statusColor: string;
  if (diffDays > 7)       { statusText = `${Math.round(diffDays / 30)} ${Math.round(diffDays / 30) === 1 ? "mês" : "meses"} antes do prazo`; statusColor = "var(--moss)"; }
  else if (diffDays >= 0) { statusText = "no prazo";   statusColor = "var(--brand-accent)"; }
  else                    { statusText = `${Math.round(Math.abs(diffDays) / 30)} ${Math.round(Math.abs(diffDays) / 30) === 1 ? "mês" : "meses"} após o prazo`; statusColor = "var(--gold)"; }
  return (
    <div className="flex items-center justify-between border-t border-[var(--border-color)] px-4 py-3">
      <div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Conquistada em</p>
        <p className="text-[12.5px] font-medium text-[var(--text)]">{dateLabel}</p>
      </div>
      <span className="font-mono text-[11px] font-medium" style={{ color: statusColor }}>{statusText}</span>
    </div>
  );
}

// ── Item Goal Card ────────────────────────────────────────────────────────────

type ItemGoalCardActions = {
  onOpen: () => void;
  onContribute: () => void;
  onWithdraw: () => void;
  onPurchase: () => void;
  onDelete: () => void;
};

const ItemGoalCard = ({ goal, onOpen, onContribute, onWithdraw, onPurchase, onDelete }: { goal: Goal } & ItemGoalCardActions) => {
  const priority   = PRIORITY_CONFIG[goal.priority];
  const isAchieved = goal.status === "Achieved";
  const goalColor  = goal.color ?? "#4A9EFF";

  const saved         = goal.currentAmount ?? 0;
  const targetReached = saved >= goal.targetAmount;
  const progressPct   = Math.min((saved / goal.targetAmount) * 100, 100);
  const remaining     = Math.max(goal.targetAmount - saved, 0);

  const ageMonths      = monthsElapsed(goal.createdAt);
  const avgMonthly     = Math.round(saved / ageMonths);
  const monthsLeft     = monthsUntil(goal.targetDate);
  const neededPerMonth = monthsLeft > 0 ? Math.round(remaining / monthsLeft) : null;
  const etaMonths      = avgMonthly > 0 && remaining > 0 ? Math.ceil(remaining / avgMonthly) : null;

  let sufficiency: "ok" | "over" | "under" | null = null;
  if (neededPerMonth !== null && !targetReached) {
    if (avgMonthly > neededPerMonth * 1.05) sufficiency = "over";
    else if (avgMonthly >= neededPerMonth * 0.95) sufficiency = "ok";
    else sufficiency = "under";
  }

  const pctColor = targetReached ? "var(--moss)" : goalColor;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)]",
        isAchieved && "opacity-60",
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex min-w-0 flex-1 cursor-pointer flex-col gap-3.5 p-[22px]" onClick={onOpen}>
        {/* Header — name + emoji-ish icon + pct */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="shrink-0" style={{ color: goalColor }} />
              <p className="truncate font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{goal.name}</p>
              {goal.url && <ExternalLink size={12} className="shrink-0 text-[var(--text-muted)]" />}
            </div>
            {goal.description && (
              <p className="ml-[24px] mt-0.5 truncate text-[12.5px] text-[var(--text-sub)]">{goal.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isAchieved ? (
              <span className={ST_PILL} style={{ background: "color-mix(in srgb, var(--moss) 15%, transparent)", color: "var(--moss)" }}>
                Conquistada
              </span>
            ) : (
              <span className={ST_PILL} style={priorityPillStyle(goal.priority)}>{priority.label}</span>
            )}
            <span className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: pctColor }}>
              {progressPct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Amount / target */}
        <div className="flex items-baseline gap-2">
          <Money cents={saved} className="text-[24px]" />
          <span className="text-[13px] text-[var(--text-sub)]">/ {formatCurrency(goal.targetAmount / 100)}</span>
          <span className="ml-auto font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">
            {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-[10px] w-full overflow-hidden rounded-full bg-[var(--surface2)]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${progressPct}%`,
              background: targetReached
                ? "var(--moss)"
                : `linear-gradient(90deg, ${goalColor}, color-mix(in srgb, ${goalColor} 65%, white))`,
            }}
          />
        </div>

        {/* Sub-amounts */}
        <div className="flex items-center justify-between text-[12.5px] text-[var(--text-sub)]">
          <span>{targetReached ? "Meta atingida ✦" : `faltam ${formatCurrency(remaining / 100)}`}</span>
          {!targetReached && neededPerMonth !== null && (
            <span>aporte {formatCurrency(neededPerMonth / 100)}/mês</span>
          )}
        </div>

        {/* 3-metric row */}
        {!targetReached && (
          <div className="grid grid-cols-3 gap-2 rounded-[13px] bg-[var(--surface2)] px-3 py-2.5">
            <div>
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Economia média/mês</p>
              <Money cents={avgMonthly} className="text-[13px]" />
            </div>
            <div className="border-l border-[var(--border-color)] pl-2">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Necessário/mês</p>
              {neededPerMonth !== null
                ? <Money cents={neededPerMonth} className="text-[13px]" />
                : <span className="font-mono text-[13px] text-[var(--text-muted)]">—</span>}
            </div>
            <div className="border-l border-[var(--border-color)] pl-2">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Meses restantes</p>
              <p className={cn("font-mono text-[13px] font-medium tabular-nums", monthsLeft === 0 ? "text-[var(--clay)]" : "text-[var(--text)]")}>
                {monthsLeft === 0 ? "Prazo vencido" : `${monthsLeft} mes${monthsLeft === 1 ? "" : "es"}`}
              </p>
            </div>
          </div>
        )}

        {/* Sufficiency callout */}
        {!targetReached && sufficiency && (
          <div
            className="rounded-[13px] px-3 py-2 text-[12.5px]"
            style={{
              background: `color-mix(in srgb, ${SUFFICIENCY_COLOR[sufficiency]} 12%, transparent)`,
              color: SUFFICIENCY_COLOR[sufficiency],
            }}
          >
            {sufficiency === "over"  && "Sua economia atual é mais que suficiente para atingir a meta no prazo."}
            {sufficiency === "ok"    && "Sua economia atual está exatamente na linha para atingir a meta no prazo."}
            {sufficiency === "under" && "Sua economia atual está abaixo do necessário. Aumente o ritmo para cumprir o prazo."}
            {etaMonths !== null && (
              <span className="mt-0.5 block opacity-80">
                No ritmo atual, a meta será atingida em {etaMonths} mes{etaMonths === 1 ? "" : "es"} (prazo: {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}).
              </span>
            )}
          </div>
        )}
      </div>

      {/* Achieved footer */}
      {isAchieved && goal.achievedAt && <AchievedFooter achievedAt={goal.achievedAt} targetDate={goal.targetDate} />}

      {/* Actions */}
      {!isAchieved && (
        <div className="flex items-center gap-2 border-t border-[var(--border-color)] px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onContribute}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-[var(--surface2)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
            style={{ borderLeft: `3px solid ${goalColor}` }}
          >
            <PlusCircle size={13} style={{ color: goalColor }} />
            Aportar
          </button>
          {saved > 0 && (
            <button
              onClick={onWithdraw}
              title="Retirar valor"
              className="flex h-7 items-center gap-1 rounded-[9px] px-2 text-[12px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            >
              <ArrowUpRight size={13} />
              Retirar
            </button>
          )}
          {targetReached && (
            <button
              onClick={onPurchase}
              title="Registrar compra"
              className="flex h-7 items-center gap-1 rounded-[9px] px-2 text-[12px] font-medium text-[var(--moss)] transition-colors hover:bg-[color-mix(in_srgb,var(--moss)_12%,transparent)]"
            >
              <ShoppingCart size={13} />
              Comprar
            </button>
          )}
          <button
            onClick={onDelete}
            title="Excluir meta"
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--clay)] opacity-60 transition-colors hover:bg-[color-mix(in_srgb,var(--clay)_12%,transparent)] hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Investment Goal Card ──────────────────────────────────────────────────────

const InvestmentGoalCard = ({ goal, onOpen, onDelete }: { goal: Goal; onOpen: () => void; onDelete: () => void }) => {
  const priority   = PRIORITY_CONFIG[goal.priority];
  const isAchieved = goal.status === "Achieved";
  const goalColor  = goal.color ?? "#7C6FE0";

  const currentAmount = goal.currentAmount ?? 0;
  const progressPct   = Math.min((currentAmount / goal.targetAmount) * 100, 100);
  const remaining     = Math.max(goal.targetAmount - currentAmount, 0);
  const targetReached = currentAmount >= goal.targetAmount;

  const ageMonths      = monthsElapsed(goal.createdAt);
  const avgMonthly     = Math.round(currentAmount / ageMonths);
  const monthsLeft     = monthsUntil(goal.targetDate);
  const neededPerMonth = monthsLeft > 0 ? Math.round(remaining / monthsLeft) : null;

  const etaMonths = avgMonthly > 0 && remaining > 0 ? Math.ceil(remaining / avgMonthly) : null;

  let sufficiency: "ok" | "over" | "under" | null = null;
  if (neededPerMonth !== null && !targetReached) {
    if (avgMonthly > neededPerMonth * 1.05) sufficiency = "over";
    else if (avgMonthly >= neededPerMonth * 0.95) sufficiency = "ok";
    else sufficiency = "under";
  }

  const assetColor = goal.targetAssetType ? ASSET_TYPE_COLORS[goal.targetAssetType] : undefined;
  const pctColor   = targetReached ? "var(--moss)" : goalColor;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)]",
        isAchieved && "opacity-60",
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex min-w-0 flex-1 cursor-pointer flex-col gap-3.5 p-[22px]" onClick={onOpen}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="shrink-0" style={{ color: goalColor }} />
              <p className="truncate font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{goal.name}</p>
            </div>
            {goal.description && (
              <p className="ml-[24px] mt-0.5 truncate text-[12.5px] text-[var(--text-sub)]">{goal.description}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {isAchieved ? (
                <span className={ST_PILL} style={{ background: "color-mix(in srgb, var(--moss) 15%, transparent)", color: "var(--moss)" }}>
                  Conquistada
                </span>
              ) : (
                <span className={ST_PILL} style={priorityPillStyle(goal.priority)}>{priority.label}</span>
              )}
              <span className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: pctColor }}>
                {progressPct.toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {goal.targetAssetType && (
                <span
                  className={ST_PILL}
                  style={{ background: `color-mix(in srgb, ${assetColor} 15%, transparent)`, color: assetColor }}
                >
                  {ASSET_TYPE_LABELS[goal.targetAssetType]}
                </span>
              )}
              {goal.targetTicker && (
                <span
                  className={cn(ST_PILL, "font-semibold")}
                  style={{ background: `color-mix(in srgb, ${assetColor ?? goalColor} 15%, transparent)`, color: assetColor ?? goalColor }}
                >
                  {goal.targetTicker}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Amount / target */}
        <div className="flex items-baseline gap-2">
          <Money cents={currentAmount} className="text-[24px]" />
          <span className="text-[13px] text-[var(--text-sub)]">/ {formatCurrency(goal.targetAmount / 100)}</span>
          <span className="ml-auto font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">
            {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-[10px] w-full overflow-hidden rounded-full bg-[var(--surface2)]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${progressPct}%`,
              background: targetReached
                ? "var(--moss)"
                : `linear-gradient(90deg, ${goalColor}, color-mix(in srgb, ${goalColor} 65%, white))`,
            }}
          />
        </div>

        {/* Sub-amounts */}
        <div className="flex items-center justify-between text-[12.5px] text-[var(--text-sub)]">
          <span>{targetReached ? "Meta atingida ✦" : `faltam ${formatCurrency(remaining / 100)}`}</span>
          {!targetReached && neededPerMonth !== null && (
            <span>aporte {formatCurrency(neededPerMonth / 100)}/mês</span>
          )}
        </div>

        {/* 3-metric row */}
        {!targetReached && (
          <div className="grid grid-cols-3 gap-2 rounded-[13px] bg-[var(--surface2)] px-3 py-2.5">
            <div>
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Aporte médio/mês</p>
              <Money cents={avgMonthly} className="text-[13px]" />
            </div>
            <div className="border-l border-[var(--border-color)] pl-2">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Necessário/mês</p>
              {neededPerMonth !== null
                ? <Money cents={neededPerMonth} className="text-[13px]" />
                : <span className="font-mono text-[13px] text-[var(--text-muted)]">—</span>}
            </div>
            <div className="border-l border-[var(--border-color)] pl-2">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Meses restantes</p>
              <p className={cn("font-mono text-[13px] font-medium tabular-nums", monthsLeft === 0 ? "text-[var(--clay)]" : "text-[var(--text)]")}>
                {monthsLeft === 0 ? "Prazo vencido" : `${monthsLeft} mes${monthsLeft === 1 ? "" : "es"}`}
              </p>
            </div>
          </div>
        )}

        {/* Sufficiency callout */}
        {!targetReached && sufficiency && (
          <div
            className="rounded-[13px] px-3 py-2 text-[12.5px]"
            style={{
              background: `color-mix(in srgb, ${SUFFICIENCY_COLOR[sufficiency]} 12%, transparent)`,
              color: SUFFICIENCY_COLOR[sufficiency],
            }}
          >
            {sufficiency === "over"  && "Seu aporte atual é mais que suficiente para bater a meta no prazo."}
            {sufficiency === "ok"    && "Seu aporte atual está exatamente na linha para bater a meta no prazo."}
            {sufficiency === "under" && "Seu aporte atual está abaixo do necessário. Aumente o aporte para cumprir o prazo."}
            {etaMonths !== null && (
              <span className="mt-0.5 block opacity-80">
                No ritmo atual, a meta será atingida em {etaMonths} mes{etaMonths === 1 ? "" : "es"} (prazo: {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}).
              </span>
            )}
          </div>
        )}
      </div>

      {/* Achieved footer */}
      {isAchieved && goal.achievedAt && <AchievedFooter achievedAt={goal.achievedAt} targetDate={goal.targetDate} />}

      {/* Actions */}
      {!isAchieved && (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--border-color)] px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-[12px] text-[var(--text-sub)]">Progresso via carteira de investimentos</p>
          <button
            onClick={onDelete}
            title="Excluir meta"
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--clay)] opacity-60 transition-colors hover:bg-[color-mix(in_srgb,var(--clay)_12%,transparent)] hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Contribute Drawer ─────────────────────────────────────────────────────────

const ContributeDrawer = ({ goal, onClose }: { goal: Goal | null; onClose: () => void }) => {
  const contribute = useContributeGoal();
  const { data: accounts = [] } = useAccounts();
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState<string>("");
  const [description, setDescription] = useState("");
  const open = goal !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClose = () => { setAmount(""); setSourceAccountId(""); setDescription(""); onClose(); };

  const handleSubmit = async () => {
    if (!goal || !amount) return;
    await contribute.mutateAsync({
      id: goal.id,
      data: {
        amount: Math.round(parseFloat(amount) * 100),
        sourceAccountId: sourceAccountId ? parseInt(sourceAccountId) : undefined,
        description: description || undefined,
      },
    });
    handleClose();
  };

  const goalColor = goal?.color ?? "#4A9EFF";
  const saved = goal?.currentAmount ?? 0;

  return (
    <>
      <div
        className={cn(DRAWER_BACKDROP, open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={handleClose}
      />
      <div
        className={cn(DRAWER_PANEL_BASE, "max-w-[380px]", open ? "translate-x-0" : "translate-x-full")}
        style={DRAWER_PANEL_STYLE}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: goalColor }} />
            <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Registrar aporte</h2>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {goal && (
            <div className="flex flex-col gap-1.5 rounded-[16px] border border-[var(--border-color)] bg-[var(--surface2)] px-4 py-3.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Meta</p>
              <p className="text-[14px] font-medium text-[var(--text)]">{goal.name}</p>
              <div className="mt-1 flex items-center gap-5">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Alvo</p>
                  <Money cents={goal.targetAmount} className="text-[13px]" />
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Guardado</p>
                  <Money cents={saved} sign className="text-[13px]" />
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Faltam</p>
                  <Money cents={Math.max(goal.targetAmount - saved, 0)} className="text-[13px]" />
                </div>
              </div>
              <div className="mt-2 h-[7px] w-full overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min((saved / goal.targetAmount) * 100, 100)}%`, background: goalColor }}
                />
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Valor (R$) *</label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              className={cn(INPUT_CLASS, "font-mono")}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Conta de origem (opcional)</label>
            <Select value={sourceAccountId} onValueChange={(v) => setSourceAccountId(v ?? "")}>
              <SelectTrigger className={TRIGGER_CLASS}>
                <SelectValue placeholder="Aporte externo (sem conta)" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                <SelectItem value="">
                  <span className="flex items-center gap-2 text-[var(--text-sub)]">
                    <Wallet size={13} />
                    Aporte externo (sem conta)
                  </span>
                </SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} · {formatCurrency(a.currentAmount / 100)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] text-[var(--text-sub)]">
              Se informar uma conta, o valor é transferido dela para a meta. Caso contrário, é registrado como aporte direto.
            </p>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Guardei do bônus..."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-[var(--border-color)] px-5 py-4">
          <button onClick={handleClose} className="flex-1 rounded-[13px] border border-[var(--text)] py-2.5 text-[14px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={contribute.isPending || !amount}
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: goalColor }}
          >
            {contribute.isPending && <Loader2 size={14} className="animate-spin" />}
            {contribute.isPending ? "Salvando..." : "Aportar"}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Withdraw Drawer ───────────────────────────────────────────────────────────

const WithdrawDrawer = ({ goal, onClose }: { goal: Goal | null; onClose: () => void }) => {
  const withdraw = useWithdrawGoal();
  const { data: accounts = [] } = useAccounts();
  const [amount, setAmount] = useState("");
  const [destAccountId, setDestAccountId] = useState<string>("");
  const [description, setDescription] = useState("");
  const open = goal !== null;
  const balance = goal?.currentAmount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClose = () => { setAmount(""); setDestAccountId(""); setDescription(""); onClose(); };

  const parsedAmount = parseFloat(amount) * 100;
  const exceedsBalance = !isNaN(parsedAmount) && parsedAmount > balance;

  const handleSubmit = async () => {
    if (!goal || !amount || exceedsBalance) return;
    await withdraw.mutateAsync({
      id: goal.id,
      data: {
        amount: Math.round(parsedAmount),
        destinationAccountId: destAccountId ? parseInt(destAccountId) : undefined,
        description: description || undefined,
      },
    });
    handleClose();
  };

  const goalColor = goal?.color ?? "#4A9EFF";

  return (
    <>
      <div
        className={cn(DRAWER_BACKDROP, open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={handleClose}
      />
      <div
        className={cn(DRAWER_PANEL_BASE, "max-w-[380px]", open ? "translate-x-0" : "translate-x-full")}
        style={DRAWER_PANEL_STYLE}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ArrowDownRight size={16} className="text-[var(--clay)]" />
            <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Retirar da meta</h2>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {goal && (
            <div className="flex items-center justify-between rounded-[16px] border border-[var(--border-color)] bg-[var(--surface2)] px-4 py-3">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Meta</p>
                <p className="text-[14px] font-medium text-[var(--text)]">{goal.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Saldo disponível</p>
                <Money cents={balance} className="text-[15px] font-semibold" />
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Valor a retirar (R$) *</label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              className={cn(
                INPUT_CLASS,
                "font-mono",
                exceedsBalance && "border-[var(--clay)] focus:border-[var(--clay)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--clay)_12%,transparent)]",
              )}
            />
            {exceedsBalance && (
              <p className="mt-1 text-[11px] text-[var(--clay)]">Valor maior que o saldo disponível.</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Conta destino (opcional)</label>
            <Select value={destAccountId} onValueChange={(v) => setDestAccountId(v ?? "")}>
              <SelectTrigger className={TRIGGER_CLASS}>
                <SelectValue placeholder="Sem destino (retirada direta)" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                <SelectItem value="">
                  <span className="text-[var(--text-sub)]">Sem destino (retirada direta)</span>
                </SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} · {formatCurrency(a.currentAmount / 100)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Precisei usar para outra coisa..."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-[var(--border-color)] px-5 py-4">
          <button onClick={handleClose} className="flex-1 rounded-[13px] border border-[var(--text)] py-2.5 text-[14px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={withdraw.isPending || !amount || exceedsBalance}
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--clay)] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {withdraw.isPending && <Loader2 size={14} className="animate-spin" />}
            {withdraw.isPending ? "Retirando..." : "Retirar"}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Purchase Drawer ───────────────────────────────────────────────────────────

const PurchaseDrawer = ({
  goal,
  categories,
  onClose,
}: {
  goal: Goal | null;
  categories: Category[];
  onClose: () => void;
}) => {
  const purchase = usePurchaseGoal();
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const open = goal !== null;
  const balance = goal?.currentAmount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClose = () => { setSubCategoryId(""); setDescription(""); onClose(); };

  const handleSubmit = async () => {
    if (!goal || !subCategoryId) return;
    await purchase.mutateAsync({
      id: goal.id,
      data: {
        subCategoryId: parseInt(subCategoryId),
        description: description || undefined,
      },
    });
    handleClose();
  };

  const goalColor = goal?.color ?? "#4A9EFF";

  return (
    <>
      <div
        className={cn(DRAWER_BACKDROP, open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={handleClose}
      />
      <div
        className={cn(DRAWER_PANEL_BASE, "max-w-[400px]", open ? "translate-x-0" : "translate-x-full")}
        style={DRAWER_PANEL_STYLE}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={16} className="text-[var(--moss)]" />
            <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Registrar compra</h2>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {goal && (
            <div className="rounded-[16px] border border-[var(--border-color)] bg-[var(--surface2)] px-4 py-3">
              <p className="mb-1 text-[11px] text-[var(--text-sub)]">O saldo da meta será zerado com uma despesa de:</p>
              <Money cents={balance} className="text-[22px] font-semibold" />
              <p className="mt-1 text-[12px] text-[var(--text-sub)]">Meta: <span className="text-[var(--text)]">{goal.name}</span></p>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Categoria *</label>
            <Select value={subCategoryId} onValueChange={(v) => setSubCategoryId(v ?? "")}>
              <SelectTrigger className={TRIGGER_CLASS}>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                {categories.map((cat) =>
                  cat.subCategories.map((sub) => (
                    <SelectItem key={sub.id} value={String(sub.id)}>
                      {cat.name} · {sub.emoji ? `${sub.emoji} ${sub.name}` : sub.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex: Compra do ${goal?.name ?? "item"}`}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-[var(--border-color)] px-5 py-4">
          <button onClick={handleClose} className="flex-1 rounded-[13px] border border-[var(--text)] py-2.5 text-[14px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={purchase.isPending || !subCategoryId}
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: goalColor }}
          >
            {purchase.isPending && <Loader2 size={14} className="animate-spin" />}
            {purchase.isPending ? "Registrando..." : "Registrar compra"}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Goal Detail Drawer ────────────────────────────────────────────────────────

function txTypeLabel(type: GoalDetail["transactions"][number]["type"]): { label: string; color: string; sign: string } {
  if (type === "Income")   return { label: "Aporte direto",   color: "var(--moss)",         sign: "+" };
  if (type === "Transfer") return { label: "Transferência",   color: "var(--brand-accent)", sign: "+" };
  return                          { label: "Retirada/Compra", color: "var(--clay)",         sign: "−" };
}

const GoalDetailDrawer = ({
  goalId,
  goals,
  onClose,
  onContribute,
  onWithdraw,
  onPurchase,
}: {
  goalId: number | null;
  goals: Goal[];
  onClose: () => void;
  onContribute: (goal: Goal) => void;
  onWithdraw: (goal: Goal) => void;
  onPurchase: (goal: Goal) => void;
}) => {
  const open = goalId !== null;
  const goal = goals.find((g) => g.id === goalId) ?? null;
  const { data: detail, isLoading } = useGoalDetail(goalId);
  const { data: investmentTxs = [] } = useGoalInvestmentTransactions(
    goal?.type === "Investment" ? goalId : null
  );
  const goalColor = goal?.color ?? "#4A9EFF";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const saved      = goal?.currentAmount ?? 0;
  const target     = goal?.targetAmount ?? 1;
  const pct        = Math.min((saved / target) * 100, 100);
  const isAchieved = goal?.status === "Achieved";
  const isItem     = goal?.type === "Item";

  return (
    <>
      <div
        className={cn(DRAWER_BACKDROP, open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={onClose}
      />
      <div
        className={cn(DRAWER_PANEL_BASE, "max-w-[440px]", open ? "translate-x-0" : "translate-x-full")}
        style={DRAWER_PANEL_STYLE}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {goal?.type === "Item"
              ? <ShoppingBag size={16} style={{ color: goalColor }} className="shrink-0" />
              : <TrendingUp  size={16} style={{ color: goalColor }} className="shrink-0" />
            }
            <h2 className="truncate font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{goal?.name ?? "—"}</h2>
            {isAchieved && (
              <span className={ST_PILL} style={{ background: "color-mix(in srgb, var(--moss) 15%, transparent)", color: "var(--moss)" }}>
                Conquistada
              </span>
            )}
          </div>
          <button onClick={onClose} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading || !goal ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
            </div>
          ) : (
            <>
              {/* Progress section */}
              <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="mb-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Guardado</p>
                    <Money cents={saved} sign={saved >= target} className="text-[26px] font-semibold" />
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Meta</p>
                    <Money cents={target} className="text-[18px]" />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between text-[12px]">
                    <span className="font-medium" style={{ color: saved >= target ? "var(--moss)" : "var(--text-sub)" }}>
                      {saved >= target ? "Meta atingida! 🎉" : `${pct.toFixed(1)}% concluído`}
                    </span>
                    {saved < target && (
                      <span className="text-[var(--text-sub)]">Faltam {formatCurrency((target - saved) / 100)}</span>
                    )}
                  </div>
                  <div className="h-[8px] w-full overflow-hidden rounded-full bg-[var(--surface2)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${pct}%`, background: saved >= target ? "var(--moss)" : goalColor }}
                    />
                  </div>
                </div>

                {/* Meta info grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[13px] bg-[var(--surface2)] px-3 py-2.5">
                    <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Prazo</p>
                    <p className="text-[13px] font-medium text-[var(--text)]">
                      {new Date(goal.targetDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="rounded-[13px] bg-[var(--surface2)] px-3 py-2.5">
                    <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Prioridade</p>
                    <p className="text-[13px] font-medium" style={{ color: PRIORITY_CONFIG[goal.priority].color }}>
                      {PRIORITY_CONFIG[goal.priority].label}
                    </p>
                  </div>
                  {goal.achievedAt && (
                    <div className="col-span-2 rounded-[13px] px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--moss) 10%, transparent)" }}>
                      <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "color-mix(in srgb, var(--moss) 70%, var(--text-sub))" }}>Conquistada em</p>
                      <p className="text-[13px] font-medium text-[var(--moss)]">
                        {new Date(goal.achievedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  )}
                  {goal.description && (
                    <div className="col-span-2 rounded-[13px] bg-[var(--surface2)] px-3 py-2.5">
                      <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-sub)]">Descrição</p>
                      <p className="text-[13px] text-[var(--text)]">{goal.description}</p>
                    </div>
                  )}
                  {goal.url && (
                    <a
                      href={goal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 flex items-center gap-2 rounded-[13px] bg-[var(--surface2)] px-3 py-2.5 transition-colors hover:brightness-95"
                    >
                      <LinkIcon size={12} className="shrink-0 text-[var(--text-muted)]" />
                      <p className="truncate text-[13px] text-[var(--brand-accent)]">{goal.url}</p>
                      <ExternalLink size={11} className="ml-auto shrink-0 text-[var(--text-muted)]" />
                    </a>
                  )}
                </div>
              </div>

              {/* Transactions */}
              <div className="flex flex-col gap-3 px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">
                  {isItem ? "Histórico de movimentações" : "Aportes na carteira"}
                </p>

                {isItem ? (
                  (!detail?.transactions || detail.transactions.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ArrowRightLeft size={22} className="mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
                      <p className="text-[13px] text-[var(--text-sub)]">Nenhuma movimentação ainda</p>
                      {!isAchieved && (
                        <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">Faça um aporte para começar</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {detail.transactions.map((tx) => {
                        const { label, color } = txTypeLabel(tx.type);
                        const isOut = tx.type === "Expense";
                        return (
                          <div key={tx.id} className="flex items-center gap-3 rounded-[13px] px-3 py-2.5 transition-colors hover:bg-[var(--surface2)]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                              {tx.type === "Transfer" && <ArrowRightLeft size={13} style={{ color }} />}
                              {tx.type === "Income"   && <PlusCircle     size={13} style={{ color }} />}
                              {tx.type === "Expense"  && <ArrowUpRight   size={13} style={{ color }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] text-[var(--text)]">{tx.description}</p>
                              <p className="text-[11px] text-[var(--text-sub)]">
                                {new Date(tx.transactionDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                                <span className="mx-1.5 opacity-40">·</span>
                                <span style={{ color }}>{label}</span>
                              </p>
                            </div>
                            <Money cents={isOut ? -tx.amount : tx.amount} sign={!isOut} className="shrink-0 text-[13px]" />
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  investmentTxs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <TrendingUp size={22} className="mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
                      <p className="text-[13px] text-[var(--text-sub)]">Nenhum aporte encontrado</p>
                      <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                        {goal?.targetTicker
                          ? `Nenhuma transação de ${goal.targetTicker} registrada`
                          : "Registre compras de ativos na carteira de investimentos"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {investmentTxs.map((tx) => {
                        const isBuy   = tx.operation === "Buy";
                        const color   = isBuy ? "var(--moss)" : "var(--clay)";
                        const opLabel = isBuy ? "Compra" : "Venda";
                        return (
                          <div key={tx.id} className="flex items-center gap-3 rounded-[13px] px-3 py-2.5 transition-colors hover:bg-[var(--surface2)]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                              {isBuy
                                ? <PlusCircle    size={13} style={{ color }} />
                                : <ArrowUpRight  size={13} style={{ color }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-[var(--text)]">{tx.ticker}</p>
                              <p className="text-[11px] text-[var(--text-sub)]">
                                {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                                <span className="mx-1.5 opacity-40">·</span>
                                <span style={{ color }}>{opLabel}</span>
                                <span className="mx-1.5 opacity-40">·</span>
                                {tx.quantity} un.
                              </p>
                            </div>
                            {/* A buy reduces cash (negative), a sell adds (positive). */}
                            <Money cents={isBuy ? -tx.totalValue : tx.totalValue} sign={!isBuy} className="shrink-0 text-[13px]" />
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {!isAchieved && isItem && goal && (
          <div className="flex shrink-0 gap-2 border-t border-[var(--border-color)] px-5 py-4">
            <button
              onClick={() => { onContribute(goal); onClose(); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[13px] py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: goalColor }}
            >
              <PlusCircle size={13} />
              Aportar
            </button>
            {saved > 0 && (
              <button
                onClick={() => { onWithdraw(goal); onClose(); }}
                className="flex items-center gap-1.5 rounded-[13px] border border-[var(--border-color)] px-3 py-2.5 text-[13px] font-medium text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)]"
              >
                <ArrowDownRight size={13} />
                Retirar
              </button>
            )}
            {saved >= target && (
              <button
                onClick={() => { onPurchase(goal); onClose(); }}
                className="flex items-center gap-1.5 rounded-[13px] px-3 py-2.5 text-[13px] font-medium text-[var(--moss)] transition-colors hover:brightness-110"
                style={{ background: "color-mix(in srgb, var(--moss) 15%, transparent)" }}
              >
                <ShoppingCart size={13} />
                Comprar
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── Add Goal Drawer ───────────────────────────────────────────────────────────

const GOAL_COLORS = [
  { hex: "#4A9EFF", label: "Azul" },
  { hex: "#00C98D", label: "Verde" },
  { hex: "#7C6FE0", label: "Roxo" },
  { hex: "#F5A623", label: "Laranja" },
  { hex: "#F25F5C", label: "Vermelho" },
  { hex: "#F5CE42", label: "Amarelo" },
  { hex: "#00D4A0", label: "Ciano" },
  { hex: "#E879A0", label: "Rosa" },
];

const AddGoalDrawer = ({ open, defaultType, onClose }: { open: boolean; defaultType: GoalType; onClose: () => void }) => {
  const createGoal = useCreateGoal();
  const [type, setType]                       = useState<GoalType>(defaultType);
  const [name, setName]                       = useState("");
  const [description, setDescription]         = useState("");
  const [targetAmount, setTargetAmount]       = useState("");
  const [priority, setPriority]               = useState<GoalPriority>("Medium");
  const [color, setColor]                     = useState(GOAL_COLORS[0].hex);
  const [targetAssetType, setTargetAssetType] = useState("");
  const [targetTicker, setTargetTicker]       = useState("");
  const [url, setUrl]                         = useState("");
  const [targetDate, setTargetDate]           = useState("");

  useEffect(() => {
    if (open) setType(defaultType);
  }, [open, defaultType]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const reset = () => {
    setName(""); setDescription(""); setTargetAmount("");
    setPriority("Medium"); setColor(GOAL_COLORS[0].hex);
    setTargetAssetType(""); setTargetTicker(""); setUrl(""); setTargetDate("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!name || !targetAmount || !targetDate) return;
    const data: CreateGoalRequest = {
      type,
      name,
      description: description || undefined,
      targetAmount: Math.round(parseFloat(targetAmount) * 100),
      priority,
      color,
      url: url || undefined,
      targetDate,
      targetAssetType: targetAssetType ? (targetAssetType as AssetType) : undefined,
      targetTicker: targetTicker || undefined,
    };
    await createGoal.mutateAsync(data);
    handleClose();
  };

  return (
    <>
      <div
        className={cn(DRAWER_BACKDROP, open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={handleClose}
      />
      <div
        className={cn(DRAWER_PANEL_BASE, "max-w-[420px]", open ? "translate-x-0" : "translate-x-full")}
        style={DRAWER_PANEL_STYLE}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Nova meta</h2>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        {/* Type toggle — segmented */}
        <div className="shrink-0 border-b px-5 py-3" style={{ borderColor: "var(--border-color)" }}>
          <div
            className="flex gap-[3px] rounded-[13px] border p-1"
            style={{ background: "var(--surface2)", borderColor: "var(--border-color)" }}
          >
            <button
              type="button"
              onClick={() => { setType("Item"); setTargetAssetType(""); setTargetTicker(""); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-[9px] py-2 text-[14px] font-medium transition-colors"
              style={
                type === "Item"
                  ? { background: "var(--brand-cobalt)", color: "#fff", boxShadow: "0 6px 14px -8px rgba(31,60,224,0.7)" }
                  : { color: "var(--text-sub)" }
              }
            >
              <ShoppingBag size={13} />
              Item / Compra
            </button>
            <button
              type="button"
              onClick={() => setType("Investment")}
              className="flex flex-1 items-center justify-center gap-2 rounded-[9px] py-2 text-[14px] font-medium transition-colors"
              style={
                type === "Investment"
                  ? { background: "var(--brand-cobalt)", color: "#fff", boxShadow: "0 6px 14px -8px rgba(31,60,224,0.7)" }
                  : { color: "var(--text-sub)" }
              }
            >
              <TrendingUp size={13} />
              Investimento
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div>
            <label className={LABEL_CLASS}>Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "Item" ? "Ex: iPhone 16 Pro" : "Ex: Reserva de emergência"}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>{type === "Item" ? "Preço-meta (R$) *" : "Patrimônio-alvo (R$) *"}</label>
            <CurrencyInput
              value={targetAmount}
              onChange={setTargetAmount}
              className={cn(INPUT_CLASS, "font-mono")}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Prioridade</label>
            <Select value={priority} onValueChange={(v) => setPriority((v ?? "Medium") as GoalPriority)}>
              <SelectTrigger className={TRIGGER_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                <SelectItem value="High">Alta</SelectItem>
                <SelectItem value="Medium">Média</SelectItem>
                <SelectItem value="Low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Cor</label>
            <div className="flex flex-wrap gap-2.5">
              {GOAL_COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  type="button"
                  title={label}
                  onClick={() => setColor(hex)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === hex ? "scale-110 border-[var(--text)]" : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Prazo *</label>
            <DatePickerField value={targetDate} onChange={setTargetDate} placeholder="Selecionar prazo" />
          </div>

          {type === "Item" && (
            <div>
              <label className={LABEL_CLASS}>Link (opcional)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className={INPUT_CLASS}
              />
            </div>
          )}

          {type === "Investment" && (
            <div>
              <label className={LABEL_CLASS}>Tipo de ativo (opcional)</label>
              <Select
                value={targetAssetType}
                onValueChange={(v) => {
                  setTargetAssetType(!v || v === "__geral__" ? "" : v);
                  setTargetTicker("");
                }}
              >
                <SelectTrigger className={TRIGGER_CLASS}>
                  <SelectValue placeholder="Geral (todos os investimentos)" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                  <SelectItem value="__geral__">
                    <span className="text-[var(--text-sub)]">Geral (todos os investimentos)</span>
                  </SelectItem>
                  {(Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "Investment" && targetAssetType && (
            <div>
              <label className={LABEL_CLASS}>Ativo específico (opcional)</label>
              <input
                value={targetTicker}
                onChange={(e) => setTargetTicker(e.target.value.toUpperCase())}
                placeholder="Ex: PETR4, MXRF11…"
                className={cn(INPUT_CLASS, "font-mono")}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-[var(--border-color)] px-5 py-4">
          <button onClick={handleClose} className="flex-1 rounded-[13px] border border-[var(--text)] py-2.5 text-[14px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={createGoal.isPending || !name || !targetAmount || !targetDate}
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-50"
            style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
          >
            {createGoal.isPending && <Loader2 size={14} className="animate-spin" />}
            {createGoal.isPending ? "Criando..." : "Criar meta"}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "Item" | "Investment";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all",        label: "Todas" },
  { id: "Item",       label: "Itens & Sonhos" },
  { id: "Investment", label: "Investimento" },
];

type GoalAction = "contribute" | "withdraw" | "purchase";

export function GoalsPage() {
  const { data, isLoading, isError } = useGoals();
  const { data: categories = [] } = useCategories();
  const deleteGoal = useDeleteGoal();
  const [filterTab, setFilterTab]   = useState<FilterTab>("all");
  const [showAdd, setShowAdd]       = useState(false);
  const [addType, setAddType]       = useState<GoalType>("Item");
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [activeAction, setActiveAction] = useState<GoalAction | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<number | null>(null);

  const openAdd = (type: GoalType) => { setAddType(type); setShowAdd(true); };
  const openAction = (goal: Goal, action: GoalAction) => { setActiveGoal(goal); setActiveAction(action); };
  const closeAction = () => { setActiveGoal(null); setActiveAction(null); };

  usePageNova("Nova meta", () => openAdd("Item"));
  usePageSearch();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-[var(--text-sub)]">Erro ao carregar metas. Tente novamente.</p>
      </div>
    );
  }

  const active   = data.filter((g) => g.status === "Active");
  const achieved = data.filter((g) => g.status === "Achieved");
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved  = active.reduce((s, g) => s + (g.currentAmount ?? 0), 0);
  const totalRemaining = Math.max(totalTarget - totalSaved, 0);
  const overallPct  = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  // Aggregate monthly saving rate across active goals (used for the "no ritmo atual" estimate).
  const monthlyRate = active.reduce((s, g) => s + Math.round((g.currentAmount ?? 0) / monthsElapsed(g.createdAt)), 0);
  const etaMonths   = monthlyRate > 0 && totalRemaining > 0 ? Math.ceil(totalRemaining / monthlyRate) : null;

  const savedFrac     = totalTarget > 0 ? totalSaved / totalTarget : 0;
  const remainingFrac = totalTarget > 0 ? totalRemaining / totalTarget : 0;

  const filtered = filterTab === "all" ? data : data.filter((g) => g.type === filterTab);
  const sorted = [...filtered].sort(
    (a, b) =>
      (a.status === "Active" ? 0 : 1) - (b.status === "Active" ? 0 : 1) ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const subtitle = active.length > 0
    ? `${formatCurrency(totalSaved / 100)} guardados em ${active.length} meta${active.length !== 1 ? "s" : ""}`
    : "Nenhuma meta ativa";

  return (
    <>
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Metas" subtitle={subtitle} />

        <div className="flex flex-col gap-6">
          {/* Hero — total guardado / progresso geral */}
          {active.length > 0 && (
            <HeroPanel split>
              {/* Left — total saved */}
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                  Total guardado
                </div>
                <BigMoney
                  cents={totalSaved}
                  className="mb-[2px] mt-[10px] block font-semibold leading-[0.96] tracking-[-0.035em]"
                  style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
                />

                <div className="mt-2 inline-flex items-center gap-[7px] font-mono text-[13px] font-medium">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-[9px] py-[3px]"
                    style={{ background: "rgba(129,151,255,0.18)", color: "var(--cobalt-lift)" }}
                  >
                    {overallPct.toFixed(0)}%
                  </span>
                  <span className="text-[var(--panel-muted)]">do total das suas metas</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-[26px]">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--panel-muted)]">Meta total</div>
                    <div className="mt-[3px] font-mono text-[18px] font-medium">{formatCurrency(totalTarget / 100)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--panel-muted)]">Metas ativas</div>
                    <div className="mt-[3px] font-mono text-[18px] font-medium">{active.length}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--panel-muted)]">Concluídas</div>
                    <div className="mt-[3px] font-mono text-[18px] font-medium">{achieved.length}/{data.length}</div>
                  </div>
                </div>
              </div>

              {/* Right — overall progress flow */}
              <div className="self-center">
                <div className="mb-[18px] flex items-baseline justify-between">
                  <span className="font-display text-[16px] font-bold">Progresso geral</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--panel-muted)]">
                    {formatCurrency(totalTarget / 100)}
                  </span>
                </div>

                <FlowRow
                  label="Guardado"
                  dotColor="var(--moss-lift)"
                  value={formatCurrency(totalSaved / 100)}
                  valueColor="var(--moss-lift)"
                  pct={savedFrac}
                  variant="in"
                />
                <FlowRow
                  label="Falta juntar"
                  dotColor="var(--panel-muted)"
                  value={formatCurrency(totalRemaining / 100)}
                  valueColor="var(--panel-muted)"
                  pct={remainingFrac}
                  variant="out"
                />

                <div
                  className="mt-5 flex items-center justify-between border-t pt-4"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--panel-muted)]">
                    {etaMonths !== null ? "No ritmo atual" : "Falta juntar"}
                  </span>
                  <span className="font-mono text-[22px] font-semibold" style={{ color: "var(--panel-foreground)" }}>
                    {etaMonths !== null
                      ? `${etaMonths} ${etaMonths === 1 ? "mês" : "meses"}`
                      : formatCurrency(totalRemaining / 100)}
                  </span>
                </div>
              </div>
            </HeroPanel>
          )}

          {/* Section: Suas metas */}
          <div className="flex items-center gap-3">
            <h2 className="font-display text-[18px] font-bold tracking-[-0.01em] text-[var(--text)]">Suas metas</h2>
            <div className="h-px flex-1 bg-[var(--border-color)]" />
            <div className="flex flex-wrap gap-[3px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-1" role="tablist">
              {FILTER_TABS.map(({ id, label }) => {
                const isActive = filterTab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFilterTab(id)}
                    className={cn(
                      "rounded-[9px] px-[14px] py-[7px] text-[13px] font-medium outline-none transition-colors",
                      isActive
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                        : "text-[var(--text-sub)] hover:text-[var(--text)]",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] px-5 py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface2)] text-[var(--brand-accent)]">
                <Target size={24} strokeWidth={1.75} />
              </div>
              <h4 className="font-display text-[16px] font-bold text-[var(--text)]">Nenhuma meta encontrada</h4>
              <p className="mx-auto mt-1.5 max-w-[340px] text-[13.5px] text-[var(--text-sub)]">
                Crie uma meta para começar a acompanhar seu progresso.
              </p>
              <button
                onClick={() => openAdd("Item")}
                className="mt-5 inline-flex items-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
                style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
              >
                <Plus size={16} strokeWidth={2} />
                Criar meta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
              {sorted.map((goal) =>
                goal.type === "Item" ? (
                  <ItemGoalCard
                    key={goal.id}
                    goal={goal}
                    onOpen={() => setDetailGoalId(goal.id)}
                    onContribute={() => openAction(goal, "contribute")}
                    onWithdraw={() => openAction(goal, "withdraw")}
                    onPurchase={() => openAction(goal, "purchase")}
                    onDelete={() => deleteGoal.mutate({ id: goal.id })}
                  />
                ) : (
                  <InvestmentGoalCard
                    key={goal.id}
                    goal={goal}
                    onOpen={() => setDetailGoalId(goal.id)}
                    onDelete={() => deleteGoal.mutate({ id: goal.id })}
                  />
                ),
              )}
              <button
                onClick={() => openAdd("Item")}
                className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[var(--border-color)] text-[var(--text-sub)] transition-colors hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-[var(--border-color)]">
                  <Plus size={16} strokeWidth={1.5} />
                </div>
                <span className="text-[13px] font-medium">Nova meta</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <GoalDetailDrawer
        goalId={detailGoalId}
        goals={data}
        onClose={() => setDetailGoalId(null)}
        onContribute={(g) => openAction(g, "contribute")}
        onWithdraw={(g) => openAction(g, "withdraw")}
        onPurchase={(g) => openAction(g, "purchase")}
      />

      <AddGoalDrawer open={showAdd} defaultType={addType} onClose={() => setShowAdd(false)} />

      <ContributeDrawer
        goal={activeAction === "contribute" ? activeGoal : null}
        onClose={closeAction}
      />
      <WithdrawDrawer
        goal={activeAction === "withdraw" ? activeGoal : null}
        onClose={closeAction}
      />
      <PurchaseDrawer
        goal={activeAction === "purchase" ? activeGoal : null}
        categories={categories}
        onClose={closeAction}
      />
    </>
  );
}
