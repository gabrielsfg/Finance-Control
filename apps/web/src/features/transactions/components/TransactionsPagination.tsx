"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const TransactionsPagination = ({ page, totalPages, onPageChange }: Props) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).reduce<(number | "...")[]>(
    (acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) acc.push(p);
      return acc;
    },
    [],
  );

  return (
    <div className="flex items-center justify-between">
      <p className="text-text-muted text-[13px]">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
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
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
