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

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PORTFOLIO: InvestmentPortfolio = {
  currentValue: 5341800,
  totalInvested: 4820000,
  totalReturn: 521800,
  totalReturnPercent: 10.82,
  allocations: [
    { assetType: "RendaFixa",      assetClass: "Renda Fixa",      value: 2100000, percent: 39.3, color: "#4A9EFF" },
    { assetType: "Acao",           assetClass: "Ação",             value: 1650000, percent: 30.9, color: "#00C98D" },
    { assetType: "FII",            assetClass: "FII",              value: 890000,  percent: 16.7, color: "#F5A623" },
    { assetType: "ETFInternacional", assetClass: "ETF Internacional", value: 540000, percent: 10.1, color: "#7C6FE0" },
    { assetType: "Cripto",         assetClass: "Cripto",           value: 161800,  percent: 3.0,  color: "#F25F5C" },
  ],
  investments: [
    { id: 1, ticker: "SELIC29", name: "Tesouro Selic 2029",  assetType: "TesouroDireto",    assetClass: "Tesouro Direto",    broker: "NuInvest", currentQuantity: 1,     averagePrice: 1380000,  currentPrice: 1421000,  currentValue: 1421000,  totalInvested: 1380000,  totalReturn: 41000,  totalReturnPercent: 2.97,  lastPriceUpdate: null, maturityDate: "2029-03-01", expectedYieldPct: null, accountId: 1 },
    { id: 2, ticker: "CDB110",  name: "CDB Itaú 110% CDI",   assetType: "RendaFixa",        assetClass: "Renda Fixa",        broker: "Itaú",     currentQuantity: 1,     averagePrice: 680000,   currentPrice: 703000,   currentValue: 703000,   totalInvested: 680000,   totalReturn: 23000,  totalReturnPercent: 3.38,  lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: 110,  accountId: 1 },
    { id: 3, ticker: "PETR4",   name: "Petrobras PN",         assetType: "Acao",             assetClass: "Ação",              broker: "XP",       currentQuantity: 150,   averagePrice: 3890,     currentPrice: 4120,     currentValue: 618000,   totalInvested: 583500,   totalReturn: 34500,  totalReturnPercent: 5.91,  lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
    { id: 4, ticker: "VALE3",   name: "Vale ON",              assetType: "Acao",             assetClass: "Ação",              broker: "XP",       currentQuantity: 80,    averagePrice: 6240,     currentPrice: 5980,     currentValue: 478400,   totalInvested: 499200,   totalReturn: -20800, totalReturnPercent: -4.17, lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
    { id: 5, ticker: "ITUB4",   name: "Itaú Unibanco PN",    assetType: "Acao",             assetClass: "Ação",              broker: "XP",       currentQuantity: 200,   averagePrice: 2770,     currentPrice: 2765,     currentValue: 553000,   totalInvested: 554000,   totalReturn: -1000,  totalReturnPercent: -0.18, lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
    { id: 6, ticker: "HGLG11",  name: "CSHG Logística FII",  assetType: "FII",              assetClass: "FII",               broker: "XP",       currentQuantity: 60,    averagePrice: 15400,    currentPrice: 16200,    currentValue: 972000,   totalInvested: 924000,   totalReturn: 48000,  totalReturnPercent: 5.19,  lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
    { id: 7, ticker: "MXRF11",  name: "Maxi Renda FII",      assetType: "FII",              assetClass: "FII",               broker: "NuInvest", currentQuantity: 200,   averagePrice: 1030,     currentPrice: 1030,     currentValue: 206000,   totalInvested: 206000,   totalReturn: 0,      totalReturnPercent: 0,     lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
    { id: 8, ticker: "BTC",     name: "Bitcoin",              assetType: "Cripto",           assetClass: "Cripto",            broker: null,       currentQuantity: 0.002, averagePrice: 57000000, currentPrice: 62400000, currentValue: 124800,   totalInvested: 114000,   totalReturn: 10800,  totalReturnPercent: 9.47,  lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
    { id: 9, ticker: "IVVB11",  name: "iShares S&P 500",     assetType: "ETFInternacional", assetClass: "ETF Internacional", broker: "XP",       currentQuantity: 40,    averagePrice: 29800,    currentPrice: 31200,    currentValue: 1248000,  totalInvested: 1192000,  totalReturn: 56000,  totalReturnPercent: 4.70,  lastPriceUpdate: null, maturityDate: null,         expectedYieldPct: null, accountId: 1 },
  ],
};

// ── Config ────────────────────────────────────────────────────────────────────

const USE_MOCK = true;

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useInvestments = () =>
  useQuery<InvestmentPortfolio>({
    queryKey: ["investments"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_PORTFOLIO) : investmentsApi.getPortfolio(),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentById = (id: number) =>
  useQuery<Investment>({
    queryKey: ["investments", id],
    queryFn: () => investmentsApi.getById(id),
    enabled: id > 0 && !USE_MOCK,
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentTransactions = (investmentId: number) =>
  useQuery<InvestmentTransaction[]>({
    queryKey: ["investments", investmentId, "transactions"],
    queryFn: () => investmentsApi.getTransactions(investmentId),
    enabled: investmentId > 0 && !USE_MOCK,
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentDividends = (investmentId: number) =>
  useQuery<InvestmentDividend[]>({
    queryKey: ["investments", investmentId, "dividends"],
    queryFn: () => investmentsApi.getDividends(investmentId),
    enabled: investmentId > 0 && !USE_MOCK,
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
