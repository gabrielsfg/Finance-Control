import { useQuery } from "@tanstack/react-query";
import type { InvestmentSummary } from "@/lib/types/investments.types";

const MOCK: InvestmentSummary = {
  totalInvested: 4820000,
  currentValue: 5341800,
  totalReturn: 521800,
  totalReturnPercent: 10.82,
  allocations: [
    { assetClass: "Renda Fixa", value: 2100000, percent: 39.3, color: "#4A9EFF" },
    { assetClass: "Renda Variável", value: 1650000, percent: 30.9, color: "#00C98D" },
    { assetClass: "FII", value: 890000, percent: 16.7, color: "#F5A623" },
    { assetClass: "Internacional", value: 540000, percent: 10.1, color: "#7C6FE0" },
    { assetClass: "Cripto", value: 161800, percent: 3.0, color: "#F25F5C" },
  ],
  investments: [
    { id: 1, name: "Tesouro Selic 2029", ticker: "SELIC29", assetClass: "Renda Fixa", quantity: 1, averagePrice: 1380000, currentPrice: 1421000, totalInvested: 1380000, currentValue: 1421000, return: 41000, returnPercent: 2.97, color: "#4A9EFF" },
    { id: 2, name: "CDB Itaú 110% CDI", ticker: "CDB110", assetClass: "Renda Fixa", quantity: 1, averagePrice: 680000, currentPrice: 703000, totalInvested: 680000, currentValue: 703000, return: 23000, returnPercent: 3.38, color: "#4A9EFF" },
    { id: 3, name: "PETR4", ticker: "PETR4", assetClass: "Renda Variável", quantity: 150, averagePrice: 3890, currentPrice: 4120, totalInvested: 583500, currentValue: 618000, return: 34500, returnPercent: 5.91, color: "#00C98D" },
    { id: 4, name: "VALE3", ticker: "VALE3", assetClass: "Renda Variável", quantity: 80, averagePrice: 6240, currentPrice: 5980, totalInvested: 499200, currentValue: 478400, return: -20800, returnPercent: -4.17, color: "#00C98D" },
    { id: 5, name: "ITUB4", ticker: "ITUB4", assetClass: "Renda Variável", quantity: 200, averagePrice: 2770, currentPrice: 2765, totalInvested: 554000, currentValue: 553000, return: -1000, returnPercent: -0.18, color: "#00C98D" },
    { id: 6, name: "HGLG11", ticker: "HGLG11", assetClass: "FII", quantity: 60, averagePrice: 15400, currentPrice: 16200, totalInvested: 924000, currentValue: 972000, return: 48000, returnPercent: 5.19, color: "#F5A623" },
    { id: 7, name: "MXRF11", ticker: "MXRF11", assetClass: "FII", quantity: 200, averagePrice: 1030, currentPrice: 1030, totalInvested: 206000, currentValue: 206000, return: 0, returnPercent: 0, color: "#F5A623" },
    { id: 8, name: "Bitcoin", ticker: "BTC", assetClass: "Cripto", quantity: 0.002, averagePrice: 57000000, currentPrice: 62400000, totalInvested: 114000, currentValue: 124800, return: 10800, returnPercent: 9.47, color: "#F25F5C" },
    { id: 9, name: "iShares S&P 500", ticker: "IVVB11", assetClass: "Internacional", quantity: 40, averagePrice: 29800, currentPrice: 31200, totalInvested: 1192000, currentValue: 1248000, return: 56000, returnPercent: 4.70, color: "#7C6FE0" },
  ],
};

const USE_MOCK = true;

export const useInvestments = () =>
  useQuery<InvestmentSummary>({
    queryKey: ["investments"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK) : Promise.resolve(MOCK),
    staleTime: 5 * 60 * 1000,
  });
