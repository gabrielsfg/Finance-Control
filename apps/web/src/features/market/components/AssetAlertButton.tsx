"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, TrendingUp, TrendingDown, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/Money";
import type { AlertDirection } from "@/lib/types/alerts.types";
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
} from "@/features/market/hooks/useAlertRules";

export function AssetAlertButton({
  assetId,
  currentPrice,
}: {
  assetId: number;
  currentPrice: number; // cents
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: allAlerts = [] } = useAlertRules();
  const createAlert = useCreateAlertRule();
  const deleteAlert = useDeleteAlertRule();

  const [direction, setDirection] = useState<AlertDirection>("Above");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alerts = useMemo(
    () => allAlerts.filter((a) => a.marketAssetId === assetId),
    [allAlerts, assetId],
  );

  const activeCount = alerts.filter((a) => !a.isTriggered).length;

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const submit = async () => {
    setError(null);
    const value = parseFloat(price.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Informe um preço válido.");
      return;
    }
    try {
      await createAlert.mutateAsync({
        marketAssetId: assetId,
        direction,
        targetValue: Math.round(value * 100),
      });
      setPrice("");
    } catch {
      setError("Não foi possível criar o alerta. Talvez ele já exista.");
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1.5 rounded-[13px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
          open
            ? "border-[var(--brand-cobalt)] text-[var(--brand-accent)]"
            : "border-[var(--border-color)] text-[var(--text-sub)] hover:bg-[var(--surface2)] hover:text-[var(--text)]",
        )}
        style={
          open
            ? { background: "color-mix(in srgb, var(--brand-cobalt) 12%, transparent)" }
            : undefined
        }
      >
        <Bell size={13} strokeWidth={1.75} />
        Criar alerta
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-cobalt)] px-1 font-mono text-[9px] font-bold text-white">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, right: pos.right, boxShadow: "var(--shadow-sm)" }}
            className="fixed z-50 w-80 rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-4"
          >
            <div className="mb-1 flex items-center gap-2">
              <Bell size={14} className="text-[var(--brand-accent)]" strokeWidth={1.75} />
              <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">Alertas de preço</p>
            </div>
            <p className="mb-3 text-[12px] text-[var(--text-sub)]">
              Avisamos uma vez quando o preço cruzar o alvo. Cotação atual:{" "}
              <Money cents={currentPrice} className="text-[12px] text-[var(--text-sub)]" />
            </p>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex rounded-[13px] border border-[var(--border-color)] p-0.5">
                <button
                  type="button"
                  onClick={() => setDirection("Above")}
                  className={cn(
                    "flex items-center gap-1 rounded-[9px] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    direction === "Above"
                      ? "text-[var(--moss)]"
                      : "text-[var(--text-sub)] hover:text-[var(--text)]",
                  )}
                  style={
                    direction === "Above"
                      ? { background: "color-mix(in srgb, var(--moss) 14%, transparent)" }
                      : undefined
                  }
                >
                  <TrendingUp size={13} /> Acima de
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("Below")}
                  className={cn(
                    "flex items-center gap-1 rounded-[9px] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    direction === "Below"
                      ? "text-[var(--clay)]"
                      : "text-[var(--text-sub)] hover:text-[var(--text)]",
                  )}
                  style={
                    direction === "Below"
                      ? { background: "color-mix(in srgb, var(--clay) 14%, transparent)" }
                      : undefined
                  }
                >
                  <TrendingDown size={13} /> Abaixo de
                </button>
              </div>

              <div className="flex h-9 w-28 items-center gap-1 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 transition-colors focus-within:border-[var(--brand-cobalt)]">
                <span className="font-mono text-[12px] text-[var(--text-sub)]">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="0,00"
                  className="w-full bg-transparent font-mono text-[13px] tabular-nums text-[var(--text)] outline-none placeholder:text-[var(--text-sub)]"
                />
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={createAlert.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-[13px] bg-[var(--brand-cobalt)] px-3 text-[13px] font-semibold text-white transition-transform hover:-translate-y-[1px] disabled:opacity-50"
                style={{ boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
              >
                <Plus size={14} strokeWidth={2} />
                Criar
              </button>
            </div>

            {error && <p className="mt-2 text-[12px] text-[var(--clay)]">{error}</p>}

            {alerts.length > 0 && (
              <div className="mt-3 flex flex-col divide-y divide-[var(--border-color)] border-t border-[var(--border-color)] pt-1">
                {alerts.map((a) => {
                  const Icon = a.direction === "Above" ? TrendingUp : TrendingDown;
                  const color = a.direction === "Above" ? "text-[var(--moss)]" : "text-[var(--clay)]";
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2">
                      <Icon size={14} className={cn("shrink-0", color)} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-[13px] text-[var(--text)]">
                          {a.direction === "Above" ? "Acima de" : "Abaixo de"}{" "}
                          <Money cents={a.targetValue} className="text-[13px]" />
                        </p>
                        <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">
                          {a.isTriggered ? "Disparado" : "Ativo · aguardando"}
                        </p>
                      </div>
                      {!a.isTriggered && (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--moss)]"
                          style={{ background: "color-mix(in srgb, var(--moss) 15%, transparent)" }}
                        >
                          Ativo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteAlert.mutate(a.id)}
                        title="Remover alerta"
                        className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--clay)]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
