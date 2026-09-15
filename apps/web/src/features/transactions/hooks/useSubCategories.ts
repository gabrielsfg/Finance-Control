import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subcategoriesApi } from "@/lib/api/subcategories";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

export const useSubCategories = () =>
  useQuery<SubCategoryItem[]>({
    queryKey: ["subcategories"],
    queryFn: subcategoriesApi.getAll,
    staleTime: 5 * 60_000,
  });

export const useSetSavingsSubCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subCategoryIds: number[]) => subcategoriesApi.setSavings(subCategoryIds),
    onSuccess: (updated) => {
      queryClient.setQueryData(["subcategories"], updated);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Every savings figure is computed from this flag.
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
