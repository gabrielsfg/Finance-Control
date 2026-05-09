"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  rowCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const TransactionsPagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  rowCount,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = from + rowCount - 1;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).reduce<(number | "...")[]>(
    (acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) acc.push(p);
      return acc;
    },
    [],
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center justify-end gap-3">
      {/* Count label */}
      <p className="text-text-muted shrink-0 text-[13px]">
        {totalItems === 0
          ? "Nenhuma transação"
          : `${from}–${to} de ${totalItems} transaç${totalItems !== 1 ? "ões" : "ão"}`}
      </p>

      {/* Prev */}
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        title="Página anterior"
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
      >
        <ChevronLeft size={15} />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="text-text-muted px-1 text-[13px]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-[13px] transition-colors",
                page === p
                  ? "bg-green/15 text-green font-medium"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        title="Próxima página"
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
      >
        <ChevronRight size={15} />
      </button>

      {/* Page size dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          title="Itens por página"
          className={cn(
            "border-border bg-surface2 hover:bg-surface3 flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors",
            dropdownOpen ? "border-green/40 text-text" : "text-text-sub",
          )}
        >
          {pageSize} / pág.
          <ChevronDown size={13} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
        </button>

        {dropdownOpen && (
          <div className="border-border bg-surface absolute bottom-full right-0 mb-1.5 min-w-[110px] overflow-hidden rounded-lg border shadow-lg">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => { onPageSizeChange(size); onPageChange(1); setDropdownOpen(false); }}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-left text-[13px] transition-colors",
                  pageSize === size
                    ? "bg-green/10 text-green font-medium"
                    : "text-text-sub hover:bg-surface2 hover:text-text",
                )}
              >
                {size} / pág.
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
