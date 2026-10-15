import { api } from "./axios";
import type {
  BankConnection,
  ConnectToken,
  LinkBankAccountItem,
  OpenFinanceStatus,
} from "@/lib/types/openFinance.types";

export const openFinanceApi = {
  getStatus: async (): Promise<OpenFinanceStatus> => {
    const res = await api.get<OpenFinanceStatus>("/open-finance/status");
    return res.data;
  },

  getConnections: async (): Promise<BankConnection[]> => {
    const res = await api.get<BankConnection[]>("/open-finance/connections");
    return res.data;
  },

  createConnectToken: async (connectionId?: number): Promise<ConnectToken> => {
    const res = await api.post<ConnectToken>("/open-finance/connect-token", {
      connectionId: connectionId ?? null,
      platform: "web",
    });
    return res.data;
  },

  /** Registers the item the widget returned on success. */
  registerConnection: async (itemId: string): Promise<BankConnection> => {
    const res = await api.post<BankConnection>("/open-finance/connections", { itemId });
    return res.data;
  },

  linkAccounts: async (connectionId: number, accounts: LinkBankAccountItem[]): Promise<BankConnection> => {
    const res = await api.put<BankConnection>(`/open-finance/connections/${connectionId}/accounts`, { accounts });
    return res.data;
  },

  syncNow: async (connectionId: number): Promise<BankConnection> => {
    const res = await api.post<BankConnection>(`/open-finance/connections/${connectionId}/sync`);
    return res.data;
  },

  adjustBalance: async (connectionId: number, bankAccountId: number): Promise<BankConnection> => {
    const res = await api.post<BankConnection>(`/open-finance/connections/${connectionId}/balance-adjustment`, {
      bankAccountId,
    });
    return res.data;
  },

  disconnect: async (connectionId: number, deleteTransactions: boolean): Promise<BankConnection[]> => {
    const res = await api.delete<BankConnection[]>(`/open-finance/connections/${connectionId}`, {
      params: { deleteTransactions },
    });
    return res.data;
  },
};
