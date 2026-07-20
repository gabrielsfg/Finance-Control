"use client";

import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { cn } from "@/lib/utils";
import type { Category, SubCategory } from "@/lib/types/categories.types";

type Props = {
  category: Category;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onCreateSub: (categoryId: number) => void;
  onEditSub: (sub: SubCategory) => void;
  onDeleteSub: (sub: SubCategory) => void;
};

/** Small ghost icon button used in the card header / sub chips. */
function IconButton({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors",
        danger ? "hover:bg-[color-mix(in_srgb,var(--clay)_14%,transparent)] hover:text-[var(--clay)]" : "hover:bg-[var(--surface2)] hover:text-[var(--text)]",
      )}
    >
      {children}
    </button>
  );
}

export const CategoryCard = ({
  category,
  onEditCategory,
  onDeleteCategory,
  onCreateSub,
  onEditSub,
  onDeleteSub,
}: Props) => {
  const color = getCategoryColor(category.color, category.name);
  const subs = category.subCategories;
  const hasSubs = subs.length > 0;

  return (
    <div
      className="group flex flex-col rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[22px] transition-shadow hover:shadow-[var(--shadow-sm)]"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header — color tile + name + sub count, actions on hover */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
        >
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--text)]">
              {category.name}
            </h3>
            {category.isSystem && (
              <Lock size={11} className="shrink-0 text-[var(--text-muted)]" aria-label="Categoria do sistema" />
            )}
          </div>
          <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">
            {subs.length} subcategoria{subs.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <IconButton title="Nova subcategoria" onClick={() => onCreateSub(category.id)}>
            <Plus size={14} />
          </IconButton>
          <IconButton title="Editar categoria" onClick={() => onEditCategory(category)}>
            <Pencil size={13} />
          </IconButton>
          <IconButton title="Excluir categoria" danger onClick={() => onDeleteCategory(category)}>
            <Trash2 size={13} />
          </IconButton>
        </div>
      </div>

      {/* Subcategory chips */}
      <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
        {hasSubs ? (
          subs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onEditSub(sub)}
              onContextMenu={(e) => {
                e.preventDefault();
                onDeleteSub(sub);
              }}
              title={`Editar ${sub.name}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--surface2)] px-[11px] py-[5px] text-[12.5px] text-[var(--text-sub)] transition-colors hover:border-[color-mix(in_srgb,var(--brand-accent)_38%,var(--border-color))] hover:text-[var(--text)]"
            >
              {sub.emoji ? (
                <span className="text-[13px] leading-none">{sub.emoji}</span>
              ) : (
                <span
                  className="h-2 w-2 rounded-full opacity-70"
                  style={{ background: color }}
                />
              )}
              {sub.name}
            </button>
          ))
        ) : (
          <p className="text-[13px] text-[var(--text-sub)]">
            Nenhuma subcategoria.{" "}
            <button
              type="button"
              onClick={() => onCreateSub(category.id)}
              className="font-medium text-[var(--brand-accent)] hover:underline"
            >
              Criar uma
            </button>
          </p>
        )}
      </div>

      {/* Add subcategory footer */}
      <button
        type="button"
        onClick={() => onCreateSub(category.id)}
        className="mt-4 inline-flex items-center gap-1.5 self-start font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)] transition-colors hover:text-[var(--brand-accent)]"
      >
        <Plus size={13} />
        Adicionar subcategoria
      </button>
    </div>
  );
};
