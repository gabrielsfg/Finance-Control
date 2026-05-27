import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importApi } from "@/lib/api/import";
import type { ImportTransactionsRequest } from "@/lib/types/import.types";

export const useParseImportFile = () =>
  useMutation({
    mutationFn: ({ file, accountId }: { file: File; accountId: number }) =>
      importApi.parseFile(file, accountId),
  });

export const useConfirmImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportTransactionsRequest) => importApi.confirmImport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
