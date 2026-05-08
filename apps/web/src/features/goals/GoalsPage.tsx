"use client";

import { useState } from "react";
import {
  Loader2, Plus, Target, ShoppingBag, TrendingUp, ExternalLink,
  CheckCircle2, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useGoals, useCreateGoal, useDeleteGoal, useAchieveGoal } from "@/features/goals/hooks/useGoals";
import { usePageNova, usePageSearch } from "@/lib/hooks/usePageHeader";
import type { Goal, GoalType, GoalPriority, CreateGoalRequest } from "@/lib/types/goal.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; className: string }> = {
  High:   { label: "Alta",   className: "bg-red/12 text-red" },
  Medium: { label: "Média",  className: "bg-orange/12 text-orange" },
  Low:    { label: "Baixa",  className: "bg-surface2 text-text-muted" },
};

const PRIORITY_ORDER: Record<GoalPriority, number> = { High: 0, Medium: 1, Low: 2 };

// ── Projection Callout ────────────────────────────────────────────────────────

function ProjectionCallout({ goal }: { goal: Goal }) {
  if (goal.status !== "Active") return null;

  const saved     = goal.latestCheckpointAmount ?? 0;
  const remaining = Math.max(goal.targetAmount - saved, 0);

  if (remaining === 0) return (
    <div className="mt-2 rounded-lg bg-green/10 px-3 py-2 text-[12px] text-green font-medium">
      Meta atingida! Pronto para marcar como conquistada.
    </div>
  );

  if (!goal.targetDate) return null;

  const monthsLeft = Math.max(
    Math.round((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)),
    0,
  );

  if (monthsLeft === 0) return (
    <div className="mt-2 rounded-lg bg-orange/10 px-3 py-2 text-[12px] text-orange">
      Prazo atingido — faltam ainda {formatCurrency(remaining / 100)}
    </div>
  );

  const needed = remaining / monthsLeft;
  return (
    <div className="mt-2 rounded-lg bg-surface2 px-3 py-2 text-[12px] text-text-muted">
      No ritmo necessário: <span className="text-text font-medium">{formatCurrency(needed / 100)}/mês</span> por {monthsLeft} meses para concluir no prazo.
    </div>
  );
}

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

          <ProjectionCallout goal={goal} />
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

  let etaLabel: string | null = null;
  if (goal.targetDate) {
    const months = Math.round(
      (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
    );
    etaLabel = months > 0
      ? `${months} mes${months === 1 ? "" : "es"} restante${months === 1 ? "" : "s"}`
      : "Prazo atingido";
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

          <ProjectionCallout goal={goal} />
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
  const [type, setType]                 = useState<GoalType>(defaultType);
  const [name, setName]                 = useState("");
  const [description, setDescription]   = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [priority, setPriority]         = useState<GoalPriority>("Medium");
  const [url, setUrl]                   = useState("");
  const [targetDate, setTargetDate]     = useState("");

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
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder={type === "Item" ? "Ex: iPhone 16 Pro" : "Ex: Reserva de emergência"}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Descrição (opcional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações..." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{type === "Item" ? "Preço-meta (R$) *" : "Patrimônio-alvo (R$) *"}</label>
              <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0,00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className={inputClass}>
                <option value="High">Alta</option>
                <option value="Medium">Média</option>
                <option value="Low">Baixa</option>
              </select>
            </div>
          </div>

          {type === "Item" && (
            <div>
              <label className={labelClass}>Link (opcional)</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..." className={inputClass} />
            </div>
          )}

          {type === "Investment" && (
            <div>
              <label className={labelClass}>Prazo (opcional)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass} />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose}
            className="border-border text-text-sub hover:bg-surface2 flex-1 rounded-lg border py-2 text-[13px] transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit}
            disabled={createGoal.isPending || !name || !targetAmount}
            className="bg-green text-black flex-1 rounded-lg py-2 text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
            {createGoal.isPending ? "Criando..." : "Criar Meta"}
          </button>
        </div>
      </div>
    </div>
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
  const deleteGoal  = useDeleteGoal();
  const achieveGoal = useAchieveGoal();
  const [filterTab, setFilterTab]   = useState<FilterTab>("all");
  const [showAdd, setShowAdd]       = useState(false);
  const [addType, setAddType]       = useState<GoalType>("Item");

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
    { label: "Concluídas",         value: String(achieved.length),            color: "text-purple" },
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

      {showAdd && <AddGoalModal defaultType={addType} onClose={() => setShowAdd(false)} />}
    </>
  );
}
