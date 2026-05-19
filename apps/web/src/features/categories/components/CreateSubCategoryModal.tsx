"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useCreateSubCategory } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/lib/types/categories.types";
import { cn } from "@/lib/utils";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-10 px-3.5 text-[14px] outline-none focus:border-green/60 transition-colors";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  defaultCategoryId?: number;
};

export function CreateSubCategoryModal({ open, onClose, categories, defaultCategoryId }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [categoryId, setCategoryId] = useState<number>(defaultCategoryId ?? 0);
  const { mutate: create, isPending } = useCreateSubCategory();

  useEffect(() => {
    if (open) {
      setName("");
      setEmoji("");
      setCategoryId(defaultCategoryId ?? categories[0]?.id ?? 0);
    }
  }, [open, defaultCategoryId, categories]);

  const handleClose = () => {
    setName("");
    setEmoji("");
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !categoryId) return;
    create(
      { name: name.trim(), emoji: emoji || undefined, categoryId },
      { onSuccess: handleClose },
    );
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto backdrop-blur-sm bg-black/40" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className={cn(
          "bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <h2 className="font-display font-600 text-text text-[17px]">Nova subcategoria</h2>
          <button
            onClick={handleClose}
            title="Fechar"
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-2">
            <label className="text-text-sub text-[14px]">Categoria pai</label>
            <select
              className={inputCls + " appearance-none cursor-pointer"}
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
            <label className="text-text-sub text-[14px]">Nome</label>
            <div className="flex items-center gap-2">
              {emoji && (
                <span className="border-border bg-surface2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[20px]">
                  {emoji}
                </span>
              )}
              <input
                className={inputCls}
                placeholder="Ex: Restaurantes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-text-sub text-[14px]">Ícone</label>
              {emoji && (
                <button
                  type="button"
                  onClick={() => setEmoji("")}
                  className="text-text-muted hover:text-red text-[12px] transition-colors"
                >
                  Remover
                </button>
              )}
            </div>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-border shrink-0 border-t px-6 py-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
            <Button className="flex-1" disabled={!name.trim() || !categoryId || isPending} onClick={handleSubmit}>
              {isPending ? "Criando..." : "Criar subcategoria"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
