"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useUpdateSubCategory } from "@/features/categories/hooks/useCategories";
import type { Category, SubCategory } from "@/lib/types/categories.types";
import { cn } from "@/lib/utils";

const labelCls = "font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]";
const inputCls =
  "w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-shadow focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

type Props = {
  subCategory: SubCategory | null;
  onClose: () => void;
  categories: Category[];
};

export function EditSubCategoryModal({ subCategory, onClose, categories }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const { mutate: update, isPending } = useUpdateSubCategory();

  useEffect(() => {
    if (subCategory) {
      setName(subCategory.name);
      setEmoji(subCategory.emoji ?? "");
      setCategoryId(subCategory.categoryId);
    }
  }, [subCategory]);

  const handleSubmit = () => {
    if (!subCategory || !name.trim() || !categoryId) return;
    update(
      { id: subCategory.id, data: { name: name.trim(), emoji: emoji || undefined, categoryId } },
      { onSuccess: onClose },
    );
  };

  const open = !!subCategory;

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
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Editar subcategoria</h2>
          <button
            onClick={onClose}
            title="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Categoria pai</label>
            <select
              className={cn(inputCls, "cursor-pointer appearance-none")}
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Nome</label>
            <div className="flex items-center gap-2">
              {emoji && (
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] text-[20px]">
                  {emoji}
                </span>
              )}
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Ícone</label>
              {emoji && (
                <button
                  type="button"
                  onClick={() => setEmoji("")}
                  className="text-[12px] text-[var(--text-sub)] transition-colors hover:text-[var(--clay)]"
                >
                  Remover
                </button>
              )}
            </div>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--border-color)] px-6 py-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" disabled={!name.trim() || !categoryId || isPending} onClick={handleSubmit}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
