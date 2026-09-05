import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import type { TransactionsFilteredResponse } from "@/lib/types/transactions.types";

/**
 * The newest transactions on one account, for the preview inside an account card.
 *
 * Unbounded in time on purpose: an account that has been quiet this month would otherwise
 * preview as empty, which reads as "no transactions" rather than "none lately". The far
 * start date matches the "all-time" preset the transactions page uses.
 */
export const useAccountRecentTransactions = (accountId: number, enabled: boolean, limit = 5) =>
  useQuery<TransactionsFilteredResponse>({
    queryKey: ["transactions", "account-recent", accountId, limit],
    queryFn: () =>
      transactionsApi.getFiltered({
        startDate: "1900-01-01",
        finishDate: new Date().toISOString().slice(0, 10),
        accountIds: [accountId],
        page: 1,
        pageSize: limit,
        sortField: "date",
        sortOrder: "desc",
      }),
    enabled,
    staleTime: 60_000,
  });
