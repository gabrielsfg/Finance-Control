import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { legalApi } from "@/lib/api/legal";
import type { AcceptLegalDocumentsRequest } from "@/lib/types/legal.types";

export const PENDING_LEGAL_DOCUMENTS_KEY = ["legal", "pending"] as const;

/** What the signed-in user still has to accept. Re-checked on every app load. */
export const usePendingLegalDocuments = () =>
  useQuery({
    queryKey: PENDING_LEGAL_DOCUMENTS_KEY,
    queryFn: legalApi.getPending,
    staleTime: 1000 * 60 * 10,
  });

export const useAcceptLegalDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AcceptLegalDocumentsRequest) => legalApi.accept(data),
    onSuccess: (pending) => queryClient.setQueryData(PENDING_LEGAL_DOCUMENTS_KEY, pending),
    // 409 means a newer version was published while the screen was open: reload the
    // list so the user reviews what is actually in force.
    onError: () => queryClient.invalidateQueries({ queryKey: PENDING_LEGAL_DOCUMENTS_KEY }),
  });
};
