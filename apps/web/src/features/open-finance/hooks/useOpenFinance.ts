import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openFinanceApi } from "@/lib/api/openFinance";
import { transactionsApi } from "@/lib/api/transactions";
import type { BankConnection, LinkBankAccountItem } from "@/lib/types/openFinance.types";

const STATUS_KEY = ["open-finance", "status"];
const CONNECTIONS_KEY = ["open-finance", "connections"];

/** While Pluggy collects or the first import runs, the list is polled so it settles by itself. */
const isBusy = (connections: BankConnection[] | undefined) =>
  !!connections?.some((c) => c.isImporting || c.status === "Syncing");

export const useOpenFinanceStatus = () =>
  useQuery({
    queryKey: STATUS_KEY,
    queryFn: openFinanceApi.getStatus,
    staleTime: 60_000,
  });

export const useBankConnections = (enabled = true) =>
  useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: openFinanceApi.getConnections,
    staleTime: 30_000,
    enabled,
    refetchInterval: (query) => (isBusy(query.state.data) ? 5_000 : false),
  });

/** A sync changes connections, accounts (balances, connected flag) and transactions at once. */
function useRefreshAfterSync() {
  const queryClient = useQueryClient();
  return (connection?: BankConnection) => {
    if (connection) {
      queryClient.setQueryData<BankConnection[]>(CONNECTIONS_KEY, (current) => {
        if (!current) return [connection];
        const exists = current.some((c) => c.id === connection.id);
        return exists ? current.map((c) => (c.id === connection.id ? connection : c)) : [...current, connection];
      });
    }
    queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };
}

export const useCreateConnectToken = () =>
  useMutation({ mutationFn: (connectionId?: number) => openFinanceApi.createConnectToken(connectionId) });

export const useRegisterConnection = () => {
  const refresh = useRefreshAfterSync();
  return useMutation({
    mutationFn: (itemId: string) => openFinanceApi.registerConnection(itemId),
    onSuccess: (connection) => refresh(connection),
  });
};

export const useLinkBankAccounts = () => {
  const refresh = useRefreshAfterSync();
  return useMutation({
    mutationFn: ({ connectionId, accounts }: { connectionId: number; accounts: LinkBankAccountItem[] }) =>
      openFinanceApi.linkAccounts(connectionId, accounts),
    onSuccess: (connection) => refresh(connection),
  });
};

export const useSyncConnection = () => {
  const refresh = useRefreshAfterSync();
  return useMutation({
    mutationFn: (connectionId: number) => openFinanceApi.syncNow(connectionId),
    onSuccess: (connection) => refresh(connection),
  });
};

export const useAdjustBankBalance = () => {
  const refresh = useRefreshAfterSync();
  return useMutation({
    mutationFn: ({ connectionId, bankAccountId }: { connectionId: number; bankAccountId: number }) =>
      openFinanceApi.adjustBalance(connectionId, bankAccountId),
    onSuccess: (connection) => refresh(connection),
  });
};

export const useDisconnectBank = () => {
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterSync();
  return useMutation({
    mutationFn: ({ connectionId, deleteTransactions }: { connectionId: number; deleteTransactions: boolean }) =>
      openFinanceApi.disconnect(connectionId, deleteTransactions),
    onSuccess: (connections) => {
      queryClient.setQueryData(CONNECTIONS_KEY, connections);
      refresh();
    },
  });
};

export const useMarkTransactionsReviewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => transactionsApi.markReviewed(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });
};
