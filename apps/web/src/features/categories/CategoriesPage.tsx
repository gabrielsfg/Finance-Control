"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Tag,
  FolderOpen,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/config/categoryColors";
import {
  useCategories,
  useDeleteCategory,
  useDeleteSubCategory,
} from "@/features/categories/hooks/useCategories";
import { CreateCategoryModal } from "@/features/categories/components/CreateCategoryModal";
import { EditCategoryModal } from "@/features/categories/components/EditCategoryModal";
import { CreateSubCategoryModal } from "@/features/categories/components/CreateSubCategoryModal";
import { EditSubCategoryModal } from "@/features/categories/components/EditSubCategoryModal";
import { usePageNova, usePageSearch } from "@/lib/hooks/usePageHeader";
import type { Category, SubCategory } from "@/lib/types/categories.types";

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();

  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: deleteSubCategory } = useDeleteSubCategory();

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  usePageNova("Nova categoria", () => setShowCreateCategory(true));
  usePageSearch();
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCreateSub, setShowCreateSub] = useState<number | null>(null);
  const [editSub, setEditSub] = useState<SubCategory | null>(null);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar categorias. Tente novamente.</p>
      </div>
    );
  }

  const userCategories = categories ?? [];
  const total = userCategories.reduce((acc, c) => acc + c.subCategories.length, 0);

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Categorias</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">
            {userCategories.length} categori{userCategories.length !== 1 ? "as" : "a"},{" "}
            {total} subcategori{total !== 1 ? "as" : "a"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Categorias", value: userCategories.length, icon: Layers, color: "text-purple", bg: "bg-purple/10" },
            { label: "Subcategorias", value: total, icon: Tag, color: "text-blue", bg: "bg-blue/10" },
            { label: "Sem subcategorias", value: userCategories.filter((c) => c.subCategories.length === 0).length, icon: FolderOpen, color: "text-text-muted", bg: "bg-surface2" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="border-border bg-surface flex items-center gap-3 rounded-xl border p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon size={16} className={color} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-text-muted text-[11px]">{label}</p>
                <p className="font-mono font-600 text-text text-[20px] leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* List */}
        {userCategories.length === 0 ? (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <div className="bg-surface2 mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]">
              <FolderOpen size={22} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="font-500 text-text text-[15px]">Nenhuma categoria criada</p>
            <p className="text-text-muted mt-1 text-[13px]">
              Crie categorias para organizar suas transações e orçamentos.
            </p>
            <Button size="sm" className="mt-5" onClick={() => setShowCreateCategory(true)}>
              <Plus size={14} />
              Nova categoria
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {userCategories.map((category) => {
              const isOpen = expanded.has(category.id);
              const color = getCategoryColor(category.color, category.name);
              const hasSubs = category.subCategories.length > 0;

              return (
                <div
                  key={category.id}
                  className="border-border bg-surface rounded-xl border overflow-hidden"
                >
                  {/* Category row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="text-text-muted hover:text-text transition-colors shrink-0"
                      aria-label={isOpen ? "Recolher" : "Expandir"}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ backgroundColor: color + "25" }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>

                    <span
                      className="font-500 text-text text-[14px] flex-1 cursor-pointer select-none"
                      onClick={() => toggleExpand(category.id)}
                    >
                      {category.name}
                    </span>

                    <span
                      className="font-mono text-text-muted mr-1 text-[11px]"
                    >
                      {color}
                    </span>

                    <span className="text-text-muted text-[12px] mr-1">
                      {category.subCategories.length} sub
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowCreateSub(category.id)}
                        className="text-text-muted hover:text-green flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                        title="Nova subcategoria"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => setEditCategory(category)}
                        className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                        title="Editar categoria"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deletar a categoria "${category.name}"? As subcategorias também serão removidas.`))
                            deleteCategory(category.id);
                        }}
                        className="text-text-muted hover:text-red flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                        title="Deletar categoria"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isOpen && (
                    <div className="border-border border-t">
                      {hasSubs ? (
                        category.subCategories.map((sub, idx) => (
                          <div
                            key={sub.id}
                            className={`flex items-center gap-3 px-4 py-2.5 ${
                              idx < category.subCategories.length - 1
                                ? "border-border border-b"
                                : ""
                            }`}
                          >
                            <div className="w-4 shrink-0" />
                            <Tag size={12} className="text-text-muted shrink-0" />
                            <span className="text-text-sub text-[13px] flex-1">{sub.name}</span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditSub(sub)}
                                className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                title="Editar subcategoria"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Deletar a subcategoria "${sub.name}"?`))
                                    deleteSubCategory(sub.id);
                                }}
                                className="text-text-muted hover:text-red flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                title="Deletar subcategoria"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-4 shrink-0" />
                          <p className="text-text-muted text-[12px]">
                            Nenhuma subcategoria.{" "}
                            <button
                              onClick={() => setShowCreateSub(category.id)}
                              className="text-green hover:underline"
                            >
                              Criar uma
                            </button>
                          </p>
                        </div>
                      )}

                      {/* Add sub footer */}
                      <button
                        onClick={() => setShowCreateSub(category.id)}
                        className="border-border flex w-full items-center gap-2 border-t px-4 py-2.5 text-[12px] text-text-muted hover:bg-surface2 transition-colors"
                      >
                        <div className="w-4 shrink-0" />
                        <Plus size={12} />
                        Adicionar subcategoria
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateCategoryModal
        open={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
      />
      <EditCategoryModal
        category={editCategory}
        onClose={() => setEditCategory(null)}
      />
      <CreateSubCategoryModal
        open={showCreateSub !== null}
        onClose={() => setShowCreateSub(null)}
        categories={userCategories}
        defaultCategoryId={showCreateSub ?? undefined}
      />
      <EditSubCategoryModal
        subCategory={editSub}
        onClose={() => setEditSub(null)}
        categories={userCategories}
      />
    </>
  );
}
