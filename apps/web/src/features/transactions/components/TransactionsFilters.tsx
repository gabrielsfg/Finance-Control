"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SlidersHorizontal, Check, Search,
  CalendarDays, Tag, Hash, Wallet, BookOpen, ListFilter, ArrowUpDown, DollarSign,
} from "lucide-react";
import { cn, normalizeSearch } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils/budgetPeriod";
import { centsToInput, inputToCents } from "@/lib/utils/currencyInput";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useTags } from "@/features/transactions/hooks/useTags";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { TransactionsFilter, TxBudgetInclusion, TxDatePreset, TxSortField, TxSortOrder } from "../types/filters.types";
import { activeTxDateLabel, availableTxYears, defaultTxFilter } from "../utils/filterDates";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "date" | "categories" | "type" | "accounts" | "budgets" | "tags" | "value" | "sort";

const DATE_PRESETS: { id: TxDatePreset; label: string }[] = [
  { id: "budget-cycle",   label: "Ciclo do orçamento" },
  { id: "current-month",  label: "Mês atual" },
  { id: "last-3-months",  label: "Últimos 3 meses" },
  { id: "last-6-months",  label: "Últimos 6 meses" },
  { id: "last-12-months", label: "Últimos 12 meses" },
  { id: "current-year",   label: "Este ano" },
  { id: "all-time",       label: "Todo o período" },
];

const BUDGET_INCLUSION_OPTIONS: { id: TxBudgetInclusion; label: string }[] = [
  { id: "all", label: "Tanto faz" },
  { id: "in",  label: "No orçamento" },
  { id: "out", label: "Fora do orçamento" },
];

const TYPE_OPTIONS: { id: TransactionsFilter["typeFilter"]; label: string }[] = [
  { id: "All",      label: "Todos" },
  { id: "Income",   label: "Receitas" },
  { id: "Expense",  label: "Despesas" },
  { id: "Transfer", label: "Transferências" },
];


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

  // budget-cycle is the default, so it is not something the user "set" — showing a chip
  // for it would put a removable badge on the state you get by doing nothing.
  if (filter.preset !== "budget-cycle") {
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

  if (filter.budgetInclusion !== "all") {
    tags.push({
      id: "budgetInclusion",
      label: filter.budgetInclusion === "in" ? "No orçamento" : "Fora do orçamento",
    });
  }

  if (meta.filterDay) {
    const label = parseLocalDate(meta.filterDay).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    tags.push({ id: "filterDay", label });
  }

  return tags;
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

/**
 * Tag checkboxes, with type-to-search.
 *
 * Same shape as CategoriesSection, and for the same reason: mounting with the section
 * means the query dies when the panel is left, instead of silently narrowing the list
 * next time it is opened. A long tag list is unusable without it.
 */
function TagsSection({
  draft, tags, toggleTag,
}: {
  draft: TransactionsFilter;
  tags: { id: number; name: string }[];
  toggleTag: (tagId: number) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const key = normalizeSearch(query);
    if (!key) return tags;
    return tags.filter(t => normalizeSearch(t.name).includes(key));
  }, [tags, query]);

  if (tags.length === 0) {
    return <p className="text-text-muted py-4 text-center text-[14px]">Nenhuma tag criada</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-border bg-surface2 focus-within:border-green/60 flex items-center gap-2 rounded-lg border px-2.5 py-2">
        <Search size={13} className="text-text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tag..."
          className="text-text placeholder:text-text-muted w-full bg-transparent text-[13px] outline-none"
        />
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 300 }}>
        {filtered.length === 0
          ? <p className="text-text-muted py-4 text-center text-[13px]">Nenhuma tag encontrada.</p>
          : filtered.map(tag => (
            <CheckRow
              key={tag.id}
              checked={draft.tagIds.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
              label={`#${tag.name}`}
            />
          ))
        }
      </div>
    </div>
  );
}

/**
 * Category + subcategory checkboxes, with type-to-search.
 *
 * Its own component so it mounts and unmounts with the section: the query then lives and
 * dies with the panel, instead of persisting after the user has gone to Contas and come
 * back to find the list still narrowed by something they typed a minute ago.
 */
function CategoriesSection({
  draft, categories, subcategories, toggleCategory, toggleSubCategory,
}: {
  draft: TransactionsFilter;
  categories: { id: number; name: string; color: string }[];
  subcategories: { id: number; name: string; categoryId: number; color: string; emoji?: string | null }[];
  toggleCategory: (catId: number) => void;
  toggleSubCategory: (subId: number, catId: number) => void;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const key = normalizeSearch(query);

    const all = categories.map(cat => {
      const subs = subcategories.filter(s => s.categoryId === cat.id);
      // Matching the category name keeps its whole group: narrowing to "Moradia" means
      // everything under it, not only the subcategories that repeat the word.
      if (!key || normalizeSearch(cat.name).includes(key)) return { cat, subs };
      return { cat, subs: subs.filter(s => normalizeSearch(s.name).includes(key)) };
    });

    if (!key) return all;
    return all.filter(g => g.subs.length > 0 || normalizeSearch(g.cat.name).includes(key));
  }, [categories, subcategories, query]);

  if (categories.length === 0) {
    return <p className="text-text-muted py-4 text-center text-[14px]">Nenhuma categoria</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-border bg-surface2 flex items-center gap-2 rounded-lg border px-2.5 py-2 focus-within:border-green/60">
        <Search size={13} className="text-text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar categoria ou subcategoria..."
          className="text-text placeholder:text-text-muted w-full bg-transparent text-[13px] outline-none"
        />
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 300 }}>
        {groups.length === 0
          ? <p className="text-text-muted py-4 text-center text-[13px]">Nenhuma categoria encontrada.</p>
          : groups.map(({ cat, subs }) => (
            <div key={cat.id}>
              <CheckRow
                checked={draft.categoryIds.includes(cat.id)}
                onClick={() => toggleCategory(cat.id)}
                label={cat.name}
                color={cat.color}
              />
              {subs.map(sub => (
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
          ))
        }
      </div>
    </div>
  );
}

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
          <DateRangePicker
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
      <CategoriesSection
        draft={draft}
        categories={categories}
        subcategories={subcategories}
        toggleCategory={toggleCategory}
        toggleSubCategory={toggleSubCategory}
      />
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-text-sub text-[13px] font-medium">Conta para o orçamento?</p>
          <div className="flex gap-2">
            {BUDGET_INCLUSION_OPTIONS.map(opt => (
              <PresetPill
                key={opt.id}
                active={draft.budgetInclusion === opt.id}
                onClick={() => setDraft(d => ({ ...d, budgetInclusion: opt.id }))}
              >
                {opt.label}
              </PresetPill>
            ))}
          </div>
          <p className="text-text-muted text-[12px] leading-relaxed">
            &quot;Fora&quot; mostra o que foi lançado sem marcar &quot;incluir no orçamento&quot; —
            útil para achar o que ficou de fora do controle do mês sem querer.
          </p>
        </div>

        <div className="border-border flex flex-col gap-1 border-t pt-3">
          <p className="text-text-sub mb-1 text-[13px] font-medium">Orçamento específico</p>
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
      </div>
    );
  }

  if (section === "tags") {
    return (
      <TagsSection
        draft={draft}
        tags={tags}
        toggleTag={(id) => toggleId("tagIds", id)}
      />
    );
  }

  if (section === "value") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-text-muted text-[13px] leading-relaxed">
          Filtra pelo valor da transação, sem considerar se é entrada ou saída. Deixe um
          dos campos vazio para não limitar aquele lado.
        </p>
        <div className="flex items-center gap-2">
          <ValueField
            label="De"
            cents={draft.minValue}
            onChange={(cents) => setDraft(d => ({ ...d, minValue: cents }))}
          />
          <ValueField
            label="Até"
            cents={draft.maxValue}
            onChange={(cents) => setDraft(d => ({ ...d, maxValue: cents }))}
          />
        </div>
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

/**
 * Kept as text while the user types — reformatting a partially typed number moves the
 * caret and fights the person typing. It settles into the canonical form on blur.
 */
function ValueField({
  label,
  cents,
  onChange,
}: {
  label: string;
  cents: number | null;
  onChange: (cents: number | null) => void;
}) {
  const [text, setText] = useState(() => centsToInput(cents));

  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-text-muted text-[12px] font-medium tracking-wide uppercase">{label}</span>
      <div className="border-border bg-surface2 focus-within:border-green/60 flex h-9 items-center gap-1.5 rounded-lg border px-3">
        <span className="text-text-muted text-[13px]">R$</span>
        <input
          inputMode="decimal"
          placeholder="0,00"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(inputToCents(e.target.value));
          }}
          onBlur={() => setText(centsToInput(inputToCents(text)))}
          className="text-text placeholder:text-text-muted w-full bg-transparent text-[13px] outline-none"
        />
      </div>
    </label>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
const FILTER_SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "date",       label: "Data",       icon: CalendarDays },
  { id: "type",       label: "Tipo",       icon: ListFilter },
  { id: "categories", label: "Categoria",  icon: Tag },
  { id: "accounts",   label: "Contas",     icon: Wallet },
  { id: "budgets",    label: "Orçamentos", icon: BookOpen },
  { id: "tags",       label: "Tags",       icon: Hash },
  { id: "value",      label: "Valor",      icon: DollarSign },
];

const SORT_SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "sort", label: "Ordenação", icon: ArrowUpDown },
];

function countActive(filter: TransactionsFilter): number {
  let n = 0;
  if (filter.preset !== "budget-cycle") n++;
  if (filter.typeFilter !== "All") n++;
  if (filter.categoryIds.length > 0) n++;
  if (filter.subCategoryIds.length > 0) n++;
  if (filter.accountIds.length > 0) n++;
  if (filter.budgetIds.length > 0) n++;
  if (filter.budgetInclusion !== "all") n++;
  if (filter.tagIds.length > 0) n++;
  if (filter.minValue !== null || filter.maxValue !== null) n++;
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
              if (id === "value" && (draft.minValue !== null || draft.maxValue !== null)) badge = 1;
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
                className="bg-brand hover:bg-brand/90 w-full rounded-lg py-1.5 text-center text-[12px] font-semibold text-white transition-colors"
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
