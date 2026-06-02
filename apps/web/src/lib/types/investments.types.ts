export type AssetType =
  | "Acao"
  | "FundoInvestimento"
  | "FII"
  | "Cripto"
  | "Stock"
  | "Reit"
  | "BDR"
  | "ETF"
  | "ETFInternacional"
  | "TesouroDireto"
  | "RendaFixa"
  | "Outro";

export type InvestmentOperation = "Buy" | "Sell";

export type DividendType =
  | "Dividend"
  | "JurosCapitalProprio"
  | "RendimentoFII"
  | "Cupom"
  | "Rendimento";

export type Investment = {
  id: number;
  ticker: string;
  name: string;
  assetType: AssetType;
  assetClass: string;
  broker: string | null;
  currentQuantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  previousClose: number | null;
  dayChangeAbs: number;
  dayChangePct: number;
  lastPriceUpdate: string | null;
  maturityDate: string | null;
  expectedYieldPct: number | null;
  accountId: number;
};

export type Allocation = {
  assetType: AssetType;
  assetClass: string;
  value: number;
  percent: number;
  color: string;
};

export type InvestmentPortfolio = {
  investments: Investment[];
  currentValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  allocations: Allocation[];
};

export type InvestmentTransaction = {
  id: number;
  investmentId: number;
  ticker: string;
  name: string;
  operation: InvestmentOperation;
  date: string;
  quantity: number;
  unitPrice: number;
  otherCosts: number;
  totalValue: number;
};

export type InvestmentDividend = {
  id: number;
  investmentId: number;
  ticker: string;
  date: string;
  amount: number;
  type: DividendType;
};

export type CreateInvestmentTransactionRequest = {
  ticker: string;
  name: string;
  assetType: AssetType;
  broker?: string;
  operation: InvestmentOperation;
  date: string;
  quantity: number;
  unitPrice: number;
  otherCosts: number;
  accountId: number;
};

export type CreateInvestmentDividendRequest = {
  investmentId: number;
  date: string;
  amount: number;
  type: DividendType;
  accountId: number;
};

export type UpdateInvestmentPriceRequest = {
  currentPrice: number;
};

// Legacy alias kept for components that still reference InvestmentSummary
export type InvestmentSummary = InvestmentPortfolio & {
  // map legacy field names used by existing components
  investments: Investment[];
};
