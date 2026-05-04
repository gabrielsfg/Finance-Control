import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import type {
  AnalyticsSummaryResponse,
  MonthlyData,
  DaySpend,
  CategoryMonthlyData,
  NetWorthPoint,
  InvestmentEvolutionResponse,
  ProjectionPoint,
  ProfitabilityTotals,
  AnnualReturnsResponse,
  ProfitabilityVsCdiPoint,
  InvestmentLaunchesResponse,
  NetWorthProjectionResponse,
  CategoryProjection,
  PassiveIncomeProjectionResponse,
  FinancialMilestonesResponse,
  PortfolioCompositionProjectionResponse,
  RealNetWorthResponse,
} from "@/lib/types/analytics.types";

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY: AnalyticsSummaryResponse = {
  avgMonthlyIncome: 915714,
  avgMonthlyExpense: 514007,
  avgMonthlyBalance: 401707,
  bestMonth:  { month: 4, year: 2026, label: "Abril 2026",     totalIncome: 980000, totalExpense: 482050, balance: 497950 },
  worstMonth: { month: 12, year: 2025, label: "Dezembro 2025", totalIncome: 950000, totalExpense: 620000, balance: 330000 },
  categoryBreakdown: {
    maxSpent: 243390,
    items: [
      { categoryId: 1, categoryName: "Moradia",     color: "#4A9EFF", totalSpent: 243390, percent: 49.2, change: 2.1 },
      { categoryId: 2, categoryName: "Alimentação", color: "#F5A623", totalSpent: 60230,  percent: 12.2, change: -8.4 },
      { categoryId: 3, categoryName: "Transporte",  color: "#00C98D", totalSpent: 48350,  percent: 9.8,  change: 5.3 },
      { categoryId: 4, categoryName: "Saúde",       color: "#F25F5C", totalSpent: 38760,  percent: 7.8,  change: -1.2 },
      { categoryId: 5, categoryName: "Lazer",       color: "#7C6FE0", totalSpent: 29480,  percent: 6.0,  change: 12.7 },
      { categoryId: 6, categoryName: "Educação",    color: "#F5CE42", totalSpent: 25000,  percent: 5.1,  change: null },
      { categoryId: 7, categoryName: "Pessoal",     color: "#00D4A0", totalSpent: 18900,  percent: 3.8,  change: -3.5 },
      { categoryId: 8, categoryName: "Outros",      color: "#8A95A3", totalSpent: 29940,  percent: 6.1,  change: 1.8 },
    ],
  },
};

const MOCK_MONTHLY: MonthlyData[] = [
  { month: 10, year: 2025, label: "Out", totalIncome: 820000, totalExpense: 510000, balance: 310000 },
  { month: 11, year: 2025, label: "Nov", totalIncome: 870000, totalExpense: 490000, balance: 380000 },
  { month: 12, year: 2025, label: "Dez", totalIncome: 950000, totalExpense: 620000, balance: 330000 },
  { month: 1,  year: 2026, label: "Jan", totalIncome: 880000, totalExpense: 530000, balance: 350000 },
  { month: 2,  year: 2026, label: "Fev", totalIncome: 900000, totalExpense: 470000, balance: 430000 },
  { month: 3,  year: 2026, label: "Mar", totalIncome: 920000, totalExpense: 505000, balance: 415000 },
  { month: 4,  year: 2026, label: "Abr", totalIncome: 980000, totalExpense: 482050, balance: 497950 },
];

const MOCK_HEATMAP: DaySpend[] = [
  { date: "2026-04-01", total: 12400,  income: 0,      net: -12400,  state: "Expense2" },
  { date: "2026-04-02", total: 0,      income: 0,      net: 0,       state: "Empty"    },
  { date: "2026-04-03", total: 8900,   income: 0,      net: -8900,   state: "Expense1" },
  { date: "2026-04-04", total: 32100,  income: 0,      net: -32100,  state: "Expense2" },
  { date: "2026-04-05", total: 4200,   income: 320000, net: 315800,  state: "Income4"  },
  { date: "2026-04-06", total: 5400,   income: 0,      net: -5400,   state: "Expense1" },
  { date: "2026-04-07", total: 18700,  income: 0,      net: -18700,  state: "Expense2" },
  { date: "2026-04-08", total: 7200,   income: 0,      net: -7200,   state: "Expense1" },
  { date: "2026-04-09", total: 0,      income: 0,      net: 0,       state: "Empty"    },
  { date: "2026-04-10", total: 14300,  income: 0,      net: -14300,  state: "Expense2" },
  { date: "2026-04-11", total: 76500,  income: 0,      net: -76500,  state: "Expense4" },
  { date: "2026-04-12", total: 0,      income: 0,      net: 0,       state: "Empty"    },
  { date: "2026-04-13", total: 9800,   income: 0,      net: -9800,   state: "Expense1" },
  { date: "2026-04-14", total: 0,      income: 45000,  net: 45000,   state: "Income1"  },
  { date: "2026-04-15", total: 4100,   income: 560000, net: 555900,  state: "Income4"  },
  { date: "2026-04-16", total: 12000,  income: 0,      net: -12000,  state: "Expense2" },
  { date: "2026-04-17", total: 31200,  income: 0,      net: -31200,  state: "Expense2" },
  { date: "2026-04-18", total: 6700,   income: 0,      net: -6700,   state: "Expense1" },
  { date: "2026-04-19", total: 0,      income: 0,      net: 0,       state: "Empty"    },
  { date: "2026-04-20", total: 15800,  income: 28000,  net: 12200,   state: "Income1"  },
  { date: "2026-04-21", total: 8300,   income: 0,      net: -8300,   state: "Expense1" },
  { date: "2026-04-22", total: 0,      income: 0,      net: 0,       state: "Empty"    },
  { date: "2026-04-23", total: 44200,  income: 0,      net: -44200,  state: "Expense3" },
  { date: "2026-04-24", total: 11900,  income: 0,      net: -11900,  state: "Expense2" },
  { date: "2026-04-25", total: 3200,   income: 18000,  net: 14800,   state: "Income1"  },
  { date: "2026-04-26", total: 28600,  income: 0,      net: -28600,  state: "Expense2" },
  { date: "2026-04-27", total: 5200,   income: 0,      net: -5200,   state: "Expense1" },
  { date: "2026-04-28", total: 0,      income: 0,      net: 0,       state: "Empty"    },
  { date: "2026-04-29", total: 19100,  income: 0,      net: -19100,  state: "Expense2" },
  { date: "2026-04-30", total: 3400,   income: 0,      net: -3400,   state: "Expense1" },
];

const MOCK_CATEGORY_EVOLUTION: CategoryMonthlyData[] = [
  { label: "Out", Moradia: 238000, Alimentação: 65000, Transporte: 52000, Saúde: 41000, Lazer: 22000 },
  { label: "Nov", Moradia: 241000, Alimentação: 71000, Transporte: 49000, Saúde: 38000, Lazer: 25000 },
  { label: "Dez", Moradia: 245000, Alimentação: 88000, Transporte: 55000, Saúde: 43000, Lazer: 42000 },
  { label: "Jan", Moradia: 241000, Alimentação: 62000, Transporte: 50000, Saúde: 36000, Lazer: 21000 },
  { label: "Fev", Moradia: 241000, Alimentação: 58000, Transporte: 46000, Saúde: 40000, Lazer: 19000 },
  { label: "Mar", Moradia: 243000, Alimentação: 63000, Transporte: 51000, Saúde: 39000, Lazer: 27000 },
  { label: "Abr", Moradia: 243390, Alimentação: 60230, Transporte: 48350, Saúde: 38760, Lazer: 29480 },
];

const MOCK_NET_WORTH: NetWorthPoint[] = [
  { label: "Out", netWorth: 8420000,  assets: 9800000,  liabilities: 1380000 },
  { label: "Nov", netWorth: 8810000,  assets: 10190000, liabilities: 1380000 },
  { label: "Dez", netWorth: 9150000,  assets: 10530000, liabilities: 1380000 },
  { label: "Jan", netWorth: 9510000,  assets: 10870000, liabilities: 1360000 },
  { label: "Fev", netWorth: 9950000,  assets: 11290000, liabilities: 1340000 },
  { label: "Mar", netWorth: 10370000, assets: 11690000, liabilities: 1320000 },
  { label: "Abr", netWorth: 10875000, assets: 12175000, liabilities: 1300000 },
];

const MOCK_INVESTMENT_EVOLUTION: InvestmentEvolutionResponse = {
  data: [
    { label: "Out", totalValue: 4720000, totalInvested: 4500000, returns: 198000, dividends: 22000 },
    { label: "Nov", totalValue: 4840000, totalInvested: 4580000, returns: 234000, dividends: 26000 },
    { label: "Dez", totalValue: 4910000, totalInvested: 4660000, returns: 221000, dividends: 29000 },
    { label: "Jan", totalValue: 5020000, totalInvested: 4740000, returns: 251000, dividends: 29000 },
    { label: "Fev", totalValue: 5120000, totalInvested: 4780000, returns: 308000, dividends: 32000 },
    { label: "Mar", totalValue: 5230000, totalInvested: 4800000, returns: 396000, dividends: 34000 },
    { label: "Abr", totalValue: 5341800, totalInvested: 4820000, returns: 485800, dividends: 36000 },
  ],
  returnPct: 10.08, // 485800 / 4820000 * 100
  cumulativeDividends: 208000,
};

const MOCK_PROJECTIONS: ProjectionPoint[] = [
  { label: "Abr/26", conservative: 10875000, moderate: 10875000, optimistic: 10875000 },
  { label: "Out/26", conservative: 12100000, moderate: 12800000, optimistic: 13600000 },
  { label: "Abr/27", conservative: 13500000, moderate: 14900000, optimistic: 16700000 },
  { label: "Out/27", conservative: 14900000, moderate: 17200000, optimistic: 20400000 },
  { label: "Abr/28", conservative: 16400000, moderate: 19800000, optimistic: 24800000 },
  { label: "Out/28", conservative: 18000000, moderate: 22700000, optimistic: 30100000 },
  { label: "Abr/29", conservative: 19700000, moderate: 26000000, optimistic: 36500000 },
];

const MOCK_PROFITABILITY_TOTALS: ProfitabilityTotals = {
  allTime:      { returnPct: 0.71, vsCdiPct: -44.05 },
  last12Months: { returnPct: 8.34, vsCdiPct: -12.20 },
  lastMonth:    { returnPct: 0.71, vsCdiPct: -44.05 },
};

const MOCK_ANNUAL_RETURNS: AnnualReturnsResponse = {
  rows: [
    {
      year: 2024,
      months: [
        { month: 1,  returnBps: 82  }, { month: 2,  returnBps: 61  }, { month: 3,  returnBps: 95  },
        { month: 4,  returnBps: 74  }, { month: 5,  returnBps: 88  }, { month: 6,  returnBps: 53  },
        { month: 7,  returnBps: 110 }, { month: 8,  returnBps: 67  }, { month: 9,  returnBps: 79  },
        { month: 10, returnBps: 91  }, { month: 11, returnBps: 58  }, { month: 12, returnBps: 103 },
      ],
      annualReturnBps: 961,
    },
    {
      year: 2025,
      months: [
        { month: 1,  returnBps: 75  }, { month: 2,  returnBps: 69  }, { month: 3,  returnBps: 88  },
        { month: 4,  returnBps: 92  }, { month: 5,  returnBps: 71  }, { month: 6,  returnBps: 84  },
        { month: 7,  returnBps: 96  }, { month: 8,  returnBps: 63  }, { month: 9,  returnBps: 79  },
        { month: 10, returnBps: 87  }, { month: 11, returnBps: 94  }, { month: 12, returnBps: 108 },
      ],
      annualReturnBps: 1006,
    },
    {
      year: 2026,
      months: [
        { month: 1,  returnBps: 80   }, { month: 2,  returnBps: 74   }, { month: 3,  returnBps: 91   },
        { month: 4,  returnBps: 71   }, { month: 5,  returnBps: null }, { month: 6,  returnBps: null },
        { month: 7,  returnBps: null }, { month: 8,  returnBps: null }, { month: 9,  returnBps: null },
        { month: 10, returnBps: null }, { month: 11, returnBps: null }, { month: 12, returnBps: null },
      ],
      annualReturnBps: 316,
    },
  ],
  // sum per calendar month across all available years
  monthlyCumulatives: [237, 204, 274, 237, 159, 137, 206, 130, 158, 178, 152, 211],
  grandTotal: 2283, // 961 + 1006 + 316
};

const MOCK_PROFITABILITY_VS_CDI: ProfitabilityVsCdiPoint[] = [
  { label: "Out/25", portfolioPct: 0.87, cdiPct: 0.91 },
  { label: "Nov/25", portfolioPct: 0.94, cdiPct: 0.97 },
  { label: "Dez/25", portfolioPct: 1.08, cdiPct: 1.07 },
  { label: "Jan/26", portfolioPct: 0.80, cdiPct: 0.97 },
  { label: "Fev/26", portfolioPct: 0.74, cdiPct: 0.94 },
  { label: "Mar/26", portfolioPct: 0.91, cdiPct: 0.97 },
  { label: "Abr/26", portfolioPct: 0.71, cdiPct: 1.27 },
];

// ── Hooks ────────────────────────────────────────────────────────────────────

const USE_MOCK = true;

export const useAnalyticsSummary = (startDate: string, finishDate: string) =>
  useQuery<AnalyticsSummaryResponse>({
    queryKey: ["analytics", "summary", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_SUMMARY) : analyticsApi.getSummary(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsMonthly = (startDate: string, finishDate: string) =>
  useQuery<MonthlyData[]>({
    queryKey: ["analytics", "monthly", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_MONTHLY) : analyticsApi.getIncomeExpense(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsHeatmap = (startDate: string, finishDate: string) =>
  useQuery<DaySpend[]>({
    queryKey: ["analytics", "heatmap", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_HEATMAP) : analyticsApi.getSpendingHeatmap(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsCategoryEvolution = (startDate: string, finishDate: string, categoryIds: number[]) =>
  useQuery<CategoryMonthlyData[]>({
    queryKey: ["analytics", "category-evolution", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_CATEGORY_EVOLUTION) : Promise.resolve(MOCK_CATEGORY_EVOLUTION),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsNetWorth = (startDate: string, finishDate: string) =>
  useQuery<NetWorthPoint[]>({
    queryKey: ["analytics", "net-worth", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_NET_WORTH) : analyticsApi.getNetWorthEvolution(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsInvestmentEvolution = (startDate: string, finishDate: string) =>
  useQuery<InvestmentEvolutionResponse>({
    queryKey: ["analytics", "investment-evolution", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_INVESTMENT_EVOLUTION) : analyticsApi.getInvestmentEvolution(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsProjections = () =>
  useQuery<ProjectionPoint[]>({
    queryKey: ["analytics", "projections"],
    queryFn: () => Promise.resolve(MOCK_PROJECTIONS),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentProfitabilityTotals = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityTotals>({
    queryKey: ["analytics", "investment-profitability-totals", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_PROFITABILITY_TOTALS) : analyticsApi.getInvestmentProfitabilityTotals(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentAnnualReturns = (startDate: string, finishDate: string) =>
  useQuery<AnnualReturnsResponse>({
    queryKey: ["analytics", "investment-annual-returns", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_ANNUAL_RETURNS) : analyticsApi.getInvestmentAnnualReturns(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentProfitabilityVsCdi = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityVsCdiPoint[]>({
    queryKey: ["analytics", "investment-vs-cdi", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_PROFITABILITY_VS_CDI) : analyticsApi.getInvestmentProfitabilityVsCdi(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

const MOCK_INVESTMENT_LAUNCHES: InvestmentLaunchesResponse = {
  // pre-sorted by date descending (backend responsibility)
  launches: [
    { id: 30, date: "2026-04-17", ticker: "HGLG11",  name: "CSHG Logística FII",  assetClass: "FII",            operation: "buy",  quantity: 20,    unitPrice: 16200,    totalValue: 324000,  broker: "XP" },
    { id: 29, date: "2026-03-06", ticker: "ITUB4",   name: "Itaú Unibanco PN",    assetClass: "Renda Variável", operation: "sell", quantity: 50,    unitPrice: 2780,     totalValue: 139000,  broker: "XP" },
    { id: 28, date: "2026-02-14", ticker: "PETR4",   name: "Petrobras PN",        assetClass: "Renda Variável", operation: "sell", quantity: 30,    unitPrice: 4200,     totalValue: 126000,  broker: "XP" },
    { id: 27, date: "2026-01-09", ticker: "SELIC29", name: "Tesouro Selic 2029",  assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 1380000,  totalValue: 1380000, broker: "NuInvest" },
    { id: 26, date: "2025-12-02", ticker: "IVVB11",  name: "iShares S&P 500",     assetClass: "Internacional",  operation: "buy",  quantity: 10,    unitPrice: 31100,    totalValue: 311000,  broker: "XP" },
    { id: 25, date: "2025-11-18", ticker: "MXRF11",  name: "Maxi Renda FII",      assetClass: "FII",            operation: "buy",  quantity: 100,   unitPrice: 1028,     totalValue: 102800,  broker: "NuInvest" },
    { id: 24, date: "2025-10-05", ticker: "VALE3",   name: "Vale ON",             assetClass: "Renda Variável", operation: "buy",  quantity: 30,    unitPrice: 5800,     totalValue: 174000,  broker: "XP" },
    { id: 23, date: "2025-09-10", ticker: "BTC",     name: "Bitcoin",             assetClass: "Cripto",         operation: "sell", quantity: 0.001, unitPrice: 63000000, totalValue: 63000,   broker: "Mercado Bitcoin" },
    { id: 22, date: "2025-08-22", ticker: "HGLG11",  name: "CSHG Logística FII",  assetClass: "FII",            operation: "sell", quantity: 20,    unitPrice: 15900,    totalValue: 318000,  broker: "XP" },
    { id: 21, date: "2025-07-11", ticker: "PETR4",   name: "Petrobras PN",        assetClass: "Renda Variável", operation: "buy",  quantity: 80,    unitPrice: 3860,     totalValue: 308800,  broker: "XP" },
    { id: 20, date: "2025-06-03", ticker: "CDB110",  name: "CDB Itaú 110% CDI",   assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 680000,   totalValue: 680000,  broker: "Itaú" },
    { id: 19, date: "2025-05-15", ticker: "IVVB11",  name: "iShares S&P 500",     assetClass: "Internacional",  operation: "sell", quantity: 10,    unitPrice: 30800,    totalValue: 308000,  broker: "XP" },
    { id: 18, date: "2025-04-07", ticker: "ITUB4",   name: "Itaú Unibanco PN",    assetClass: "Renda Variável", operation: "buy",  quantity: 50,    unitPrice: 2810,     totalValue: 140500,  broker: "XP" },
    { id: 17, date: "2025-03-20", ticker: "SELIC29", name: "Tesouro Selic 2029",  assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 1360000,  totalValue: 1360000, broker: "NuInvest" },
    { id: 16, date: "2025-02-14", ticker: "PETR4",   name: "Petrobras PN",        assetClass: "Renda Variável", operation: "sell", quantity: 40,    unitPrice: 4050,     totalValue: 162000,  broker: "XP" },
    { id: 15, date: "2025-01-08", ticker: "MXRF11",  name: "Maxi Renda FII",      assetClass: "FII",            operation: "buy",  quantity: 80,    unitPrice: 1030,     totalValue: 82400,   broker: "NuInvest" },
    { id: 14, date: "2024-12-17", ticker: "BTC",     name: "Bitcoin",             assetClass: "Cripto",         operation: "buy",  quantity: 0.001, unitPrice: 58000000, totalValue: 58000,   broker: "Mercado Bitcoin" },
    { id: 13, date: "2024-12-03", ticker: "IVVB11",  name: "iShares S&P 500",     assetClass: "Internacional",  operation: "buy",  quantity: 20,    unitPrice: 30200,    totalValue: 604000,  broker: "XP" },
    { id: 12, date: "2024-11-06", ticker: "VALE3",   name: "Vale ON",             assetClass: "Renda Variável", operation: "sell", quantity: 30,    unitPrice: 6100,     totalValue: 183000,  broker: "XP" },
    { id: 11, date: "2024-10-28", ticker: "HGLG11",  name: "CSHG Logística FII",  assetClass: "FII",            operation: "buy",  quantity: 40,    unitPrice: 15550,    totalValue: 622000,  broker: "XP" },
    { id: 10, date: "2024-10-11", ticker: "ITUB4",   name: "Itaú Unibanco PN",    assetClass: "Renda Variável", operation: "buy",  quantity: 200,   unitPrice: 2770,     totalValue: 554000,  broker: "XP" },
    { id: 9,  date: "2024-09-05", ticker: "CDB110",  name: "CDB Itaú 110% CDI",   assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 650000,   totalValue: 650000,  broker: "Itaú" },
    { id: 8,  date: "2024-08-14", ticker: "BTC",     name: "Bitcoin",             assetClass: "Cripto",         operation: "buy",  quantity: 0.001, unitPrice: 56000000, totalValue: 56000,   broker: "Mercado Bitcoin" },
    { id: 7,  date: "2024-07-22", ticker: "MXRF11",  name: "Maxi Renda FII",      assetClass: "FII",            operation: "buy",  quantity: 120,   unitPrice: 1025,     totalValue: 123000,  broker: "NuInvest" },
    { id: 6,  date: "2024-07-03", ticker: "PETR4",   name: "Petrobras PN",        assetClass: "Renda Variável", operation: "buy",  quantity: 60,    unitPrice: 3950,     totalValue: 237000,  broker: "XP" },
    { id: 5,  date: "2024-06-18", ticker: "VALE3",   name: "Vale ON",             assetClass: "Renda Variável", operation: "buy",  quantity: 80,    unitPrice: 6240,     totalValue: 499200,  broker: "XP" },
    { id: 4,  date: "2024-05-10", ticker: "IVVB11",  name: "iShares S&P 500",     assetClass: "Internacional",  operation: "buy",  quantity: 20,    unitPrice: 28900,    totalValue: 578000,  broker: "XP" },
    { id: 3,  date: "2024-04-02", ticker: "SELIC29", name: "Tesouro Selic 2029",  assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 1320000,  totalValue: 1320000, broker: "NuInvest" },
    { id: 2,  date: "2024-03-12", ticker: "HGLG11",  name: "CSHG Logística FII",  assetClass: "FII",            operation: "buy",  quantity: 20,    unitPrice: 15100,    totalValue: 302000,  broker: "XP" },
    { id: 1,  date: "2024-03-05", ticker: "PETR4",   name: "Petrobras PN",        assetClass: "Renda Variável", operation: "buy",  quantity: 50,    unitPrice: 3720,     totalValue: 186000,  broker: "XP" },
  ],
  monthlyPoints: [
    { label: "Out/25", bought: 174000,  sold: 0       },
    { label: "Nov/25", bought: 102800,  sold: 0       },
    { label: "Dez/25", bought: 311000,  sold: 0       },
    { label: "Jan/26", bought: 1380000, sold: 0       },
    { label: "Fev/26", bought: 0,       sold: 126000  },
    { label: "Mar/26", bought: 0,       sold: 139000  },
    { label: "Abr/26", bought: 324000,  sold: 0       },
  ],
  summary: {
    totalBought: 9467700,
    totalSold:   1298000,
    buyCount:    23,
    sellCount:   7,
  },
};

export const useInvestmentLaunches = (startDate: string, finishDate: string) =>
  useQuery<InvestmentLaunchesResponse>({
    queryKey: ["analytics", "investment-launches", startDate, finishDate],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_INVESTMENT_LAUNCHES) : analyticsApi.getInvestmentLaunches(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

// ── Projections mock data ─────────────────────────────────────────────────────

const MOCK_NET_WORTH_PROJECTION: NetWorthProjectionResponse = {
  currentNetWorth: 10875000,
  monthlyAvgGrowth: 409167,
  monthsUntilZero: null,
  monthsUntilTarget: 17,
  targetAmount: 18000000,
  historical: [
    { year: 2025, month: 5,  netWorth: 6840000  },
    { year: 2025, month: 6,  netWorth: 7220000  },
    { year: 2025, month: 7,  netWorth: 7600000  },
    { year: 2025, month: 8,  netWorth: 7980000  },
    { year: 2025, month: 9,  netWorth: 8190000  },
    { year: 2025, month: 10, netWorth: 8420000  },
    { year: 2025, month: 11, netWorth: 8810000  },
    { year: 2025, month: 12, netWorth: 9150000  },
    { year: 2026, month: 1,  netWorth: 9510000  },
    { year: 2026, month: 2,  netWorth: 9950000  },
    { year: 2026, month: 3,  netWorth: 10370000 },
    { year: 2026, month: 4,  netWorth: 10875000 },
  ],
  projected: [
    { year: 2026, month: 5,  netWorth: 11284167  },
    { year: 2026, month: 6,  netWorth: 11693334  },
    { year: 2026, month: 7,  netWorth: 12102501  },
    { year: 2026, month: 8,  netWorth: 12511668  },
    { year: 2026, month: 9,  netWorth: 12920835  },
    { year: 2026, month: 10, netWorth: 13330002  },
    { year: 2026, month: 11, netWorth: 13739169  },
    { year: 2026, month: 12, netWorth: 14148336  },
    { year: 2027, month: 1,  netWorth: 14557503  },
    { year: 2027, month: 2,  netWorth: 14966670  },
    { year: 2027, month: 3,  netWorth: 15375837  },
    { year: 2027, month: 4,  netWorth: 15785004  },
    { year: 2027, month: 5,  netWorth: 16194171  },
    { year: 2027, month: 6,  netWorth: 16603338  },
    { year: 2027, month: 7,  netWorth: 17012505  },
    { year: 2027, month: 8,  netWorth: 17421672  },
    { year: 2027, month: 9,  netWorth: 17830839  },
    { year: 2027, month: 10, netWorth: 18240006  },
    { year: 2027, month: 11, netWorth: 18649173  },
    { year: 2027, month: 12, netWorth: 19058340  },
    { year: 2028, month: 1,  netWorth: 19467507  },
    { year: 2028, month: 2,  netWorth: 19876674  },
    { year: 2028, month: 3,  netWorth: 20285841  },
    { year: 2028, month: 4,  netWorth: 20695008  },
  ],
};

const MOCK_CATEGORY_PROJECTION: CategoryProjection[] = [
  { categoryId: 1, categoryName: "Moradia",     spentSoFar: 243390, projectedTotal: 243390, historicalMonthlyAvg: 241000, monthElapsedPercent: 100, spentPercent: 101.0 },
  { categoryId: 2, categoryName: "Alimentação", spentSoFar: 45000,  projectedTotal: 62400,  historicalMonthlyAvg: 66000,  monthElapsedPercent: 65,  spentPercent: 68.2  },
  { categoryId: 3, categoryName: "Transporte",  spentSoFar: 31200,  projectedTotal: 50200,  historicalMonthlyAvg: 50500,  monthElapsedPercent: 65,  spentPercent: 61.8  },
  { categoryId: 4, categoryName: "Saúde",       spentSoFar: 38760,  projectedTotal: 38760,  historicalMonthlyAvg: 40500,  monthElapsedPercent: 65,  spentPercent: 95.7  },
  { categoryId: 5, categoryName: "Lazer",       spentSoFar: 29480,  projectedTotal: 38100,  historicalMonthlyAvg: 28000,  monthElapsedPercent: 65,  spentPercent: 105.3 },
  { categoryId: 6, categoryName: "Educação",    spentSoFar: 25000,  projectedTotal: 25000,  historicalMonthlyAvg: 25000,  monthElapsedPercent: 65,  spentPercent: 100.0 },
];

const MOCK_PASSIVE_INCOME: PassiveIncomeProjectionResponse = {
  currentMonthlyPassiveIncome: 34000,
  projectedAnnualPassiveIncome: 408000,
  monthlyLivingCost: 514007,
  coveragePercent: 6.6,
  monthsUntilFinancialFreedom: null,
  history: [
    { year: 2025, month: 5,  passiveIncome: 18000, livingCost: 480000 },
    { year: 2025, month: 6,  passiveIncome: 22000, livingCost: 470000 },
    { year: 2025, month: 7,  passiveIncome: 24000, livingCost: 510000 },
    { year: 2025, month: 8,  passiveIncome: 26000, livingCost: 495000 },
    { year: 2025, month: 9,  passiveIncome: 28000, livingCost: 500000 },
    { year: 2025, month: 10, passiveIncome: 29000, livingCost: 510000 },
    { year: 2025, month: 11, passiveIncome: 26000, livingCost: 490000 },
    { year: 2025, month: 12, passiveIncome: 29000, livingCost: 620000 },
    { year: 2026, month: 1,  passiveIncome: 29000, livingCost: 530000 },
    { year: 2026, month: 2,  passiveIncome: 32000, livingCost: 470000 },
    { year: 2026, month: 3,  passiveIncome: 34000, livingCost: 505000 },
    { year: 2026, month: 4,  passiveIncome: 36000, livingCost: 482050 },
  ],
  projected: Array.from({ length: 24 }, (_, i) => ({
    year:         new Date(2026, 4 + i).getFullYear(),
    month:        new Date(2026, 4 + i).getMonth() + 1,
    passiveIncome: Math.round(36000 * Math.pow(1.02, i + 1)),
    livingCost:   514007,
  })),
};

const MOCK_MILESTONES: FinancialMilestonesResponse = {
  milestones: [
    { label: "Início da jornada",       date: "2023-03-01", netWorthAtDate: 120000,    type: "journey_start"       },
    { label: "Primeiro investimento",   date: "2024-03-05", netWorthAtDate: 3400000,   type: "investment_start"    },
    { label: "Patrimônio R$ 1k",        date: "2023-04-01", netWorthAtDate: 100000,    type: "net_worth_milestone" },
    { label: "Patrimônio R$ 5k",        date: "2023-07-01", netWorthAtDate: 500000,    type: "net_worth_milestone" },
    { label: "Patrimônio R$ 10k",       date: "2023-11-01", netWorthAtDate: 1000000,   type: "net_worth_milestone" },
    { label: "Patrimônio R$ 25k",       date: "2024-05-01", netWorthAtDate: 2500000,   type: "net_worth_milestone" },
    { label: "Patrimônio R$ 50k",       date: "2024-09-01", netWorthAtDate: 5000000,   type: "net_worth_milestone" },
    { label: "Patrimônio R$ 100k",      date: "2025-10-01", netWorthAtDate: 10000000,  type: "net_worth_milestone" },
    { label: "9 meses consecutivos poupando", date: "2025-12-01", netWorthAtDate: 9150000, type: "savings_streak" },
  ],
  timeline: [
    { year: 2023, month: 3,  netWorth: 120000   },
    { year: 2023, month: 4,  netWorth: 250000   },
    { year: 2023, month: 5,  netWorth: 420000   },
    { year: 2023, month: 6,  netWorth: 610000   },
    { year: 2023, month: 7,  netWorth: 830000   },
    { year: 2023, month: 8,  netWorth: 1050000  },
    { year: 2023, month: 9,  netWorth: 1290000  },
    { year: 2023, month: 10, netWorth: 1540000  },
    { year: 2023, month: 11, netWorth: 1800000  },
    { year: 2023, month: 12, netWorth: 2100000  },
    { year: 2024, month: 1,  netWorth: 2380000  },
    { year: 2024, month: 2,  netWorth: 2700000  },
    { year: 2024, month: 3,  netWorth: 3400000  },
    { year: 2024, month: 4,  netWorth: 3900000  },
    { year: 2024, month: 5,  netWorth: 4500000  },
    { year: 2024, month: 6,  netWorth: 5100000  },
    { year: 2024, month: 7,  netWorth: 5700000  },
    { year: 2024, month: 8,  netWorth: 5900000  },
    { year: 2024, month: 9,  netWorth: 6200000  },
    { year: 2024, month: 10, netWorth: 6500000  },
    { year: 2024, month: 11, netWorth: 6700000  },
    { year: 2024, month: 12, netWorth: 6900000  },
    { year: 2025, month: 1,  netWorth: 7100000  },
    { year: 2025, month: 2,  netWorth: 7300000  },
    { year: 2025, month: 3,  netWorth: 7500000  },
    { year: 2025, month: 4,  netWorth: 7650000  },
    { year: 2025, month: 5,  netWorth: 6840000  },
    { year: 2025, month: 6,  netWorth: 7220000  },
    { year: 2025, month: 7,  netWorth: 7600000  },
    { year: 2025, month: 8,  netWorth: 7980000  },
    { year: 2025, month: 9,  netWorth: 8190000  },
    { year: 2025, month: 10, netWorth: 8420000  },
    { year: 2025, month: 11, netWorth: 8810000  },
    { year: 2025, month: 12, netWorth: 9150000  },
    { year: 2026, month: 1,  netWorth: 9510000  },
    { year: 2026, month: 2,  netWorth: 9950000  },
    { year: 2026, month: 3,  netWorth: 10370000 },
    { year: 2026, month: 4,  netWorth: 10875000 },
  ],
};

// ── Projection hooks ──────────────────────────────────────────────────────────

export const useNetWorthProjection = (projectionMonths = 24) =>
  useQuery<NetWorthProjectionResponse>({
    queryKey: ["analytics", "net-worth-projection", projectionMonths],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_NET_WORTH_PROJECTION) : analyticsApi.getNetWorthProjection(projectionMonths),
    staleTime: 5 * 60 * 1000,
  });

export const useCategoryProjection = (lookbackMonths = 3) =>
  useQuery<CategoryProjection[]>({
    queryKey: ["analytics", "category-projection", lookbackMonths],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_CATEGORY_PROJECTION) : analyticsApi.getCategoryProjection(lookbackMonths),
    staleTime: 5 * 60 * 1000,
  });

export const usePassiveIncomeProjection = (projectionMonths = 24) =>
  useQuery<PassiveIncomeProjectionResponse>({
    queryKey: ["analytics", "passive-income-projection", projectionMonths],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_PASSIVE_INCOME) : analyticsApi.getPassiveIncomeProjection(projectionMonths),
    staleTime: 5 * 60 * 1000,
  });

export const useFinancialMilestones = () =>
  useQuery<FinancialMilestonesResponse>({
    queryKey: ["analytics", "milestones"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_MILESTONES) : analyticsApi.getFinancialMilestones(),
    staleTime: 5 * 60 * 1000,
  });

// ── Portfolio composition projection mock ────────────────────────────────────

const ASSET_CLASSES = ["Renda Fixa", "Renda Variável", "FII", "Internacional", "Cripto"] as const;

// Base values (cents) for each class at month 0 (May 2025)
const BASE_VALUES: Record<string, number> = {
  "Renda Fixa":    3200000,
  "Renda Variável": 2100000,
  "FII":            980000,
  "Internacional":  650000,
  "Cripto":         310000,
};

// Monthly growth rates for historical reconstruction
const HIST_RATES: Record<string, number> = {
  "Renda Fixa":    0.012,
  "Renda Variável": 0.018,
  "FII":            0.010,
  "Internacional":  0.022,
  "Cripto":         0.030,
};

// Monthly growth rates used in the projection (slightly smoother)
const PROJ_RATES: Record<string, number> = {
  "Renda Fixa":    0.011,
  "Renda Variável": 0.016,
  "FII":            0.009,
  "Internacional":  0.020,
  "Cripto":         0.025,
};

const MOCK_PORTFOLIO_COMPOSITION: PortfolioCompositionProjectionResponse = (() => {
  const data: PortfolioCompositionProjectionResponse["data"] = [];

  // 12 historical months: May 2025 → Apr 2026
  const histMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2025, 4 + i);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const cur = { ...BASE_VALUES };
  for (const { year, month } of histMonths) {
    data.push({
      year,
      month,
      isProjected: false,
      breakdown: ASSET_CLASSES.map((cls) => ({ assetClass: cls, value: Math.round(cur[cls]) })),
    });
    for (const cls of ASSET_CLASSES) cur[cls] *= 1 + HIST_RATES[cls];
  }

  // 12 projected months: May 2026 → Apr 2027
  const projMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, 4 + i);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  for (const { year, month } of projMonths) {
    for (const cls of ASSET_CLASSES) cur[cls] *= 1 + PROJ_RATES[cls];
    data.push({
      year,
      month,
      isProjected: true,
      breakdown: ASSET_CLASSES.map((cls) => ({ assetClass: cls, value: Math.round(cur[cls]) })),
    });
  }

  return { data, assetClasses: [...ASSET_CLASSES] };
})();

export const usePortfolioCompositionProjection = (projectionMonths = 12) =>
  useQuery<PortfolioCompositionProjectionResponse>({
    queryKey: ["analytics", "portfolio-composition-projection", projectionMonths],
    queryFn: () => USE_MOCK
      ? Promise.resolve(MOCK_PORTFOLIO_COMPOSITION)
      : analyticsApi.getPortfolioCompositionProjection(projectionMonths),
    staleTime: 5 * 60 * 1000,
  });

// ── Real net worth mock ───────────────────────────────────────────────────────

// IPCA ~0.6% p.m. (≈7.4% a.a.) — accumulates over 12 months
const MOCK_REAL_NET_WORTH: RealNetWorthResponse = (() => {
  const nominalBase    = 6840000;
  const nominalGrowth  = 336000; // avg monthly nominal growth (cents)
  const monthlyIpca    = 0.006;  // ~0.6% per month

  const points: RealNetWorthResponse["points"] = [];
  let accInflation = 0;

  const startMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2025, 4 + i);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  for (let i = 0; i < startMonths.length; i++) {
    const { year, month } = startMonths[i];
    const nominal = nominalBase + nominalGrowth * i;

    if (i > 0) accInflation = (1 + accInflation) * (1 + monthlyIpca) - 1;

    const real = Math.round(nominal / (1 + accInflation));
    points.push({
      year,
      month,
      nominalNetWorth: nominal,
      realNetWorth: real,
      accumulatedInflationPct: Math.round(accInflation * 10000) / 100,
    });
  }

  const first = points[0];
  const last  = points[points.length - 1];
  const totalNominalGrowthPct = Math.round((last.nominalNetWorth - first.nominalNetWorth) / Math.abs(first.nominalNetWorth) * 10000) / 100;
  const totalRealGrowthPct    = Math.round((last.realNetWorth    - first.realNetWorth)    / Math.abs(first.realNetWorth)    * 10000) / 100;
  const totalInflationPct     = last.accumulatedInflationPct;

  return { points, totalNominalGrowthPct, totalRealGrowthPct, totalInflationPct };
})();

export const useRealNetWorth = () =>
  useQuery<RealNetWorthResponse>({
    queryKey: ["analytics", "real-net-worth"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_REAL_NET_WORTH) : analyticsApi.getRealNetWorth(),
    staleTime: 5 * 60 * 1000,
  });
