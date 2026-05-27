"use client";

import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export const MarketSearchBar = ({ value, onChange }: Props) => (
  <div className="relative w-full max-w-md">
    <Search size={14} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar ticker ou nome do ativo..."
      className="border-border bg-surface2 text-text placeholder:text-text-muted h-10 w-full rounded-xl border py-2 pl-9 pr-9 text-[14px] outline-none focus:border-green/60 transition-colors"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        aria-label="Limpar busca"
      >
        <X size={13} className="text-text-muted hover:text-text transition-colors" />
      </button>
    )}
  </div>
);
