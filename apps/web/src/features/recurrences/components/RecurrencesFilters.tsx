"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ChevronRight, Check, ChevronLeft, Tag, Wallet, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { RecurrenceFilter } from "@/lib/types/recurrences.types";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const TYPE_OPTIONS: { id: RecurrenceFilter["typeFilter"]; label: string }[] = [
  { id: "All",         label: "Todas" },
  { id: "Recurring",   label: "Assinaturas" },
  { id: "Installment", label: "Parcelamentos" },
];

type Section = "month" | "type" | "categories" | "accounts";

function CheckRow({
  checked, onClick, label, color, indent,
}: {
  checked: boolean; onClick: () => void; label: string; color?: string; indent?: boolean;
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
      {color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className={cn("text-[14px]", checked ? "text-text font-medium" : "text-text-sub")}>{label}</span>
    </button>
  );
}

function MonthPicker({
  month, year, onChange,
}: {
  month: number; year: number; onChange: (m: number, y: number) => void;
}) {
  const [viewYear, setViewYear] = useState(year);

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setViewYear(y => y - 1)}
          className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-text text-[13px] font-semibold">{viewYear}</span>
        <button
          onClick={() => setViewYear(y => y + 1)}
          className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const active = m === month && viewYear === year;
          return (
            <button
              key={m}
              onClick={() => onChange(m, viewYear)}
              className={cn(
                "h-9 rounded-lg text-[13px] font-medium transition-all",
                active
                  ? "bg-green/15 text-green ring-1 ring-green/30"
                  : "bg-surface3 text-text-sub hover:text-text",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
      <div className={cn(
        "mt-3 rounded-lg px-3 py-2 text-center text-[12px]",
        "bg-green/10 text-green font-medium",
      )}>
        {MONTH_NAMES[month - 1]} {year}
      </div>
    </div>
  );
}

function SectionContent({
  section, draft, setDraft, accounts, categories, subcategories,
}: {
  section: Section;
  draft: RecurrenceFilter;
  setDraft: React.Dispatch<React.SetStateAction<RecurrenceFilter>>;
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string; color: string }[];
  subcategories: { id: number; name: string; categoryId: number; color: string }[];
}) {
  function toggleCategory(catId: number) {
    const catSubIds = subcategories.filter(s => s.categoryId === catId).map(s => s.id);
    const catChecked = draft.categoryIds.includes(catId);
    if (catChecked) {
      setDraft(d => ({
        ...d,
        categoryIds: d.categoryIds.filter(id => id !== catId),
        subCategoryIds: d.subCategoryIds.filter(id => !catSubIds.includes(id)),
      }));
    } else {
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

    const allSubsChecked = catSubIds.every(id => newSubIds.includes(id));
    const newCatIds = allSubsChecked
      ? [...new Set([...draft.categoryIds, catId])]
      : draft.categoryIds.filter(id => id !== catId);

    setDraft(d => ({ ...d, subCategoryIds: newSubIds, categoryIds: newCatIds }));
  }
  if (section === "month") {
    return (
      <MonthPicker
        month={draft.month}
        year={draft.year}
        onChange={(m, y) => setDraft(d => ({ ...d, month: m, year: y }))}
      />
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
              onClick={() => setDraft(d => ({
                ...d,
                accountIds: d.accountIds.includes(a.id)
                  ? d.accountIds.filter(id => id !== a.id)
                  : [...d.accountIds, a.id],
              }))}
              label={a.name}
            />
          ))
        }
      </div>
    );
  }

  return null;
}

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "month",      label: "Mês",       icon: ChevronRight },
  { id: "type",       label: "Tipo",       icon: ListFilter },
  { id: "categories", label: "Categoria",  icon: Tag },
  { id: "accounts",   label: "Contas",     icon: Wallet },
];

function countActive(filter: RecurrenceFilter): number {
  let n = 0;
  const now = new Date();
  if (filter.month !== now.getMonth() + 1 || filter.year !== now.getFullYear()) n++;
  if (filter.typeFilter !== "All") n++;
  if (filter.categoryIds.length > 0) n++;
  if (filter.subCategoryIds.length > 0) n++;
  if (filter.accountIds.length > 0) n++;
  return n;
}

type Props = {
  filter: RecurrenceFilter;
  onChange: (f: RecurrenceFilter) => void;
};

export function RecurrencesFilters({ filter, onChange }: Props) {
  const [open,    setOpen]    = useState(false);
  const [section, setSection] = useState<Section>("month");
  const [draft,   setDraft]   = useState<RecurrenceFilter>(filter);
  const ref = useRef<HTMLDivElement>(null);

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();

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
  })).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => { setDraft(filter); }, [filter]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function apply() { onChange(draft); setOpen(false); }

  function clearAll() {
    const now = new Date();
    const reset: RecurrenceFilter = {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      categoryIds: [],
      subCategoryIds: [],
      accountIds: [],
      typeFilter: "All",
    };
    setDraft(reset);
    onChange(reset);
    setOpen(false);
  }

  const active = countActive(filter);
  const MONTH_NAMES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  function stepMonth(direction: -1 | 1) {
    let m = filter.month + direction;
    let y = filter.year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    onChange({ ...filter, month: m, year: y });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => stepMonth(-1)}
        title="Mês anterior"
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-full transition-colors"
      >
        <ChevronLeft size={15} />
      </button>

      <div ref={ref} className="relative">
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
        {MONTH_NAMES_FULL[filter.month - 1]} {filter.year}
        {active > 1 && (
          <span className="bg-green flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-black">
            {active - 1}
          </span>
        )}
      </button>

      {open && (
        <div
          className="border-border bg-surface absolute right-0 top-10 z-50 flex overflow-hidden rounded-2xl border shadow-xl"
          style={{ minWidth: 520 }}
        >
          {/* Left nav */}
          <div className="border-border bg-surface2 flex w-44 shrink-0 flex-col border-r py-2">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              let badge = 0;
              const now = new Date();
              if (id === "month" && (draft.month !== now.getMonth() + 1 || draft.year !== now.getFullYear())) badge = 1;
              if (id === "type" && draft.typeFilter !== "All") badge = 1;
              if (id === "categories") badge = draft.categoryIds.length + draft.subCategoryIds.length;
              if (id === "accounts") badge = draft.accountIds.length;

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
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 420 }}>
            <SectionContent
              section={section}
              draft={draft}
              setDraft={setDraft}
              accounts={accounts}
              categories={categories}
              subcategories={subcategories}
            />
          </div>
        </div>
      )}
      </div>

      <button
        onClick={() => stepMonth(1)}
        title="Próximo mês"
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-full transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
