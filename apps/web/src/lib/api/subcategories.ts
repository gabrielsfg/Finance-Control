import { api } from "./axios";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

export const subcategoriesApi = {
  getAll: async (): Promise<SubCategoryItem[]> => {
    const res = await api.get<SubCategoryItem[]>("/subcategory");
    return res.data;
  },
};
