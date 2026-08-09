import { ASSET_TYPE_LABELS } from "@/features/investments/utils/assetLabels";
import {
  buildCsv,
  csvAmount,
  csvDate,
  csvFileName,
  csvNumber,
  downloadCsv,
  type CsvColumn,
} from "@/lib/utils/csv";
import type { Investment } from "@/lib/types/investments.types";

// Quantity is the one number here that is not money — crypto and fractional shares
// need the extra decimals that a currency format would round away.
const COLUMNS: CsvColumn<Investment>[] = [
  { header: "Ticker", value: (i) => i.ticker },
  { header: "Nome", value: (i) => i.name },
  { header: "Classe", value: (i) => i.assetClass },
  { header: "Tipo", value: (i) => ASSET_TYPE_LABELS[i.assetType] ?? i.assetType },
  { header: "Corretora", value: (i) => i.broker ?? "" },
  { header: "Quantidade", value: (i) => csvNumber(i.currentQuantity, 8) },
  { header: "Preço médio", value: (i) => csvAmount(i.averagePrice) },
  { header: "Preço atual", value: (i) => csvAmount(i.currentPrice) },
  { header: "Valor investido", value: (i) => csvAmount(i.totalInvested) },
  { header: "Valor atual", value: (i) => csvAmount(i.currentValue) },
  { header: "Resultado", value: (i) => csvAmount(i.totalReturn) },
  { header: "Resultado %", value: (i) => csvNumber(i.totalReturnPercent) },
  { header: "Vencimento", value: (i) => csvDate(i.maturityDate) },
  { header: "Cotação atualizada em", value: (i) => csvDate(i.lastPriceUpdate) },
];

export function exportInvestmentsToCsv(investments: Investment[]): void {
  downloadCsv(csvFileName("investimentos"), buildCsv(investments, COLUMNS));
}
