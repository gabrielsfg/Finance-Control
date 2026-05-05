"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CategoryColorPicker } from "./CategoryColorPicker";
import { useCreateCategory } from "@/features/categories/hooks/useCategories";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type Props = { open: boolean; onClose: () => void };

export function CreateCategoryModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#00C98D");
  const { mutate: create, isPending } = useCreateCategory();

  const handleClose = () => {
    setName("");
    setColor("#00C98D");
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    create({ name: name.trim(), color }, { onSuccess: handleClose });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Nova categoria</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div>
            <label className="text-text-muted mb-1.5 block text-[12px]">Nome</label>
            <input
              className={inputCls}
              placeholder="Ex: Alimentação"
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
          <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button size="sm" disabled={!name.trim() || isPending} onClick={handleSubmit}>
            {isPending ? "Criando..." : "Criar categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
