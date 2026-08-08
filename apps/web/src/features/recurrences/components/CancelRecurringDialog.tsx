"use client";

import { X, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { RecurringItem } from "@/lib/types/recurrences.types";

type Props = {
  item: RecurringItem | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function CancelRecurringDialog({ item, loading, onConfirm, onClose }: Props) {
  if (!item) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="anim-pop w-full max-w-[400px] rounded-[20px] border p-6 shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red/10 flex h-10 w-10 items-center justify-center rounded-[10px]">
              <AlertTriangle size={18} className="text-red" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-display text-text text-[15px] font-bold">Cancelar {item.description}?</h3>
              <p className="text-text-muted text-[12px]">{formatCurrency(item.value / 100)}/mês</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="bg-red/8 border-red/20 mb-5 rounded-[13px] border p-3.5">
          <p className="text-text-sub text-[13px] leading-relaxed">
            Ao cancelar, você vai economizar{" "}
            <span className="font-money text-green font-semibold">
              {formatCurrency((item.value * 12) / 100)}/ano
            </span>
            . Esta ação não cancela a assinatura no serviço — apenas remove o rastreamento daqui.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-surface2 hover:bg-surface3 text-text border-border flex-1 rounded-[13px] border py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50"
          >
            Manter assinatura
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red/15 hover:bg-red/25 text-red border-red/25 flex-1 rounded-[13px] border py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
