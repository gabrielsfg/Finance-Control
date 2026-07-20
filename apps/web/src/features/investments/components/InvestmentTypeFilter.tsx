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
  Moeda:             "Moedas",
  Index:             "Índices",
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
          "inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-[13px] text-[13px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]",
          hiddenCount > 0 && "border-[var(--brand-accent)] text-[var(--brand-accent)]",
        )}
      >
        <SlidersHorizontal size={14} strokeWidth={1.75} />
        Tipos
        {hiddenCount > 0 && (
          <span className="ml-0.5 rounded-full px-1.5 py-px font-mono text-[10px] font-bold text-white" style={{ background: "var(--brand-accent)" }}>
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 flex min-w-[200px] flex-col gap-px rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] p-1.5" style={{ boxShadow: "var(--shadow-md)" }}>
          <p className="px-2 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">
            Mostrar tipos
          </p>
          {allTypes.map((type) => {
            const checked = visibleTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--surface2)]"
              >
                <span className={cn("text-[var(--text-sub)]", checked && "text-[var(--text)]")}>{LABELS[type]}</span>
                {checked && <Check size={13} className="shrink-0 text-[var(--brand-accent)]" />}
              </button>
            );
          })}
          <div className="mx-1 my-1 border-t border-[var(--border-color)]" />
          <button
            onClick={() => onChange([...allTypes])}
            className="rounded-[9px] px-2.5 py-1.5 text-left text-[12px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            Mostrar todos
          </button>
        </div>
      )}
    </div>
  );
};
