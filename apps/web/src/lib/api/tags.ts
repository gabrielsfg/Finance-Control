import { api } from "./axios";
import type { TagItem } from "@/lib/types/tags.types";

export const tagsApi = {
  getAll: async (): Promise<TagItem[]> => {
    const res = await api.get<TagItem[]>("/tag");
    return res.data;
  },

  create: async (name: string): Promise<TagItem> => {
    const res = await api.post<TagItem>("/tag", { name });
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tag/${id}`);
  },
};
