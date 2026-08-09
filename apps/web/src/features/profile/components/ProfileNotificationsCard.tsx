"use client";

import { useEffect, useState } from "react";
import { Card, CardHead } from "@/components/shared/Card";
import { Switch } from "@/components/shared/Switch";
import { cn } from "@/lib/utils";
import type { NotificationPreferences } from "@/lib/types/notifications.types";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/useNotifications";

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
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-1.5 transition-[border-color,box-shadow] focus-within:border-[var(--brand-cobalt)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]">
        <input
          type="number"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-12 border-0 bg-transparent text-center font-mono text-[14px] tabular-nums text-[var(--text)] outline-none"
        />
      </div>
      <span className="font-mono text-[12px] text-[var(--text-sub)]">{suffix}</span>
    </div>
  );
}

function SettingRow({
  name,
  desc,
  control,
  extra,
  last,
}: {
  name: string;
  desc: string;
  control: React.ReactNode;
  extra?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("py-[15px]", !last && "border-b border-[var(--border-color)]")}>
      <div className="flex items-center gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--text)]">{name}</div>
          <div className="mt-0.5 text-[13px] text-[var(--text-sub)]">{desc}</div>
        </div>
        {control}
      </div>
      {extra}
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
    <Card>
      <CardHead title="Notificações" subtitle="Resumo de faturas, metas e vencimentos" />

      {isLoading || !prefs ? (
        <p className="py-6 text-center font-mono text-[13px] text-[var(--text-sub)]">Carregando…</p>
      ) : (
        <div className="flex flex-col">
          {/* Recurrence charged */}
          <SettingRow
            name="Cobrança de recorrência"
            desc="Avisa quando uma transação recorrente é gerada"
            control={
              <Switch
                value={prefs.recurrenceChargedEnabled}
                onChange={(v) => set({ recurrenceChargedEnabled: v })}
              />
            }
          />

          {/* Card due */}
          <SettingRow
            name="Vencimento da fatura"
            desc="Lembrete antes do vencimento do cartão"
            control={<Switch value={prefs.cardDueEnabled} onChange={(v) => set({ cardDueEnabled: v })} />}
            extra={
              prefs.cardDueEnabled && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-sub)]">Avisar com antecedência de</span>
                  <NumberField
                    value={prefs.cardDueDaysAhead}
                    suffix="dias"
                    min={0}
                    max={30}
                    onCommit={(v) => set({ cardDueDaysAhead: v })}
                  />
                </div>
              )
            }
          />

          {/* Card closing */}
          <SettingRow
            name="Fechamento da fatura"
            desc="Lembrete antes da fatura fechar"
            control={
              <Switch value={prefs.cardClosingEnabled} onChange={(v) => set({ cardClosingEnabled: v })} />
            }
            extra={
              prefs.cardClosingEnabled && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-sub)]">Avisar com antecedência de</span>
                  <NumberField
                    value={prefs.cardClosingDaysAhead}
                    suffix="dias"
                    min={0}
                    max={30}
                    onCommit={(v) => set({ cardClosingDaysAhead: v })}
                  />
                </div>
              )
            }
          />

          {/* Budget alert */}
          <SettingRow
            name="Alertas de orçamento"
            desc="Avisa ao se aproximar e ao estourar o orçamento"
            last
            control={
              <Switch value={prefs.budgetAlertEnabled} onChange={(v) => set({ budgetAlertEnabled: v })} />
            }
            extra={
              prefs.budgetAlertEnabled && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-sub)]">Alertar ao atingir</span>
                  <NumberField
                    value={prefs.budgetWarningPercent}
                    suffix="%"
                    min={1}
                    max={100}
                    onCommit={(v) => set({ budgetWarningPercent: v })}
                  />
                </div>
              )
            }
          />
        </div>
      )}
    </Card>
  );
};
