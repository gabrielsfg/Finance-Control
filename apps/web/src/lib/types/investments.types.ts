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
  | "Moeda"
  | "Index"
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
  /** Account the cash side of the operation was booked against. */
  accountId: number;
  /** Whether the operation moved money in that account. */
  hasLinkedTransaction: boolean;
  /** Whether that movement counts against the active budget. */
  includeInBudget: boolean;
  /** Tags on that movement. */
  tags: string[];
};

export type InvestmentDividend = {
  id: number;
  investmentId: number;
  ticker: string;
  date: string;
  amount: number;
  type: DividendType;
};

/** What a fixed-income position earns against. */
export type YieldIndex = "Cdi" | "Ipca" | "Prefixed";

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
  /**
   * Whether the operation also moves money in the account. False when registering a
   * position bought long ago, whose cash movement is not part of this ledger.
   */
  createLinkedTransaction: boolean;
  /** Whether that movement counts against the active budget. */
  includeInBudget?: boolean;
  /** Tags for that movement, same names the transaction form uses. */
  tags?: string[];
  /**
   * Register against a NEW asset even when the ticker already exists, suffixing it
   * (CDB → CDB-2). Two CDBs share a name but not a rate, a maturity or a position.
   */
  forceNewAsset?: boolean;
  /** Fixed income only: what the position earns against, since nobody quotes a CDB. */
  yieldIndex?: YieldIndex;
  /** The rate paired with yieldIndex — 110 for "110% do CDI". */
  yieldRatePct?: number;
  maturityDate?: string;
};

/** Edits an operation already registered. The asset it belongs to is not editable. */
export type UpdateInvestmentTransactionRequest = {
  operation: InvestmentOperation;
  date: string;
  quantity: number;
  unitPrice: number;
  otherCosts: number;
  accountId: number;
  createLinkedTransaction: boolean;
  includeInBudget: boolean;
  tags: string[];
};

export type CreateInvestmentDividendRequest = {
  investmentId: number;
  /** Must match the API's `PaymentDate`; sending `date` left the payout with no date at all. */
  paymentDate: string;
  amount: number;
  type: DividendType;
  accountId: number;
  /** False when the payout was already received and is in the ledger already. */
  createLinkedTransaction: boolean;
};

export type UpdateInvestmentPriceRequest = {
  currentPrice: number;
};

// Legacy alias kept for components that still reference InvestmentSummary
export type InvestmentSummary = InvestmentPortfolio & {
  // map legacy field names used by existing components
  investments: Investment[];
};
