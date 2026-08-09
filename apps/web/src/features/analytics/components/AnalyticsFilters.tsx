"use client";

import { useEffect, useRef, useState } from "react";
import {
  SlidersHorizontal, Check,
  CalendarDays, Tag, Hash, Wallet, BarChart2, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useTags } from "@/features/transactions/hooks/useTags";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { AnalyticsFilter, AssetClassFilter, DatePreset, TransactionTypeFilter } from "../types/filters.types";
import { availableYears, defaultFilter } from "../utils/filterDates";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "date" | "type" | "categories" | "accounts" | "assetclass" | "tags";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "current-month",  label: "Mês atual" },
  { id: "last-3-months",  label: "Últimos 3 meses" },
  { id: "last-6-months",  label: "Últimos 6 meses" },
  { id: "last-12-months", label: "Últimos 12 meses" },
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
  { id: "Tesouro Direto", label: "Tesouro Direto" },
  { id: "Renda Variável", label: "Ações" },
  { id: "FII",            label: "FII" },
  { id: "Internacional",  label: "Internacional" },
  { id: "Cripto",         label: "Cripto" },
];


// ── Preset pill ───────────────────────────────────────────────────────────────
function PresetPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border px-3 text-[12px] font-medium transition-all whitespace-nowrap",
        active
          ? "border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_12%,transparent)] text-[var(--brand-accent)]"
          : "border-[var(--border-color)] bg-[var(--surface2)] text-[var(--text-sub)] hover:text-[var(--text)]",
      )}
    >
      {children}
    </button>
  );
}

// ── Check row ─────────────────────────────────────────────────────────────────
function CheckRow({ checked, onClick, label, color }: { checked: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface2)]"
    >
      <span className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)] text-[var(--brand-accent)]"
          : "border-[var(--border-color)] text-transparent",
      )}>
        <Check size={10} strokeWidth={3} />
      </span>
      {color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className={cn("text-[13px]", checked ? "text-[var(--text)] font-medium" : "text-[var(--text-sub)]")}>{label}</span>
    </button>
  );
}

// ── Section content ───────────────────────────────────────────────────────────
function SectionContent({
  section, draft, setDraft, mode, accounts, categories, tags,
}: {
  section: Section;
  draft: AnalyticsFilter;
  setDraft: React.Dispatch<React.SetStateAction<AnalyticsFilter>>;
  mode: Props["mode"];
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string; color: string }[];
  tags: { id: number; name: string }[];
}) {
  const years = availableYears();

  if (section === "date") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map(p => (
              <PresetPill key={p.id} active={draft.preset === p.id} onClick={() => setDraft(d => ({ ...d, preset: p.id }))}>
                {p.label}
              </PresetPill>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Ano</p>
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
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Período personalizado</p>
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

  if (section === "type" && mode === "expenses") {
    return (
      <div className="flex flex-col gap-1">
        {TX_TYPES.map(t => (
          <CheckRow
            key={t.id}
            checked={draft.transactionType === t.id}
            onClick={() => setDraft(d => ({ ...d, transactionType: t.id }))}
            label={t.label}
          />
        ))}
      </div>
    );
  }

  if (section === "assetclass" && mode === "investments") {
    return (
      <div className="flex flex-col gap-1">
        {ASSET_CLASSES.map(a => (
          <CheckRow
            key={a.id}
            checked={draft.assetClass === a.id}
            onClick={() => setDraft(d => ({ ...d, assetClass: a.id }))}
            label={a.label}
          />
        ))}
      </div>
    );
  }

  if (section === "categories" && mode === "expenses") {
    return (
      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 300 }}>
        {categories.length === 0
          ? <p className="text-text-muted py-4 text-center text-[13px]">Nenhuma categoria</p>
          : categories.map(c => (
            <CheckRow
              key={c.id}
              checked={draft.categoryIds.includes(c.id)}
              onClick={() => {
                const cur = draft.categoryIds;
                setDraft(d => ({ ...d, categoryIds: cur.includes(c.id) ? cur.filter(x => x !== c.id) : [...cur, c.id] }));
              }}
              label={c.name}
              color={c.color}
            />
          ))
        }
      </div>
    );
  }

  if (section === "accounts") {
    return (
      <div className="flex flex-col gap-1">
        {accounts.length === 0
          ? <p className="text-text-muted py-4 text-center text-[13px]">Nenhuma conta</p>
          : accounts.map(a => (
            <CheckRow
              key={a.id}
              checked={draft.accountIds.includes(a.id)}
              onClick={() => {
                const cur = draft.accountIds;
                setDraft(d => ({ ...d, accountIds: cur.includes(a.id) ? cur.filter(x => x !== a.id) : [...cur, a.id] }));
              }}
              label={a.name}
            />
          ))
        }
      </div>
    );
  }

  if (section === "tags" && mode === "expenses") {
    return (
      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 300 }}>
        {tags.length === 0
          ? <p className="text-text-muted py-4 text-center text-[13px]">Nenhuma tag criada</p>
          : tags.map(tag => (
            <CheckRow
              key={tag.id}
              checked={draft.tagIds.includes(tag.id)}
              onClick={() => {
                const cur = draft.tagIds;
                setDraft(d => ({ ...d, tagIds: cur.includes(tag.id) ? cur.filter(x => x !== tag.id) : [...cur, tag.id] }));
              }}
              label={`#${tag.name}`}
            />
          ))
        }
      </div>
    );
  }

  return <p className="text-text-muted text-[13px]">Sem opções para este modo.</p>;
}

// ── Nav sections per mode ─────────────────────────────────────────────────────
function getSections(mode: Props["mode"]): { id: Section; label: string; icon: React.ElementType }[] {
  const base = [{ id: "date" as Section, label: "Data", icon: CalendarDays }];
  if (mode === "expenses") return [
    ...base,
    { id: "type",       label: "Tipo",       icon: ArrowUpDown },
    { id: "categories", label: "Categorias", icon: Tag },
    { id: "accounts",   label: "Contas",     icon: Wallet },
    { id: "tags",       label: "Tags",       icon: Hash },
  ];
  if (mode === "investments") return [
    ...base,
    { id: "assetclass", label: "Classe",  icon: BarChart2 },
    { id: "accounts",   label: "Contas",  icon: Wallet },
  ];
  return base;
}

function countActive(filter: AnalyticsFilter, mode: Props["mode"]): number {
  let n = 0;
  if (filter.preset !== "last-6-months") n++;
  if (mode === "expenses") {
    if (filter.categoryIds.length > 0) n++;
    if (filter.accountIds.length > 0) n++;
    if (filter.transactionType !== "all") n++;
    if (filter.tagIds.length > 0) n++;
  }
  if (mode === "investments") {
    if (filter.accountIds.length > 0) n++;
    if (filter.assetClass !== "all") n++;
  }
  return n;
}

// ── Main export ───────────────────────────────────────────────────────────────
type Props = {
  filter: AnalyticsFilter;
  onChange: (f: AnalyticsFilter) => void;
  mode: "expenses" | "investments" | "none";
};

export function AnalyticsFilters({ filter, onChange, mode }: Props) {
  const [open,    setOpen]    = useState(false);
  const [section, setSection] = useState<Section>("date");
  const [draft,   setDraft]   = useState<AnalyticsFilter>(filter);
  const ref = useRef<HTMLDivElement>(null);

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();
  const { data: tagsRaw     = [] } = useTags();

  const accounts   = accountsRaw.map(a => ({ id: a.id, name: a.name }));
  const tags = tagsRaw.map(t => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name));
  const categories = Array.from(
    new Map(subcatsRaw.map(s => [s.categoryId, {
      id: s.categoryId,
      name: s.categoryName,
      color: getCategoryColor(s.categoryColor, s.categoryName),
    }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => { setDraft(filter); }, [filter]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function apply() { onChange(draft); setOpen(false); }
  function clearAll() { const reset = defaultFilter(); setDraft(reset); onChange(reset); setOpen(false); }

  const sections = getSections(mode);
  const active   = countActive(filter, mode);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setDraft(filter); setSection("date"); }}
        className={cn(
          "flex h-[42px] items-center gap-2 rounded-[13px] border px-3.5 text-[13px] font-medium transition-all hover:-translate-y-[1px]",
          open || active > 0
            ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
            : "border-[var(--border-color)] text-[var(--text-sub)] hover:text-[var(--text)]",
        )}
        style={{ background: "var(--surface)" }}
      >
        <SlidersHorizontal size={15} strokeWidth={1.75} />
        <span className="hidden sm:inline">Filtros</span>
        {active > 0 && (
          <span
            className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold text-white"
            style={{ background: "var(--brand-accent)" }}
          >
            {active}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="border-border bg-surface absolute right-0 top-10 z-50 flex overflow-hidden rounded-2xl border shadow-xl"
          style={{ minWidth: 500 }}
        >
          {/* Left nav */}
          <div className="border-border bg-surface2 flex w-40 shrink-0 flex-col border-r py-2">
            {sections.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              let badge = 0;
              if (id === "date" && draft.preset !== "last-6-months") badge = 1;
              if (id === "categories") badge = draft.categoryIds.length;
              if (id === "accounts")   badge = draft.accountIds.length;
              if (id === "tags")       badge = draft.tagIds.length;
              if (id === "type" && draft.transactionType !== "all") badge = 1;
              if (id === "assetclass" && draft.assetClass !== "all") badge = 1;

              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors",
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

            <div className="border-border mt-auto border-t px-2 pt-2 pb-1 flex flex-col gap-1.5">
              <button onClick={clearAll} className="text-text-muted hover:text-text w-full rounded-lg py-1.5 text-center text-[12px] transition-colors hover:bg-surface3">
                Limpar tudo
              </button>
              <button onClick={apply} className="bg-brand hover:bg-brand/90 w-full rounded-lg py-1.5 text-center text-[12px] font-semibold text-white transition-colors">
                Aplicar
              </button>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 440 }}>
            <SectionContent
              section={section}
              draft={draft}
              setDraft={setDraft}
              mode={mode}
              accounts={accounts}
              categories={categories}
              tags={tags}
            />
          </div>
        </div>
      )}
    </div>
  );
}
