"use client";

import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2, AlertTriangle, Loader2, X,
  TrendingDown, TrendingUp, ArrowLeftRight, ChevronDown, Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { cn } from "@/lib/utils";
import type { useImportFlow } from "@/features/import/hooks/useImportFlow";
import type { TransactionType } from "@/lib/types/transactions.types";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

type Flow = ReturnType<typeof useImportFlow>;

const TYPE_CONFIG: Record<TransactionType, { label: string; icon: React.ElementType; color: string }> = {
  Expense:  { label: "Despesa",       icon: TrendingDown,   color: "var(--red)" },
  Income:   { label: "Receita",       icon: TrendingUp,     color: "var(--green)" },
  Transfer: { label: "Transferência", icon: ArrowLeftRight, color: "var(--blue)" },
};

const ALL_TYPES: TransactionType[] = ["Expense", "Income", "Transfer"];

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return { open, setOpen, ref };
}

function TypeDropdown({ value, onChange }: { value: TransactionType; onChange: (v: TransactionType) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const cfg = TYPE_CONFIG[value];
  const Icon = cfg.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="border-border bg-surface2 flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors hover:bg-surface2/80"
        style={{ color: cfg.color }}
      >
        <Icon size={12} strokeWidth={2} className="shrink-0" />
        <span>{cfg.label}</span>
        <ChevronDown size={11} className="text-text-muted ml-0.5 shrink-0" />
      </button>

      {open && (
        <div className="border-border bg-surface absolute left-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-xl border py-1 shadow-xl">
          {ALL_TYPES.map((t) => {
            const c = TYPE_CONFIG[t];
            const CIcon = c.icon;
            const active = t === value;
            return (
              <button
                key={t}
                onClick={() => { onChange(t); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
                  active ? "bg-surface2 font-medium" : "text-text-sub hover:bg-surface2 hover:text-text",
                )}
              >
                <CIcon size={13} strokeWidth={1.75} className="shrink-0" style={{ color: c.color }} />
                <span style={{ color: active ? c.color : undefined }}>{c.label}</span>
                {active && <Check size={11} className="ml-auto shrink-0" style={{ color: c.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubcatDropdown({
  value, onChange, subcats, subcatGroups, subcatMap,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  subcats: SubCategoryItem[];
  subcatGroups: Flow["subcatGroups"];
  subcatMap: Flow["subcatMap"];
}) {
  const { open, setOpen, ref } = useDropdown();

  const selected = value ? subcatMap.get(value) : null;
  const selectedColor = selected
    ? getCategoryColor(selected.categoryColor, selected.categoryName)
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="border-border bg-surface2 flex h-7 max-w-[200px] items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-colors hover:bg-surface2/80"
      >
        {selected ? (
          <>
            {selected.emoji
              ? <span className="shrink-0 text-[13px] leading-none">{selected.emoji}</span>
              : selectedColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selectedColor }} />
            }
            <span className="text-text truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-text-muted">Sem categoria</span>
        )}
        <ChevronDown size={11} className="text-text-muted ml-auto shrink-0" />
      </button>

      {open && (
        <div
          className="border-border bg-surface absolute left-0 top-8 z-50 w-[240px] overflow-y-auto rounded-xl border py-1 shadow-xl"
          style={{ maxHeight: 300 }}
        >
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
              value === null ? "bg-surface2 text-text font-medium" : "text-text-sub hover:bg-surface2 hover:text-text",
            )}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-border" />
            <span>Sem categoria</span>
            {value === null && <Check size={11} className="text-text-muted ml-auto" />}
          </button>

          {subcatGroups.map(([catName, { color, items }]) => (
            <div key={catName}>
              <div className="flex items-center gap-1.5 px-3 pb-0.5 pt-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-text-muted text-[11px] font-semibold uppercase tracking-wide">{catName}</span>
              </div>
              {items.map((s) => {
                const active = s.id === value;
                return (
                  <button
                    key={s.id}
                    onClick={() => { onChange(s.id); setOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-1.5 pl-6 text-left text-[13px] transition-colors",
                      active ? "bg-surface2 font-medium" : "text-text-sub hover:bg-surface2 hover:text-text",
                    )}
                  >
                    {s.emoji
                      ? <span className="shrink-0 text-[13px] leading-none">{s.emoji}</span>
                      : <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    }
                    <span className={cn(active && "text-text")}>{s.name}</span>
                    {active && <Check size={11} className="ml-auto shrink-0" style={{ color }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImportReview({ flow }: { flow: Flow }) {
  const allSelected = flow.rows.length > 0 && flow.rows.every((r) => r.selected);

  return (
    <div className="flex h-full flex-col">
      {/* Sub-header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-text text-[22px] font-semibold tracking-tight">Revisar Transações</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">
            {flow.rows.length} encontradas · {flow.duplicateCount} duplicatas ·{" "}
            <span className="text-green font-medium">{flow.selectedCount} selecionadas</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={flow.reset}
            className="border-border bg-surface2 text-text-sub hover:text-text flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors"
          >
            <X size={13} /> Cancelar
          </button>
          <button
            onClick={flow.handleConfirm}
            disabled={flow.selectedCount === 0 || flow.confirmMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all",
              flow.selectedCount === 0 || flow.confirmMutation.isPending
                ? "bg-surface2 text-text-muted cursor-not-allowed"
                : "bg-green text-black hover:bg-green/90"
            )}
          >
            {flow.confirmMutation.isPending
              ? <><Loader2 size={13} className="animate-spin" /> Importando…</>
              : <><CheckCircle2 size={13} /> Importar {flow.selectedCount}</>}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-border bg-surface flex-1 overflow-auto rounded-xl border">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-border bg-surface border-b">
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={allSelected} onChange={flow.toggleAll}
                  className="accent-green h-3.5 w-3.5 cursor-pointer" />
              </th>
              <th className="text-text-muted px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide">Data</th>
              <th className="text-text-muted px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide">Descrição</th>
              <th className="text-text-muted px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide">Tipo</th>
              <th className="text-text-muted px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide">Categoria</th>
              <th className="text-text-muted px-3 py-3 text-right text-[11px] font-medium uppercase tracking-wide">Valor</th>
            </tr>
          </thead>
          <tbody>
            {flow.rows.map((row, idx) => {
              const typeCfg = TYPE_CONFIG[row.type];
              return (
                <tr
                  key={row.externalId + idx}
                  className={cn(
                    "border-border border-b last:border-0 transition-colors",
                    !row.selected && "opacity-40",
                    row.isDuplicate && row.selected && "bg-yellow/5"
                  )}
                >
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={row.selected} onChange={() => flow.toggleRow(idx)}
                      className="accent-green h-3.5 w-3.5 cursor-pointer" />
                  </td>
                  <td className="text-text-sub whitespace-nowrap px-3 py-2.5 font-mono text-[12px]">
                    {row.date.slice(0, 10).split("-").reverse().join("/")}
                  </td>
                  <td className="max-w-[300px] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-text block truncate">{row.description}</span>
                      {row.isDuplicate && (
                        <span title={row.duplicateReason ?? "Possível duplicata"}
                          className="text-yellow flex shrink-0 items-center gap-0.5 text-[11px]">
                          <AlertTriangle size={11} strokeWidth={2} /> duplicata
                        </span>
                      )}
                      {row.paymentType === "Installment" && row.installmentNumber && row.totalInstallments && (
                        <span className="text-text-muted shrink-0 text-[11px]">
                          {row.installmentNumber}/{row.totalInstallments}x
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <TypeDropdown value={row.type} onChange={(v) => flow.setRowType(idx, v)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SubcatDropdown
                      value={row.subCategoryId}
                      onChange={(v) => flow.setRowSubcat(idx, v)}
                      subcats={flow.subcats}
                      subcatGroups={flow.subcatGroups}
                      subcatMap={flow.subcatMap}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium"
                    style={{ color: typeCfg.color }}>
                    {row.type === "Income" ? "+" : "-"}{formatCurrency(row.value / 100)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {flow.confirmMutation.isError && (
        <p className="text-red mt-3 text-[13px]">
          {(flow.confirmMutation.error as Error)?.message ?? "Erro ao confirmar importação."}
        </p>
      )}
    </div>
  );
}

export function ImportDone({ flow }: { flow: Flow }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="bg-green/10 flex h-20 w-20 items-center justify-center rounded-full">
        <CheckCircle2 size={40} className="text-green" strokeWidth={1.75} />
      </div>
      <div className="text-center">
        <h2 className="font-display text-text text-xl font-semibold">Importação concluída!</h2>
        <p className="text-text-sub mt-1 text-[14px]">
          {flow.importedCount} transaç{flow.importedCount === 1 ? "ão importada" : "ões importadas"} com sucesso.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={flow.reset}
          className="border-border bg-surface2 text-text hover:bg-surface2/60 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Importar outro arquivo
        </button>
        <button
          onClick={flow.close}
          className="bg-green hover:bg-green/90 rounded-xl px-5 py-2.5 text-sm font-medium text-black transition-colors"
        >
          Voltar às transações
        </button>
      </div>
    </div>
  );
}
