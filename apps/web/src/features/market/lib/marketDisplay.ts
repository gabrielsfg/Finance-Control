// Shared display helpers for the market feature: asset-type colors, change formatting,
// and big-number formatting (market cap / revenue). Kept in one place so the dashboard,
// ranking page, asset page and search rows render assets consistently.

// One source of truth for asset colours — see `lib/config/assetColors`. Re-exported so
// the market feature's own imports keep working.
export { ASSET_TYPE_COLORS, assetTypeColor as assetColor } from "@/lib/config/assetColors";

// "+1,23%" / "-0,45%" (always signed — this is a neutral context, not a colored KPI cell).
export function formatChangePct(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

// Big money values from Brapi come in reais (not cents): 1.2e12 -> "R$ 1,20 T".
export function formatBigMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `R$ ${(n / 1e12).toFixed(2)} T`;
  if (abs >= 1e9) return `R$ ${(n / 1e9).toFixed(2)} B`;
  if (abs >= 1e6) return `R$ ${(n / 1e6).toFixed(2)} M`;
  return `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

// Brapi dividend yield comes as a fraction (0.0713) — render as percentage.
export function formatYieldFraction(n: number | null | undefined): string {
  if (n == null) return "—";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

export function formatRatio(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
