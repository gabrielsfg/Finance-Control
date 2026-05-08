import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, subCategoriesApi } from "@/lib/api/categories";
import { MOCK_CATEGORIES } from "@/lib/mocks";
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateSubCategoryRequest,
  UpdateSubCategoryRequest,
  SubCategory,
} from "@/lib/types/categories.types";

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: () => Promise.resolve(MOCK_CATEGORIES),
    staleTime: Infinity,
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: (updated) => {
      qc.setQueryData(["categories"], updated);
      qc.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCategoryRequest) =>
      categoriesApi.updateBatch({ categories: [data] }),
    onSuccess: (updated) => {
      qc.setQueryData(["categories"], updated);
      qc.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: (updated) => {
      qc.setQueryData(["categories"], updated);
      qc.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};

export const useCreateSubCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubCategoryRequest) => subCategoriesApi.create(data),
    onSuccess: (updatedSubs: SubCategory[]) => {
      qc.setQueryData(["subcategories"], updatedSubs);
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateSubCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubCategoryRequest }) =>
      subCategoriesApi.update(id, data),
    onSuccess: (updatedSubs: SubCategory[]) => {
      qc.setQueryData(["subcategories"], updatedSubs);
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useDeleteSubCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subCategoriesApi.delete(id),
    onSuccess: (updatedSubs: SubCategory[]) => {
      qc.setQueryData(["subcategories"], updatedSubs);
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
