"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { cn, normalizeSearch } from "@/lib/utils";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

/**
 * Canonical category → subcategory picker **with type-to-search**.
 *
 * Use this wherever a subcategory is chosen from a list long enough to scroll — the
 * transaction form and the import review both reach a few dozen rows, and scrolling a
 * grouped list to find "Restaurantes" is slower than typing four letters.
 *
 * `CategorySelectContent` remains for the places that live inside a `<Select>`; this is
 * a self-contained trigger + popover, so it does not fight the Select's own typeahead
 * and keyboard handling the way an input nested in a listbox would.
 *
 * Colour rules match the rest of the app: the category header carries the category
 * COLOUR as a dot, each subcategory its EMOJI (or a faded category dot as fallback).
 * Selection is always by subcategory id.
 */

type Group = { name: string; color: string; items: SubCategoryItem[] };

const SIZES = {
  md: {
    trigger: "h-11 rounded-[13px] px-3.5 text-[15px]",
    chevron: 14,
    dot: "h-2.5 w-2.5",
    emoji: "text-[15px]",
    panelWidth: "w-full min-w-[260px]",
    panelTop: "top-[calc(100%+4px)]",
    listMax: 300,
    row: "px-3.5 py-2.5 text-[14px]",
    indent: "pl-7",
    header: "px-3.5 pt-2.5 pb-1",
    searchBox: "px-3 py-2.5 text-[13px]",
  },
  sm: {
    trigger: "h-7 max-w-[200px] rounded-md px-2.5 text-[12px]",
    chevron: 11,
    dot: "h-2 w-2",
    emoji: "text-[13px]",
    panelWidth: "w-[262px]",
    panelTop: "top-8",
    listMax: 264,
    row: "px-3 py-1.5 text-[13px]",
    indent: "pl-6",
    header: "px-3 pt-2 pb-0.5",
    searchBox: "px-2.5 py-2 text-[12px]",
  },
} as const;

function groupByCategory(subcategories: SubCategoryItem[]): Group[] {
  const groups = new Map<string, Group>();

  for (const sub of subcategories) {
    let group = groups.get(sub.categoryName);
    if (!group) {
      group = {
        name: sub.categoryName,
        color: getCategoryColor(sub.categoryColor, sub.categoryName),
        items: [],
      };
      groups.set(sub.categoryName, group);
    }
    group.items.push(sub);
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type Props = {
  /** Selected subcategory id, or null for none. */
  value: number | null;
  onChange: (subCategoryId: number | null) => void;
  subcategories: SubCategoryItem[];
  /** Adds a "Sem categoria" row that selects null. */
  allowEmpty?: boolean;
  size?: "md" | "sm";
  hasError?: boolean;
  placeholder?: string;
  /** Footer action for creating what is missing. Hidden when omitted. */
  onCreateNew?: () => void;
  createLabel?: string;
};

export function CategoryPickerField({
  value,
  onChange,
  subcategories,
  allowEmpty,
  size = "md",
  hasError,
  placeholder = "Selecionar categoria",
  onCreateNew,
  createLabel = "Nova categoria / subcategoria",
}: Props) {
  const metrics = SIZES[size];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = value !== null ? subcategories.find((sub) => sub.id === value) ?? null : null;
  const selectedColor = selected
    ? getCategoryColor(selected.categoryColor, selected.categoryName)
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "border-border bg-surface2 text-text flex w-full items-center gap-2 border text-left outline-none transition-colors",
          metrics.trigger,
          hasError && "border-red/60",
        )}
      >
        {selected ? (
          <>
            {selected.emoji ? (
              <span className={cn("shrink-0 leading-none", metrics.emoji)}>{selected.emoji}</span>
            ) : (
              selectedColor && (
                <span
                  className={cn("shrink-0 rounded-full", metrics.dot)}
                  style={{ backgroundColor: selectedColor }}
                />
              )
            )}
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-text-muted truncate">{placeholder}</span>
        )}
        <ChevronDown size={metrics.chevron} className="text-text-muted ml-auto shrink-0" />
      </button>

      {open && (
        <CategoryPickerMenu
          value={value}
          subcategories={subcategories}
          allowEmpty={allowEmpty}
          metrics={metrics}
          onPick={(id) => {
            onChange(id);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          onCreateNew={
            onCreateNew &&
            (() => {
              setOpen(false);
              onCreateNew();
            })
          }
          createLabel={createLabel}
        />
      )}
    </div>
  );
}

/**
 * The open panel.
 *
 * Split from the trigger so it mounts and unmounts with `open`, which is what keeps the
 * search honest: the query lives and dies with the panel, so the next open starts from
 * the full list rather than inheriting the last search. Holding it in the parent would
 * mean clearing it on close, and every close path — outside click included — would have
 * to remember to.
 */
function CategoryPickerMenu({
  value, subcategories, allowEmpty, metrics, onPick, onClose, onCreateNew, createLabel,
}: {
  value: number | null;
  subcategories: SubCategoryItem[];
  allowEmpty?: boolean;
  metrics: (typeof SIZES)[keyof typeof SIZES];
  onPick: (id: number | null) => void;
  onClose: () => void;
  onCreateNew?: () => void;
  createLabel: string;
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // The point of the search box is not having to reach for the mouse, so the caret
  // starts in it.
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const groups = useMemo(() => {
    const all = groupByCategory(subcategories);
    const key = normalizeSearch(query);
    if (!key) return all;

    return all
      .map((group) => ({
        ...group,
        // A category name keeps its whole group: someone narrowing to "Moradia" wants
        // everything under it, not only the subcategories that repeat the word.
        items: normalizeSearch(group.name).includes(key)
          ? group.items
          : group.items.filter((sub) => normalizeSearch(sub.name).includes(key)),
      }))
      .filter((group) => group.items.length > 0);
  }, [subcategories, query]);

  // Enter commits the first match, so a narrowed list never needs the mouse.
  const firstMatch = groups[0]?.items[0] ?? null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (firstMatch) onPick(firstMatch.id);
    }
  }

  return (
    <div
      className={cn(
        "border-border bg-surface absolute left-0 z-50 overflow-hidden rounded-xl border shadow-xl",
        metrics.panelWidth,
        metrics.panelTop,
      )}
    >
      <div className={cn("border-border flex items-center gap-2 border-b", metrics.searchBox)}>
        <Search size={12} className="text-text-muted shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar categoria..."
          className="text-text placeholder:text-text-muted w-full bg-transparent outline-none"
        />
      </div>

      <div className="overflow-y-auto py-1" style={{ maxHeight: metrics.listMax }}>
        {/* Nobody searches for "Sem categoria", so it steps aside as soon as there is a
            query and the matches get the whole panel. */}
        {allowEmpty && !query && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className={cn(
              "flex w-full items-center gap-2.5 text-left transition-colors",
              metrics.row,
              value === null
                ? "bg-surface2 text-text font-medium"
                : "text-text-sub hover:bg-surface2 hover:text-text",
            )}
          >
            <span className={cn("border-border shrink-0 rounded-full border", metrics.dot)} />
            <span>Sem categoria</span>
            {value === null && <Check size={11} className="text-text-muted ml-auto" />}
          </button>
        )}

        {groups.map((group) => (
          <div key={group.name}>
            <div className={cn("flex items-center gap-1.5", metrics.header)}>
              <span
                className={cn("shrink-0 rounded-full", metrics.dot)}
                style={{ backgroundColor: group.color }}
              />
              <span className="text-text-muted text-[11px] font-semibold uppercase tracking-wide">
                {group.name}
              </span>
            </div>
            {group.items.map((sub) => {
              const active = sub.id === value;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onPick(sub.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 text-left transition-colors",
                    metrics.row,
                    metrics.indent,
                    active ? "bg-surface2 font-medium" : "text-text-sub hover:bg-surface2 hover:text-text",
                  )}
                >
                  {sub.emoji ? (
                    <span className={cn("shrink-0 leading-none", metrics.emoji)}>{sub.emoji}</span>
                  ) : (
                    <span
                      className={cn("shrink-0 rounded-full opacity-70", metrics.dot)}
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <span className={cn(active && "text-text")}>{sub.name}</span>
                  {active && (
                    <Check size={11} className="ml-auto shrink-0" style={{ color: group.color }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {groups.length === 0 && (
          <p className="text-text-muted px-3 py-4 text-center text-[12px]">
            Nenhuma categoria encontrada.
          </p>
        )}
      </div>

      {/* Outside the scroll area, so it is reachable without scrolling to the bottom of a
          long list — and reachable at all when a search matched nothing, which is exactly
          when the missing category needs creating. */}
      {onCreateNew && (
        <button
          type="button"
          onClick={onCreateNew}
          className="border-border text-text-sub hover:bg-surface2 hover:text-text flex w-full items-center gap-2 border-t px-3 py-2.5 text-left text-[12px] font-medium transition-colors"
        >
          <Plus size={12} className="shrink-0" />
          {createLabel}
        </button>
      )}
    </div>
  );
}
