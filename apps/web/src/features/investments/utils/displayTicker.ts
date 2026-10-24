/** Prefix of the private assets the Open Finance sync creates for positions no market quotes. */
export const PRIVATE_TICKER_PREFIX = "OF-";

/**
 * What to show where a ticker goes. A bank position nobody quotes (a CDB, a fund) has an
 * internal code instead of a ticker; its name is what the user recognizes.
 */
export function displayTicker(investment: { ticker: string; name: string }): string {
  return investment.ticker.startsWith(PRIVATE_TICKER_PREFIX) ? investment.name : investment.ticker;
}
