"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useTags } from "@/features/transactions/hooks/useTags";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { useAnalyticsFilter } from "../AnalyticsFilterContext";
import { presetLabel } from "../utils/filterDates";

const TX_TYPE_LABELS: Record<string, string> = {
  expense: "Despesas", income: "Receitas", recurring: "Recorrentes", installment: "Parceladas",
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  "Renda Fixa": "Renda Fixa", "Tesouro Direto": "Tesouro Direto",
  "Renda Variável": "Ações", "FII": "FII", "Internacional": "Internacional", "Cripto": "Cripto",
};

type Chip = { id: string; label: string; color?: string; onRemove: () => void };

/** Page title plus the active-filter chips, shared by every analytics sub-page. */
export function AnalyticsHeader({ title }: { title: string }) {
  const { filter, setFilter, mode } = useAnalyticsFilter();

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();
  const { data: tagsRaw     = [] } = useTags();

  const metaAccounts = useMemo(() => accountsRaw.map(a => ({ id: a.id, name: a.name })), [accountsRaw]);
  const metaTags = useMemo(() => tagsRaw.map(t => ({ id: t.id, name: t.name })), [tagsRaw]);
  const metaCategories = useMemo(() =>
    Array.from(
      new Map(subcatsRaw.map(s => [s.categoryId, {
        id: s.categoryId,
        name: s.categoryName,
        color: getCategoryColor(s.categoryColor, s.categoryName),
      }])).values()
    ), [subcatsRaw]);

  const activeChips = useMemo<Chip[]>(() => {
    const chips: Chip[] = [];

    if (filter.preset !== "last-6-months") {
      chips.push({
        id: "preset",
        label: presetLabel(filter.preset, filter.customYear),
        onRemove: () => setFilter(f => ({ ...f, preset: "last-6-months" })),
      });
    }

    if (mode === "expenses") {
      if (filter.transactionType !== "all") {
        chips.push({
          id: "txtype",
          label: TX_TYPE_LABELS[filter.transactionType] ?? filter.transactionType,
          onRemove: () => setFilter(f => ({ ...f, transactionType: "all" })),
        });
      }
      for (const id of filter.categoryIds) {
        const cat = metaCategories.find(c => c.id === id);
        if (cat) chips.push({
          id: `cat-${id}`,
          label: cat.name,
          color: cat.color,
          onRemove: () => setFilter(f => ({ ...f, categoryIds: f.categoryIds.filter(x => x !== id) })),
        });
      }
    }

    if (mode === "investments" && filter.assetClass !== "all") {
      chips.push({
        id: "assetclass",
        label: ASSET_CLASS_LABELS[filter.assetClass] ?? filter.assetClass,
        onRemove: () => setFilter(f => ({ ...f, assetClass: "all" })),
      });
    }

    if (mode !== "none") {
      for (const id of filter.accountIds) {
        const acc = metaAccounts.find(a => a.id === id);
        if (acc) chips.push({
          id: `acc-${id}`,
          label: acc.name,
          onRemove: () => setFilter(f => ({ ...f, accountIds: f.accountIds.filter(x => x !== id) })),
        });
      }
    }

    if (mode === "expenses") {
      for (const id of filter.tagIds) {
        const tag = metaTags.find(t => t.id === id);
        if (tag) chips.push({
          id: `tag-${id}`,
          label: `#${tag.name}`,
          onRemove: () => setFilter(f => ({ ...f, tagIds: f.tagIds.filter(x => x !== id) })),
        });
      }
    }

    return chips;
  }, [filter, mode, metaCategories, metaAccounts, metaTags, setFilter]);

  return (
    <div>
      <h1 className="font-display font-700 text-text text-[22px] tracking-tight">{title}</h1>
      {activeChips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {activeChips.map(chip => (
            <div
              key={chip.id}
              className="border-border bg-surface2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px]"
            >
              {chip.color && (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chip.color }} />
              )}
              <span className="text-text-sub">{chip.label}</span>
              <button
                onClick={chip.onRemove}
                className="text-text-muted hover:text-red ml-0.5 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
