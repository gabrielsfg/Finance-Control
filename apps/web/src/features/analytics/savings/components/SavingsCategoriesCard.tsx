"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, PiggyBank } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { cn } from "@/lib/utils";
import {
  useSubCategories,
  useSetSavingsSubCategories,
} from "@/features/transactions/hooks/useSubCategories";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

/**
 * Which subcategories are money kept rather than money gone. An "Aporte" is the obvious
 * one: it leaves the account like an expense, but counting it as spending reads the
 * month backwards — the more the user invested, the worse the savings rate looked.
 *
 * The set is edited whole and saved on demand rather than toggling one flag per click:
 * these figures reshape every number on the page, and a mis-click should be recoverable
 * with "Cancelar" instead of a second round trip.
 */
export function SavingsCategoriesCard() {
  const { data: subcategories = [], isLoading } = useSubCategories();
  const { mutateAsync, isPending } = useSetSavingsSubCategories();

  const savedSelection = useMemo(
    () => new Set(subcategories.filter((s) => s.isSavings).map((s) => s.id)),
    [subcategories],
  );
  const [draft, setDraft] = useState<Set<number> | null>(null);
  const selection = draft ?? savedSelection;

  const dirty =
    draft !== null &&
    (draft.size !== savedSelection.size || [...draft].some((id) => !savedSelection.has(id)));

  const groups = useMemo(() => {
    const byCategory = new Map<number, { name: string; color: string; items: SubCategoryItem[] }>();
    for (const sub of subcategories) {
      const group = byCategory.get(sub.categoryId) ?? {
        name: sub.categoryName,
        color: getCategoryColor(sub.categoryColor, sub.categoryName),
        items: [],
      };
      group.items.push(sub);
      byCategory.set(sub.categoryId, group);
    }
    return [...byCategory.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [subcategories]);

  function toggle(id: number) {
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDraft(next);
  }

  async function save() {
    if (!draft) return;
    await mutateAsync([...draft]);
    setDraft(null);
  }

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Categorias que contam como economia"
        subtitle="Gastos nelas viram dinheiro guardado, não despesa"
      />

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      ) : subcategories.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[var(--text-sub)]">
          Nenhuma subcategoria cadastrada.
        </p>
      ) : (
        <>
          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.name}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">
                    {group.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((sub) => {
                    const on = selection.has(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggle(sub.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors",
                          on
                            ? "border-[var(--moss)] bg-[color-mix(in_srgb,var(--moss)_14%,transparent)] text-[var(--text)]"
                            : "border-[var(--border-color)] bg-[var(--surface2)] text-[var(--text-sub)] hover:text-[var(--text)]",
                        )}
                      >
                        {on ? (
                          <Check size={11} strokeWidth={3} className="text-[var(--moss)]" />
                        ) : sub.emoji ? (
                          <span className="text-[11px]">{sub.emoji}</span>
                        ) : (
                          <span
                            className="h-1.5 w-1.5 rounded-full opacity-50"
                            style={{ backgroundColor: group.color }}
                          />
                        )}
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-3">
            <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-sub)]">
              <PiggyBank size={13} className="text-[var(--moss)]" />
              {selection.size === 0
                ? "Nenhuma marcada"
                : `${selection.size} ${selection.size === 1 ? "marcada" : "marcadas"}`}
            </p>
            {dirty && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDraft(null)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={save} disabled={isPending}>
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : "Salvar"}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
