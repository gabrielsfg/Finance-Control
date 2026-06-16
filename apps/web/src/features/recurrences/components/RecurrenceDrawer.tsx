"use client";

import { useEffect, useRef } from "react";
import { X, RefreshCw, Layers, Calendar, Wallet, Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { RecurringItem, InstallmentItem } from "@/lib/types/recurrences.types";

const RECURRENCE_LABELS: Record<string, string> = {
  Daily:        "Diário",
  WorkDay:      "Dia útil",
  Weekly:       "Semanal",
  Biweekly:     "Quinzenal",
  Monthly:      "Mensal",
  Quarterly:    "Trimestral",
  Semiannually: "Semestral",
  Annually:     "Anual",
};

type DrawerItem =
  | { kind: "recurring"; item: RecurringItem }
  | { kind: "installment"; item: InstallmentItem };

type Props = {
  open: boolean;
  data: DrawerItem | null;
  onClose: () => void;
  onEdit: (data: DrawerItem) => void;
  onCancel: (item: RecurringItem) => void;
  onReactivate: (item: RecurringItem) => void;
};

function DetailRow({ icon: Icon, label, value, valueClass }: {
  icon: React.ElementType; label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="text-text-muted shrink-0" strokeWidth={1.75} />
        <span className="text-text-muted text-[13px]">{label}</span>
      </div>
      <span className={cn("text-text text-[13px] font-medium", valueClass)}>{value}</span>
    </div>
  );
}

function RecurringDetail({ item, onEdit, onCancel, onReactivate }: {
  item: RecurringItem;
  onEdit: () => void;
  onCancel: () => void;
   onReactivate: () => void;
}) {
  const color = getCategoryColor(item.categoryColor, item.categoryName);
  const startDate = new Date(item.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: `${color}18` }}
        >
          <RefreshCw size={20} strokeWidth={1.75} style={{ color }} />
        </div>
        <div>
          <h2 className="font-display text-text text-[18px] font-bold">{item.description}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {item.categoryName}
            </span>
            {item.isActive ? (
              <span className="text-green border-green/25 bg-green/8 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                Ativa
              </span>
            ) : (
              <span className="text-red border-red/25 bg-red/8 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                Cancelada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Value highlight */}
      <div className="bg-surface2 rounded-[13px] border p-4" style={{ borderColor: "var(--border-color)" }}>
        <p className="text-text-muted mb-1 text-[11px] uppercase tracking-wide">Valor mensal</p>
        <p className="font-money text-text text-[28px] font-bold">{formatCurrency(item.value / 100)}</p>
        <p className="text-text-muted mt-0.5 text-[12px]">
          {formatCurrency((item.value * 12) / 100)}/ano · {RECURRENCE_LABELS[item.recurrence]}
        </p>
      </div>

      {/* Details */}
      <div className="divide-border divide-y rounded-[13px] border px-4" style={{ borderColor: "var(--border-color)" }}>
        <DetailRow icon={Tag}      label="Subcategoria"  value={item.subCategoryEmoji ? `${item.subCategoryEmoji} ${item.subCategoryName}` : item.subCategoryName} />
        <DetailRow icon={Wallet}   label="Conta"         value={item.accountName} />
        <DetailRow icon={RefreshCw} label="Recorrência"  value={RECURRENCE_LABELS[item.recurrence]} />
        <DetailRow icon={Calendar} label="Início"        value={startDate} />
        {item.endDate && (
          <DetailRow
            icon={Calendar}
            label="Encerramento"
            value={new Date(item.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {item.isActive ? (
          <>
            <button
              onClick={onEdit}
              className="bg-surface2 hover:bg-surface3 text-text w-full rounded-[13px] border py-3 text-[14px] font-semibold transition-colors" style={{ borderColor: "var(--border-color)" }}
            >
              Editar assinatura
            </button>
            <button
              onClick={onCancel}
              className="text-red hover:bg-red/10 border-red/25 w-full rounded-[13px] border py-3 text-[14px] font-semibold transition-colors"
            >
              Cancelar assinatura
            </button>
          </>
        ) : (
          <button
            onClick={onReactivate}
            className="text-green hover:bg-green/10 border-green/30 w-full rounded-[13px] border py-3 text-[14px] font-semibold transition-colors"
          >
            Reativar assinatura
          </button>
        )}
      </div>
    </div>
  );
}

function InstallmentDetail({ item, onEdit }: {
  item: InstallmentItem;
  onEdit: () => void;
}) {
  const color = getCategoryColor(item.categoryColor, item.categoryName);
  const pct = (item.paidInstallments / item.totalInstallments) * 100;
  const done = item.remainingInstallments === 0;
  const transactionDate = new Date(item.transactionDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const endDate = (() => {
    const d = new Date(item.transactionDate);
    d.setMonth(d.getMonth() + item.totalInstallments - 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: `${color}18` }}
        >
          <Layers size={20} strokeWidth={1.75} style={{ color }} />
        </div>
        <div>
          <h2 className="font-display text-text text-[18px] font-bold">{item.description}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {item.categoryName}
            </span>
            {done ? (
              <span className="text-green border-green/25 bg-green/8 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                Quitado
              </span>
            ) : (
              <span className="text-blue border-blue/25 bg-blue/8 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                {item.paidInstallments}/{item.totalInstallments} parcelas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Value highlight */}
      <div className="bg-surface2 rounded-[13px] border p-4" style={{ borderColor: "var(--border-color)" }}>
        <p className="text-text-muted mb-1 text-[11px] uppercase tracking-wide">Valor da parcela</p>
        <p className="font-money text-text text-[28px] font-bold">{formatCurrency(item.value / 100)}</p>
        <p className="text-text-muted mt-0.5 text-[12px]">
          Total: {formatCurrency(item.totalValue / 100)}
        </p>
      </div>

      {/* Progress */}
      <div className="bg-surface2 rounded-[13px] border p-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-text-muted text-[12px]">Progresso</span>
          <span className="text-text-muted text-[12px]">{pct.toFixed(0)}%</span>
        </div>
        <div className="bg-surface3 h-2 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: done ? "#00C98D" : color }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-muted text-[11px]">Pagas</p>
            <p className="font-money text-text text-[15px] font-semibold">{item.paidInstallments}</p>
          </div>
          <div>
            <p className="text-text-muted text-[11px]">Restantes</p>
            <p className={cn("font-money text-[15px] font-semibold", done ? "text-green" : "text-text")}>{item.remainingInstallments}</p>
          </div>
          {!done && (
            <div className="col-span-2">
              <p className="text-text-muted text-[11px]">Valor restante</p>
              <p className="font-money text-red text-[15px] font-semibold">{formatCurrency(item.remainingAmount / 100)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="divide-border divide-y rounded-[13px] border px-4" style={{ borderColor: "var(--border-color)" }}>
        <DetailRow icon={Wallet}   label="Conta"         value={item.accountName} />
        <DetailRow icon={Tag}      label="Subcategoria"  value={item.subCategoryEmoji ? `${item.subCategoryEmoji} ${item.subCategoryName}` : item.subCategoryName} />
        <DetailRow icon={Calendar} label="Início"        value={transactionDate} />
        <DetailRow icon={Calendar} label="Término"       value={endDate} />
        {item.paymentMethod && (
          <DetailRow icon={Check}  label="Pagamento"     value={item.paymentMethod === "Credit" ? "Crédito" : "Débito"} />
        )}
      </div>

      {/* Actions */}
      {!done && (
        <button
          onClick={onEdit}
          className="bg-surface2 hover:bg-surface3 text-text w-full rounded-[13px] border py-3 text-[14px] font-semibold transition-colors" style={{ borderColor: "var(--border-color)" }}
        >
          Editar parcelamento
        </button>
      )}
    </div>
  );
}

export function RecurrenceDrawer({ open, data, onClose, onEdit, onCancel, onReactivate }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border-color)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[--text-sub]">
            {data?.kind === "recurring" ? "Assinatura" : "Parcelamento"}
          </span>
          <button
            onClick={onClose}
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {data?.kind === "recurring" && (
            <RecurringDetail
              item={data.item}
              onEdit={() => onEdit(data)}
              onCancel={() => onCancel(data.item)}
              onReactivate={() => onReactivate(data.item)}
            />
          )}
          {data?.kind === "installment" && (
            <InstallmentDetail
              item={data.item}
              onEdit={() => onEdit(data)}
            />
          )}
        </div>
      </div>
    </>
  );
}
