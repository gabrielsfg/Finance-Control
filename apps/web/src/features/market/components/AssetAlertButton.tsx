"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, TrendingUp, TrendingDown, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
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
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
          open
            ? "border-purple/40 bg-purple/10 text-purple"
            : "border-border text-text-muted hover:border-border hover:bg-surface2 hover:text-text",
        )}
      >
        <Bell size={13} strokeWidth={1.75} />
        Criar Alerta
        {activeCount > 0 && (
          <span className="bg-purple flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, right: pos.right }}
            className="border-border bg-surface fixed z-50 w-80 rounded-xl border p-4 shadow-xl"
          >
            <div className="mb-1 flex items-center gap-2">
              <Bell size={14} className="text-purple" strokeWidth={1.75} />
              <p className="font-display font-600 text-text text-[14px]">Alertas de preço</p>
            </div>
            <p className="text-text-muted mb-3 text-[12px]">
              Avisamos uma vez quando o preço cruzar o alvo. Cotação atual:{" "}
              <span className="font-money text-text-sub">
                {formatCurrency(currentPrice / 100)}
              </span>
            </p>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setDirection("Above")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    direction === "Above"
                      ? "bg-green/15 text-green"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  <TrendingUp size={13} /> Acima de
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("Below")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    direction === "Below"
                      ? "bg-red/15 text-red"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  <TrendingDown size={13} /> Abaixo de
                </button>
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="0,00"
                className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-28 rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
              />

              <button
                type="button"
                onClick={submit}
                disabled={createAlert.isPending}
                className="bg-green hover:bg-green/90 font-600 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-black transition-colors disabled:opacity-50"
              >
                <Plus size={14} strokeWidth={2} />
                Criar
              </button>
            </div>

            {error && <p className="text-red mt-2 text-[12px]">{error}</p>}

            {alerts.length > 0 && (
              <div className="border-border/60 mt-3 flex flex-col divide-y divide-border/50 border-t pt-1">
                {alerts.map((a) => {
                  const Icon = a.direction === "Above" ? TrendingUp : TrendingDown;
                  const color = a.direction === "Above" ? "text-green" : "text-red";
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2">
                      <Icon size={14} className={cn("shrink-0", color)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-text text-[13px]">
                          {a.direction === "Above" ? "Acima de" : "Abaixo de"}{" "}
                          <span className="font-money">{formatCurrency(a.targetValue / 100)}</span>
                        </p>
                        <p className="text-text-muted text-[11px]">
                          {a.isTriggered ? "Disparado" : "Ativo · aguardando"}
                        </p>
                      </div>
                      {!a.isTriggered && (
                        <span className="bg-green/15 text-green rounded-full px-2 py-0.5 text-[10px] font-medium">
                          Ativo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteAlert.mutate(a.id)}
                        title="Remover alerta"
                        className="text-text-muted hover:text-red hover:bg-surface2 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
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
