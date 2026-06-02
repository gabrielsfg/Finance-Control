import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeStr(s: string): string {
  return s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

export function includesNormalized(text: string, query: string): boolean {
  return normalizeStr(text).includes(normalizeStr(query));
}

// Aggressive search normalization: strips accents, lowercases and removes every
// character that is not a letter or digit. This makes search accent- and
// case-insensitive and tolerant to special characters / spacing, so that
// "Ações", "Açoes", "acoes" and "AÇÕES!" all collapse to "acoes", and
// "S&P 500 (BRL)" collapses to "sp500brl".
export function normalizeSearch(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

// Portuguese search synonyms per EnumAssetType (matches the backend enum string
// values). Lets the user filter assets by typing the type/category name.
const ASSET_TYPE_KEYWORDS: Record<string, string> = {
  Acao:              "acao acoes ação ações renda variavel bolsa b3",
  FundoInvestimento: "fundo fundos investimento multimercado",
  FII:               "fii fiis fundo imobiliario fundos imobiliarios imovel imoveis",
  Cripto:            "cripto criptomoeda criptomoedas crypto bitcoin ethereum",
  Stock:             "stock stocks acao americana acoes americanas exterior internacional eua",
  Reit:              "reit reits fundo imobiliario americano imovel internacional",
  BDR:               "bdr bdrs recibo acoes estrangeiras internacional",
  ETF:               "etf etfs fundo de indice indice",
  ETFInternacional:  "etf etfs internacional internacionais exterior indice",
  TesouroDireto:     "tesouro direto titulo publico renda fixa selic ipca prefixado",
  RendaFixa:         "renda fixa cdb lci lca cdi debenture pos fixado",
  Index:             "indice index benchmark referencia",
  Outro:             "outro outros",
};

// Returns the Portuguese search keywords for a given asset type string.
export function assetTypeKeywords(assetType?: string | null): string {
  if (!assetType) return "";
  return ASSET_TYPE_KEYWORDS[assetType] ?? "";
}

// Returns true when the (normalized) query is contained in the combined,
// normalized haystack built from the provided parts. An empty query matches all.
export function matchesSearch(query: string, ...parts: (string | null | undefined)[]): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const haystack = normalizeSearch(parts.filter(Boolean).join(" "));
  return haystack.includes(q);
}
