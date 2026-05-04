// ── /api/analytics/summary ───────────────────────────────────────────────────
export type MonthSummary = {
  month: number;
  year: number;
  label: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export type CategoryBreakdown = {
  categoryId: number;
  categoryName: string;
  color: string | null;
  totalSpent: number;
  percent: number;
  change: number | null; // null = sem período anterior para comparar
};

export type CategoryBreakdownResult = {
  maxSpent: number;
  items: CategoryBreakdown[];
};

export type AnalyticsSummaryResponse = {
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  avgMonthlyBalance: number;
  bestMonth: MonthSummary;
  worstMonth: MonthSummary;
  categoryBreakdown: CategoryBreakdownResult;
};

// ── /api/analytics/income-expense ────────────────────────────────────────────
export type MonthlyData = {
  month: number;
  year: number;
  label: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

// ── /api/analytics/spending-heatmap ──────────────────────────────────────────
export type DayHeatmapState =
  | "Empty"
  | "Expense1" | "Expense2" | "Expense3" | "Expense4"
  | "Income1"  | "Income2"  | "Income3"  | "Income4";

export type DaySpend = {
  date: string;
  total: number;  // expense (centavos)
  income: number; // income (centavos)
  net: number;    // income - expense (centavos)
  state: DayHeatmapState;
};

// ── /api/analytics/category-evolution ────────────────────────────────────────
export type CategoryMonthlyData = {
  label: string;
  [categoryName: string]: number | string;
};

// ── /api/analytics/net-worth-evolution ───────────────────────────────────────
export type NetWorthPoint = {
  label: string;
  netWorth: number;
  assets: number;
  liabilities: number;
};

// ── Investments (from investments feature) ────────────────────────────────────
export type InvestmentEvolutionPoint = {
  label: string;
  totalValue: number;
  totalInvested: number;
  returns: number;
  dividends: number;
};

export type InvestmentEvolutionResponse = {
  data: InvestmentEvolutionPoint[];
  returnPct: number | null;
  cumulativeDividends: number;
};

// ── /api/analytics/projection/net-worth ──────────────────────────────────────
export type ProjectionPoint = {
  label: string;
  conservative: number;
  moderate: number;
  optimistic: number;
};

// ── Investment profitability ──────────────────────────────────────────────────
export type ProfitabilityTotals = {
  allTime: { returnPct: number; vsCdiPct: number };
  last12Months: { returnPct: number; vsCdiPct: number };
  lastMonth: { returnPct: number; vsCdiPct: number };
};

export type MonthlyReturnRow = {
  month: number;
  // returnPct in basis points (e.g. 71 = 0.71%)
  returnBps: number | null;
};

export type AnnualReturnRow = {
  year: number;
  months: MonthlyReturnRow[]; // always 12 entries, null if no data
  annualReturnBps: number | null;
};

export type AnnualReturnsResponse = {
  rows: AnnualReturnRow[];
  monthlyCumulatives: (number | null)[]; // 12 entries
  grandTotal: number;
};

export type ProfitabilityVsCdiPoint = {
  label: string;
  portfolioPct: number; // e.g. 0.71
  cdiPct: number;
};

// ── /api/analytics/projection/net-worth ──────────────────────────────────────
export type NetWorthProjectionPoint = {
  month: number;
  year: number;
  netWorth: number;
};

export type NetWorthProjectionResponse = {
  currentNetWorth: number;
  monthlyAvgGrowth: number;
  monthsUntilZero: number | null;
  monthsUntilTarget: number | null;
  targetAmount: number | null;
  historical: NetWorthProjectionPoint[];
  projected: NetWorthProjectionPoint[];
};

// ── /api/analytics/projection/categories ─────────────────────────────────────
export type CategoryProjection = {
  categoryId: number;
  categoryName: string;
  spentSoFar: number;
  projectedTotal: number;
  historicalMonthlyAvg: number;
  monthElapsedPercent: number;
  spentPercent: number;
};

// ── /api/analytics/projection/passive-income ─────────────────────────────────
export type PassiveIncomeMonth = {
  year: number;
  month: number;
  passiveIncome: number;
  livingCost: number;
};

export type PassiveIncomeProjectionResponse = {
  currentMonthlyPassiveIncome: number;
  projectedAnnualPassiveIncome: number;
  monthlyLivingCost: number;
  coveragePercent: number;
  monthsUntilFinancialFreedom: number | null;
  history: PassiveIncomeMonth[];
  projected: PassiveIncomeMonth[];
};

// ── /api/analytics/milestones ─────────────────────────────────────────────────
export type FinancialMilestone = {
  label: string;
  date: string; // ISO date
  netWorthAtDate: number;
  type: "journey_start" | "investment_start" | "net_worth_milestone" | "peak" | "savings_streak";
};

export type NetWorthTimelinePoint = {
  year: number;
  month: number;
  netWorth: number;
};

export type FinancialMilestonesResponse = {
  milestones: FinancialMilestone[];
  timeline: NetWorthTimelinePoint[];
};

// ── /api/analytics/projection/portfolio-composition ──────────────────────────
export type AssetClassValue = { assetClass: string; value: number; };
export type PortfolioCompositionMonth = {
  year: number;
  month: number;
  isProjected: boolean;
  breakdown: AssetClassValue[];
};
export type PortfolioCompositionProjectionResponse = {
  data: PortfolioCompositionMonth[];
  assetClasses: string[];
};

// ── /api/analytics/real-net-worth ────────────────────────────────────────────
export type RealNetWorthPoint = {
  year: number;
  month: number;
  nominalNetWorth: number;
  realNetWorth: number;
  accumulatedInflationPct: number;
};
export type RealNetWorthResponse = {
  points: RealNetWorthPoint[];
  totalNominalGrowthPct: number;
  totalRealGrowthPct: number;
  totalInflationPct: number;
};

// ── Investment launches (buy/sell history) ────────────────────────────────────
export type InvestmentOperationType = "buy" | "sell";

export type InvestmentLaunch = {
  id: number;
  date: string; // ISO date
  ticker: string;
  name: string;
  assetClass: string;
  operation: InvestmentOperationType;
  quantity: number;
  unitPrice: number;    // cents
  totalValue: number;   // cents
  broker: string | null;
};

export type InvestmentLaunchMonthPoint = {
  label: string; // e.g. "Jan/26"
  bought: number; // cents
  sold: number;   // cents
};

export type InvestmentLaunchesSummary = {
  totalBought: number;
  totalSold: number;
  buyCount: number;
  sellCount: number;
};

export type InvestmentLaunchesResponse = {
  launches: InvestmentLaunch[]; // pre-sorted by date descending
  monthlyPoints: InvestmentLaunchMonthPoint[];
  summary: InvestmentLaunchesSummary;
};
