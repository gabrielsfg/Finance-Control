import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import type {
  TransactionItem,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "@/lib/types/transactions.types";

const MOCK_TRANSACTIONS: TransactionItem[] = [
  {
    id: 1, description: "Salário", value: 980000, type: "Income",
    subCategoryId: 1, subCategoryName: "Salário", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-05", paymentType: "OneTime", paymentMethod: null,
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 2, description: "Aluguel", value: 220000, type: "Expense",
    subCategoryId: 2, subCategoryName: "Aluguel", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-10", paymentType: "Recurring", paymentMethod: "Debit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: 5, parentTransactionId: null,
  },
  {
    id: 3, description: "Mercado Extra", value: 31240, type: "Expense",
    subCategoryId: 3, subCategoryName: "Supermercado", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-12", paymentType: "OneTime", paymentMethod: "Debit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 4, description: "iFood", value: 8990, type: "Expense",
    subCategoryId: 4, subCategoryName: "Delivery", accountId: 2, accountName: "Inter",
    transactionDate: "2026-04-14", paymentType: "OneTime", paymentMethod: "Credit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 5, description: "Uber", value: 2350, type: "Expense",
    subCategoryId: 5, subCategoryName: "Aplicativo", accountId: 2, accountName: "Inter",
    transactionDate: "2026-04-15", paymentType: "OneTime", paymentMethod: "Credit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 6, description: "Netflix", value: 5500, type: "Expense",
    subCategoryId: 6, subCategoryName: "Streaming", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-16", paymentType: "Recurring", paymentMethod: "Credit",
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: 8, parentTransactionId: null,
  },
  {
    id: 7, description: "Notebook Dell", value: 480000, type: "Expense",
    subCategoryId: 7, subCategoryName: "Eletrônicos", accountId: 2, accountName: "Inter",
    transactionDate: "2026-04-17", paymentType: "Installment", paymentMethod: "Credit",
    installmentNumber: 1, totalInstallments: 12, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 8, description: "Academia", value: 9900, type: "Expense",
    subCategoryId: 8, subCategoryName: "Saúde", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-18", paymentType: "Recurring", paymentMethod: "Debit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: 12, parentTransactionId: null,
  },
  {
    id: 9, description: "Freelance Design", value: 120000, type: "Income",
    subCategoryId: 9, subCategoryName: "Freelance", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-20", paymentType: "OneTime", paymentMethod: null,
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 10, description: "Posto Shell", value: 18000, type: "Expense",
    subCategoryId: 10, subCategoryName: "Combustível", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-22", paymentType: "OneTime", paymentMethod: "Debit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 11, description: "Consulta Médica", value: 25000, type: "Expense",
    subCategoryId: 8, subCategoryName: "Saúde", accountId: 2, accountName: "Inter",
    transactionDate: "2026-04-23", paymentType: "OneTime", paymentMethod: "Credit",
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 12, description: "Bar com amigos", value: 12480, type: "Expense",
    subCategoryId: 11, subCategoryName: "Lazer", accountId: 2, accountName: "Inter",
    transactionDate: "2026-04-25", paymentType: "OneTime", paymentMethod: "Credit",
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 13, description: "Dividendos MXRF11", value: 32000, type: "Income",
    subCategoryId: 12, subCategoryName: "Dividendos", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-04-28", paymentType: "OneTime", paymentMethod: null,
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 14, description: "Salário", value: 980000, type: "Income",
    subCategoryId: 1, subCategoryName: "Salário", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-03-05", paymentType: "OneTime", paymentMethod: null,
    installmentNumber: null, totalInstallments: null, budgetId: null,
    recurringTransactionId: null, parentTransactionId: null,
  },
  {
    id: 15, description: "Aluguel", value: 220000, type: "Expense",
    subCategoryId: 2, subCategoryName: "Aluguel", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-03-10", paymentType: "Recurring", paymentMethod: "Debit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: 5, parentTransactionId: null,
  },
  {
    id: 16, description: "Mercado Extra", value: 28500, type: "Expense",
    subCategoryId: 3, subCategoryName: "Supermercado", accountId: 1, accountName: "Nubank",
    transactionDate: "2026-03-15", paymentType: "OneTime", paymentMethod: "Debit",
    installmentNumber: null, totalInstallments: null, budgetId: 1,
    recurringTransactionId: null, parentTransactionId: null,
  },
];

const USE_MOCK = true;

const KEY = ["transactions"] as const;

export const useTransactions = () =>
  useQuery<TransactionItem[]>({
    queryKey: KEY,
    queryFn: () => (USE_MOCK ? Promise.resolve(MOCK_TRANSACTIONS) : transactionsApi.getAll()),
    staleTime: 60_000,
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: (updated) => queryClient.setQueryData(KEY, updated),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data),
    onSuccess: (updated) => queryClient.setQueryData(KEY, updated),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: (updated) => queryClient.setQueryData(KEY, updated),
  });
};
