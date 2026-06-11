"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { NotificationPreferences } from "@/lib/types/notifications.types";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/useNotifications";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-[22px] w-10 shrink-0 rounded-full border transition-all",
        value ? "border-green bg-green" : "border-border bg-surface3",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all",
          value ? "left-[20px]" : "left-[2px]",
        )}
      />
    </button>
  );
}

// Compact numeric stepper that commits on blur to avoid a request per keystroke.
function NumberField({
  value,
  suffix,
  min,
  max,
  onCommit,
}: {
  value: number;
  suffix: string;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft);
    const clamped = Math.min(max, Math.max(min, Number.isFinite(parsed) ? parsed : value));
    if (clamped !== value) onCommit(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="border-border bg-surface2 text-text h-8 w-14 rounded-lg border px-2 text-[13px] outline-none focus:border-green/60"
      />
      <span className="text-text-muted text-[12px]">{suffix}</span>
    </div>
  );
}

export const ProfileNotificationsCard = () => {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const set = (partial: Partial<NotificationPreferences>) => {
    if (!prefs) return;
    update.mutate({ ...prefs, ...partial });
  };

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-display font-600 text-text mb-1 text-[15px]">Notificações</p>

      {isLoading || !prefs ? (
        <p className="text-text-muted py-6 text-center text-[13px]">Carregando…</p>
      ) : (
        <div className="divide-border/50 flex flex-col divide-y">
          {/* Recurrence charged */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Cobrança de recorrência</p>
              <p className="text-text-muted mt-0.5 text-[11px]">
                Avisa quando uma transação recorrente é gerada
              </p>
            </div>
            <Toggle
              value={prefs.recurrenceChargedEnabled}
              onChange={(v) => set({ recurrenceChargedEnabled: v })}
            />
          </div>

          {/* Card due */}
          <div className="py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text text-[13px] font-medium">Vencimento da fatura</p>
                <p className="text-text-muted mt-0.5 text-[11px]">
                  Lembrete antes do vencimento do cartão
                </p>
              </div>
              <Toggle value={prefs.cardDueEnabled} onChange={(v) => set({ cardDueEnabled: v })} />
            </div>
            {prefs.cardDueEnabled && (
              <div className="mt-3 flex items-center justify-between pl-0.5">
                <span className="text-text-sub text-[12px]">Avisar com antecedência de</span>
                <NumberField
                  value={prefs.cardDueDaysAhead}
                  suffix="dias"
                  min={0}
                  max={30}
                  onCommit={(v) => set({ cardDueDaysAhead: v })}
                />
              </div>
            )}
          </div>

          {/* Card closing */}
          <div className="py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text text-[13px] font-medium">Fechamento da fatura</p>
                <p className="text-text-muted mt-0.5 text-[11px]">
                  Lembrete antes da fatura fechar
                </p>
              </div>
              <Toggle
                value={prefs.cardClosingEnabled}
                onChange={(v) => set({ cardClosingEnabled: v })}
              />
            </div>
            {prefs.cardClosingEnabled && (
              <div className="mt-3 flex items-center justify-between pl-0.5">
                <span className="text-text-sub text-[12px]">Avisar com antecedência de</span>
                <NumberField
                  value={prefs.cardClosingDaysAhead}
                  suffix="dias"
                  min={0}
                  max={30}
                  onCommit={(v) => set({ cardClosingDaysAhead: v })}
                />
              </div>
            )}
          </div>

          {/* Budget alert */}
          <div className="py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text text-[13px] font-medium">Alertas de orçamento</p>
                <p className="text-text-muted mt-0.5 text-[11px]">
                  Avisa ao se aproximar e ao estourar o orçamento
                </p>
              </div>
              <Toggle
                value={prefs.budgetAlertEnabled}
                onChange={(v) => set({ budgetAlertEnabled: v })}
              />
            </div>
            {prefs.budgetAlertEnabled && (
              <div className="mt-3 flex items-center justify-between pl-0.5">
                <span className="text-text-sub text-[12px]">Alertar ao atingir</span>
                <NumberField
                  value={prefs.budgetWarningPercent}
                  suffix="%"
                  min={1}
                  max={100}
                  onCommit={(v) => set({ budgetWarningPercent: v })}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
