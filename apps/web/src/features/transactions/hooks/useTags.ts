import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "@/lib/api/tags";
import type { TagItem, UpdateTagRequest } from "@/lib/types/tags.types";

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

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTagRequest }) => tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      // Transaction rows carry the tag names they were loaded with.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};
