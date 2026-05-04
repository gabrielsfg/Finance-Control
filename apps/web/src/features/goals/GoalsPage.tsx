"use client";

import { useState } from "react";
import {
  Loader2, Plus, Target, ShoppingBag, TrendingUp, ExternalLink,
  CheckCircle2, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useGoals, useCreateGoal, useDeleteGoal, useAchieveGoal, useRecordCheckpoint } from "@/features/goals/hooks/useGoals";
import type { Goal, GoalType, GoalPriority, CreateGoalRequest } from "@/lib/types/goal.types";

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; className: string }> = {
  High:   { label: "Alta",   className: "bg-red/12 text-red" },
  Medium: { label: "Média",  className: "bg-orange/12 text-orange" },
  Low:    { label: "Baixa",  className: "bg-surface2 text-text-muted" },
};

const PRIORITY_ORDER: Record<GoalPriority, number> = { High: 0, Medium: 1, Low: 2 };

// ── Tooltip ──────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-1.5 shadow-md">
      <p className="text-text-muted mb-0.5 text-[11px]">{label}</p>
      <p className="font-money text-text text-[12px]">{formatCurrency(payload[0].value / 100)}</p>
    </div>
  );
};

// ── Item Goal Card ────────────────────────────────────────────────────────────

const ItemGoalCard = ({ goal, onDelete, onAchieve }: { goal: Goal; onDelete: () => void; onAchieve: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_CONFIG[goal.priority];
  const isAchieved = goal.status === "Achieved";

  const hasCurrentAmount = goal.latestCheckpointAmount !== null;
  const targetReached = hasCurrentAmount && goal.latestCheckpointAmount! <= goal.targetAmount;
  const progressPct = hasCurrentAmount
    ? Math.min((goal.targetAmount / goal.latestCheckpointAmount!) * 100, 100)
    : 0;

  // "N months saving Y/month to reach target" — based on monthly savings = targetAmount / 12 (rough)
  const remaining = hasCurrentAmount ? Math.max(goal.latestCheckpointAmount! - goal.targetAmount, 0) : null;

  return (
    <div className={cn("border-border bg-surface rounded-xl border overflow-hidden", isAchieved && "opacity-60")}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-surface2/40 flex w-full items-start gap-3 p-4 text-left transition-colors"
      >
        <div className="flex flex-1 min-w-0 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShoppingBag size={14} className="text-text-muted shrink-0" />
                <p className="text-text truncate text-[14px] font-medium">{goal.name}</p>
                {goal.url && <ExternalLink size={12} className="text-text-muted shrink-0" />}
              </div>
              {goal.description && (
                <p className="text-text-muted mt-0.5 truncate text-[12px] ml-[22px]">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAchieved ? (
                <span className="rounded-full bg-green/12 px-2 py-0.5 text-[11px] font-medium text-green">Conquistada</span>
              ) : (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", priority.className)}>
                  {priority.label}
                </span>
              )}
              {expanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-[22px]">
            <div>
              <p className="text-text-muted text-[11px]">Meta</p>
              <p className="font-money text-text text-[13px]">{formatCurrency(goal.targetAmount / 100)}</p>
            </div>
            {hasCurrentAmount && (
              <div>
                <p className="text-text-muted text-[11px]">Preço atual</p>
                <p className={cn("font-money text-[13px]", targetReached ? "text-green" : "text-text")}>
                  {formatCurrency(goal.latestCheckpointAmount! / 100)}
                </p>
              </div>
            )}
          </div>

          {hasCurrentAmount && (
            <div className="mt-1 ml-[22px]">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-text-muted">
                  {targetReached ? "Meta de preço atingida!" : `${progressPct.toFixed(0)}% do preço-meta`}
                </span>
                {!targetReached && remaining !== null && remaining > 0 && (
                  <span className="text-text-muted">Faltam {formatCurrency(remaining / 100)}</span>
                )}
              </div>
              <ProgressBar value={goal.targetAmount} max={goal.latestCheckpointAmount!} height={4} color={targetReached ? "#00C98D" : "#4A9EFF"} />
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-border border-t px-4 pb-4 pt-3 flex flex-col gap-3">
          {!isAchieved && (
            <div className="flex gap-2">
              <button
                onClick={onAchieve}
                className="flex items-center gap-1.5 rounded-lg bg-green/12 px-3 py-1.5 text-[12px] font-medium text-green transition-colors hover:bg-green/20"
              >
                <CheckCircle2 size={13} />
                Marcar como conquistada
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red/10 px-3 py-1.5 text-[12px] font-medium text-red transition-colors hover:bg-red/20 ml-auto"
              >
                <Trash2 size={13} />
                Remover
              </button>
            </div>
          )}
          {goal.targetDate && (
            <p className="text-text-muted text-[12px]">
              Prazo: {new Date(goal.targetDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Investment Goal Card ──────────────────────────────────────────────────────

const InvestmentGoalCard = ({ goal, onDelete, onAchieve }: { goal: Goal; onDelete: () => void; onAchieve: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_CONFIG[goal.priority];
  const isAchieved = goal.status === "Achieved";

  const currentAmount = goal.latestCheckpointAmount ?? 0;
  const progressPct = Math.min((currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - currentAmount, 0);
  const targetReached = currentAmount >= goal.targetAmount;

  // Estimate months to reach target based on a simple average monthly savings hint
  // We don't have income data here, so we skip the calculation — just show progress
  let etaLabel: string | null = null;
  if (goal.targetDate) {
    const months = Math.round(
      (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
    );
    if (months > 0) etaLabel = `${months} mes${months === 1 ? "" : "es"} restante${months === 1 ? "" : "s"}`;
    else etaLabel = "Prazo atingido";
  }

  return (
    <div className={cn("border-border bg-surface rounded-xl border overflow-hidden", isAchieved && "opacity-60")}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-surface2/40 flex w-full items-start gap-3 p-4 text-left transition-colors"
      >
        <div className="flex flex-1 min-w-0 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-purple shrink-0" />
                <p className="text-text truncate text-[14px] font-medium">{goal.name}</p>
              </div>
              {goal.description && (
                <p className="text-text-muted mt-0.5 truncate text-[12px] ml-[22px]">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAchieved ? (
                <span className="rounded-full bg-green/12 px-2 py-0.5 text-[11px] font-medium text-green">Conquistada</span>
              ) : (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", priority.className)}>
                  {priority.label}
                </span>
              )}
              {expanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-[22px]">
            <div>
              <p className="text-text-muted text-[11px]">Alvo</p>
              <p className="font-money text-text text-[13px]">{formatCurrency(goal.targetAmount / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Patrimônio atual</p>
              <p className={cn("font-money text-[13px]", targetReached ? "text-green" : "text-text")}>
                {formatCurrency(currentAmount / 100)}
              </p>
            </div>
            {etaLabel && (
              <div className="ml-auto">
                <p className="text-text-muted text-[11px] text-right">Prazo</p>
                <p className="text-text text-[12px]">{etaLabel}</p>
              </div>
            )}
          </div>

          <div className="mt-1 ml-[22px]">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className={cn("font-medium", targetReached ? "text-green" : "text-text-muted")}>
                {targetReached ? "Meta atingida!" : `${progressPct.toFixed(1)}% do objetivo`}
              </span>
              {!targetReached && (
                <span className="text-text-muted">Faltam {formatCurrency(remaining / 100)}</span>
              )}
            </div>
            <ProgressBar value={currentAmount} max={goal.targetAmount} height={6} color={targetReached ? "#00C98D" : "#7C6FE0"} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-border border-t px-4 pb-4 pt-3 flex flex-col gap-3">
          <p className="text-text-muted text-[12px]">
            O valor do patrimônio é calculado automaticamente com base nos seus investimentos em carteira.
          </p>
          {!isAchieved && (
            <div className="flex gap-2">
              <button
                onClick={onAchieve}
                className="flex items-center gap-1.5 rounded-lg bg-green/12 px-3 py-1.5 text-[12px] font-medium text-green transition-colors hover:bg-green/20"
              >
                <CheckCircle2 size={13} />
                Marcar como conquistada
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red/10 px-3 py-1.5 text-[12px] font-medium text-red transition-colors hover:bg-red/20 ml-auto"
              >
                <Trash2 size={13} />
                Remover
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Add Goal Modal ────────────────────────────────────────────────────────────

const AddGoalModal = ({ defaultType, onClose }: { defaultType: GoalType; onClose: () => void }) => {
  const createGoal = useCreateGoal();
  const [type, setType] = useState<GoalType>(defaultType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [priority, setPriority] = useState<GoalPriority>("Medium");
  const [url, setUrl] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = async () => {
    if (!name || !targetAmount) return;
    const data: CreateGoalRequest = {
      type,
      name,
      description: description || undefined,
      targetAmount: Math.round(parseFloat(targetAmount) * 100),
      priority,
      url: url || undefined,
      targetDate: targetDate || undefined,
    };
    await createGoal.mutateAsync(data);
    onClose();
  };

  const inputClass = "border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60";
  const labelClass = "text-text-muted mb-1 block text-[12px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="border-border bg-surface relative w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <h2 className="font-display font-700 text-text mb-5 text-[18px]">Nova Meta</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Item", "Investment"] as GoalType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border py-2 text-[13px] font-medium transition-colors",
                    type === t
                      ? "border-green/60 bg-green/10 text-green"
                      : "border-border text-text-muted hover:border-border/60",
                  )}
                >
                  {t === "Item" ? <ShoppingBag size={14} /> : <TrendingUp size={14} />}
                  {t === "Item" ? "Item / Compra" : "Investimento"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "Item" ? "Ex: iPhone 16 Pro" : "Ex: Reserva de emergência"}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{type === "Item" ? "Preço-meta (R$) *" : "Patrimônio-alvo (R$) *"}</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className={inputClass}
              >
                <option value="High">Alta</option>
                <option value="Medium">Média</option>
                <option value="Low">Baixa</option>
              </select>
            </div>
          </div>

          {type === "Item" && (
            <div>
              <label className={labelClass}>Link (opcional)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          )}

          {type === "Investment" && (
            <div>
              <label className={labelClass}>Prazo (opcional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="border-border text-text-sub hover:bg-surface2 flex-1 rounded-lg border py-2 text-[13px] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={createGoal.isPending || !name || !targetAmount}
            className="bg-green text-black flex-1 rounded-lg py-2 text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {createGoal.isPending ? "Criando..." : "Criar Meta"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const GoalStats = ({ goals }: { goals: Goal[] }) => {
  const active = goals.filter((g) => g.status === "Active").length;
  const achieved = goals.filter((g) => g.status === "Achieved").length;
  const totalTarget = goals
    .filter((g) => g.status === "Active")
    .reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Metas ativas", value: String(active) },
        { label: "Conquistadas", value: String(achieved) },
        { label: "Total a atingir", value: formatCurrency(totalTarget / 100) },
      ].map(({ label, value }) => (
        <div key={label} className="border-border bg-surface rounded-xl border p-4">
          <p className="text-text-muted text-[12px]">{label}</p>
          <p className="font-money text-text mt-1 text-[18px] font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
};

// ── Tab ───────────────────────────────────────────────────────────────────────

type Tab = "Item" | "Investment";

// ── Page ──────────────────────────────────────────────────────────────────────

export function GoalsPage() {
  const { data, isLoading, isError } = useGoals();
  const deleteGoal = useDeleteGoal();
  const achieveGoal = useAchieveGoal();
  const [activeTab, setActiveTab] = useState<Tab>("Item");
  const [showAdd, setShowAdd] = useState(false);

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

  const tabGoals = data.filter((g) => g.type === activeTab);
  const sorted = [...tabGoals].sort(
    (a, b) =>
      (a.status === "Active" ? 0 : 1) - (b.status === "Active" ? 0 : 1) ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "Item",       label: "Itens",        icon: <ShoppingBag size={14} /> },
    { key: "Investment", label: "Investimento",  icon: <TrendingUp size={14} /> },
  ];

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Metas</h1>
            <p className="text-text-muted mt-0.5 text-[13px]">
              {data.filter((g) => g.status === "Active").length} meta{data.filter((g) => g.status === "Active").length !== 1 ? "s" : ""} ativa{data.filter((g) => g.status === "Active").length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-green text-black flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90 shrink-0"
          >
            <Plus size={15} />
            Nova meta
          </button>
        </div>

        <GoalStats goals={data} />

        {/* Tabs */}
        <div className="border-border flex border-b">
          {TABS.map((tab) => {
            const count = data.filter((g) => g.type === tab.key && g.status === "Active").length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 pb-2.5 pt-1 text-[13px] font-medium transition-colors",
                  activeTab === tab.key
                    ? "border-green text-green"
                    : "border-transparent text-text-muted hover:text-text",
                )}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    activeTab === tab.key ? "bg-green/15 text-green" : "bg-surface2 text-text-muted",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Goal list */}
        {sorted.length === 0 ? (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <div className="bg-surface2 mb-3 flex h-12 w-12 items-center justify-center rounded-[14px]">
              <Target size={22} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-text text-[15px] font-medium">
              {activeTab === "Item" ? "Nenhuma meta de compra" : "Nenhuma meta de investimento"}
            </p>
            <p className="text-text-muted mt-1 text-[13px]">
              {activeTab === "Item"
                ? "Adicione itens que deseja comprar e acompanhe o preço."
                : "Defina um alvo de patrimônio e acompanhe seu progresso."}
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-green text-black mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
            >
              <Plus size={14} />
              Criar meta
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((goal) =>
              goal.type === "Item" ? (
                <ItemGoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={() => deleteGoal.mutate(goal.id)}
                  onAchieve={() => achieveGoal.mutate(goal.id)}
                />
              ) : (
                <InvestmentGoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={() => deleteGoal.mutate(goal.id)}
                  onAchieve={() => achieveGoal.mutate(goal.id)}
                />
              ),
            )}
          </div>
        )}
      </div>

      {showAdd && <AddGoalModal defaultType={activeTab} onClose={() => setShowAdd(false)} />}
    </>
  );
}
