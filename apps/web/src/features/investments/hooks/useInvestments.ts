import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentsApi } from "@/lib/api/investments";
import type {
  InvestmentPortfolio,
  Investment,
  InvestmentTransaction,
  InvestmentDividend,
  CreateInvestmentTransactionRequest,
  UpdateInvestmentTransactionRequest,
  CreateInvestmentDividendRequest,
  UpdateInvestmentPriceRequest,
} from "@/lib/types/investments.types";
import type { PricePoint } from "@/lib/types/market.types";

export const useInvestments = () =>
  useQuery<InvestmentPortfolio>({
    queryKey: ["investments"],
    queryFn: investmentsApi.getPortfolio,
    staleTime: 60_000,
  });

export const useInvestmentById = (id: number) =>
  useQuery<Investment>({
    queryKey: ["investments", id],
    queryFn: () => investmentsApi.getById(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentTransactions = (investmentId: number) =>
  useQuery<InvestmentTransaction[]>({
    queryKey: ["investments", investmentId, "transactions"],
    queryFn: () => investmentsApi.getTransactions(investmentId),
    enabled: investmentId > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentDividends = (investmentId: number) =>
  useQuery<InvestmentDividend[]>({
    queryKey: ["investments", investmentId, "dividends"],
    queryFn: () => investmentsApi.getDividends(investmentId),
    enabled: investmentId > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useRegisterTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation<InvestmentPortfolio, Error, CreateInvestmentTransactionRequest>({
    mutationFn: investmentsApi.registerTransaction,
    onSuccess: (data) => {
      queryClient.setQueryData(["investments"], data);
      // Net worth and investment analytics derive from the portfolio.
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation<
    InvestmentPortfolio,
    Error,
    { id: number; investmentId: number; dto: UpdateInvestmentTransactionRequest }
  >({
    mutationFn: ({ id, dto }) => investmentsApi.updateTransaction(id, dto),
    onSuccess: (data, { investmentId }) => {
      queryClient.setQueryData(["investments"], data);
      // The operation list the edit came from is a separate query.
      queryClient.invalidateQueries({ queryKey: ["investments", investmentId, "transactions"] });
      // Rewriting an operation rewrites its linked cash transaction with it.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      // Net worth and investment analytics derive from the portfolio.
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation<InvestmentPortfolio, Error, number>({
    mutationFn: investmentsApi.deleteTransaction,
    onSuccess: (data) => {
      queryClient.setQueryData(["investments"], data);
      // The per-position operation lists are separate queries — without this the row
      // the user just deleted stays on screen until the modal is reopened.
      queryClient.invalidateQueries({ queryKey: ["investments"], exact: false });
      // Deleting an operation deletes its linked cash transaction with it.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      // Net worth and investment analytics derive from the portfolio.
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useRegisterDividend = () => {
  const queryClient = useQueryClient();
  return useMutation<InvestmentPortfolio, Error, CreateInvestmentDividendRequest>({
    mutationFn: investmentsApi.registerDividend,
    onSuccess: (data) => {
      queryClient.setQueryData(["investments"], data);
      // Net worth and investment analytics derive from the portfolio.
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useInvestmentPriceHistory = (investmentId: number) =>
  useQuery<PricePoint[]>({
    queryKey: ["investments", investmentId, "price-history"],
    queryFn: () => investmentsApi.getPriceHistory(investmentId),
    enabled: investmentId > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateInvestmentPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<Investment, Error, { id: number; dto: UpdateInvestmentPriceRequest }>({
    mutationFn: ({ id, dto }) => investmentsApi.updatePrice(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
