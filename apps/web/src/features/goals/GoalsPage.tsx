"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Plus, Target, ShoppingBag, TrendingUp, ExternalLink,
  Trash2, X, ChevronRight, Calendar as CalendarIcon,
  Pencil, PlusCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useGoals, useCreateGoal, useDeleteGoal, useRecordCheckpoint } from "@/features/goals/hooks/useGoals";
import { usePageNova, usePageSearch } from "@/lib/hooks/usePageHeader";
import type { Goal, GoalType, GoalPriority, CreateGoalRequest } from "@/lib/types/goal.types";
import type { AssetType } from "@/lib/types/investments.types";

// ── Shared drawer constants ────────────────────────────────────────────────────

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-green/60 h-11 rounded-lg px-3.5 text-[15px]";

const TRIGGER_CLASS =
  "border-border bg-surface2 text-text w-full !h-11 rounded-lg px-3.5 text-[15px]";

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
          !value && "text-text-muted",
        )}
      >
        <span className="flex items-center gap-2.5">
          <CalendarIcon size={15} className="text-text-muted shrink-0" />
          <span className={cn("text-[15px]", value ? "text-text" : "text-text-muted")}>{label}</span>
        </span>
        {allowClear && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange(""); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange(""); } }}
            className="text-text-muted hover:text-text"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="border-border bg-surface absolute left-0 top-12 z-[70] rounded-xl border p-4 shadow-2xl" style={{ minWidth: 280 }}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface2">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <span className="text-text text-[13px] font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface2">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-text-muted py-1 text-center text-[10px] font-medium">{d}</div>
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
                      "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-all",
                      isSelected
                        ? "bg-green text-black font-bold"
                        : isToday
                          ? "border-border border text-text font-semibold"
                          : "text-text-sub hover:bg-surface2 hover:text-text",
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

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; className: string }> = {
  High:   { label: "Alta",   className: "bg-red/12 text-red" },
  Medium: { label: "Média",  className: "bg-yellow/12 text-yellow" },
  Low:    { label: "Baixa",  className: "bg-surface2 text-text-muted" },
};

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

// ── Item Goal Card ────────────────────────────────────────────────────────────

const ItemGoalCard = ({ goal, onCheckpoint, onDelete }: { goal: Goal; onCheckpoint: () => void; onDelete: () => void }) => {
  const priority   = PRIORITY_CONFIG[goal.priority];
  const isAchieved = goal.status === "Achieved";
  const goalColor  = goal.color ?? "#4A9EFF";

  const saved         = goal.latestCheckpointAmount ?? 0;
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

  return (
    <div
      className={cn("border-border bg-surface rounded-xl border overflow-hidden flex flex-col", isAchieved && "opacity-60")}
      style={{ borderTopColor: goalColor, borderTopWidth: 2 }}
    >
      <div className="flex flex-1 min-w-0 flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShoppingBag size={14} className="shrink-0" style={{ color: goalColor }} />
              <p className="text-text truncate text-[14px] font-medium">{goal.name}</p>
              {goal.url && <ExternalLink size={12} className="text-text-muted shrink-0" />}
            </div>
            {goal.description && (
              <p className="text-text-muted mt-0.5 truncate text-[12px] ml-[22px]">{goal.description}</p>
            )}
          </div>
          <div className="shrink-0">
            {isAchieved ? (
              <span className="rounded-full bg-green/12 px-2 py-0.5 text-[11px] font-medium text-green">Conquistada</span>
            ) : (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", priority.className)}>
                {priority.label}
              </span>
            )}
          </div>
        </div>

        {/* Main values */}
        <div className="flex items-center gap-4 ml-[22px]">
          <div>
            <p className="text-text-muted text-[11px]">Meta</p>
            <p className="font-money text-text text-[13px]">{formatCurrency(goal.targetAmount / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[11px]">Guardado</p>
            <p className={cn("font-money text-[13px]", targetReached ? "text-green" : "text-text")}>
              {formatCurrency(saved / 100)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-text-muted text-[11px]">Prazo</p>
            <p className="text-text text-[12px]">
              {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="ml-[22px]">
          <div className="mb-1 flex justify-between text-[11px]">
            <span className={cn("font-medium", targetReached ? "text-green" : "text-text-muted")}>
              {targetReached ? "Meta atingida!" : `${progressPct.toFixed(0)}% do objetivo`}
            </span>
            {!targetReached && (
              <span className="text-text-muted">Faltam {formatCurrency(remaining / 100)}</span>
            )}
          </div>
          <ProgressBar value={saved} max={goal.targetAmount} height={4} color={targetReached ? "#00C98D" : goalColor} />
        </div>

        {/* 3-metric row */}
        {!targetReached && (
          <div className="ml-[22px] grid grid-cols-3 gap-2 rounded-lg bg-surface2 px-3 py-2.5">
            <div>
              <p className="text-text-muted text-[10px] mb-0.5">Economia média/mês</p>
              <p className="font-money text-text text-[12px] font-medium">{formatCurrency(avgMonthly / 100)}</p>
            </div>
            <div className="border-l border-border pl-2">
              <p className="text-text-muted text-[10px] mb-0.5">Necessário/mês</p>
              <p className={cn("font-money text-[12px] font-medium", neededPerMonth === null ? "text-text-muted" : "text-text")}>
                {neededPerMonth !== null ? formatCurrency(neededPerMonth / 100) : "—"}
              </p>
            </div>
            <div className="border-l border-border pl-2">
              <p className="text-text-muted text-[10px] mb-0.5">Meses restantes</p>
              <p className={cn("text-[12px] font-medium", monthsLeft === 0 ? "text-red" : "text-text")}>
                {monthsLeft === 0 ? "Prazo vencido" : `${monthsLeft} mes${monthsLeft === 1 ? "" : "es"}`}
              </p>
            </div>
          </div>
        )}

        {/* Sufficiency callout */}
        {!targetReached && sufficiency && (
          <div className={cn(
            "ml-[22px] rounded-lg px-3 py-2 text-[12px]",
            sufficiency === "over"  && "bg-green/10 text-green",
            sufficiency === "ok"    && "bg-blue/10 text-blue",
            sufficiency === "under" && "bg-orange/10 text-orange",
          )}>
            {sufficiency === "over"  && "Sua economia atual é mais que suficiente para atingir a meta no prazo."}
            {sufficiency === "ok"    && "Sua economia atual está exatamente na linha para atingir a meta no prazo."}
            {sufficiency === "under" && "Sua economia atual está abaixo do necessário. Aumente o ritmo para cumprir o prazo."}
            {etaMonths !== null && (
              <span className="block mt-0.5 opacity-80">
                No ritmo atual, a meta será atingida em {etaMonths} mes{etaMonths === 1 ? "" : "es"} (prazo: {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}).
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isAchieved && (
        <div className="border-t border-border px-4 py-3 flex items-center gap-2">
          <button
            onClick={onCheckpoint}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface2 hover:bg-surface2/80 px-3 py-1.5 text-[12px] font-medium text-text-sub transition-colors"
            style={{ borderLeft: `3px solid ${goalColor}` }}
          >
            <PlusCircle size={13} style={{ color: goalColor }} />
            Registrar aporte
          </button>
          <button
            onClick={() => {/* editar — a implementar */}}
            title="Editar meta"
            className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            title="Excluir meta"
            className="text-red/60 hover:bg-red/10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:text-red"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Investment Goal Card ──────────────────────────────────────────────────────

const InvestmentGoalCard = ({ goal, onCheckpoint, onDelete }: { goal: Goal; onCheckpoint: () => void; onDelete: () => void }) => {
  const priority   = PRIORITY_CONFIG[goal.priority];
  const isAchieved = goal.status === "Achieved";
  const goalColor  = goal.color ?? "#7C6FE0";

  const currentAmount = goal.latestCheckpointAmount ?? 0;
  const progressPct   = Math.min((currentAmount / goal.targetAmount) * 100, 100);
  const remaining     = Math.max(goal.targetAmount - currentAmount, 0);
  const targetReached = currentAmount >= goal.targetAmount;

  const ageMonths      = monthsElapsed(goal.createdAt);
  const avgMonthly     = Math.round(currentAmount / ageMonths);
  const monthsLeft     = monthsUntil(goal.targetDate);
  const neededPerMonth = monthsLeft > 0 ? Math.round(remaining / monthsLeft) : null;

  // ETA com aporte médio atual
  const etaMonths = avgMonthly > 0 && remaining > 0 ? Math.ceil(remaining / avgMonthly) : null;

  // Status de suficiência
  let sufficiency: "ok" | "over" | "under" | null = null;
  if (neededPerMonth !== null && !targetReached) {
    if (avgMonthly > neededPerMonth * 1.05) sufficiency = "over";
    else if (avgMonthly >= neededPerMonth * 0.95) sufficiency = "ok";
    else sufficiency = "under";
  }

  const assetColor  = goal.targetAssetType ? ASSET_TYPE_COLORS[goal.targetAssetType] : undefined;

  return (
    <div
      className={cn("border-border bg-surface rounded-xl border overflow-hidden flex flex-col", isAchieved && "opacity-60")}
      style={{ borderTopColor: goalColor, borderTopWidth: 2 }}
    >
      <div className="flex flex-1 min-w-0 flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="shrink-0" style={{ color: goalColor }} />
              <p className="text-text truncate text-[14px] font-medium">{goal.name}</p>
            </div>
            {goal.description && (
              <p className="text-text-muted mt-0.5 truncate text-[12px] ml-[22px]">{goal.description}</p>
            )}
          </div>

          {/* Right column: priority + asset tags stacked */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            {isAchieved ? (
              <span className="rounded-full bg-green/12 px-2 py-0.5 text-[11px] font-medium text-green">Conquistada</span>
            ) : (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", priority.className)}>
                {priority.label}
              </span>
            )}
            {goal.targetAssetType && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${assetColor}18`, color: assetColor }}
              >
                {ASSET_TYPE_LABELS[goal.targetAssetType]}
              </span>
            )}
            {goal.targetTicker && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold"
                style={{ backgroundColor: `${assetColor ?? goalColor}18`, color: assetColor ?? goalColor }}
              >
                {goal.targetTicker}
              </span>
            )}
          </div>
        </div>

        {/* Main values */}
        <div className="flex items-center gap-4 ml-[22px]">
          <div>
            <p className="text-text-muted text-[11px]">Alvo</p>
            <p className="font-money text-text text-[13px]">{formatCurrency(goal.targetAmount / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[11px]">Atual</p>
            <p className={cn("font-money text-[13px]", targetReached ? "text-green" : "text-text")}>
              {formatCurrency(currentAmount / 100)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-text-muted text-[11px]">Prazo</p>
            <p className="text-text text-[12px]">
              {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="ml-[22px]">
          <div className="mb-1 flex justify-between text-[11px]">
            <span className={cn("font-medium", targetReached ? "text-green" : "text-text-muted")}>
              {targetReached ? "Meta atingida!" : `${progressPct.toFixed(1)}% do objetivo`}
            </span>
            {!targetReached && (
              <span className="text-text-muted">Faltam {formatCurrency(remaining / 100)}</span>
            )}
          </div>
          <ProgressBar value={currentAmount} max={goal.targetAmount} height={6} color={targetReached ? "#00C98D" : goalColor} />
        </div>

        {/* 3-metric row */}
        {!targetReached && (
          <div className="ml-[22px] grid grid-cols-3 gap-2 rounded-lg bg-surface2 px-3 py-2.5">
            <div>
              <p className="text-text-muted text-[10px] mb-0.5">Aporte médio/mês</p>
              <p className="font-money text-text text-[12px] font-medium">{formatCurrency(avgMonthly / 100)}</p>
            </div>
            <div className="border-l border-border pl-2">
              <p className="text-text-muted text-[10px] mb-0.5">Necessário/mês</p>
              <p className={cn("font-money text-[12px] font-medium", neededPerMonth === null ? "text-text-muted" : "text-text")}>
                {neededPerMonth !== null ? formatCurrency(neededPerMonth / 100) : "—"}
              </p>
            </div>
            <div className="border-l border-border pl-2">
              <p className="text-text-muted text-[10px] mb-0.5">Meses restantes</p>
              <p className={cn("text-[12px] font-medium", monthsLeft === 0 ? "text-red" : "text-text")}>
                {monthsLeft === 0 ? "Prazo vencido" : `${monthsLeft} mes${monthsLeft === 1 ? "" : "es"}`}
              </p>
            </div>
          </div>
        )}

        {/* Sufficiency callout */}
        {!targetReached && sufficiency && (
          <div className={cn(
            "ml-[22px] rounded-lg px-3 py-2 text-[12px]",
            sufficiency === "over"  && "bg-green/10 text-green",
            sufficiency === "ok"    && "bg-blue/10 text-blue",
            sufficiency === "under" && "bg-orange/10 text-orange",
          )}>
            {sufficiency === "over"  && "Seu aporte atual é mais que suficiente para bater a meta no prazo."}
            {sufficiency === "ok"    && "Seu aporte atual está exatamente na linha para bater a meta no prazo."}
            {sufficiency === "under" && "Seu aporte atual está abaixo do necessário. Aumente o aporte para cumprir o prazo."}
            {etaMonths !== null && (
              <span className="block mt-0.5 opacity-80">
                No ritmo atual, a meta será atingida em {etaMonths} mes{etaMonths === 1 ? "" : "es"} (prazo: {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}).
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isAchieved && (
        <div className="border-t border-border px-4 py-3 flex items-center gap-2">
          <button
            onClick={onCheckpoint}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface2 hover:bg-surface2/80 px-3 py-1.5 text-[12px] font-medium text-text-sub transition-colors"
            style={{ borderLeft: `3px solid ${goalColor}` }}
          >
            <PlusCircle size={13} style={{ color: goalColor }} />
            Registrar aporte
          </button>
          <button
            onClick={() => {/* editar — a implementar */}}
            title="Editar meta"
            className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            title="Excluir meta"
            className="text-red/60 hover:bg-red/10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:text-red"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Checkpoint Drawer ─────────────────────────────────────────────────────────

const CheckpointDrawer = ({ goal, onClose }: { goal: Goal | null; onClose: () => void }) => {
  const recordCheckpoint = useRecordCheckpoint();
  const [amount, setAmount] = useState("");
  const open = goal !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClose = () => { setAmount(""); onClose(); };

  const handleSubmit = async () => {
    if (!goal || !amount) return;
    await recordCheckpoint.mutateAsync({ id: goal.id, amount: Math.round(parseFloat(amount) * 100) });
    handleClose();
  };

  const goalColor = goal?.color ?? "#4A9EFF";
  const saved = goal?.latestCheckpointAmount ?? 0;
  const labelClass = "text-text-muted mb-1.5 block text-[12px] font-medium uppercase tracking-wide";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: goalColor }} />
            <h2 className="font-display font-700 text-text text-[17px]">Registrar Aporte</h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Meta info */}
          {goal && (
            <div className="rounded-xl border border-border bg-surface2 px-4 py-3.5 flex flex-col gap-1.5">
              <p className="text-text-muted text-[11px] uppercase tracking-wide font-medium">Meta</p>
              <p className="text-text text-[14px] font-medium">{goal.name}</p>
              <div className="flex items-center gap-4 mt-1">
                <div>
                  <p className="text-text-muted text-[11px]">Alvo</p>
                  <p className="font-money text-text text-[13px]">{formatCurrency(goal.targetAmount / 100)}</p>
                </div>
                <div>
                  <p className="text-text-muted text-[11px]">Guardado</p>
                  <p className="font-money text-green text-[13px]">{formatCurrency(saved / 100)}</p>
                </div>
                <div>
                  <p className="text-text-muted text-[11px]">Faltam</p>
                  <p className="font-money text-text text-[13px]">
                    {formatCurrency(Math.max(goal.targetAmount - saved, 0) / 100)}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={saved}
                  max={goal.targetAmount}
                  height={4}
                  color={goalColor}
                />
              </div>
            </div>
          )}

          {/* Valor do aporte */}
          <div>
            <label className={labelClass}>Valor do aporte (R$) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              autoFocus
              className={INPUT_CLASS}
            />
            <p className="text-text-muted mt-1.5 text-[11px]">
              Informe quanto você está aportando agora. Os aportes são somados automaticamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 flex gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="border-border text-text-sub hover:bg-surface2 flex-1 rounded-lg border py-2.5 text-[14px] font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={recordCheckpoint.isPending || !amount}
            className="flex-1 rounded-lg py-2.5 text-[14px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 text-black"
            style={{ backgroundColor: goalColor }}
          >
            {recordCheckpoint.isPending && <Loader2 size={14} className="animate-spin" />}
            {recordCheckpoint.isPending ? "Salvando..." : "Registrar"}
          </button>
        </div>
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

  const labelClass = "text-text-muted mb-1.5 block text-[12px] font-medium uppercase tracking-wide";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h2 className="font-display font-700 text-text text-[17px]">Nova Meta</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="border-b border-border px-5 py-3 shrink-0">
          <div className="bg-surface2 flex rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setType("Item"); setTargetAssetType(""); setTargetTicker(""); }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-medium transition-colors",
                type === "Item" ? "bg-blue/15 text-blue" : "text-text-muted hover:text-text-sub",
              )}
            >
              <ShoppingBag size={13} />
              Item / Compra
            </button>
            <button
              type="button"
              onClick={() => setType("Investment")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-medium transition-colors",
                type === "Investment" ? "bg-green/15 text-green" : "text-text-muted hover:text-text-sub",
              )}
            >
              <TrendingUp size={13} />
              Investimento
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "Item" ? "Ex: iPhone 16 Pro" : "Ex: Reserva de emergência"}
              className={INPUT_CLASS}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className={labelClass}>Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações..."
              className={INPUT_CLASS}
            />
          </div>

          {/* Valor-alvo */}
          <div>
            <label className={labelClass}>{type === "Item" ? "Preço-meta (R$) *" : "Patrimônio-alvo (R$) *"}</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0,00"
              className={INPUT_CLASS}
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className={labelClass}>Prioridade</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
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

          {/* Cor */}
          <div>
            <label className={labelClass}>Cor</label>
            <div className="flex flex-wrap gap-2.5">
              {GOAL_COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  type="button"
                  title={label}
                  onClick={() => setColor(hex)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === hex ? "border-text scale-110" : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Prazo — ambos os tipos */}
          <div>
            <label className={labelClass}>Prazo *</label>
            <DatePickerField
              value={targetDate}
              onChange={setTargetDate}
              placeholder="Selecionar prazo"
            />
          </div>

          {/* Link — apenas Item */}
          {type === "Item" && (
            <div>
              <label className={labelClass}>Link (opcional)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className={INPUT_CLASS}
              />
            </div>
          )}

          {/* Tipo de ativo — apenas Investment */}
          {type === "Investment" && (
            <div>
              <label className={labelClass}>Tipo de ativo (opcional)</label>
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
                    <span className="text-text-muted">Geral (todos os investimentos)</span>
                  </SelectItem>
                  {(Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ativo específico — apenas quando tipo de ativo selecionado */}
          {type === "Investment" && targetAssetType && (
            <div>
              <label className={labelClass}>Ativo específico (opcional)</label>
              <input
                value={targetTicker}
                onChange={(e) => setTargetTicker(e.target.value.toUpperCase())}
                placeholder="Ex: PETR4, MXRF11… (em breve via Brapi)"
                className={INPUT_CLASS}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 flex gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="border-border text-text-sub hover:bg-surface2 flex-1 rounded-lg border py-2.5 text-[14px] font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={createGoal.isPending || !name || !targetAmount || !targetDate}
            className="bg-green text-black flex-1 rounded-lg py-2.5 text-[14px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createGoal.isPending && <Loader2 size={14} className="animate-spin" />}
            {createGoal.isPending ? "Criando..." : "Criar Meta"}
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

export function GoalsPage() {
  const { data, isLoading, isError } = useGoals();
  const deleteGoal = useDeleteGoal();
  const [filterTab, setFilterTab]         = useState<FilterTab>("all");
  const [showAdd, setShowAdd]             = useState(false);
  const [addType, setAddType]             = useState<GoalType>("Item");
  const [checkpointGoal, setCheckpointGoal] = useState<Goal | null>(null);

  const openAdd = (type: GoalType) => { setAddType(type); setShowAdd(true); };

  usePageNova("Nova meta", () => openAdd("Item"));
  usePageSearch();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar metas. Tente novamente.</p>
      </div>
    );
  }

  const active   = data.filter((g) => g.status === "Active");
  const achieved = data.filter((g) => g.status === "Achieved");
  const totalTarget  = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved   = active.reduce((s, g) => s + (g.latestCheckpointAmount ?? 0), 0);

  const kpis = [
    { label: "Total Guardado",     value: formatCurrency(totalSaved / 100),   color: "text-green" },
    { label: "Total das Metas",    value: formatCurrency(totalTarget / 100),  color: "text-text" },
    { label: "Progresso Geral",    value: totalTarget > 0 ? `${Math.min((totalSaved / totalTarget) * 100, 100).toFixed(1)}%` : "—", color: "text-blue" },
    { label: "Concluídas",         value: `${achieved.length}/${data.length}`, color: "text-purple" },
  ];

  const filtered = filterTab === "all" ? data : data.filter((g) => g.type === filterTab);
  const sorted = [...filtered].sort(
    (a, b) =>
      (a.status === "Active" ? 0 : 1) - (b.status === "Active" ? 0 : 1) ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Metas</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">
            {active.length} meta{active.length !== 1 ? "s" : ""} ativa{active.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* 4 KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map(({ label, value, color }) => (
            <div key={label} className="border-border bg-surface rounded-xl border p-4">
              <p className="text-text-muted text-[12px]">{label}</p>
              <p className={cn("font-money font-600 mt-1 text-[20px]", color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2" role="tablist">
          {FILTER_TABS.map(({ id, label }) => {
            const active = filterTab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setFilterTab(id)}
                className={cn(
                  "h-8 rounded-full border px-3.5 text-[13px] font-medium transition-all outline-none",
                  active
                    ? "border-green/45 bg-green/15 text-green"
                    : "border-border bg-surface text-text-sub hover:border-border-light hover:text-text",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Goal grid */}
        {sorted.length === 0 ? (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <div className="bg-surface2 mb-3 flex h-12 w-12 items-center justify-center rounded-[14px]">
              <Target size={22} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-text text-[15px] font-medium">Nenhuma meta encontrada</p>
            <p className="text-text-muted mt-1 text-[13px]">Crie uma meta para começar a acompanhar seu progresso.</p>
            <button
              onClick={() => openAdd("Item")}
              className="bg-green text-black mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
            >
              <Plus size={14} />
              Criar meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sorted.map((goal) =>
              goal.type === "Item" ? (
                <ItemGoalCard
                  key={goal.id}
                  goal={goal}
                  onCheckpoint={() => setCheckpointGoal(goal)}
                  onDelete={() => deleteGoal.mutate(goal.id)}
                />
              ) : (
                <InvestmentGoalCard
                  key={goal.id}
                  goal={goal}
                  onCheckpoint={() => setCheckpointGoal(goal)}
                  onDelete={() => deleteGoal.mutate(goal.id)}
                />
              ),
            )}
            {/* Placeholder add card */}
            <button
              onClick={() => openAdd("Item")}
              className="border-border text-text-muted hover:border-green/40 hover:text-green flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors"
            >
              <div className="border-border flex h-9 w-9 items-center justify-center rounded-full border border-dashed">
                <Plus size={16} strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium">Nova Meta</span>
            </button>
          </div>
        )}
      </div>

      <AddGoalDrawer open={showAdd} defaultType={addType} onClose={() => setShowAdd(false)} />
      <CheckpointDrawer goal={checkpointGoal} onClose={() => setCheckpointGoal(null)} />
    </>
  );
}
