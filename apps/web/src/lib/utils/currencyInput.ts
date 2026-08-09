/**
 * Conversion between a currency text field and the cents the API speaks.
 *
 * Null is "no value", not zero — a filter bound left blank is open-ended, and a blank
 * field that read as R$ 0,00 would silently apply a bound the user never set.
 */

/** 123456 → "1234,56". Null becomes an empty field. */
export const centsToInput = (cents: number | null): string =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");

/**
 * "1.234,56" → 123456. Accepts what a Brazilian keyboard produces: thousand dots are
 * dropped, the comma is the decimal separator, and anything else is ignored.
 */
export const inputToCents = (text: string): number | null => {
  const clean = text.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
};
