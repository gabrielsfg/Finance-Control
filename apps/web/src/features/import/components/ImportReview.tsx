"use client";

import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2, AlertTriangle, Loader2, X,
  TrendingDown, TrendingUp, ArrowLeftRight, ChevronDown, Check,
} from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { CategoryPickerField } from "@/components/shared/CategoryPickerField";
import { TagInput } from "@/features/transactions/components/TagInput";
import { CreateSubCategoryModal } from "@/features/categories/components/CreateSubCategoryModal";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { useImportFlow } from "@/features/import/hooks/useImportFlow";
import type { TransactionType } from "@/lib/types/transactions.types";

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

export function ImportReview({ flow }: { flow: Flow }) {
  const allSelected = flow.rows.length > 0 && flow.rows.every((r) => r.selected);
  const { data: categories = [] } = useCategories();

  // Which row opened the create drawer, so the new subcategory lands on it. One drawer
  // for the whole table rather than one per row.
  const [createSubcatForRow, setCreateSubcatForRow] = useState<number | null>(null);

  const busy = flow.selectedCount === 0 || flow.confirmMutation.isPending;

  return (
    <div className="flex h-full flex-col px-[clamp(20px,3.4vw,46px)] pb-[30px]">
      {/* Title and actions ride the shared topbar, so this screen lines up with every
          other page instead of starting flush against the top of the viewport. The
          buttons take the primary-action slot on the right — where "Nova transacao"
          sits — and match its metrics, or the row reads as subtly misaligned. */}
      <div className="shrink-0">
        <PageTopbar
          title="Revisar Transações"
          subtitle={
            <>
              {flow.rows.length} encontradas · {flow.duplicateCount} duplicatas ·{" "}
              <span className="text-green font-medium">{flow.selectedCount} selecionadas</span>
            </>
          }
          actions={
            <>
              <button
                onClick={flow.reset}
                className="flex h-[42px] items-center gap-2 rounded-[13px] border px-4 text-[13px] font-medium transition-all hover:-translate-y-[1px]"
                style={{ background: "var(--surface)", borderColor: "var(--border-color)", color: "var(--text-sub)" }}
              >
                <X size={15} strokeWidth={1.75} /> Cancelar
              </button>
              <button
                onClick={flow.handleConfirm}
                disabled={busy}
                className={cn(
                  "inline-flex h-[42px] items-center gap-2 rounded-[13px] px-[18px] text-[14px] font-semibold transition-transform",
                  busy
                    ? "bg-surface2 text-text-muted cursor-not-allowed"
                    : "text-white hover:-translate-y-[1px]",
                )}
                style={
                  busy
                    ? undefined
                    : { background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }
                }
              >
                {flow.confirmMutation.isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Importando…</>
                  : <><CheckCircle2 size={16} strokeWidth={2} /> Importar {flow.selectedCount}</>}
              </button>
            </>
          }
        />
      </div>

      {/* The same choice the upload step offers, repeated here because this is the screen
          where it is actually decided — by now the rows are on screen and the reviewer can
          see what they are about to charge against the budget. Bound to the same state, so
          the two controls can never disagree. */}
      <label className="mb-3 flex w-fit shrink-0 cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={flow.countForBudget}
          onChange={(e) => flow.setCountForBudget(e.target.checked)}
          className="accent-green h-4 w-4 cursor-pointer rounded"
        />
        <span className="text-text text-[13px] font-medium">Contar no orçamento ativo</span>
        <span className="text-text-muted text-[12px]">
          — as transações importadas serão associadas ao orçamento ativo atual.
        </span>
      </label>

      {/* Table */}
      <div className="border-border bg-surface flex-1 overflow-auto rounded-xl border">
        <table className="w-full min-w-[1180px] text-[13px]">
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
              <th className="text-text-muted px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide">Tags</th>
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
                  <td className="px-3 py-2.5">
                    {/* The statement's date is a suggestion, not a fact — a card purchase
                        posts days after it happened, and the reviewer is often the only
                        one who knows which date the transaction belongs to. */}
                    <div className="w-[122px]">
                      <DatePickerField
                        size="sm"
                        value={row.date.slice(0, 10)}
                        onChange={(next) => flow.setRowDate(idx, next)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* Editable in place. Bank descriptions arrive as things like
                          "PIX ENVIADO 41.2 CP" — the border only shows on hover so the
                          column still reads as text until someone wants to fix one. */}
                      <input
                        value={row.description}
                        onChange={(e) => flow.setRowDescription(idx, e.target.value)}
                        placeholder="Sem descrição"
                        title="Editar descrição"
                        className="text-text placeholder:text-text-muted hover:border-border hover:bg-surface2 w-[236px] min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13px] outline-none transition-colors focus:border-[var(--brand-cobalt)] focus:bg-[var(--surface2)]"
                      />
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
                    <CategoryPickerField
                      size="sm"
                      allowEmpty
                      placeholder="Sem categoria"
                      value={row.subCategoryId}
                      onChange={(id) => flow.setRowSubcat(idx, id)}
                      subcategories={flow.subcats}
                      onCreateNew={() => setCreateSubcatForRow(idx)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {/* The transaction form's own control, shrunk to the cell, so an
                        imported row can be tagged without a second pass through edit. */}
                    <div className="w-[200px]">
                      <TagInput
                        size="sm"
                        value={row.tags}
                        onChange={(tags) => flow.setRowTags(idx, tags)}
                        extraOptions={flow.pendingTagNames}
                      />
                    </div>
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

      {/* Rendered here rather than inside the dropdown: the menu unmounts the instant it
          loses focus, and a drawer nested in it would be torn down on the first click
          inside itself. Creating a category here saves re-importing the file, which is
          what a second parse actually costs — another pass of AI categorisation. */}
      <CreateSubCategoryModal
        open={createSubcatForRow !== null}
        onClose={() => setCreateSubcatForRow(null)}
        categories={categories}
        zIndex={80}
        onCreated={(created) => {
          if (createSubcatForRow !== null) flow.setRowSubcat(createSubcatForRow, created.id);
        }}
      />
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
          className="bg-brand hover:bg-brand/90 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors"
        >
          Voltar às transações
        </button>
      </div>
    </div>
  );
}
