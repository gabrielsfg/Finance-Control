"use client";

import { useMemo, useState } from "react";
import { Hash, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTags, useDeleteTag } from "@/features/transactions/hooks/useTags";
import { EditTagModal } from "@/features/categories/components/EditTagModal";
import { includesNormalized } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TagItem } from "@/lib/types/tags.types";

/**
 * Every tag the user has, in one place. Tags are created inline while writing a
 * transaction, which is convenient right up to the first typo — until now a misspelled
 * tag could only be fixed by re-tagging each transaction by hand.
 */
export function TagsPanel({ search }: { search: string }) {
  const { data: tags = [], isLoading } = useTags();
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [deleting, setDeleting] = useState<TagItem | null>(null);
  const { mutateAsync: removeTag, isPending: isDeleting } = useDeleteTag();

  const visible = useMemo(() => {
    const q = search.trim();
    if (!q) return tags;
    return tags.filter((t) => includesNormalized(t.name, q));
  }, [tags, search]);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await removeTag(deleting.id);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <section
        className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[22px]"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--text)]">
            Tags
          </h3>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">
            {tags.length} {tags.length === 1 ? "tag" : "tags"}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-16 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
          </div>
        ) : tags.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[var(--text-sub)]">
            Nenhuma tag ainda. Elas são criadas ao marcar uma transação.
          </p>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[var(--text-sub)]">
            Nenhuma tag encontrada para{" "}
            <span className="font-medium text-[var(--text)]">“{search.trim()}”</span>.
          </p>
        ) : (
          <div className="grid grid-cols-12 gap-2.5">
            {visible.map((tag) => {
              const count = tag.transactionCount ?? 0;
              return (
                <div
                  key={tag.id}
                  className="col-span-12 flex items-center gap-2.5 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] px-3.5 py-2.5 sm:col-span-6 xl:col-span-4"
                >
                  <Hash size={14} className="shrink-0 text-[var(--brand-accent)]" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--text)]">
                    {tag.name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-sub)]">
                    {count}
                  </span>
                  <button
                    onClick={() => setEditing(tag)}
                    title="Editar tag"
                    className="shrink-0 text-[var(--text-sub)] transition-colors hover:text-[var(--brand-accent)]"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleting(tag)}
                    disabled={count > 0}
                    title={
                      count > 0
                        ? "Tags em uso não podem ser excluídas — renomeie ou una com outra"
                        : "Excluir tag"
                    }
                    className="shrink-0 text-[var(--text-sub)] transition-colors hover:text-[var(--clay)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-[var(--text-sub)]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EditTagModal tag={editing} onClose={() => setEditing(null)} />

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-[16px]">Excluir tag</DialogTitle>
            <DialogDescription className="text-text-sub text-[14px]">
              Excluir a tag “{deleting?.name}”? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
