"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useCreateSubCategory } from "@/features/categories/hooks/useCategories";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { Category, SubCategory } from "@/lib/types/categories.types";
import { cn, includesNormalized } from "@/lib/utils";

const labelCls = "font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]";
const inputCls =
  "w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-shadow focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  defaultCategoryId?: number;
  zIndex?: number;
  /**
   * Hands back the subcategory that was just created, so a caller can act on it. The
   * import review selects it on the row that asked — creating a category mid-import
   * should not then mean hunting for it in the list.
   */
  onCreated?: (created: SubCategory) => void;
};

export function CreateSubCategoryModal({ open, onClose, categories, defaultCategoryId, zIndex, onCreated }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [categoryId, setCategoryId] = useState<number>(defaultCategoryId ?? 0);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { mutate: create, isPending } = useCreateSubCategory();

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const filteredCategories = categorySearch.trim()
    ? categories.filter((c) => includesNormalized(c.name, categorySearch))
    : categories;

  const backdropZ = zIndex ? zIndex - 1 : 40;
  const drawerZ = zIndex ?? 50;

  useEffect(() => {
    if (open) {
      setName("");
      setEmoji("");
      setCategoryId(defaultCategoryId ?? categories[0]?.id ?? 0);
      setCategoryDropdownOpen(false);
      setCategorySearch("");
    }
  }, [open, defaultCategoryId, categories]);

  useEffect(() => {
    if (categoryDropdownOpen) {
      setCategorySearch("");
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [categoryDropdownOpen]);

  useEffect(() => {
    if (!categoryDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryDropdownOpen]);

  const handleClose = () => {
    setName("");
    setEmoji("");
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || !categoryId) return;
    create(
      { name: trimmed, emoji: emoji || undefined, categoryId },
      {
        onSuccess: (updatedSubs) => {
          // The API answers with the whole list rather than the new row, so it is
          // identified by what was sent.
          const created = updatedSubs.find(
            (sub) => sub.categoryId === categoryId && sub.name === trimmed,
          );
          if (created) onCreated?.(created);
          handleClose();
        },
      },
    );
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{ zIndex: backdropZ }}
        className={cn(
          "fixed inset-0 transition-all duration-300",
          open ? "pointer-events-auto backdrop-blur-sm bg-black/40" : "pointer-events-none opacity-0",
        )}
      />

      <div
        style={{ zIndex: drawerZ, background: "var(--surface)", borderColor: "var(--border-color)" }}
        className={cn(
          "fixed inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Nova subcategoria</h2>
          <button
            onClick={handleClose}
            title="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Categoria pai</label>
              <button
                type="button"
                onClick={() => setShowCreateCategory(true)}
                className="flex items-center gap-1 text-[13px] text-[var(--text-sub)] transition-colors hover:text-[var(--brand-accent)]"
              >
                <Plus size={13} />
                Nova categoria
              </button>
            </div>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((o) => !o)}
                className={cn(
                  inputCls,
                  "flex items-center gap-2.5 text-left",
                  categoryDropdownOpen && "border-[var(--brand-cobalt)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]",
                )}
              >
                {selectedCategory && !categoryDropdownOpen ? (
                  <>
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getCategoryColor(selectedCategory.color, selectedCategory.name) }}
                    />
                    <span className="flex-1 truncate">{selectedCategory.name}</span>
                  </>
                ) : categoryDropdownOpen ? (
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setCategoryDropdownOpen(false); e.stopPropagation(); }
                      if (e.key === "Enter") {
                        const first = filteredCategories[0];
                        if (first) { setCategoryId(first.id); setCategoryDropdownOpen(false); }
                        e.preventDefault();
                      }
                    }}
                    placeholder="Buscar categoria..."
                    className="flex-1 bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                ) : (
                  <span className="flex-1 text-[var(--text-muted)]">Selecionar categoria</span>
                )}
                <ChevronDown size={14} className={cn("shrink-0 text-[var(--text-sub)] transition-transform", categoryDropdownOpen && "rotate-180")} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-10 w-full overflow-hidden rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] shadow-xl">
                  <div className="max-h-48 overflow-y-auto py-1">
                    {filteredCategories.length === 0 ? (
                      <p className="px-3.5 py-4 text-center text-[13px] text-[var(--text-muted)]">Nenhuma encontrada</p>
                    ) : (
                      filteredCategories.map((c) => {
                        const color = getCategoryColor(c.color, c.name);
                        const isSelected = c.id === categoryId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCategoryId(c.id); setCategoryDropdownOpen(false); }}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] transition-colors",
                              isSelected ? "bg-[var(--surface2)] text-[var(--text)]" : "text-[var(--text-sub)] hover:bg-[var(--surface2)] hover:text-[var(--text)]",
                            )}
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                            <span className="flex-1 truncate">{c.name}</span>
                            {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-accent)]" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
            <Button className="flex-1" disabled={!name.trim() || !categoryId || isPending} onClick={handleSubmit}>
              {isPending ? "Criando..." : "Criar subcategoria"}
            </Button>
          </div>
        </div>
      </div>

      <CreateCategoryModal
        open={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        zIndex={(zIndex ?? 50) + 10}
      />
    </>
  );
}
