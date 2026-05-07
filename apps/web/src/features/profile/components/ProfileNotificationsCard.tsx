"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type NotifRow = {
  key: string;
  label: string;
  sub: string;
};

const ROWS: NotifRow[] = [
  { key: "budget",   label: "Orçamento estourado",    sub: "Alerta quando ultrapassar o limite de uma categoria" },
  { key: "invoice",  label: "Vencimento de faturas",  sub: "Lembrete 3 dias antes do vencimento" },
  { key: "ai",       label: "Insights da IA",         sub: "Card diário com análise personalizada" },
];

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

export const ProfileNotificationsCard = () => {
  const [values, setValues] = useState<Record<string, boolean>>({
    budget: true,
    invoice: true,
    ai: false,
  });

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-display font-600 text-text mb-1 text-[15px]">Notificações</p>

      <div className="flex flex-col divide-y divide-border/50">
        {ROWS.map(({ key, label, sub }) => (
          <div key={key} className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">{label}</p>
              <p className="text-text-muted mt-0.5 text-[11px]">{sub}</p>
            </div>
            <Toggle value={values[key]} onChange={(v) => setValues((s) => ({ ...s, [key]: v }))} />
          </div>
        ))}
      </div>
    </div>
  );
};
