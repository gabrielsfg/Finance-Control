"use client";

import { useEffect, useRef, useState } from "react";
import {
  SlidersHorizontal, ChevronRight, Check,
  CalendarDays, Tag, Hash, Wallet, BookOpen, ListFilter, ArrowUpDown, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useTags } from "@/features/transactions/hooks/useTags";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { TransactionsFilter, TxDatePreset, TxSortField, TxSortOrder } from "../types/filters.types";
import { activeTxDateLabel, availableTxYears, defaultTxFilter } from "../utils/filterDates";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "date" | "categories" | "type" | "accounts" | "budgets" | "tags" | "sort";

const DATE_PRESETS: { id: TxDatePreset; label: string }[] = [
  { id: "current-month",  label: "Mês atual" },
  { id: "last-3-months",  label: "Últimos 3 meses" },
  { id: "last-6-months",  label: "Últimos 6 meses" },
  { id: "last-12-months", label: "Últimos 12 meses" },
  { id: "current-year",   label: "Este ano" },
];

const TYPE_OPTIONS: { id: TransactionsFilter["typeFilter"]; label: string }[] = [
  { id: "All",      label: "Todos" },
  { id: "Income",   label: "Receitas" },
  { id: "Expense",  label: "Despesas" },
  { id: "Transfer", label: "Transferências" },
];

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEK_DAYS   = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ── Exported helper: compute active filter tag list ───────────────────────────
export type FilterTag = { id: string; label: string; color?: string };

export function getActiveFilterTags(
  filter: TransactionsFilter,
  meta: {
    categories: { id: number; name: string; color: string }[];
    subcategories: { id: number; name: string; color: string }[];
    accounts: { id: number; name: string }[];
    budgets: { id: number; name: string }[];
    tags: { id: number; name: string }[];
    filterDay?: string | null;
  }
): FilterTag[] {
  const tags: FilterTag[] = [];

  if (filter.preset !== "current-month") {
    tags.push({ id: "preset", label: activeTxDateLabel(filter) });
  }

  if (filter.typeFilter !== "All") {
    const opt = TYPE_OPTIONS.find(o => o.id === filter.typeFilter);
    if (opt) tags.push({ id: "typeFilter", label: opt.label });
  }

  for (const id of filter.categoryIds) {
    const cat = meta.categories.find(c => c.id === id);
    if (cat) tags.push({ id: `cat-${id}`, label: cat.name, color: cat.color });
  }

  for (const id of filter.subCategoryIds) {
    const sub = meta.subcategories.find(s => s.id === id);
    if (sub) tags.push({ id: `sub-${id}`, label: sub.name, color: sub.color });
  }

  for (const id of filter.accountIds) {
    const acc = meta.accounts.find(a => a.id === id);
    if (acc) tags.push({ id: `acc-${id}`, label: acc.name });
  }

  for (const id of filter.budgetIds) {
    const bud = meta.budgets.find(b => b.id === id);
    if (bud) tags.push({ id: `bud-${id}`, label: bud.name });
  }

  for (const id of filter.tagIds) {
    const tag = meta.tags.find(t => t.id === id);
    if (tag) tags.push({ id: `tag-${id}`, label: `#${tag.name}` });
  }

  if (meta.filterDay) {
    const [y, m, d] = meta.filterDay.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    tags.push({ id: "filterDay", label });
  }

  return tags;
}

// ── Calendar range picker ─────────────────────────────────────────────────────
function CalendarRangePicker({
  startDate, finishDate, onChange,
}: {
  startDate: string;
  finishDate: string;
  onChange: (start: string, finish: string) => void;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [picking,   setPicking]   = useState<"start" | "end">("start");

  const parseDate = (s: string) => s ? new Date(s + "T00:00:00") : null;
  const isoStr    = (d: Date) => d.toISOString().slice(0, 10);

  const selStart  = parseDate(startDate);
  const selEnd    = parseDate(finishDate);
  const hovDate   = hovered ? parseDate(hovered) : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(dateStr: string) {
    const clicked = parseDate(dateStr)!;
    if (picking === "start" || !selStart) {
      onChange(dateStr, "");
      setPicking("end");
    } else {
      if (clicked < selStart) {
        onChange(dateStr, startDate);
      } else {
        onChange(startDate, dateStr);
      }
      setPicking("start");
    }
  }

  function isInRange(dateStr: string) {
    const d = parseDate(dateStr)!;
    const anchor = selStart;
    const tip    = hovDate ?? selEnd;
    if (!anchor || !tip) return false;
    const lo = anchor < tip ? anchor : tip;
    const hi = anchor < tip ? tip : anchor;
    return d > lo && d < hi;
  }

  function isRangeEdge(dateStr: string) {
    return dateStr === startDate || dateStr === finishDate;
  }
  function isStart(dateStr: string) { return dateStr === startDate; }
  function isEnd(dateStr: string)   { return dateStr === finishDate; }

  // build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const day   = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${month}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeLabel = startDate && finishDate
    ? `${startDate.split("-").reverse().join("/")} → ${finishDate.split("-").reverse().join("/")}`
    : startDate
    ? `A partir de ${startDate.split("-").reverse().join("/")}`
    : "Selecione o período";

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prevMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3">
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <span className="text-text text-[13px] font-semibold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Week headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-text-muted py-1 text-center text-[10px] font-medium">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const inRange  = isInRange(dateStr);
          const edge     = isRangeEdge(dateStr);
          const isS      = isStart(dateStr);
          const isE      = isEnd(dateStr);
          const isToday  = dateStr === isoStr(today);

          return (
            <div
              key={dateStr}
              className={cn("relative flex items-center justify-center py-0.5",
                inRange && "bg-green/10",
                isS && finishDate && "rounded-l-full bg-green/10",
                isE && startDate  && "rounded-r-full bg-green/10",
              )}
              onMouseEnter={() => setHovered(dateStr)}
              onMouseLeave={() => setHovered(null)}
            >
              <button
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-all",
                  edge
                    ? "bg-green text-black font-bold"
                    : inRange
                    ? "text-green font-medium"
                    : isToday
                    ? "border-border border text-text font-semibold"
                    : "text-text-sub hover:bg-surface3 hover:text-text",
                )}
              >
                {parseInt(dateStr.slice(8))}
              </button>
            </div>
          );
        })}
      </div>

      {/* Range label */}
      <div className={cn(
        "mt-3 rounded-lg px-3 py-2 text-center text-[12px] transition-all",
        startDate && finishDate
          ? "bg-green/10 text-green font-medium"
          : "bg-surface3 text-text-muted",
      )}>
        {rangeLabel}
      </div>
    </div>
  );
}

// ── Preset pill ───────────────────────────────────────────────────────────────
function PresetPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-4 text-[13px] font-medium transition-all whitespace-nowrap",
        active ? "bg-green/15 text-green ring-1 ring-green/30" : "bg-surface3 text-text-sub hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

// ── Checkable row ─────────────────────────────────────────────────────────────
function CheckRow({
  checked, onClick, label, color, emoji, indent,
}: {
  checked: boolean; onClick: () => void; label: string; color?: string; emoji?: string | null; indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface3",
        indent && "pl-6",
      )}
    >
      <span className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
        checked ? "border-green bg-green/15 text-green" : "border-border text-transparent",
      )}>
        <Check size={11} strokeWidth={3} />
      </span>
      {emoji
        ? <span className="text-[14px] leading-none shrink-0">{emoji}</span>
        : color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      }
      <span className={cn("text-[14px]", checked ? "text-text font-medium" : "text-text-sub")}>
        {label}
      </span>
    </button>
  );
}

// ── Section panel content ─────────────────────────────────────────────────────
const SORT_OPTIONS: { field: TxSortField; order: TxSortOrder; label: string; icon: React.ElementType }[] = [
  { field: "date",  order: "desc", label: "Mais recente primeiro", icon: CalendarDays },
  { field: "date",  order: "asc",  label: "Mais antigo primeiro",  icon: CalendarDays },
  { field: "value", order: "desc", label: "Maior valor primeiro",  icon: DollarSign },
  { field: "value", order: "asc",  label: "Menor valor primeiro",  icon: DollarSign },
];

function SectionContent({
  section, draft, setDraft, accounts, categories, subcategories, budgets, tags,
}: {
  section: Section;
  draft: TransactionsFilter;
  setDraft: React.Dispatch<React.SetStateAction<TransactionsFilter>>;
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string; color: string }[];
  subcategories: { id: number; name: string; categoryId: number; color: string; emoji?: string | null }[];
  budgets: { id: number; name: string }[];
  tags: { id: number; name: string }[];
}) {
  const years = availableTxYears();

  function toggleId(key: keyof Pick<TransactionsFilter, "tagIds" | "budgetIds" | "accountIds" | "categoryIds" | "subCategoryIds">, id: number) {
    const cur = draft[key];
    setDraft(d => ({ ...d, [key]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] }));
  }

  function toggleCategory(catId: number) {
    const catSubIds = subcategories.filter(s => s.categoryId === catId).map(s => s.id);
    const catChecked = draft.categoryIds.includes(catId);
    if (catChecked) {
      // uncheck category and all its subs
      setDraft(d => ({
        ...d,
        categoryIds: d.categoryIds.filter(id => id !== catId),
        subCategoryIds: d.subCategoryIds.filter(id => !catSubIds.includes(id)),
      }));
    } else {
      // check category and all its subs
      setDraft(d => ({
        ...d,
        categoryIds: [...d.categoryIds, catId],
        subCategoryIds: [...new Set([...d.subCategoryIds, ...catSubIds])],
      }));
    }
  }

  function toggleSubCategory(subId: number, catId: number) {
    const catSubIds = subcategories.filter(s => s.categoryId === catId).map(s => s.id);
    const subChecked = draft.subCategoryIds.includes(subId);
    const newSubIds = subChecked
      ? draft.subCategoryIds.filter(id => id !== subId)
      : [...draft.subCategoryIds, subId];

    // check if all subs of this category are now checked → auto-check category
    const allSubsChecked = catSubIds.every(id => newSubIds.includes(id));
    const newCatIds = allSubsChecked
      ? [...new Set([...draft.categoryIds, catId])]
      : draft.categoryIds.filter(id => id !== catId);

    setDraft(d => ({ ...d, subCategoryIds: newSubIds, categoryIds: newCatIds }));
  }

  if (section === "date") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-text-muted mb-2 text-[12px] font-medium uppercase tracking-wide">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map(p => (
              <PresetPill
                key={p.id}
                active={draft.preset === p.id}
                onClick={() => setDraft(d => ({ ...d, preset: p.id }))}
              >
                {p.label}
              </PresetPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-text-muted mb-2 text-[12px] font-medium uppercase tracking-wide">Ano</p>
          <div className="flex flex-wrap gap-1.5">
            {years.map(y => (
              <PresetPill
                key={y}
                active={draft.preset === "custom-year" && draft.customYear === y}
                onClick={() => setDraft(d => ({ ...d, preset: "custom-year", customYear: y }))}
              >
                {y}
              </PresetPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-text-muted mb-2 text-[12px] font-medium uppercase tracking-wide">Período personalizado</p>
          <CalendarRangePicker
            startDate={draft.preset === "custom-range" ? draft.startDate : ""}
            finishDate={draft.preset === "custom-range" ? draft.finishDate : ""}
            onChange={(start, finish) =>
              setDraft(d => ({ ...d, preset: "custom-range", startDate: start, finishDate: finish }))
            }
          />
        </div>
      </div>
    );
  }

  if (section === "type") {
    return (
      <div className="flex flex-col gap-1">
        {TYPE_OPTIONS.map(opt => (
          <CheckRow
            key={opt.id}
            checked={draft.typeFilter === opt.id}
            onClick={() => setDraft(d => ({ ...d, typeFilter: opt.id }))}
            label={opt.label}
          />
        ))}
      </div>
    );
  }

  if (section === "categories") {
    return (
      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 340 }}>
        {categories.length === 0
          ? <p className="text-text-muted py-4 text-center text-[14px]">Nenhuma categoria</p>
          : categories.map(cat => {
            const catSubs = subcategories.filter(s => s.categoryId === cat.id);
            return (
              <div key={cat.id}>
                <CheckRow
                  checked={draft.categoryIds.includes(cat.id)}
                  onClick={() => toggleCategory(cat.id)}
                  label={cat.name}
                  color={cat.color}
                />
                {catSubs.map(sub => (
                  <CheckRow
                    key={sub.id}
                    checked={draft.subCategoryIds.includes(sub.id)}
                    onClick={() => toggleSubCategory(sub.id, cat.id)}
                    label={sub.name}
                    color={sub.color}
                    emoji={sub.emoji}
                    indent
                  />
                ))}
              </div>
            );
          })
        }
      </div>
    );
  }

  if (section === "accounts") {
    return (
      <div className="flex flex-col gap-1">
        {accounts.length === 0
          ? <p className="text-text-muted py-4 text-center text-[14px]">Nenhuma conta</p>
          : accounts.map(a => (
            <CheckRow
              key={a.id}
              checked={draft.accountIds.includes(a.id)}
              onClick={() => toggleId("accountIds", a.id)}
              label={a.name}
            />
          ))
        }
      </div>
    );
  }

  if (section === "budgets") {
    return (
      <div className="flex flex-col gap-1">
        {budgets.length === 0
          ? <p className="text-text-muted py-4 text-center text-[14px]">Nenhum orçamento</p>
          : budgets.map(b => (
            <CheckRow
              key={b.id}
              checked={draft.budgetIds.includes(b.id)}
              onClick={() => toggleId("budgetIds", b.id)}
              label={b.name}
            />
          ))
        }
      </div>
    );
  }

  if (section === "tags") {
    return (
      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 340 }}>
        {tags.length === 0
          ? <p className="text-text-muted py-4 text-center text-[14px]">Nenhuma tag criada</p>
          : tags.map(tag => (
            <CheckRow
              key={tag.id}
              checked={draft.tagIds.includes(tag.id)}
              onClick={() => toggleId("tagIds", tag.id)}
              label={`#${tag.name}`}
            />
          ))
        }
      </div>
    );
  }

  if (section === "sort") {
    return (
      <div className="flex flex-col gap-1">
        {SORT_OPTIONS.map(opt => {
          const active = draft.sortField === opt.field && draft.sortOrder === opt.order;
          const Icon = opt.icon;
          return (
            <button
              key={`${opt.field}-${opt.order}`}
              onClick={() => setDraft(d => ({ ...d, sortField: opt.field, sortOrder: opt.order }))}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface3",
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                active ? "border-green" : "border-border",
              )}>
                {active && <span className="bg-green h-2.5 w-2.5 rounded-full" />}
              </span>
              <Icon size={14} className={cn("shrink-0", active ? "text-green" : "text-text-muted")} />
              <span className={cn("text-[14px]", active ? "text-text font-medium" : "text-text-sub")}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

// ── Main panel ────────────────────────────────────────────────────────────────
const FILTER_SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "date",       label: "Data",       icon: CalendarDays },
  { id: "type",       label: "Tipo",       icon: ListFilter },
  { id: "categories", label: "Categoria",  icon: Tag },
  { id: "accounts",   label: "Contas",     icon: Wallet },
  { id: "budgets",    label: "Orçamentos", icon: BookOpen },
  { id: "tags",       label: "Tags",       icon: Hash },
];

const SORT_SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "sort", label: "Ordenação", icon: ArrowUpDown },
];

function countActive(filter: TransactionsFilter): number {
  let n = 0;
  if (filter.preset !== "current-month") n++;
  if (filter.typeFilter !== "All") n++;
  if (filter.categoryIds.length > 0) n++;
  if (filter.subCategoryIds.length > 0) n++;
  if (filter.accountIds.length > 0) n++;
  if (filter.budgetIds.length > 0) n++;
  if (filter.tagIds.length > 0) n++;
  return n;
}

// ── Main export ───────────────────────────────────────────────────────────────
type Props = {
  filter: TransactionsFilter;
  onChange: (f: TransactionsFilter) => void;
};

export function TransactionsFilters({ filter, onChange }: Props) {
  const [open,    setOpen]    = useState(false);
  const [section, setSection] = useState<Section>("date");
  const [draft,   setDraft]   = useState<TransactionsFilter>(filter);
  const ref = useRef<HTMLDivElement>(null);

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();
  const { data: budgetsRaw  = [] } = useBudgets();
  const { data: tagsRaw     = [] } = useTags();

  const accounts = accountsRaw.map(a => ({ id: a.id, name: a.name }));
  const categories = Array.from(
    new Map(subcatsRaw.map(s => [s.categoryId, {
      id: s.categoryId,
      name: s.categoryName,
      color: getCategoryColor(s.categoryColor, s.categoryName),
    }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const subcategories = subcatsRaw.map(s => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    color: getCategoryColor(s.categoryColor, s.categoryName),
    emoji: s.emoji,
  })).sort((a, b) => a.name.localeCompare(b.name));

  const budgets = budgetsRaw.map(b => ({ id: b.id, name: b.name }));
  const tags = tagsRaw.map(t => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name));

  // sync draft when filter changes externally
  useEffect(() => { setDraft(filter); }, [filter]);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clearAll() {
    const reset = defaultTxFilter();
    setDraft(reset);
    onChange(reset);
    setOpen(false);
  }

  const active = countActive(filter);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setDraft(filter); }}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-all",
          open || active > 0
            ? "border-green/40 bg-green/15 text-green"
            : "border-border bg-surface2 text-text hover:bg-surface3",
        )}
      >
        <SlidersHorizontal size={13} />
        Filtros
        {active > 0 && (
          <span className="bg-green flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-black">
            {active}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="border-border bg-surface absolute right-0 top-10 z-50 flex overflow-hidden rounded-2xl border shadow-xl"
          style={{ minWidth: 640 }}
        >
          {/* Left nav */}
          <div className="border-border bg-surface2 flex w-44 shrink-0 flex-col border-r py-2">
            {FILTER_SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              let badge = 0;
              if (id === "categories")  badge = draft.categoryIds.length + draft.subCategoryIds.length;
              if (id === "accounts")    badge = draft.accountIds.length;
              if (id === "budgets")     badge = draft.budgetIds.length;
              if (id === "tags")        badge = draft.tagIds.length;
              if (id === "date" && draft.preset !== "current-month") badge = 1;
              if (id === "type" && draft.typeFilter !== "All") badge = 1;

              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-3 text-left text-[14px] transition-colors",
                    isActive
                      ? "bg-green/10 text-green font-semibold"
                      : "text-text-sub hover:bg-surface3 hover:text-text",
                  )}
                >
                  <Icon size={14} strokeWidth={1.75} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      isActive ? "bg-green text-black" : "bg-green/20 text-green",
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Separator */}
            <div className="border-border mx-3 my-1.5 border-t" />
            <p className="text-text-muted px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">Ordenação</p>

            {SORT_SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              const isDefault = draft.sortField === "date" && draft.sortOrder === "desc";
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-3 text-left text-[14px] transition-colors",
                    isActive
                      ? "bg-green/10 text-green font-semibold"
                      : "text-text-sub hover:bg-surface3 hover:text-text",
                  )}
                >
                  <Icon size={14} strokeWidth={1.75} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {!isDefault && (
                    <span className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      isActive ? "bg-green text-black" : "bg-green/20 text-green",
                    )}>
                      1
                    </span>
                  )}
                </button>
              );
            })}

            {/* Clear / Apply */}
            <div className="border-border mt-auto border-t px-2 pt-2 pb-1 flex flex-col gap-1.5">
              <button
                onClick={clearAll}
                className="text-text-muted hover:text-text w-full rounded-lg py-1.5 text-center text-[12px] transition-colors hover:bg-surface3"
              >
                Limpar tudo
              </button>
              <button
                onClick={apply}
                className="bg-green hover:bg-green/90 w-full rounded-lg py-1.5 text-center text-[12px] font-semibold text-black transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 520 }}>
            <SectionContent
              section={section}
              draft={draft}
              setDraft={setDraft}
              accounts={accounts}
              categories={categories}
              subcategories={subcategories}
              budgets={budgets}
              tags={tags}
            />
          </div>
        </div>
      )}
    </div>
  );
}
