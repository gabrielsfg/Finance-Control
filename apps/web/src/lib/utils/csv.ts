/**
 * CSV writing for the export buttons.
 *
 * The target is Excel in pt-BR, which is why this is not a one-liner join:
 * - **`;` as separator** — Excel pt-BR expects it, and the decimal comma would split
 *   every monetary value into two columns with `,`
 * - **UTF-8 BOM** — without it Excel reads the file as latin-1 and every acento breaks
 * - **CRLF** — the line ending Excel has always agreed with
 *
 * Values are formatted for a human reading a spreadsheet, not for a parser: dates as
 * dd/mm/aaaa and money as a comma decimal, so the cells are usable the moment the file
 * opens, with no import wizard.
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

const SEPARATOR = ";";
const LINE_BREAK = "\r\n";
const BOM = "﻿";

/**
 * A cell starting with `=`, `+` or `@` is executed as a formula when the file is opened,
 * and descriptions and tags are user-written — that is the whole CSV injection trick.
 * Prefixing with an apostrophe forces the text reading. A leading `-` is only escaped
 * when it does not start a number, so `-12,34` stays a number.
 */
const FORMULA_START = /^[=+@\t\r]|^-(?![\d.,])/;

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;

  const needsQuotes = /[";\r\n]/.test(text);
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(SEPARATOR);
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(SEPARATOR),
  );

  return BOM + [header, ...body].join(LINE_BREAK) + LINE_BREAK;
}

/** Cents to a spreadsheet-ready decimal: 123456 → "1234,56". Keeps the sign. */
export function csvAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Same for values already in currency units, like an investment quantity. */
export function csvNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",");
}

/** ISO date (yyyy-mm-dd, with or without a time part) to dd/mm/aaaa. */
export function csvDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const [date] = isoDate.split("T");
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** `transacoes-2026-08-09.csv` — dated so repeated exports do not overwrite each other. */
export function csvFileName(prefix: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}-${today}.csv`;
}
