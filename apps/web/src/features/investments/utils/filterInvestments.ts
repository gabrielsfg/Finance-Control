import { assetTypeKeywords, matchesSearch } from "@/lib/utils";
import type { AssetType, Investment } from "@/lib/types/investments.types";

/**
 * The positions the page is currently showing. Shared by the table and the CSV export
 * so the file can only ever contain what is on screen.
 */
export function filterInvestments(
  investments: Investment[],
  { search, visibleTypes }: { search: string; visibleTypes: AssetType[] },
): Investment[] {
  const visibleSet = new Set(visibleTypes);
  const query = search.trim();

  return investments.filter(
    (investment) =>
      visibleSet.has(investment.assetType) &&
      (!query ||
        matchesSearch(query, investment.name, investment.ticker, assetTypeKeywords(investment.assetType))),
  );
}
