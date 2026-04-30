export type AssetClass = "Renda Fixa" | "Renda Variável" | "FII" | "Cripto" | "Internacional";

export type Investment = {
  id: number;
  name: string;
  ticker: string;
  assetClass: AssetClass;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  return: number;
  returnPercent: number;
  color: string;
};

export type InvestmentSummary = {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  allocations: { assetClass: AssetClass; value: number; percent: number; color: string }[];
  investments: Investment[];
};
