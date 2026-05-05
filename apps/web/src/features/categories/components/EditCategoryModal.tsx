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
import { CategoryColorPicker } from "./CategoryColorPicker";
import { useUpdateCategory } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/lib/types/categories.types";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type Props = { category: Category | null; onClose: () => void };

export function EditCategoryModal({ category, onClose }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#00C98D");
  const { mutate: update, isPending } = useUpdateCategory();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color ?? "#00C98D");
    }
  }, [category]);

  const handleSubmit = () => {
    if (!category || !name.trim()) return;
    update(
      { id: category.id, name: name.trim(), color },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={!!category} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Editar categoria</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
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

          <div>
            <label className="text-text-muted mb-2 block text-[12px]">Cor</label>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 shrink-0 rounded-full border-2 border-white/10"
                style={{ backgroundColor: color }}
              />
              <CategoryColorPicker value={color} onChange={setColor} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!name.trim() || isPending} onClick={handleSubmit}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
