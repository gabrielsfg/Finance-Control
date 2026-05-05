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
import { useUpdateSubCategory } from "@/features/categories/hooks/useCategories";
import type { Category, SubCategory } from "@/lib/types/categories.types";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type Props = {
  subCategory: SubCategory | null;
  onClose: () => void;
  categories: Category[];
};

export function EditSubCategoryModal({ subCategory, onClose, categories }: Props) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const { mutate: update, isPending } = useUpdateSubCategory();

  useEffect(() => {
    if (subCategory) {
      setName(subCategory.name);
      setCategoryId(subCategory.categoryId);
    }
  }, [subCategory]);

  const handleSubmit = () => {
    if (!subCategory || !name.trim() || !categoryId) return;
    update(
      { id: subCategory.id, data: { name: name.trim(), categoryId } },
      { onSuccess: onClose },
    );
  };

  const userCategories = categories;

  return (
    <Dialog open={!!subCategory} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Editar subcategoria</DialogTitle>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!name.trim() || !categoryId || isPending} onClick={handleSubmit}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
