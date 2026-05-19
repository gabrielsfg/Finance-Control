import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "@/lib/api/tags";
import type { TagItem } from "@/lib/types/tags.types";

const KEY = ["tags"] as const;

export const useTags = () =>
  useQuery<TagItem[]>({
    queryKey: KEY,
    queryFn: () => tagsApi.getAll(),
  });

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => tagsApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};
