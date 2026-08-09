import { api } from "./axios";
import type { LegalDocument, LegalDocumentType } from "@/lib/types/legal.types";

export const legalApi = {
  /**
   * Without `version`, the current text. With it, the archived one — how someone
   * reads back the exact wording they accepted.
   */
  get: async (type: LegalDocumentType, version?: number): Promise<LegalDocument> => {
    const response = await api.get<LegalDocument>(`/legal/${type}`, {
      params: version ? { version } : undefined,
    });
    return response.data;
  },
};
