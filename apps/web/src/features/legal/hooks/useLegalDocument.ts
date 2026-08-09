import { useQuery } from "@tanstack/react-query";
import { legalApi } from "@/lib/api/legal";
import type { LegalDocumentType } from "@/lib/types/legal.types";

/**
 * A published version never changes, so this is as cacheable as data gets — the
 * only thing that can move is which version is current.
 */
export const useLegalDocument = (type: LegalDocumentType, version?: number) =>
  useQuery({
    queryKey: ["legal", type, version ?? "current"],
    queryFn: () => legalApi.get(type, version),
    staleTime: 1000 * 60 * 60,
  });
