"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import type {
  AnalyticsFilter,
  AssetClassFilter,
  DatePreset,
  TransactionTypeFilter,
} from "../types/filters.types";
import { availableYears } from "../utils/filterDates";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "current-month",  label: "Mês atual" },
  { id: "last-3-months",  label: "3 meses" },
  { id: "last-6-months",  label: "6 meses" },
  { id: "last-12-months", label: "12 meses" },
  { id: "current-year",   label: "Este ano" },
];

const TX_TYPES: { id: TransactionTypeFilter; label: string }[] = [
  { id: "all",         label: "Todos" },
  { id: "expense",     label: "Despesas" },
  { id: "income",      label: "Receitas" },
  { id: "recurring",   label: "Recorrentes" },
  { id: "installment", label: "Parceladas" },
];

const ASSET_CLASSES: { id: AssetClassFilter; label: string }[] = [
  { id: "all",            label: "Todos" },
  { id: "Renda Fixa",     label: "Renda Fixa" },
  { id: "Tesouro Direto", label: "Tesouro" },
  { id: "Renda Variável", label: "Ações" },
  { id: "FII",            label: "FII" },
  { id: "Internacional",  label: "Internacional" },
  { id: "Cripto",         label: "Cripto" },
];

// ── Shared pill ───────────────────────────────────────────────────────────────
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 text-[12px] font-medium transition-all whitespace-nowrap",
        active
          ? "bg-green/15 text-green ring-1 ring-green/30"
          : "bg-surface2 text-text-sub hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

// ── Multi-select row (checkboxes) ─────────────────────────────────────────────
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
                  checked
                    ? "border-green bg-green/15 text-green"
                    : "border-border text-transparent",
                )}
              >
                <Check size={10} strokeWidth={3} />
              </span>
              <span className={cn("text-[12px]", checked ? "text-text" : "text-text-sub")}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Generic dropdown wrapper ──────────────────────────────────────────────────
function Dropdown({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

// ── Filter button (trigger pill) ──────────────────────────────────────────────
function FilterButton({
  label,
  icon,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all",
        active
          ? "bg-green/15 text-green ring-1 ring-green/30"
          : "bg-surface2 text-text-sub hover:text-text",
      )}
    >
      {icon}
      {label}
      <ChevronDown size={11} />
    </button>
  );
}

// ── Date dropdown content ─────────────────────────────────────────────────────
function DateDropdownContent({
  filter,
  onPreset,
  onYear,
  onCustomRange,
}: {
  filter: AnalyticsFilter;
  onPreset: (p: DatePreset) => void;
  onYear: (y: number) => void;
  onCustomRange: (start: string, finish: string) => void;
}) {
  const years = availableYears();
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

// ── Expenses filter dropdown content ─────────────────────────────────────────
function ExpensesDropdownContent({
  filter,
  onTxType,
  onToggleCategory,
  onToggleAccount,
}: {
  filter: AnalyticsFilter;
  onTxType: (t: TransactionTypeFilter) => void;
  onToggleCategory: (id: number) => void;
  onToggleAccount: (id: number) => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: subcategories = [] } = useSubCategories();

  // Deduplicate categories from subcategories
  const categories = Array.from(
    new Map(subcategories.map((s) => [s.categoryId, { id: s.categoryId, name: s.categoryName }])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-[240px] p-3">
      <p className="text-text-muted mb-2 text-[11px] font-medium uppercase tracking-wide">Tipo</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {TX_TYPES.map((t) => (
          <Pill key={t.id} active={filter.transactionType === t.id} onClick={() => onTxType(t.id)}>
            {t.label}
          </Pill>
        ))}
      </div>

      <div className="mb-3">
        <MultiSelectRow
          label="Categorias"
          items={categories}
          selected={filter.categoryIds}
          onToggle={onToggleCategory}
        />
      </div>

      <MultiSelectRow
        label="Contas"
        items={accounts.map((a) => ({ id: a.id, name: a.name }))}
        selected={filter.accountIds}
        onToggle={onToggleAccount}
      />
    </div>
  );
}

// ── Investments filter dropdown content ──────────────────────────────────────
function InvestmentsDropdownContent({
  filter,
  onAssetClass,
}: {
  filter: AnalyticsFilter;
  onAssetClass: (v: AssetClassFilter) => void;
}) {
  return (
    <div className="w-[220px] p-3">
      <p className="text-text-muted mb-2 text-[11px] font-medium uppercase tracking-wide">Classe de ativo</p>
      <div className="flex flex-wrap gap-1">
        {ASSET_CLASSES.map((a) => (
          <Pill key={a.id} active={filter.assetClass === a.id} onClick={() => onAssetClass(a.id)}>
            {a.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function activeDateLabel(filter: AnalyticsFilter): string {
  if (filter.preset === "custom-year") return String(filter.customYear);
  if (filter.preset === "custom-range") return `${filter.startDate} → ${filter.finishDate}`;
  return DATE_PRESETS.find((p) => p.id === filter.preset)?.label ?? "Data";
}

function hasActiveFilters(filter: AnalyticsFilter, mode: Props["mode"]): boolean {
  if (mode === "expenses")
    return filter.transactionType !== "all" || filter.categoryIds.length > 0 || filter.accountIds.length > 0;
  if (mode === "investments") return filter.assetClass !== "all";
  return false;
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  filter: AnalyticsFilter;
  onChange: (f: AnalyticsFilter) => void;
  mode: "expenses" | "investments" | "none";
};

export function AnalyticsFilters({ filter, onChange, mode }: Props) {
  function setPreset(preset: DatePreset) {
    onChange({ ...filter, preset });
  }

  function setYear(y: number) {
    onChange({ ...filter, preset: "custom-year", customYear: y });
  }

  function setCustomRange(start: string, finish: string) {
    onChange({ ...filter, preset: "custom-range", startDate: start, finishDate: finish });
  }

  function setTxType(t: TransactionTypeFilter) {
    onChange({ ...filter, transactionType: t });
  }

  function toggleCategory(id: number) {
    const ids = filter.categoryIds.includes(id)
      ? filter.categoryIds.filter((x) => x !== id)
      : [...filter.categoryIds, id];
    onChange({ ...filter, categoryIds: ids });
  }

  function toggleAccount(id: number) {
    const ids = filter.accountIds.includes(id)
      ? filter.accountIds.filter((x) => x !== id)
      : [...filter.accountIds, id];
    onChange({ ...filter, accountIds: ids });
  }

  function setAssetClass(v: AssetClassFilter) {
    onChange({ ...filter, assetClass: v });
  }

  const filtersActive = hasActiveFilters(filter, mode);

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        trigger={
          <FilterButton
            label={activeDateLabel(filter)}
            icon={<Calendar size={11} />}
            active={filter.preset !== "last-6-months"}
          />
        }
      >
        <DateDropdownContent
          filter={filter}
          onPreset={setPreset}
          onYear={setYear}
          onCustomRange={setCustomRange}
        />
      </Dropdown>

      {mode !== "none" && (
        <Dropdown
          trigger={
            <FilterButton
              label={
                filtersActive
                  ? [
                      filter.categoryIds.length > 0 && `${filter.categoryIds.length} cat.`,
                      filter.accountIds.length > 0 && `${filter.accountIds.length} conta${filter.accountIds.length > 1 ? "s" : ""}`,
                      filter.transactionType !== "all" && TX_TYPES.find((t) => t.id === filter.transactionType)?.label,
                      mode === "investments" && filter.assetClass !== "all" && filter.assetClass,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Filtros"
                  : "Filtros"
              }
              icon={<SlidersHorizontal size={11} />}
              active={filtersActive}
            />
          }
        >
          {mode === "expenses" && (
            <ExpensesDropdownContent
              filter={filter}
              onTxType={setTxType}
              onToggleCategory={toggleCategory}
              onToggleAccount={toggleAccount}
            />
          )}
          {mode === "investments" && (
            <InvestmentsDropdownContent filter={filter} onAssetClass={setAssetClass} />
          )}
        </Dropdown>
      )}
    </div>
  );
}
