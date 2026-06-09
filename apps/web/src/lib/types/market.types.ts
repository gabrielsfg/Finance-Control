import type { AssetType } from "./investments.types";

export type PricePoint = {
  date: string;
  price: number;
};

export type MarketAsset = {
  id: number;
  ticker: string;
  name: string;
  assetType: AssetType;
  assetClass: string;
  logoUrl: string | null;
  currency: string;
  currentPrice: number;
  lastPriceUpdate: string | null;
  previousClose: number | null;
  dayChangePct: number | null;
  // Populated only on fundamental-sorted rankings (dy/pl/pvp/marketcap/revenue/roe).
  dividendYield?: number | null;
  priceToEarnings?: number | null;
  priceToBook?: number | null;
  returnOnEquity?: number | null;
  marketCap?: number | null;
  totalRevenue?: number | null;
};

export type MarketAssetDetail = MarketAsset & {
  priceHistory: PricePoint[];
};

export type FundamentalDividend = {
  paymentDate: string | null;
  rate: number;
  label: string;
};

export type FiiIndicators = {
  ticker: string;
  name: string | null;
  segmentType: string | null;
  segment: string | null;
  managementType: string | null;
  mandate: string | null;
  administratorName: string | null;
  price: number | null;
  navPerShare: number | null;
  priceToNav: number | null;
  dividendYield12m: number | null;
  totalInvestors: number | null;
  fetchedAt: string;
};

export type MacroIndicator = {
  slug: string;
  name: string;
  unit: string | null;
  value: number | null;
  date: string | null;
  previousValue: number | null;
};

export type Fundamentals = {
  ticker: string;
  // summaryProfile
  companyName: string | null;
  sector: string | null;
  industry: string | null;
  website: string | null;
  businessSummary: string | null;
  fullTimeEmployees: number | null;
  // defaultKeyStatistics
  priceToEarnings: number | null;
  priceToBook: number | null;
  returnOnEquity: number | null;
  dividendYield: number | null;
  earningsPerShare: number | null;
  beta: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  bookValue: number | null;
  sharesOutstanding: number | null;
  // FII / fundo
  administratorName: string | null;
  recentDividends: FundamentalDividend[];
  // financialData
  ebitda: number | null;
  totalRevenue: number | null;
  grossMargin: number | null;
  ebitdaMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  totalCash: number | null;
  totalDebt: number | null;
  freeCashflow: number | null;
  // balanceSheet
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalStockholderEquity: number | null;
  cash: number | null;
  longTermDebt: number | null;
  // incomeStatement
  annualRevenue: number | null;
  annualNetIncome: number | null;
  annualGrossProfit: number | null;
  fetchedAt: string;
};
