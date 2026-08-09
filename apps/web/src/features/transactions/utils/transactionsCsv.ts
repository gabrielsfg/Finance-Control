import {
  buildCsv,
  csvAmount,
  csvDate,
  csvFileName,
  downloadCsv,
  type CsvColumn,
} from "@/lib/utils/csv";
import type {
  PaymentMethod,
  PaymentType,
  TransactionItem,
  TransactionType,
} from "@/lib/types/transactions.types";

const TYPE_LABELS: Record<TransactionType, string> = {
  Income: "Receita",
  Expense: "Despesa",
  Transfer: "Transferência",
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  OneTime: "Avulso",
  Installment: "Parcelado",
  Recurring: "Recorrente",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Debit: "Débito",
  Credit: "Crédito",
};

/**
 * The sheet is for reconciliation, so the value carries its sign instead of hiding it
 * in a type column: money out is negative, money in is positive, and a column of them
 * sums to the period's balance without the user writing a formula.
 */
function signedAmount(transaction: TransactionItem): string {
  const sign = transaction.type === "Income" ? 1 : -1;
  return csvAmount(sign * transaction.value);
}

// Ids are useless in a spreadsheet — every reference is exported as the name the user
// gave it.
const COLUMNS: CsvColumn<TransactionItem>[] = [
  { header: "Data", value: (t) => csvDate(t.transactionDate) },
  { header: "Descrição", value: (t) => t.description },
  { header: "Tipo", value: (t) => TYPE_LABELS[t.type] },
  { header: "Valor", value: signedAmount },
  { header: "Categoria", value: (t) => t.categoryName },
  { header: "Subcategoria", value: (t) => t.subCategoryName },
  { header: "Conta", value: (t) => t.accountName },
  { header: "Conta destino", value: (t) => t.destinationAccountName ?? "" },
  { header: "Forma de pagamento", value: (t) => (t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod] : "") },
  { header: "Tipo de pagamento", value: (t) => PAYMENT_TYPE_LABELS[t.paymentType] },
  {
    header: "Parcela",
    value: (t) => (t.installmentNumber && t.totalInstallments ? `${t.installmentNumber}/${t.totalInstallments}` : ""),
  },
  { header: "Orçamento", value: (t) => t.budgetName ?? "" },
  { header: "Tags", value: (t) => t.tags.map((tag) => tag.name).join(", ") },
];

export function exportTransactionsToCsv(transactions: TransactionItem[]): void {
  downloadCsv(csvFileName("transacoes"), buildCsv(transactions, COLUMNS));
}
