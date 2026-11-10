"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn, normalizeSearch } from "@/lib/utils";
import { BANKS, findBank } from "@/lib/config/banks";
import { BankLogo } from "@/components/shared/BankLogo";

/**
 * Bank / broker / benefit-card picker **with type-to-search**, same shape as
 * `CategoryPickerField`: a trigger plus a popover whose search box takes the caret on
 * open, Enter picks the first match and Escape closes. An empty value means "no bank"
 * (the account shows its type icon).
 */
type Props = {
  /** Bank slug, or "" for none. */
  value: string;
  onChange: (slug: string) => void;
};

export function BankPickerField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bank = findBank(value);

  useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-border bg-surface2 text-text flex h-12 w-full items-center gap-3 rounded-[13px] border px-3.5 text-left text-[15px] outline-none transition-colors"
      >
        {bank ? (
          <>
            <BankLogo slug={bank.slug} size={30} className="rounded-[8px]" />
            <span className="truncate font-medium">{bank.name}</span>
          </>
        ) : (
          <span className="text-text-muted truncate">Nenhum</span>
        )}
        <ChevronDown size={15} className="text-text-muted ml-auto shrink-0" />
      </button>

      {open && (
        <BankPickerMenu
          value={value}
          onPick={(slug) => {
            onChange(slug);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** Mounted only while open, so each open starts from the full list. */
function BankPickerMenu({
  value,
  onPick,
  onClose,
}: {
  value: string;
  onPick: (slug: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const matches = useMemo(() => {
    const key = normalizeSearch(query);
    const sorted = [...BANKS].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return key ? sorted.filter((b) => normalizeSearch(b.name).includes(key)) : sorted;
  }, [query]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (matches[0]) onPick(matches[0].slug);
    }
  }

  return (
    <div className="border-border bg-surface absolute top-[calc(100%+4px)] left-0 z-50 w-full min-w-[280px] overflow-hidden rounded-xl border shadow-xl">
      <div className="border-border flex items-center gap-2 border-b px-3.5 py-3 text-[14px]">
        <Search size={14} className="text-text-muted shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar banco, corretora ou benefício..."
          className="text-text placeholder:text-text-muted w-full bg-transparent outline-none"
        />
      </div>

      <div className="max-h-[340px] overflow-y-auto py-1">
        {!query && (
          <button
            type="button"
            onClick={() => onPick("")}
            className="hover:bg-surface2 text-text-sub flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px] transition-colors"
          >
            <span className="h-8 w-8 shrink-0" />
            <span className="flex-1">Nenhum</span>
            {!value && <Check size={15} className="text-green shrink-0" />}
          </button>
        )}

        {matches.map((b) => (
          <button
            key={b.slug}
            type="button"
            onClick={() => onPick(b.slug)}
            className={cn(
              "hover:bg-surface2 text-text flex w-full items-center gap-3 px-3.5 py-2 text-left text-[15px] transition-colors",
              b.slug === value && "bg-surface2",
            )}
          >
            <BankLogo slug={b.slug} size={32} className="rounded-[8px]" />
            <span className="flex-1 truncate font-medium">{b.name}</span>
            {b.slug === value && <Check size={15} className="text-green shrink-0" />}
          </button>
        ))}

        {matches.length === 0 && (
          <p className="text-text-muted px-3.5 py-4 text-center text-[13px]">Nenhum resultado para “{query}”.</p>
        )}
      </div>
    </div>
  );
}
