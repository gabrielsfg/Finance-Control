import { api } from "./axios";
import type {
  InvestmentPortfolio,
  Investment,
  InvestmentTransaction,
  InvestmentDividend,
  CreateInvestmentTransactionRequest,
  CreateInvestmentDividendRequest,
  UpdateInvestmentPriceRequest,
} from "@/lib/types/investments.types";
import type { PricePoint } from "@/lib/types/market.types";

export const investmentsApi = {
  getPortfolio: async (): Promise<InvestmentPortfolio> => {
    const response = await api.get<InvestmentPortfolio>("/investment");
    return response.data;
  },

  getById: async (id: number): Promise<Investment> => {
    const response = await api.get<Investment>(`/investment/${id}`);
    return response.data;
  },

  getTransactions: async (investmentId: number): Promise<InvestmentTransaction[]> => {
    const response = await api.get<InvestmentTransaction[]>(`/investment/${investmentId}/transactions`);
    return response.data;
  },

  getDividends: async (investmentId: number): Promise<InvestmentDividend[]> => {
    const response = await api.get<InvestmentDividend[]>(`/investment/${investmentId}/dividends`);
    return response.data;
  },

  registerTransaction: async (dto: CreateInvestmentTransactionRequest): Promise<InvestmentPortfolio> => {
    const response = await api.post<InvestmentPortfolio>("/investment/transactions", dto);
    return response.data;
  },

  deleteTransaction: async (transactionId: number): Promise<InvestmentPortfolio> => {
    const response = await api.delete<InvestmentPortfolio>(`/investment/transactions/${transactionId}`);
    return response.data;
  },

  registerDividend: async (dto: CreateInvestmentDividendRequest): Promise<InvestmentPortfolio> => {
    const response = await api.post<InvestmentPortfolio>("/investment/dividends", dto);
    return response.data;
  },

  updatePrice: async (investmentId: number, dto: UpdateInvestmentPriceRequest): Promise<Investment> => {
    const response = await api.patch<Investment>(`/investment/${investmentId}/price`, dto);
    return response.data;
  },

  getPriceHistory: async (investmentId: number): Promise<PricePoint[]> => {
    const response = await api.get<PricePoint[]>(`/investment/${investmentId}/price-history`);
    return response.data;
  },
};
