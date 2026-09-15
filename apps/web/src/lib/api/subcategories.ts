import { api } from "./axios";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

export const subcategoriesApi = {
  getAll: async (): Promise<SubCategoryItem[]> => {
    const res = await api.get<SubCategoryItem[]>("/subcategory");
    return res.data;
  },

  /** Replaces the whole set of subcategories whose spending counts as savings. */
  setSavings: async (subCategoryIds: number[]): Promise<SubCategoryItem[]> => {
    const res = await api.put<SubCategoryItem[]>("/subcategory/savings", { subCategoryIds });
    return res.data;
  },
};
