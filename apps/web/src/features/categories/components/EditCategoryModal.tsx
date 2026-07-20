"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryColorPicker } from "./CategoryColorPicker";
import { useUpdateCategory } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/lib/types/categories.types";
import { cn } from "@/lib/utils";

const labelCls = "font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]";
const inputCls =
  "w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-shadow focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

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

  const open = !!category;

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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Editar categoria</h2>
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
            <label className={labelCls}>Nome</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Cor</label>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 shrink-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: "inset 0 0 0 2px color-mix(in srgb, var(--text) 10%, transparent)" }}
              />
              <CategoryColorPicker value={color} onChange={setColor} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--border-color)] px-6 py-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" disabled={!name.trim() || isPending} onClick={handleSubmit}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
