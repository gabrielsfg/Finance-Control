"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateSubCategory } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/lib/types/categories.types";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  defaultCategoryId?: number;
};

export function CreateSubCategoryModal({ open, onClose, categories, defaultCategoryId }: Props) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number>(defaultCategoryId ?? 0);
  const { mutate: create, isPending } = useCreateSubCategory();

  useEffect(() => {
    if (open) {
      setName("");
      setCategoryId(defaultCategoryId ?? categories[0]?.id ?? 0);
    }
  }, [open, defaultCategoryId, categories]);

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !categoryId) return;
    create({ name: name.trim(), categoryId }, { onSuccess: handleClose });
  };

  const userCategories = categories;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Nova subcategoria</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div>
            <label className="text-text-muted mb-1.5 block text-[12px]">Categoria pai</label>
            <select
              className={inputCls + " appearance-none cursor-pointer"}
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {userCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-text-muted mb-1.5 block text-[12px]">Nome</label>
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

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button size="sm" disabled={!name.trim() || !categoryId || isPending} onClick={handleSubmit}>
            {isPending ? "Criando..." : "Criar subcategoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
