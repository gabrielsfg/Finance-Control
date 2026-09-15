"use client";

import { useState } from "react";
import { X, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateTag } from "@/features/transactions/hooks/useTags";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/lib/types/tags.types";

const labelCls = "font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]";
const inputCls =
  "w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-shadow focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

type Props = { tag: TagItem | null; onClose: () => void };

/**
 * Renaming is a rename, not a re-tag: every transaction marked with the tag keeps it,
 * which is the point of fixing a typo here instead of editing each transaction. The one
 * case needing a decision is a name another tag already answers to — the API refuses it
 * and the user is offered the merge instead of a dead end.
 */
export function EditTagModal({ tag, onClose }: Props) {
  const open = tag !== null;

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto backdrop-blur-sm bg-black/40" : "pointer-events-none opacity-0",
        )}
      />

      <div
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">
            Editar tag
          </h2>
          <button
            onClick={onClose}
            title="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Keyed so each tag opens its own form instead of inheriting the last one's state. */}
        {tag && <TagForm key={tag.id} tag={tag} onClose={onClose} />}
      </div>
    </>
  );
}

function TagForm({ tag, onClose }: { tag: TagItem; onClose: () => void }) {
  const [name, setName] = useState(tag.name);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateTag();

  const trimmed = name.trim();
  const count = tag.transactionCount ?? 0;

  async function save(merge: boolean) {
    if (!trimmed) return;
    setError(null);
    try {
      await mutateAsync({ id: tag.id, data: { name: trimmed, merge } });
      onClose();
    } catch (err) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 409) {
        setConflict(true);
        return;
      }
      setError("Erro ao salvar a tag. Tente novamente.");
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-2">
          <label className={labelCls}>Nome</label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setConflict(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && !conflict && save(false)}
            autoFocus
          />
          <p className="text-[12.5px] text-[var(--text-sub)]">
            {count > 0
              ? `${count} transaç${count === 1 ? "ão continua marcada" : "ões continuam marcadas"} com esta tag.`
              : "Esta tag ainda não marca nenhuma transação."}
          </p>
        </div>

        {conflict && (
          <div className="rounded-[13px] border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-[var(--text)]">
              <Merge size={14} />
              Já existe uma tag “{trimmed}”
            </div>
            <p className="text-[12.5px] text-[var(--text-sub)]">
              Unir as duas move as transações de “{tag.name}” para “{trimmed}” e apaga a tag
              antiga. Não dá para desfazer.
            </p>
            <Button
              variant="outline"
              className="mt-3 w-full"
              disabled={isPending}
              onClick={() => save(true)}
            >
              {isPending ? "Unindo..." : "Unir as duas tags"}
            </Button>
          </div>
        )}

        {error && <p className="text-red text-[13px]">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-[var(--border-color)] px-6 py-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!trimmed || isPending || conflict || trimmed === tag.name}
            onClick={() => save(false)}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </>
  );
}
