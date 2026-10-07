"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X, Target, Receipt, PieChart, Clock, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { cn } from "@/lib/utils";
import { useCancelAction, useConfirmAction } from "../hooks/useAssistant";
import { getApiErrorMessage } from "../utils/apiError";
import type { AiAction, AiActionKind } from "@/lib/types/assistant.types";

const KIND_CONFIG: Record<AiActionKind, { label: string; icon: LucideIcon }> = {
  CreateTransaction: { label: "Nova transação", icon: Receipt },
  UpdateTransaction: { label: "Editar transação", icon: Receipt },
  CreateGoal: { label: "Nova meta", icon: Target },
  CreateBudget: { label: "Novo orçamento", icon: PieChart },
};

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted h-9 w-full rounded-lg border px-3 text-[13px] outline-none focus:border-[var(--brand-cobalt)]";

/** Which payload fields the card lets the user change, and what they are called. */
type EditableFields = {
  text: { key: string; label: string };
  money: { key: string; label: string };
  date: { key: string; label: string };
};

const EDITABLE: Partial<Record<AiActionKind, EditableFields>> = {
  CreateTransaction: {
    text: { key: "description", label: "Descrição" },
    money: { key: "value", label: "Valor" },
    date: { key: "transactionDate", label: "Data" },
  },
  UpdateTransaction: {
    text: { key: "description", label: "Descrição" },
    money: { key: "value", label: "Valor" },
    date: { key: "transactionDate", label: "Data" },
  },
  CreateGoal: {
    text: { key: "name", label: "Nome" },
    money: { key: "targetAmount", label: "Valor da meta" },
    date: { key: "targetDate", label: "Data alvo" },
  },
};

type Draft = { text: string; money: string; date: string };

const centsToInput = (value: unknown) =>
  typeof value === "number" && value > 0 ? (value / 100).toFixed(2) : "";

const toDraft = (action: AiAction, fields: EditableFields): Draft => ({
  text: String(action.payload[fields.text.key] ?? ""),
  money: centsToInput(action.payload[fields.money.key]),
  date: String(action.payload[fields.date.key] ?? "").slice(0, 10),
});

/**
 * A proposal the assistant prepared. Nothing is written until the user confirms, and the
 * main fields can be corrected in place first — the edited payload goes back in the same
 * shape and through the same validators as a form would.
 */
export function ActionCard({ action, conversationId }: { action: AiAction; conversationId: number }) {
  const confirm = useConfirmAction(conversationId);
  const cancel = useCancelAction(conversationId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Read once: the card only needs to know whether it was already stale when it
  // appeared. The API refuses a late confirm anyway, and says so.
  const [openedAt] = useState(() => Date.now());

  const fields = EDITABLE[action.kind];
  const expired =
    action.status === "Expired" ||
    (action.status === "Pending" && new Date(action.expiresAt).getTime() < openedAt);
  const pending = action.status === "Pending" && !expired;
  const busy = confirm.isPending || cancel.isPending;

  const { label, icon: Icon } = KIND_CONFIG[action.kind];

  const startEditing = () => {
    if (!fields) return;
    setDraft(toDraft(action, fields));
    setEditing(true);
    setError(null);
  };

  const buildPayload = (): Record<string, unknown> | null => {
    if (!editing || !fields || !draft) return null;
    const cents = Math.round(parseFloat(draft.money || "0") * 100);
    return {
      ...action.payload,
      [fields.text.key]: draft.text.trim(),
      [fields.money.key]: cents,
      [fields.date.key]: draft.date,
    };
  };

  const handleConfirm = () => {
    if (editing && draft) {
      if (!draft.text.trim()) return setError(`Preencha ${fields?.text.label.toLowerCase()}.`);
      if (!draft.money || parseFloat(draft.money) <= 0) return setError("Informe um valor maior que zero.");
      if (!draft.date) return setError("Escolha uma data.");
    }
    setError(null);
    confirm.mutate(
      { id: action.id, payload: buildPayload() },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => setError(getApiErrorMessage(err, "Não foi possível salvar. Tente novamente.")),
      },
    );
  };

  const handleCancel = () => {
    setError(null);
    cancel.mutate(action.id, {
      onError: (err) => setError(getApiErrorMessage(err, "Não foi possível cancelar. Tente novamente.")),
    });
  };

  const muted = action.status === "Cancelled" || expired;

  return (
    <div
      className={cn(
        "rounded-[13px] border p-3.5 transition-opacity",
        muted && "opacity-60",
      )}
      style={{
        borderColor:
          action.status === "Confirmed"
            ? "color-mix(in srgb, var(--moss) 40%, transparent)"
            : "var(--border-color)",
        background:
          action.status === "Confirmed"
            ? "color-mix(in srgb, var(--moss) 7%, var(--surface))"
            : "var(--surface)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={13} className="shrink-0 text-[var(--brand-accent)]" />
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-[var(--text-sub)] uppercase">
          {label}
        </span>
        <StatusBadge status={action.status} expired={expired} />
      </div>

      <p className="mb-2 text-[13.5px] font-semibold text-[var(--text)]">{action.preview.title}</p>

      {editing && fields && draft ? (
        <div className="flex flex-col gap-2.5">
          <Field label={fields.text.label}>
            <input
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              maxLength={200}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={fields.money.label}>
            <CurrencyInput
              value={draft.money}
              onChange={(money) => setDraft({ ...draft, money })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={fields.date.label}>
            <DatePickerField value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
          </Field>
        </div>
      ) : (
        <dl className="flex flex-col gap-1">
          {action.preview.lines.map((line, index) => (
            <div key={index} className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <dt className="shrink-0 text-[var(--text-sub)]">{line.label}</dt>
              <dd className="min-w-0 text-right text-[var(--text)]">{line.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(error || (action.status === "Failed" && action.error)) && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[12px] text-[var(--clay)]">
          <TriangleAlert size={12} className="mt-[2px] shrink-0" />
          {error ?? action.error}
        </p>
      )}

      {pending && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand-cobalt)" }}
          >
            {confirm.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Confirmar
          </button>
          {fields && !editing && (
            <button
              onClick={startEditing}
              disabled={busy}
              className="border-border inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface2)] disabled:opacity-50"
            >
              <Pencil size={12} />
              Editar
            </button>
          )}
          <button
            onClick={editing ? () => setEditing(false) : handleCancel}
            disabled={busy}
            className="border-border inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[13px] font-medium text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-50"
          >
            {cancel.isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            {editing ? "Desfazer" : "Cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-medium text-[var(--text-sub)]">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status, expired }: { status: AiAction["status"]; expired: boolean }) {
  if (status === "Confirmed") {
    return (
      <span
        className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.06em]"
        style={{ color: "var(--moss)", background: "color-mix(in srgb, var(--moss) 14%, transparent)" }}
      >
        <Check size={10} strokeWidth={2.4} />
        Salvo
      </span>
    );
  }
  if (status === "Cancelled" || expired) {
    return (
      <span className="ml-auto flex items-center gap-1 rounded-full bg-[var(--surface2)] px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-[var(--text-sub)]">
        {expired ? <Clock size={10} /> : <X size={10} />}
        {expired ? "Expirado" : "Cancelado"}
      </span>
    );
  }
  if (status === "Failed") {
    return (
      <span
        className="ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.06em]"
        style={{ color: "var(--clay)", background: "color-mix(in srgb, var(--clay) 12%, transparent)" }}
      >
        Falhou
      </span>
    );
  }
  return null;
}
