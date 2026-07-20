"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteCategory } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/lib/types/categories.types";

type Props = {
  category: Category | null;
  onClose: () => void;
};

export const DeleteCategoryModal = ({ category, onClose }: Props) => {
  const { mutate, isPending } = useDeleteCategory();

  const handleConfirm = () => {
    if (!category) return;
    mutate(category.id, { onSuccess: onClose });
  };

  return (
    <Dialog open={!!category} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--text)]">
            Excluir categoria
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          <div
            className="flex items-start gap-3 rounded-[13px] border p-3"
            style={{
              background: "color-mix(in srgb, var(--clay) 8%, transparent)",
              borderColor: "color-mix(in srgb, var(--clay) 22%, transparent)",
            }}
          >
            <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[var(--clay)]" />
            <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">
              Excluir{" "}
              <span className="font-medium text-[var(--text)]">{category?.name}</span> irá
              remover todas as subcategorias vinculadas. Esta ação não pode ser
              desfeita.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : "Excluir categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
