import { api } from "./axios";
import type { ParseImportFileResponse, ImportTransactionsRequest } from "@/lib/types/import.types";

export const importApi = {
  parseFile: async (file: File, accountId: number): Promise<ParseImportFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", String(accountId));
    const res = await api.post<ParseImportFileResponse>("/import/parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  confirmImport: async (data: ImportTransactionsRequest): Promise<{ importedCount: number }> => {
    const res = await api.post<{ importedCount: number }>("/import/confirm", data);
    return res.data;
  },
};
