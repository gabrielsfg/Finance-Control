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
  change: number | null; // null = sem mês anterior para comparar
};

export type AnalyticsSummaryResponse = {
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  avgMonthlyBalance: number;
  bestMonth: MonthSummary;
  worstMonth: MonthSummary;
  categoryBreakdown: CategoryBreakdown[];
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
export type DaySpend = {
  date: string;
  total: number;   // expense (centavos)
  income?: number; // income (centavos), optional for backwards compat
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

export type ProfitabilityVsCdiPoint = {
  label: string;
  portfolioPct: number; // e.g. 0.71
  cdiPct: number;
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
