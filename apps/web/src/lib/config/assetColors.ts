import type { AssetType } from "@/lib/types/investments.types";

/**
 * Fixed colour per asset type — the same for every user, every screen.
 *
 * The type badge in the table, the market rows and the allocation chart all read from
 * here, so an investment that shows up green in one place is green in the other. Every
 * entry is a distinct hue on purpose: the previous map reused one colour across several
 * types, which is harmless on a badge (the label is right there) but makes two slices of
 * the same pie indistinguishable.
 */
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  Acao:              "#00C98D", // verde
  Stock:             "#00D4A0", // verde-menta
  ETF:               "#4A9EFF", // azul
  ETFInternacional:  "#8197FF", // azul-periwinkle
  FII:               "#F5A623", // laranja
  Reit:              "#7C6FE0", // roxo
  BDR:               "#F5CE42", // amarelo
  FundoInvestimento: "#B06FE0", // violeta
  Cripto:            "#F25F5C", // vermelho
  TesouroDireto:     "#6FD4E0", // ciano
  RendaFixa:         "#14B8A6", // teal
  Moeda:             "#E0A96F", // areia
  Index:             "#A0AEC0", // cinza-azulado
  Outro:             "#8A95A3", // cinza
};

export const ASSET_FALLBACK_COLOR = "#8A95A3";

export function assetTypeColor(assetType: string): string {
  return ASSET_TYPE_COLORS[assetType as AssetType] ?? ASSET_FALLBACK_COLOR;
}

/**
 * The asset classes the portfolio is grouped into, and which types feed each one.
 * Shared so the table's grouping and the chart's colours cannot drift apart.
 */
export const ASSET_CLASSES: { assetClass: string; types: AssetType[] }[] = [
  { assetClass: "Ações",               types: ["Acao"] },
  { assetClass: "FIIs",                types: ["FII"] },
  { assetClass: "ETFs",                types: ["ETF"] },
  { assetClass: "ETFs Internacionais", types: ["ETFInternacional"] },
  { assetClass: "Stocks",              types: ["Stock"] },
  { assetClass: "REITs",               types: ["Reit"] },
  { assetClass: "BDRs",                types: ["BDR"] },
  { assetClass: "Fundos",              types: ["FundoInvestimento"] },
  { assetClass: "Criptomoedas",        types: ["Cripto"] },
  { assetClass: "Tesouro Direto",      types: ["TesouroDireto"] },
  { assetClass: "Renda Fixa",          types: ["RendaFixa"] },
  { assetClass: "Moedas",              types: ["Moeda"] },
  { assetClass: "Índices",             types: ["Index"] },
  { assetClass: "Outros",              types: ["Outro"] },
];

const CLASS_COLORS: Record<string, string> = Object.fromEntries(
  ASSET_CLASSES.map((g) => [g.assetClass, assetTypeColor(g.types[0])]),
);

/** Colour of an asset class, matching the colour of the type(s) it holds. */
export function assetClassColor(assetClass: string): string {
  return CLASS_COLORS[assetClass] ?? ASSET_FALLBACK_COLOR;
}

/**
 * Palette for slices that have no fixed colour of their own — the individual tickers
 * inside one class, where every slice would otherwise be that class's single colour.
 */
const TICKER_PALETTE = [
  "#4A9EFF", "#00C98D", "#F5A623", "#7C6FE0", "#F25F5C",
  "#F5CE42", "#00D4A0", "#B06FE0", "#6FD4E0", "#E0A96F",
];

function hashIndex(name: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % modulo;
}

/**
 * One colour per name, in the order given.
 *
 * The colour is picked from the name, not from the position, so a ticker keeps it when
 * the list is re-sorted or a neighbouring position is sold. Two names landing on the same
 * slot is the case a plain hash gets wrong — a pie with two identical slices — so the
 * later one walks forward to the next free colour, and only repeats once the palette is
 * exhausted.
 */
export function distinctColorsFor(names: string[]): string[] {
  const taken = new Set<number>();
  return names.map((name) => {
    let slot = hashIndex(name, TICKER_PALETTE.length);
    for (let step = 0; step < TICKER_PALETTE.length && taken.has(slot); step++) {
      slot = (slot + 1) % TICKER_PALETTE.length;
    }
    taken.add(slot);
    return TICKER_PALETTE[slot];
  });
}
