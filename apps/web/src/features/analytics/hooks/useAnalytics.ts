import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import type {
  AnalyticsSummaryResponse,
  MonthlyData,
  DaySpend,
  CategoryMonthlyData,
  NetWorthPoint,
  InvestmentEvolutionPoint,
  ProjectionPoint,
  ProfitabilityTotals,
  AnnualReturnRow,
  ProfitabilityVsCdiPoint,
  InvestmentLaunch,
  InvestmentLaunchMonthPoint,
} from "@/lib/types/analytics.types";

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY: AnalyticsSummaryResponse = {
  avgMonthlyIncome: 915714,
  avgMonthlyExpense: 514007,
  avgMonthlyBalance: 401707,
  bestMonth:  { month: 4, year: 2026, label: "Abril 2026",    totalIncome: 980000, totalExpense: 482050, balance: 497950 },
  worstMonth: { month: 12, year: 2025, label: "Dezembro 2025", totalIncome: 950000, totalExpense: 620000, balance: 330000 },
  categoryBreakdown: [
    { categoryId: 1, categoryName: "Moradia",     color: "#4A9EFF", totalSpent: 243390, percent: 49.2, change: 2.1 },
    { categoryId: 2, categoryName: "Alimentação", color: "#F5A623", totalSpent: 60230,  percent: 12.2, change: -8.4 },
    { categoryId: 3, categoryName: "Transporte",  color: "#00C98D", totalSpent: 48350,  percent: 9.8,  change: 5.3 },
    { categoryId: 4, categoryName: "Saúde",       color: "#F25F5C", totalSpent: 38760,  percent: 7.8,  change: -1.2 },
    { categoryId: 5, categoryName: "Lazer",       color: "#7C6FE0", totalSpent: 29480,  percent: 6.0,  change: 12.7 },
    { categoryId: 6, categoryName: "Educação",    color: "#F5CE42", totalSpent: 25000,  percent: 5.1,  change: null },
    { categoryId: 7, categoryName: "Pessoal",     color: "#00D4A0", totalSpent: 18900,  percent: 3.8,  change: -3.5 },
    { categoryId: 8, categoryName: "Outros",      color: "#8A95A3", totalSpent: 29940,  percent: 6.1,  change: 1.8 },
  ],
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
  { date: "2026-04-01", total: 12400,  income: 0       },
  { date: "2026-04-02", total: 0,      income: 0       },
  { date: "2026-04-03", total: 8900,   income: 0       },
  { date: "2026-04-04", total: 32100,  income: 0       },
  { date: "2026-04-05", total: 4200,   income: 320000  }, // salário — dia bem positivo
  { date: "2026-04-06", total: 5400,   income: 0       },
  { date: "2026-04-07", total: 18700,  income: 0       },
  { date: "2026-04-08", total: 7200,   income: 0       },
  { date: "2026-04-09", total: 0,      income: 0       },
  { date: "2026-04-10", total: 14300,  income: 0       },
  { date: "2026-04-11", total: 76500,  income: 0       },
  { date: "2026-04-12", total: 0,      income: 0       },
  { date: "2026-04-13", total: 9800,   income: 0       },
  { date: "2026-04-14", total: 0,      income: 45000   }, // renda extra
  { date: "2026-04-15", total: 4100,   income: 560000  }, // segundo salário — muito positivo
  { date: "2026-04-16", total: 12000,  income: 0       },
  { date: "2026-04-17", total: 31200,  income: 0       },
  { date: "2026-04-18", total: 6700,   income: 0       },
  { date: "2026-04-19", total: 0,      income: 0       },
  { date: "2026-04-20", total: 15800,  income: 28000   }, // pequena receita > gasto
  { date: "2026-04-21", total: 8300,   income: 0       },
  { date: "2026-04-22", total: 0,      income: 0       },
  { date: "2026-04-23", total: 44200,  income: 0       },
  { date: "2026-04-24", total: 11900,  income: 0       },
  { date: "2026-04-25", total: 3200,   income: 18000   }, // positivo leve
  { date: "2026-04-26", total: 28600,  income: 0       },
  { date: "2026-04-27", total: 5200,   income: 0       },
  { date: "2026-04-28", total: 0,      income: 0       },
  { date: "2026-04-29", total: 19100,  income: 0       },
  { date: "2026-04-30", total: 3400,   income: 0       },
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

const MOCK_INVESTMENT_EVOLUTION: InvestmentEvolutionPoint[] = [
  { label: "Out", totalValue: 4720000, totalInvested: 4500000, returns: 198000, dividends: 22000 },
  { label: "Nov", totalValue: 4840000, totalInvested: 4580000, returns: 234000, dividends: 26000 },
  { label: "Dez", totalValue: 4910000, totalInvested: 4660000, returns: 221000, dividends: 29000 },
  { label: "Jan", totalValue: 5020000, totalInvested: 4740000, returns: 251000, dividends: 29000 },
  { label: "Fev", totalValue: 5120000, totalInvested: 4780000, returns: 308000, dividends: 32000 },
  { label: "Mar", totalValue: 5230000, totalInvested: 4800000, returns: 396000, dividends: 34000 },
  { label: "Abr", totalValue: 5341800, totalInvested: 4820000, returns: 485800, dividends: 36000 },
];

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

const MOCK_ANNUAL_RETURNS: AnnualReturnRow[] = [
  {
    year: 2024,
    months: [
      { month: 1,  returnBps: 82  },
      { month: 2,  returnBps: 61  },
      { month: 3,  returnBps: 95  },
      { month: 4,  returnBps: 74  },
      { month: 5,  returnBps: 88  },
      { month: 6,  returnBps: 53  },
      { month: 7,  returnBps: 110 },
      { month: 8,  returnBps: 67  },
      { month: 9,  returnBps: 79  },
      { month: 10, returnBps: 91  },
      { month: 11, returnBps: 58  },
      { month: 12, returnBps: 103 },
    ],
    annualReturnBps: 961,
  },
  {
    year: 2025,
    months: [
      { month: 1,  returnBps: 75  },
      { month: 2,  returnBps: 69  },
      { month: 3,  returnBps: 88  },
      { month: 4,  returnBps: 92  },
      { month: 5,  returnBps: 71  },
      { month: 6,  returnBps: 84  },
      { month: 7,  returnBps: 96  },
      { month: 8,  returnBps: 63  },
      { month: 9,  returnBps: 79  },
      { month: 10, returnBps: 87  },
      { month: 11, returnBps: 94  },
      { month: 12, returnBps: 108 },
    ],
    annualReturnBps: 1006,
  },
  {
    year: 2026,
    months: [
      { month: 1,  returnBps: 80  },
      { month: 2,  returnBps: 74  },
      { month: 3,  returnBps: 91  },
      { month: 4,  returnBps: 71  },
      { month: 5,  returnBps: null },
      { month: 6,  returnBps: null },
      { month: 7,  returnBps: null },
      { month: 8,  returnBps: null },
      { month: 9,  returnBps: null },
      { month: 10, returnBps: null },
      { month: 11, returnBps: null },
      { month: 12, returnBps: null },
    ],
    annualReturnBps: 316,
  },
];

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

export const useAnalyticsSummary = (lookbackMonths = 7) =>
  useQuery<AnalyticsSummaryResponse>({
    queryKey: ["analytics", "summary", lookbackMonths],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_SUMMARY) : analyticsApi.getSummary(lookbackMonths),
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

export const useAnalyticsInvestmentEvolution = () =>
  useQuery<InvestmentEvolutionPoint[]>({
    queryKey: ["analytics", "investment-evolution"],
    queryFn: () => Promise.resolve(MOCK_INVESTMENT_EVOLUTION),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsProjections = () =>
  useQuery<ProjectionPoint[]>({
    queryKey: ["analytics", "projections"],
    queryFn: () => Promise.resolve(MOCK_PROJECTIONS),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentProfitabilityTotals = () =>
  useQuery<ProfitabilityTotals>({
    queryKey: ["analytics", "investment-profitability-totals"],
    queryFn: () => Promise.resolve(MOCK_PROFITABILITY_TOTALS),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentAnnualReturns = () =>
  useQuery<AnnualReturnRow[]>({
    queryKey: ["analytics", "investment-annual-returns"],
    queryFn: () => Promise.resolve(MOCK_ANNUAL_RETURNS),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentProfitabilityVsCdi = () =>
  useQuery<ProfitabilityVsCdiPoint[]>({
    queryKey: ["analytics", "investment-vs-cdi"],
    queryFn: () => Promise.resolve(MOCK_PROFITABILITY_VS_CDI),
    staleTime: 5 * 60 * 1000,
  });

const MOCK_INVESTMENT_LAUNCHES: InvestmentLaunch[] = [
  { id: 1,  date: "2024-03-05", ticker: "PETR4",  name: "Petrobras PN",       assetClass: "Renda Variável", operation: "buy",  quantity: 50,    unitPrice: 3720,     totalValue: 186000,   broker: "XP" },
  { id: 2,  date: "2024-03-12", ticker: "HGLG11", name: "CSHG Logística FII", assetClass: "FII",            operation: "buy",  quantity: 20,    unitPrice: 15100,    totalValue: 302000,   broker: "XP" },
  { id: 3,  date: "2024-04-02", ticker: "SELIC29", name: "Tesouro Selic 2029",assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 1320000,  totalValue: 1320000,  broker: "NuInvest" },
  { id: 4,  date: "2024-05-10", ticker: "IVVB11", name: "iShares S&P 500",    assetClass: "Internacional",  operation: "buy",  quantity: 20,    unitPrice: 28900,    totalValue: 578000,   broker: "XP" },
  { id: 5,  date: "2024-06-18", ticker: "VALE3",  name: "Vale ON",            assetClass: "Renda Variável", operation: "buy",  quantity: 80,    unitPrice: 6240,     totalValue: 499200,   broker: "XP" },
  { id: 6,  date: "2024-07-03", ticker: "PETR4",  name: "Petrobras PN",       assetClass: "Renda Variável", operation: "buy",  quantity: 60,    unitPrice: 3950,     totalValue: 237000,   broker: "XP" },
  { id: 7,  date: "2024-07-22", ticker: "MXRF11", name: "Maxi Renda FII",     assetClass: "FII",            operation: "buy",  quantity: 120,   unitPrice: 1025,     totalValue: 123000,   broker: "NuInvest" },
  { id: 8,  date: "2024-08-14", ticker: "BTC",    name: "Bitcoin",            assetClass: "Cripto",         operation: "buy",  quantity: 0.001, unitPrice: 56000000, totalValue: 56000,    broker: "Mercado Bitcoin" },
  { id: 9,  date: "2024-09-05", ticker: "CDB110", name: "CDB Itaú 110% CDI",  assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 650000,   totalValue: 650000,   broker: "Itaú" },
  { id: 10, date: "2024-10-11", ticker: "ITUB4",  name: "Itaú Unibanco PN",   assetClass: "Renda Variável", operation: "buy",  quantity: 200,   unitPrice: 2770,     totalValue: 554000,   broker: "XP" },
  { id: 11, date: "2024-10-28", ticker: "HGLG11", name: "CSHG Logística FII", assetClass: "FII",            operation: "buy",  quantity: 40,    unitPrice: 15550,    totalValue: 622000,   broker: "XP" },
  { id: 12, date: "2024-11-06", ticker: "VALE3",  name: "Vale ON",            assetClass: "Renda Variável", operation: "sell", quantity: 30,    unitPrice: 6100,     totalValue: 183000,   broker: "XP" },
  { id: 13, date: "2024-12-03", ticker: "IVVB11", name: "iShares S&P 500",    assetClass: "Internacional",  operation: "buy",  quantity: 20,    unitPrice: 30200,    totalValue: 604000,   broker: "XP" },
  { id: 14, date: "2024-12-17", ticker: "BTC",    name: "Bitcoin",            assetClass: "Cripto",         operation: "buy",  quantity: 0.001, unitPrice: 58000000, totalValue: 58000,    broker: "Mercado Bitcoin" },
  { id: 15, date: "2025-01-08", ticker: "MXRF11", name: "Maxi Renda FII",     assetClass: "FII",            operation: "buy",  quantity: 80,    unitPrice: 1030,     totalValue: 82400,    broker: "NuInvest" },
  { id: 16, date: "2025-02-14", ticker: "PETR4",  name: "Petrobras PN",       assetClass: "Renda Variável", operation: "sell", quantity: 40,    unitPrice: 4050,     totalValue: 162000,   broker: "XP" },
  { id: 17, date: "2025-03-20", ticker: "SELIC29", name: "Tesouro Selic 2029",assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 1360000,  totalValue: 1360000,  broker: "NuInvest" },
  { id: 18, date: "2025-04-07", ticker: "ITUB4",  name: "Itaú Unibanco PN",   assetClass: "Renda Variável", operation: "buy",  quantity: 50,    unitPrice: 2810,     totalValue: 140500,   broker: "XP" },
  { id: 19, date: "2025-05-15", ticker: "IVVB11", name: "iShares S&P 500",    assetClass: "Internacional",  operation: "sell", quantity: 10,    unitPrice: 30800,    totalValue: 308000,   broker: "XP" },
  { id: 20, date: "2025-06-03", ticker: "CDB110", name: "CDB Itaú 110% CDI",  assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 680000,   totalValue: 680000,   broker: "Itaú" },
  { id: 21, date: "2025-07-11", ticker: "PETR4",  name: "Petrobras PN",       assetClass: "Renda Variável", operation: "buy",  quantity: 80,    unitPrice: 3860,     totalValue: 308800,   broker: "XP" },
  { id: 22, date: "2025-08-22", ticker: "HGLG11", name: "CSHG Logística FII", assetClass: "FII",            operation: "sell", quantity: 20,    unitPrice: 15900,    totalValue: 318000,   broker: "XP" },
  { id: 23, date: "2025-09-10", ticker: "BTC",    name: "Bitcoin",            assetClass: "Cripto",         operation: "sell", quantity: 0.001, unitPrice: 63000000, totalValue: 63000,    broker: "Mercado Bitcoin" },
  { id: 24, date: "2025-10-05", ticker: "VALE3",  name: "Vale ON",            assetClass: "Renda Variável", operation: "buy",  quantity: 30,    unitPrice: 5800,     totalValue: 174000,   broker: "XP" },
  { id: 25, date: "2025-11-18", ticker: "MXRF11", name: "Maxi Renda FII",     assetClass: "FII",            operation: "buy",  quantity: 100,   unitPrice: 1028,     totalValue: 102800,   broker: "NuInvest" },
  { id: 26, date: "2025-12-02", ticker: "IVVB11", name: "iShares S&P 500",    assetClass: "Internacional",  operation: "buy",  quantity: 10,    unitPrice: 31100,    totalValue: 311000,   broker: "XP" },
  { id: 27, date: "2026-01-09", ticker: "SELIC29", name: "Tesouro Selic 2029",assetClass: "Renda Fixa",     operation: "buy",  quantity: 1,     unitPrice: 1380000,  totalValue: 1380000,  broker: "NuInvest" },
  { id: 28, date: "2026-02-14", ticker: "PETR4",  name: "Petrobras PN",       assetClass: "Renda Variável", operation: "sell", quantity: 30,    unitPrice: 4200,     totalValue: 126000,   broker: "XP" },
  { id: 29, date: "2026-03-06", ticker: "ITUB4",  name: "Itaú Unibanco PN",   assetClass: "Renda Variável", operation: "sell", quantity: 50,    unitPrice: 2780,     totalValue: 139000,   broker: "XP" },
  { id: 30, date: "2026-04-17", ticker: "HGLG11", name: "CSHG Logística FII", assetClass: "FII",            operation: "buy",  quantity: 20,    unitPrice: 16200,    totalValue: 324000,   broker: "XP" },
];

const MOCK_LAUNCH_MONTH_POINTS: InvestmentLaunchMonthPoint[] = [
  { label: "Out/25", bought: 174000,  sold: 0       },
  { label: "Nov/25", bought: 102800,  sold: 0       },
  { label: "Dez/25", bought: 311000,  sold: 0       },
  { label: "Jan/26", bought: 1380000, sold: 0       },
  { label: "Fev/26", bought: 0,       sold: 126000  },
  { label: "Mar/26", bought: 0,       sold: 139000  },
  { label: "Abr/26", bought: 324000,  sold: 0       },
];

export const useInvestmentLaunches = () =>
  useQuery<InvestmentLaunch[]>({
    queryKey: ["analytics", "investment-launches"],
    queryFn: () => Promise.resolve(MOCK_INVESTMENT_LAUNCHES),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentLaunchMonthPoints = () =>
  useQuery<InvestmentLaunchMonthPoint[]>({
    queryKey: ["analytics", "investment-launch-month-points"],
    queryFn: () => Promise.resolve(MOCK_LAUNCH_MONTH_POINTS),
    staleTime: 5 * 60 * 1000,
  });
