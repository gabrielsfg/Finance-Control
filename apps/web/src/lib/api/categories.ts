import { api } from "./axios";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoriesRequest,
  CreateSubCategoryRequest,
  UpdateSubCategoryRequest,
  SubCategory,
} from "@/lib/types/categories.types";

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>("/category");
    return res.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category[]> => {
    const res = await api.post<Category[]>("/category", data);
    return res.data;
  },

  updateBatch: async (data: UpdateCategoriesRequest): Promise<Category[]> => {
    const res = await api.patch<Category[]>("/category", data);
    return res.data;
  },

  delete: async (id: number): Promise<Category[]> => {
    const res = await api.delete<Category[]>(`/category/${id}`);
    return res.data;
  },
};

export const subCategoriesApi = {
  create: async (data: CreateSubCategoryRequest): Promise<SubCategory[]> => {
    const res = await api.post<SubCategory[]>("/subcategory", data);
    return res.data;
  },

  update: async (id: number, data: UpdateSubCategoryRequest): Promise<SubCategory[]> => {
    const res = await api.patch<SubCategory[]>(`/subcategory/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<SubCategory[]> => {
    const res = await api.delete<SubCategory[]>(`/subcategory/${id}`);
    return res.data;
  },
};
