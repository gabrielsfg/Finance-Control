"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import type { TransactionsFilter, TxDatePreset } from "../types/filters.types";
import { activeTxDateLabel, availableTxYears } from "../utils/filterDates";

const DATE_PRESETS: { id: TxDatePreset; label: string }[] = [
  { id: "current-month",  label: "Mês atual" },
  { id: "last-3-months",  label: "3 meses" },
  { id: "last-6-months",  label: "6 meses" },
  { id: "last-12-months", label: "12 meses" },
  { id: "current-year",   label: "Este ano" },
];

// ── Shared pill ───────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 text-[12px] font-medium transition-all whitespace-nowrap",
        active ? "bg-green/15 text-green ring-1 ring-green/30" : "bg-surface2 text-text-sub hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

// ── Multi-select list ─────────────────────────────────────────────────────────
function MultiSelectRow({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { id: number; name: string }[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-text-muted mb-1.5 text-[11px] font-medium uppercase tracking-wide">{label}</p>
      <div className="flex max-h-[140px] flex-col overflow-y-auto">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface2"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-green bg-green/15 text-green" : "border-border text-transparent",
                )}
              >
                <Check size={10} strokeWidth={3} />
              </span>
              <span className={cn("text-[12px]", checked ? "text-text" : "text-text-sub")}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Generic dropdown ──────────────────────────────────────────────────────────
function Dropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className="border-border bg-surface absolute left-0 top-9 z-50 rounded-xl border shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Filter button (pill trigger) ──────────────────────────────────────────────
function FilterButton({ label, icon, active }: { label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all",
        active ? "bg-green/15 text-green ring-1 ring-green/30" : "bg-surface2 text-text-sub hover:text-text",
      )}
    >
      {icon}
      {label}
      <ChevronDown size={11} />
    </button>
  );
}

// ── Date dropdown ─────────────────────────────────────────────────────────────
function DateDropdown({
  filter,
  onPreset,
  onYear,
  onCustomRange,
}: {
  filter: TransactionsFilter;
  onPreset: (p: TxDatePreset) => void;
  onYear: (y: number) => void;
  onCustomRange: (start: string, finish: string) => void;
}) {
  const years = availableTxYears();
  const [localStart, setLocalStart] = useState(filter.startDate);
  const [localFinish, setLocalFinish] = useState(filter.finishDate);

  return (
    <div className="w-[300px] p-3">
      <p className="text-text-muted mb-2 text-[11px] font-medium uppercase tracking-wide">Período</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {DATE_PRESETS.map((p) => (
          <Pill key={p.id} active={filter.preset === p.id} onClick={() => onPreset(p.id)}>
            {p.label}
          </Pill>
        ))}
      </div>

      <p className="text-text-muted mb-1.5 text-[11px] font-medium uppercase tracking-wide">Ano</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {years.map((y) => (
          <Pill
            key={y}
            active={filter.preset === "custom-year" && filter.customYear === y}
            onClick={() => onYear(y)}
          >
            {y}
          </Pill>
        ))}
      </div>

      <p className="text-text-muted mb-1.5 text-[11px] font-medium uppercase tracking-wide">Personalizado</p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-0.5">
            <label className="text-text-sub text-[11px]">De</label>
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="border-border bg-surface2 text-text h-8 w-full rounded-lg border px-2 text-[12px] outline-none focus:border-green/60"
            />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <label className="text-text-sub text-[11px]">Até</label>
            <input
              type="date"
              value={localFinish}
              onChange={(e) => setLocalFinish(e.target.value)}
              className="border-border bg-surface2 text-text h-8 w-full rounded-lg border px-2 text-[12px] outline-none focus:border-green/60"
            />
          </div>
        </div>
        <button
          onClick={() => onCustomRange(localStart, localFinish)}
          disabled={!localStart || !localFinish || localStart > localFinish}
          className="h-8 rounded-lg bg-green text-[12px] font-medium text-background transition-opacity disabled:opacity-40"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ── Filters dropdown ──────────────────────────────────────────────────────────
function FiltersDropdown({
  filter,
  onToggleBudget,
  onToggleAccount,
  onToggleCategory,
  onToggleSubCategory,
}: {
  filter: TransactionsFilter;
  onToggleBudget: (id: number) => void;
  onToggleAccount: (id: number) => void;
  onToggleCategory: (id: number) => void;
  onToggleSubCategory: (id: number) => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: subcategories = [] } = useSubCategories();
  const { data: budgets = [] } = useBudgets();

  const categories = Array.from(
    new Map(subcategories.map((s) => [s.categoryId, { id: s.categoryId, name: s.categoryName }])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const subcategoryItems = subcategories
    .map((s) => ({ id: s.id, name: `${s.categoryName} › ${s.name}` }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const budgetItems = budgets.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="w-[260px] p-3 flex flex-col gap-3">
      <MultiSelectRow
        label="Orçamentos"
        items={budgetItems}
        selected={filter.budgetIds}
        onToggle={onToggleBudget}
      />
      <MultiSelectRow
        label="Contas"
        items={accounts.map((a) => ({ id: a.id, name: a.name }))}
        selected={filter.accountIds}
        onToggle={onToggleAccount}
      />
      <MultiSelectRow
        label="Categorias"
        items={categories}
        selected={filter.categoryIds}
        onToggle={onToggleCategory}
      />
      <MultiSelectRow
        label="Subcategorias"
        items={subcategoryItems}
        selected={filter.subCategoryIds}
        onToggle={onToggleSubCategory}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hasActiveFilters(filter: TransactionsFilter): boolean {
  return (
    filter.budgetIds.length > 0 ||
    filter.accountIds.length > 0 ||
    filter.categoryIds.length > 0 ||
    filter.subCategoryIds.length > 0
  );
}

function filtersLabel(filter: TransactionsFilter): string {
  const parts: string[] = [];
  if (filter.budgetIds.length > 0) parts.push(`${filter.budgetIds.length} orç.`);
  if (filter.accountIds.length > 0) parts.push(`${filter.accountIds.length} conta${filter.accountIds.length > 1 ? "s" : ""}`);
  if (filter.categoryIds.length > 0) parts.push(`${filter.categoryIds.length} cat.`);
  if (filter.subCategoryIds.length > 0) parts.push(`${filter.subCategoryIds.length} sub.`);
  return parts.length > 0 ? parts.join(", ") : "Filtros";
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  filter: TransactionsFilter;
  onChange: (f: TransactionsFilter) => void;
};

export function TransactionsFilters({ filter, onChange }: Props) {
  function setPreset(preset: TxDatePreset) {
    onChange({ ...filter, preset });
  }

  function setYear(y: number) {
    onChange({ ...filter, preset: "custom-year", customYear: y });
  }

  function setCustomRange(start: string, finish: string) {
    onChange({ ...filter, preset: "custom-range", startDate: start, finishDate: finish });
  }

  function toggle(key: keyof Pick<TransactionsFilter, "budgetIds" | "accountIds" | "categoryIds" | "subCategoryIds">, id: number) {
    const cur = filter[key];
    onChange({ ...filter, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  }

  const filtersActive = hasActiveFilters(filter);

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        trigger={
          <FilterButton
            label={activeTxDateLabel(filter)}
            icon={<Calendar size={11} />}
            active={filter.preset !== "current-month"}
          />
        }
      >
        <DateDropdown
          filter={filter}
          onPreset={setPreset}
          onYear={setYear}
          onCustomRange={setCustomRange}
        />
      </Dropdown>

      <Dropdown
        trigger={
          <FilterButton
            label={filtersLabel(filter)}
            icon={<SlidersHorizontal size={11} />}
            active={filtersActive}
          />
        }
      >
        <FiltersDropdown
          filter={filter}
          onToggleBudget={(id) => toggle("budgetIds", id)}
          onToggleAccount={(id) => toggle("accountIds", id)}
          onToggleCategory={(id) => toggle("categoryIds", id)}
          onToggleSubCategory={(id) => toggle("subCategoryIds", id)}
        />
      </Dropdown>
    </div>
  );
}
