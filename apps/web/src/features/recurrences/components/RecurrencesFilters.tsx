"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, Check, Tag, Wallet, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { RecurrenceFilter } from "@/lib/types/recurrences.types";

const TYPE_OPTIONS: { id: RecurrenceFilter["typeFilter"]; label: string }[] = [
  { id: "All",         label: "Todas" },
  { id: "Recurring",   label: "Assinaturas" },
  { id: "Installment", label: "Parcelamentos" },
];

type Section = "type" | "categories" | "accounts";

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
      <span className={cn("text-[14px]", checked ? "text-text font-medium" : "text-text-sub")}>{label}</span>
    </button>
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
  subcategories: { id: number; name: string; categoryId: number; color: string; emoji?: string | null }[];
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
  { id: "type",       label: "Tipo",      icon: ListFilter },
  { id: "categories", label: "Categoria", icon: Tag },
  { id: "accounts",   label: "Contas",    icon: Wallet },
];

function countActive(filter: RecurrenceFilter): number {
  let n = 0;
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
  const [section, setSection] = useState<Section>("type");
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
    emoji: s.emoji,
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
    const reset: RecurrenceFilter = {
      ...filter,
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

  return (
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
        Filtros
        {active > 0 && (
          <span className="bg-green flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-black">
            {active}
          </span>
        )}
      </button>

      {open && (
        <div
          className="border-border bg-surface absolute right-0 top-10 z-50 flex overflow-hidden rounded-2xl border shadow-xl"
          style={{ minWidth: 460 }}
        >
          {/* Left nav */}
          <div className="border-border bg-surface2 flex w-40 shrink-0 flex-col border-r py-2">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              let badge = 0;
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
  );
}
