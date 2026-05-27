import { useQuery } from "@tanstack/react-query";
import { subcategoriesApi } from "@/lib/api/subcategories";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

export const useSubCategories = () =>
  useQuery<SubCategoryItem[]>({
    queryKey: ["subcategories"],
    queryFn: subcategoriesApi.getAll,
    staleTime: 5 * 60_000,
  });
