import type { AssetType } from "@/lib/types/investments.types";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  Acao: "Ação",
  FundoInvestimento: "Fundo de Investimento",
  FII: "FII",
  Cripto: "Cripto",
  Stock: "Stock",
  Reit: "REIT",
  BDR: "BDR",
  ETF: "ETF",
  ETFInternacional: "ETF Internacional",
  TesouroDireto: "Tesouro Direto",
  RendaFixa: "Renda Fixa",
  Moeda: "Moeda",
  Index: "Índice",
  Outro: "Outro",
};
