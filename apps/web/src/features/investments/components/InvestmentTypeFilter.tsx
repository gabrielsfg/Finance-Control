"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/lib/types/investments.types";

const LABELS: Record<AssetType, string> = {
  Acao:              "Ações",
  FII:               "FIIs",
  ETF:               "ETFs",
  ETFInternacional:  "ETFs Internacionais",
  Stock:             "Stocks",
  Reit:              "REITs",
  BDR:               "BDRs",
  FundoInvestimento: "Fundos",
  Cripto:            "Criptomoedas",
  TesouroDireto:     "Tesouro Direto",
  RendaFixa:         "Renda Fixa",
  Outro:             "Outros",
};

type Props = {
  allTypes: AssetType[];
  visibleTypes: AssetType[];
  onChange: (visible: AssetType[]) => void;
};

export const InvestmentTypeFilter = ({ allTypes, visibleTypes, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (type: AssetType) => {
    if (visibleTypes.includes(type)) {
      if (visibleTypes.length === 1) return; // keep at least one
      onChange(visibleTypes.filter((t) => t !== type));
    } else {
      onChange([...visibleTypes, type]);
    }
  };

  const hiddenCount = allTypes.length - visibleTypes.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Filtrar tipos de investimentos"
        className={cn(
          "border-border bg-surface2 text-text-sub hover:text-text flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors",
          hiddenCount > 0 && "border-green/40 text-green",
        )}
      >
        <SlidersHorizontal size={13} strokeWidth={1.75} />
        Tipos
        {hiddenCount > 0 && (
          <span className="bg-green text-white rounded-full px-1.5 py-px text-[10px] font-bold ml-0.5">
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 top-10 z-50 flex flex-col gap-px rounded-xl border p-1.5 shadow-lg min-w-[180px]">
          <p className="text-text-muted px-2 py-1 text-[10px] uppercase tracking-[0.06em]">
            Mostrar tipos
          </p>
          {allTypes.map((type) => {
            const checked = visibleTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface2"
              >
                <span className={cn("text-text-sub", checked && "text-text")}>{LABELS[type]}</span>
                {checked && <Check size={12} className="text-green shrink-0" />}
              </button>
            );
          })}
          <div className="border-border mx-1 my-1 border-t" />
          <button
            onClick={() => onChange([...allTypes])}
            className="rounded-lg px-2.5 py-1.5 text-left text-[12px] text-text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            Mostrar todos
          </button>
        </div>
      )}
    </div>
  );
};
