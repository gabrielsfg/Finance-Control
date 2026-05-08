"use client";

import { Search } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
};

export const TransactionsFilterBar = ({ search, onSearchChange }: Props) => (
  <div
    className="border-border bg-surface2 focus-within:border-green/60 flex h-8 items-center gap-2 rounded-full border px-3 transition-colors"
    style={{ minWidth: 160, maxWidth: 220 }}
  >
    <Search size={12} className="text-text-muted shrink-0" />
    <input
      type="text"
      placeholder="Buscar..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      className="text-text placeholder:text-text-muted flex-1 bg-transparent text-[13px] focus:outline-none"
    />
  </div>
);
