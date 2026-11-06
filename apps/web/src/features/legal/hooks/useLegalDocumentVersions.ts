import { useQuery } from "@tanstack/react-query";
import { legalApi } from "@/lib/api/legal";
import type { LegalDocumentType } from "@/lib/types/legal.types";

export const useLegalDocumentVersions = (type: LegalDocumentType) =>
  useQuery({
    queryKey: ["legal", type, "versions"],
    queryFn: () => legalApi.getVersions(type),
    staleTime: 1000 * 60 * 60,
  });
