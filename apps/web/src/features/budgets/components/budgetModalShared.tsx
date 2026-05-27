"use client";

// Shared types, constants, and step components used by both CreateBudgetModal and EditBudgetModal.

import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, FolderOpen, X, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { BudgetRecurrence, AllocationType } from "@/lib/types/budgets.types";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

// ── Constants ─────────────────────────────────────────────────────────────────

export const RECURRENCE_OPTIONS: { value: BudgetRecurrence; label: string }[] = [
  { value: "Monthly",      label: "Mensal" },
  { value: "Weekly",       label: "Semanal" },
  { value: "Biweekly",     label: "Quinzenal" },
  { value: "Semiannually", label: "Semestral" },
  { value: "Annually",     label: "Anual" },
];

export const RECURRENCE_LABELS: Record<BudgetRecurrence, string> = {
  Monthly: "Mensal", Weekly: "Semanal", Biweekly: "Quinzenal",
  Semiannually: "Semestral", Annually: "Anual",
};

// ── Draft types ───────────────────────────────────────────────────────────────

export type DraftAllocation = {
  id: number;
  subCategoryId: number;
  subCategoryName: string;
  subCategoryEmoji?: string | null;
  categoryName: string;
  categoryColor: string | null;
  expectedValue: number; // cents
  allocationType: AllocationType;
};

export type DraftArea = {
  id: number;
  name: string;
  allocations: DraftAllocation[];
};

let _uid = 0;
export const uid = () => ++_uid;

// ── Step indicator ─────────────────────────────────────────────────────────────

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Detalhes", "Áreas", "Resumo"] as const;
  return (
    <div className="mb-5 flex items-center gap-2">
      {steps.map((label, i) => {
        const s = (i + 1) as 1 | 2 | 3;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              step === s ? "bg-green text-black" : step > s ? "bg-green/30 text-green" : "bg-surface2 text-text-muted",
            )}>{s}</div>
            <span className={cn("text-[12px] font-medium", step === s ? "text-text" : "text-text-muted")}>
              {label}
            </span>
            {s < 3 && <ChevronRight size={12} className="text-text-muted" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Subcategory picker ────────────────────────────────────────────────────────

export function SubcategoryPicker({
  subCategories, usedIds, onPick, onClose, onNewSubCategory,
}: {
  subCategories: SubCategoryItem[];
  usedIds: Set<number>;
  onPick: (sub: SubCategoryItem) => void;
  onClose: () => void;
  onNewSubCategory?: () => void;
}) {
  const [search, setSearch] = useState("");

  const available = subCategories.filter(
    (s) => !usedIds.has(s.id) &&
      (!search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(search.toLowerCase())),
  );

  const groups = available.reduce<Record<string, SubCategoryItem[]>>((acc, s) => {
    (acc[s.categoryName] ??= []).push(s);
    return acc;
  }, {});

  const resolveColor = (subs: SubCategoryItem[]) =>
    getCategoryColor(subs[0]?.categoryColor, subs[0]?.categoryName);

  return (
    <div className="border-border bg-surface rounded-xl border overflow-hidden">
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar subcategoria..."
          className="bg-transparent text-text placeholder:text-text-muted flex-1 text-[13px] outline-none"
        />
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text">
          <X size={13} />
        </button>
      </div>
      <div className="max-h-44 overflow-y-auto">
        {Object.keys(groups).length === 0 ? (
          <p className="text-text-muted px-3 py-4 text-center text-[12px]">Nenhuma encontrada</p>
        ) : (
          Object.entries(groups).map(([cat, subs]) => {
            const color = resolveColor(subs);
            return (
              <div key={cat}>
                <div className="bg-surface2/60 flex items-center gap-1.5 px-3 py-1">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <p className="text-text-muted text-[11px] font-medium uppercase tracking-[0.06em]">{cat}</p>
                </div>
                {subs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onPick(s)}
                    className="hover:bg-surface2 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
                  >
                    {s.emoji
                      ? <span className="text-[14px] leading-none shrink-0">{s.emoji}</span>
                      : <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    }
                    <span className="text-text text-[13px]">{s.name}</span>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
      {onNewSubCategory && (
        <div className="border-border border-t px-3 py-2">
          <button
            type="button"
            onClick={onNewSubCategory}
            className="text-text-muted hover:text-green flex w-full items-center gap-1.5 text-[12px] transition-colors"
          >
            <Plus size={12} />
            Nova subcategoria
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 1 — Details ──────────────────────────────────────────────────────────

export function Step1({
  name, setName, recurrence, setRecurrence, startDayStr, setStartDayStr,
}: {
  name: string; setName: (v: string) => void;
  recurrence: BudgetRecurrence; setRecurrence: (v: BudgetRecurrence) => void;
  startDayStr: string; setStartDayStr: (v: string) => void;
}) {
  const inputClass = "border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-green/60";

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setStartDayStr(""); return; }
    const n = Math.min(31, Math.max(1, Number(raw)));
    setStartDayStr(String(n));
  };

  const dayInvalid = startDayStr === "" || Number(startDayStr) < 1 || Number(startDayStr) > 31;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-text-muted mb-1 block text-[12px]">Nome *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Mensal Maio, Viagem Europa..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-text-muted mb-1 block text-[12px]">Recorrência</label>
        <div className="grid grid-cols-5 gap-2">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRecurrence(opt.value)}
              className={cn(
                "rounded-lg border py-2 text-[12px] font-medium transition-colors",
                recurrence === opt.value
                  ? "border-green/60 bg-green/10 text-green"
                  : "border-border text-text-muted hover:text-text",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-text-muted mb-1 block text-[12px]">Dia de início</label>
        <input
          inputMode="numeric"
          value={startDayStr}
          onChange={handleDayChange}
          placeholder="1"
          className={cn(inputClass, "w-24", dayInvalid && startDayStr !== "" && "border-red/60")}
        />
        <p className="text-text-muted mt-1 text-[11px]">Dia do mês em que o orçamento começa (1–31)</p>
      </div>
    </div>
  );
}

// ── Step 2 — Areas & Allocations ──────────────────────────────────────────────

export function Step2({
  areas, setAreas, subCategories, onNewSubCategory,
}: {
  areas: DraftArea[];
  setAreas: (v: DraftArea[]) => void;
  subCategories: SubCategoryItem[];
  onNewSubCategory?: () => void;
}) {
  const [pickerAreaId, setPickerAreaId] = useState<number | null>(null);
  const [pendingSubByArea, setPendingSubByArea] = useState<Record<number, SubCategoryItem>>({});
  const [centsByArea, setCentsByArea] = useState<Record<number, number>>({});
  const [typeByArea, setTypeByArea] = useState<Record<number, AllocationType>>({});
  const [collapsedAreas, setCollapsedAreas] = useState<Set<number>>(new Set());
  // editing: key = `${areaId}-${allocId}`, value = cents being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingCents, setEditingCents] = useState<number>(0);

  const allUsedIds = new Set(areas.flatMap((a) => a.allocations.map((al) => al.subCategoryId)));

  const addArea = () => {
    const id = uid();
    setAreas([...areas, { id, name: "", allocations: [] }]);
  };

  const removeArea = (id: number) => {
    setAreas(areas.filter((a) => a.id !== id));
    setPickerAreaId((p) => (p === id ? null : p));
  };

  const renameArea = (id: number, name: string) =>
    setAreas(areas.map((a) => (a.id === id ? { ...a, name } : a)));

  const toggleCollapse = (id: number) =>
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handlePickSub = (areaId: number, sub: SubCategoryItem) => {
    setPendingSubByArea((p) => ({ ...p, [areaId]: sub }));
    setCentsByArea((p) => ({ ...p, [areaId]: 0 }));
    setTypeByArea((p) => ({ ...p, [areaId]: p[areaId] ?? "Expense" }));
    setPickerAreaId(null);
  };

  const handleValueKey = (areaId: number, key: string) => {
    if (key === "Backspace") {
      setCentsByArea((p) => ({ ...p, [areaId]: Math.floor((p[areaId] ?? 0) / 10) }));
    } else if (/^\d$/.test(key)) {
      setCentsByArea((p) => {
        const prev = p[areaId] ?? 0;
        const next = prev * 10 + Number(key);
        return { ...p, [areaId]: next > 9_999_999_99 ? prev : next };
      });
    }
  };

  const formatCents = (cents: number) => {
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    const reaisStr = reais.toLocaleString("pt-BR");
    return `${reaisStr},${String(centavos).padStart(2, "0")}`;
  };

  const confirmAlloc = (areaId: number) => {
    const sub = pendingSubByArea[areaId];
    const cents = centsByArea[areaId] ?? 0;
    if (!sub || cents <= 0) return;

    const alloc: DraftAllocation = {
      id: uid(),
      subCategoryId: sub.id,
      subCategoryName: sub.name,
      subCategoryEmoji: sub.emoji,
      categoryName: sub.categoryName,
      categoryColor: sub.categoryColor ?? null,
      expectedValue: cents,
      allocationType: typeByArea[areaId] ?? "Expense",
    };

    setAreas(areas.map((a) => (a.id === areaId ? { ...a, allocations: [...a.allocations, alloc] } : a)));
    setPendingSubByArea((p) => { const n = { ...p }; delete n[areaId]; return n; });
    setCentsByArea((p) => { const n = { ...p }; delete n[areaId]; return n; });
  };

  const removeAlloc = (areaId: number, allocId: number) =>
    setAreas(areas.map((a) =>
      a.id === areaId ? { ...a, allocations: a.allocations.filter((al) => al.id !== allocId) } : a,
    ));

  const startEditAlloc = (areaId: number, allocId: number, currentCents: number) => {
    setEditingKey(`${areaId}-${allocId}`);
    setEditingCents(currentCents);
  };

  const handleEditKey = (key: string) => {
    if (key === "Backspace") {
      setEditingCents((p) => Math.floor(p / 10));
    } else if (/^\d$/.test(key)) {
      setEditingCents((p) => {
        const next = p * 10 + Number(key);
        return next > 9_999_999_99 ? p : next;
      });
    }
  };

  const confirmEditAlloc = (areaId: number, allocId: number) => {
    if (editingCents <= 0) return;
    setAreas(areas.map((a) =>
      a.id === areaId
        ? { ...a, allocations: a.allocations.map((al) => al.id === allocId ? { ...al, expectedValue: editingCents } : al) }
        : a,
    ));
    setEditingKey(null);
  };

  const inputClass = "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[13px] outline-none focus:border-green/60";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {areas.map((area) => {
          const collapsed = collapsedAreas.has(area.id);
          const areaTotal = area.allocations.reduce((s, a) => s + a.expectedValue, 0);
          const pending = pendingSubByArea[area.id];

          return (
            <div key={area.id} className="border-border bg-surface rounded-xl border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <FolderOpen size={14} className="text-text-muted shrink-0" />
                <input
                  value={area.name}
                  onChange={(e) => renameArea(area.id, e.target.value)}
                  placeholder="Nome da área..."
                  className="bg-transparent text-text flex-1 text-[13px] font-medium outline-none placeholder:text-text-muted"
                />
                {areaTotal > 0 && (
                  <span className="font-money text-text-muted text-[12px] shrink-0">
                    {formatCurrency(areaTotal / 100)}
                  </span>
                )}
                <button type="button" onClick={() => toggleCollapse(area.id)} className="text-text-muted hover:text-text transition-colors">
                  <ChevronDown size={14} className={cn("transition-transform", !collapsed && "rotate-180")} />
                </button>
                <button type="button" onClick={() => removeArea(area.id)} className="text-text-muted hover:text-red transition-colors">
                  <X size={14} />
                </button>
              </div>

              {!collapsed && (
                <div className="border-border border-t px-3 pb-3 pt-2 flex flex-col gap-2">
                  {area.allocations.map((a) => {
                    const key = `${area.id}-${a.id}`;
                    const isEditing = editingKey === key;
                    return (
                      <div key={a.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {a.subCategoryEmoji
                            ? <span className="text-[13px] leading-none shrink-0">{a.subCategoryEmoji}</span>
                            : <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(a.categoryColor, a.categoryName) }} />
                          }
                          <span className="text-text flex-1 text-[13px]">{a.subCategoryName}</span>
                          <button
                            type="button"
                            onClick={() => isEditing ? setEditingKey(null) : startEditAlloc(area.id, a.id, a.expectedValue)}
                            className={cn(
                              "font-money text-[12px] shrink-0 transition-colors",
                              a.allocationType === "Income" ? "text-green hover:text-green/70" : "text-red hover:text-red/70",
                            )}
                          >
                            {formatCurrency(a.expectedValue / 100)}
                          </button>
                          <button type="button" onClick={() => removeAlloc(area.id, a.id)} className="text-text-muted hover:text-red transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                        {isEditing && (
                          <div className="flex gap-2 pl-4">
                            <input
                              autoFocus
                              readOnly
                              value={`R$ ${formatCents(editingCents)}`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { confirmEditAlloc(area.id, a.id); return; }
                                if (e.key === "Escape") { setEditingKey(null); return; }
                                handleEditKey(e.key);
                              }}
                              className={cn(inputClass, "flex-1 cursor-default font-money")}
                            />
                            <button
                              type="button"
                              onClick={() => confirmEditAlloc(area.id, a.id)}
                              disabled={editingCents <= 0}
                              className="bg-green text-black h-9 w-9 rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {pending && (
                    <div className="bg-surface2 rounded-lg p-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {pending.emoji
                          ? <span className="text-[13px] leading-none shrink-0">{pending.emoji}</span>
                          : <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(pending.categoryColor, pending.categoryName) }} />
                        }
                        <span className="text-text text-[13px] flex-1">{pending.name}</span>
                        <button type="button" onClick={() => setPendingSubByArea((p) => { const n = { ...p }; delete n[area.id]; return n; })} className="text-text-muted hover:text-text">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          readOnly
                          value={`R$ ${formatCents(centsByArea[area.id] ?? 0)}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { confirmAlloc(area.id); return; }
                            handleValueKey(area.id, e.key);
                          }}
                          placeholder="R$ 0,00"
                          className={cn(inputClass, "flex-1 cursor-default font-money")}
                        />
                        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
                          {(["Expense", "Income"] as AllocationType[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTypeByArea((p) => ({ ...p, [area.id]: t }))}
                              className={cn(
                                "px-2.5 h-9 text-[11px] font-medium transition-colors",
                                (typeByArea[area.id] ?? "Expense") === t
                                  ? t === "Expense" ? "bg-red/15 text-red" : "bg-green/15 text-green"
                                  : "text-text-muted hover:text-text",
                              )}
                            >
                              {t === "Expense" ? "Desp." : "Rec."}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => confirmAlloc(area.id)}
                          disabled={(centsByArea[area.id] ?? 0) <= 0}
                          className="bg-green text-black h-9 w-9 rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {pickerAreaId === area.id ? (
                    <SubcategoryPicker
                      subCategories={subCategories}
                      usedIds={allUsedIds}
                      onPick={(sub) => handlePickSub(area.id, sub)}
                      onClose={() => setPickerAreaId(null)}
                      onNewSubCategory={onNewSubCategory}
                    />
                  ) : (
                    !pending && (
                      <button
                        type="button"
                        onClick={() => setPickerAreaId(area.id)}
                        className="border-border text-text-muted hover:text-text border border-dashed rounded-lg py-1.5 text-[12px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus size={12} />
                        Adicionar subcategoria
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addArea}
          className="border-border text-text-muted hover:text-text border border-dashed rounded-xl py-2.5 text-[13px] flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={14} />
          Nova área
        </button>

        {onNewSubCategory && (
          <button
            type="button"
            onClick={onNewSubCategory}
            className="text-text-muted hover:text-green flex items-center justify-center gap-1.5 text-[12px] transition-colors py-1"
          >
            <Plus size={12} />
            Nova subcategoria
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 3 — Summary ──────────────────────────────────────────────────────────

export function Step3({
  name, recurrence, startDay, areas,
}: {
  name: string;
  recurrence: BudgetRecurrence;
  startDay: number;
  areas: DraftArea[];
}) {
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());

  const toggleArea = (id: number) =>
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allAllocs = areas.flatMap((a) => a.allocations);
  const totalExpense = allAllocs.filter((a) => a.allocationType === "Expense").reduce((s, a) => s + a.expectedValue, 0);
  const totalIncome  = allAllocs.filter((a) => a.allocationType === "Income" ).reduce((s, a) => s + a.expectedValue, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-surface2 rounded-xl border px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-text font-medium text-[14px]">{name}</p>
          <p className="text-text-muted text-[12px] mt-0.5">{RECURRENCE_LABELS[recurrence]} · inicia dia {startDay}</p>
        </div>
        <span className="text-text-muted text-[12px]">{allAllocs.length} alocaç{allAllocs.length === 1 ? "ão" : "ões"}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="border-border bg-surface rounded-xl border p-3 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} className="text-green shrink-0" />
            <p className="text-text-muted text-[11px]">Receitas</p>
          </div>
          <p className="font-money text-green text-[14px] font-semibold truncate">{formatCurrency(totalIncome / 100)}</p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-3 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={13} className="text-red shrink-0" />
            <p className="text-text-muted text-[11px]">Despesas</p>
          </div>
          <p className="font-money text-red text-[14px] font-semibold truncate">{formatCurrency(totalExpense / 100)}</p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-3 min-w-0">
          <p className="text-text-muted text-[11px] mb-1">Saldo</p>
          <p className={cn("font-money text-[14px] font-semibold truncate", balance >= 0 ? "text-green" : "text-red")}>
            {balance >= 0 ? "+" : ""}{formatCurrency(balance / 100)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {areas.filter((a) => a.allocations.length > 0).map((area) => {
          const areaExpense = area.allocations.filter((a) => a.allocationType === "Expense").reduce((s, a) => s + a.expectedValue, 0);
          const areaIncome  = area.allocations.filter((a) => a.allocationType === "Income" ).reduce((s, a) => s + a.expectedValue, 0);
          const areaTotal = areaExpense + areaIncome;
          const expanded = expandedAreas.has(area.id);

          return (
            <div key={area.id} className="border-border bg-surface rounded-xl border overflow-hidden">
              <button
                type="button"
                onClick={() => toggleArea(area.id)}
                className="hover:bg-surface2/40 flex w-full items-center gap-3 px-3 py-2.5 transition-colors min-w-0"
              >
                <FolderOpen size={13} className="text-text-muted shrink-0" />
                <span className="text-text flex-1 text-left text-[13px] font-medium truncate">{area.name || "Área sem nome"}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {areaIncome > 0 && (
                    <span className="font-money text-green text-[12px]">{formatCurrency(areaIncome / 100)}</span>
                  )}
                  {areaExpense > 0 && (
                    <span className="font-money text-red text-[12px]">{formatCurrency(areaExpense / 100)}</span>
                  )}
                </div>
                <ChevronDown size={13} className={cn("text-text-muted transition-transform shrink-0", expanded && "rotate-180")} />
              </button>

              {expanded && (
                <div className="border-border border-t px-3 pb-3 pt-2 flex flex-col gap-2">
                  {area.allocations.map((alloc) => {
                    const pct = totalExpense > 0 && alloc.allocationType === "Expense"
                      ? (alloc.expectedValue / totalExpense) * 100
                      : totalIncome > 0 && alloc.allocationType === "Income"
                      ? (alloc.expectedValue / totalIncome) * 100
                      : 0;

                    return (
                      <div key={alloc.id} className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {alloc.subCategoryEmoji
                            ? <span className="text-[12px] leading-none shrink-0">{alloc.subCategoryEmoji}</span>
                            : <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(alloc.categoryColor, alloc.categoryName) }} />
                          }
                          <span className="text-text flex-1 text-[12px] truncate">{alloc.subCategoryName}</span>
                          <span className="font-money text-text-muted text-[11px] shrink-0">
                            {formatCurrency(alloc.expectedValue / 100)}
                          </span>
                          <span className="text-text-muted text-[11px] w-7 text-right shrink-0">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar
                          value={alloc.expectedValue}
                          max={alloc.allocationType === "Expense" ? totalExpense : totalIncome}
                          height={3}
                          color={alloc.allocationType === "Expense" ? "var(--red)" : "var(--green)"}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
