import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import { MOCK_TRANSACTIONS } from "@/lib/mocks";
import type {
  TransactionItem,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  GetTransactionsFilterParams,
  TransactionsFilteredResponse,
} from "@/lib/types/transactions.types";

const KEY = ["transactions"] as const;

const USE_MOCK = true;

function buildMockFilteredResponse(params: GetTransactionsFilterParams): TransactionsFilteredResponse {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const sortField = params.sortField ?? "date";
  const sortOrder = params.sortOrder ?? "desc";
  const items = [...MOCK_TRANSACTIONS].sort((a, b) => {
    const diff = sortField === "value"
      ? a.value - b.value
      : a.transactionDate.localeCompare(b.transactionDate);
    return sortOrder === "asc" ? diff : -diff;
  });
  const totalIncome = items.filter((t) => t.type === "Income").reduce((s, t) => s + t.value, 0);
  const totalExpense = items.filter((t) => t.type === "Expense").reduce((s, t) => s + t.value, 0);
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  const prevIncome  = Math.round(totalIncome  * 0.88);
  const prevExpense = Math.round(totalExpense * 1.05);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    previousTotalIncome:  prevIncome,
    previousTotalExpense: prevExpense,
    previousBalance:      prevIncome - prevExpense,
    page: {
      currentPage: page,
      totalPages,
      pageSize,
      totalItems,
      rowCount: pageItems.length,
      items: pageItems,
    },
  };
}

export const useTransactions = () =>
  useQuery<TransactionItem[]>({
    queryKey: KEY,
    queryFn: () => transactionsApi.getAll(),
  });

export const useTransactionsFiltered = (params: GetTransactionsFilterParams) =>
  useQuery<TransactionsFilteredResponse>({
    queryKey: ["transactions", "filtered", params],
    queryFn: USE_MOCK
      ? () => Promise.resolve(buildMockFilteredResponse(params))
      : () => transactionsApi.getFiltered(params),
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
    },
  });
};
