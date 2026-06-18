"use client";

import { useState, useMemo } from "react";
import { Loader2, Layers, Tag, FolderOpen, FolderPlus } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { CategoryCard } from "@/features/categories/components/CategoryCard";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { CreateCategoryModal } from "@/features/categories/components/CreateCategoryModal";
import { EditCategoryModal } from "@/features/categories/components/EditCategoryModal";
import { CreateSubCategoryModal } from "@/features/categories/components/CreateSubCategoryModal";
import { EditSubCategoryModal } from "@/features/categories/components/EditSubCategoryModal";
import { DeleteCategoryModal } from "@/features/categories/components/DeleteCategoryModal";
import { DeleteSubCategoryModal } from "@/features/categories/components/DeleteSubCategoryModal";
import { usePageNova, usePageSearch } from "@/lib/hooks/usePageHeader";
import { includesNormalized } from "@/lib/utils";
import type { Category, SubCategory } from "@/lib/types/categories.types";

/** Compact count stat — mono figure + icon, in the new token style. */
function CountStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Layers;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[18px]"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
      >
        <Icon size={17} strokeWidth={1.75} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">{label}</p>
        <p className="font-mono text-[22px] font-semibold leading-tight tabular-nums text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [showCreateSub, setShowCreateSub] = useState<number | null>(null);
  const [editSub, setEditSub] = useState<SubCategory | null>(null);
  const [deleteSub, setDeleteSub] = useState<SubCategory | null>(null);
  const [search, setSearch] = useState("");

  usePageNova("Nova categoria", () => setShowCreateCategory(true));
  usePageSearch((q) => setSearch(q), "Buscar categoria…");

  const userCategories = categories ?? [];
  const totalSubs = userCategories.reduce((acc, c) => acc + c.subCategories.length, 0);
  const emptyCount = userCategories.filter((c) => c.subCategories.length === 0).length;

  // Filter by category or subcategory name (search-as-you-type from the topbar).
  const visibleCategories = useMemo(() => {
    const q = search.trim();
    if (!q) return userCategories;
    return userCategories.filter(
      (c) =>
        includesNormalized(c.name, q) ||
        c.subCategories.some((s) => includesNormalized(s.name, q)),
    );
  }, [userCategories, search]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-[var(--text-sub)]">Erro ao carregar categorias. Tente novamente.</p>
      </div>
    );
  }

  const hasCategories = userCategories.length > 0;
  const subtitle = hasCategories
    ? `${userCategories.length} categoria${userCategories.length !== 1 ? "s" : ""} · ${totalSubs} subcategoria${totalSubs !== 1 ? "s" : ""}`
    : "Nenhuma categoria";

  return (
    <>
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Categorias" subtitle={subtitle} />

        <div className="flex flex-col gap-5">
          {!hasCategories ? (
            <div
              className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] px-5 py-16 text-center"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface2)] text-[var(--brand-accent)]">
                <FolderOpen size={24} strokeWidth={1.75} />
              </div>
              <h4 className="font-display text-[16px] font-bold text-[var(--text)]">Nenhuma categoria ainda</h4>
              <p className="mx-auto mt-1.5 max-w-[340px] text-[13.5px] text-[var(--text-sub)]">
                Crie categorias para organizar suas transações e orçamentos.
              </p>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
                style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
              >
                <FolderPlus size={16} strokeWidth={2} />
                Criar categoria
              </button>
            </div>
          ) : (
            <>
              {/* Count summary row */}
              <div className="grid grid-cols-3 gap-[22px] max-sm:grid-cols-1">
                <CountStat label="Categorias" value={userCategories.length} icon={Layers} color="var(--brand-cobalt)" />
                <CountStat label="Subcategorias" value={totalSubs} icon={Tag} color="var(--brand-accent)" />
                <CountStat label="Sem subcategorias" value={emptyCount} icon={FolderOpen} color="var(--gold)" />
              </div>

              {/* Category grid */}
              {visibleCategories.length === 0 ? (
                <div
                  className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] px-5 py-14 text-center"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <p className="text-[14px] text-[var(--text-sub)]">
                    Nenhuma categoria encontrada para{" "}
                    <span className="font-medium text-[var(--text)]">“{search.trim()}”</span>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-[22px]">
                  {visibleCategories.map((category) => (
                    <div key={category.id} className="col-span-12 sm:col-span-6 xl:col-span-4">
                      <CategoryCard
                        category={category}
                        onEditCategory={setEditCategory}
                        onDeleteCategory={setDeleteCategory}
                        onCreateSub={setShowCreateSub}
                        onEditSub={setEditSub}
                        onDeleteSub={setDeleteSub}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
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
      <DeleteCategoryModal
        category={deleteCategory}
        onClose={() => setDeleteCategory(null)}
      />
      <DeleteSubCategoryModal
        subCategory={deleteSub}
        onClose={() => setDeleteSub(null)}
      />
    </>
  );
}
