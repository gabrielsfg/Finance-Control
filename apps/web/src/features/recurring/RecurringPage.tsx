"use client";

import { RefreshCw } from "lucide-react";

export const RecurringPage = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <div className="bg-surface2 flex h-16 w-16 items-center justify-center rounded-2xl">
        <RefreshCw size={28} className="text-text-muted" />
      </div>
      <div className="text-center">
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Recorrências e Parcelamentos</h1>
        <p className="text-text-muted mt-1.5 text-[14px]">Esta página está em construção.</p>
      </div>
    </div>
  );
};
