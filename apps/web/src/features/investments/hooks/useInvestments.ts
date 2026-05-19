import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentsApi } from "@/lib/api/investments";
import type {
  InvestmentPortfolio,
  Investment,
  InvestmentTransaction,
  InvestmentDividend,
  CreateInvestmentTransactionRequest,
  CreateInvestmentDividendRequest,
  UpdateInvestmentPriceRequest,
} from "@/lib/types/investments.types";

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
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation<InvestmentPortfolio, Error, number>({
    mutationFn: investmentsApi.deleteTransaction,
    onSuccess: (data) => {
      queryClient.setQueryData(["investments"], data);
    },
  });
};

export const useRegisterDividend = () => {
  const queryClient = useQueryClient();
  return useMutation<InvestmentPortfolio, Error, CreateInvestmentDividendRequest>({
    mutationFn: investmentsApi.registerDividend,
    onSuccess: (data) => {
      queryClient.setQueryData(["investments"], data);
    },
  });
};

export const useUpdateInvestmentPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<Investment, Error, { id: number; dto: UpdateInvestmentPriceRequest }>({
    mutationFn: ({ id, dto }) => investmentsApi.updatePrice(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
  });
};
