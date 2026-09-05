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
      // The review screen can invent tags, and the server creates them on confirm — the
      // cached list would otherwise not know about them until a reload.
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};
