export type Benchmark =
  | "CDI"
  | "SELIC"
  | "IPCA+6"
  | "IPCA+5"
  | "IPCA+4"
  | "IBOVESPA"
  | "IFIX"
  | "SP500_BRL";

export const BENCHMARK_LABELS: Record<Benchmark, string> = {
  CDI:       "CDI",
  SELIC:     "SELIC",
  "IPCA+6":  "IPCA + 6% a.a.",
  "IPCA+5":  "IPCA + 5% a.a.",
  "IPCA+4":  "IPCA + 4% a.a.",
  IBOVESPA:  "Ibovespa",
  IFIX:      "IFIX (FIIs)",
  SP500_BRL: "S&P 500 (BRL)",
};

// Search synonyms per fixed benchmark — lets the user filter by typing the
// asset type/category name (e.g. "renda fixa", "ações", "fii", "internacional").
export const BENCHMARK_SEARCH_KEYWORDS: Record<Benchmark, string> = {
  CDI:       "cdi renda fixa cdb pos fixado di juros",
  SELIC:     "selic renda fixa tesouro juros pos fixado",
  "IPCA+6":  "ipca renda fixa tesouro inflacao indexado",
  "IPCA+5":  "ipca renda fixa tesouro inflacao indexado",
  "IPCA+4":  "ipca renda fixa tesouro inflacao indexado",
  IBOVESPA:  "ibovespa ibov acoes bolsa indice renda variavel b3",
  IFIX:      "ifix fii fundos imobiliarios imovel indice",
  SP500_BRL: "sp500 s&p 500 internacional acoes exterior eua indice ivvb11",
};

export type AssetCategory =
  | "renda_fixa_bancaria"
  | "tesouro_direto"
  | "fundo_curto_prazo"
  | "fundo_longo_prazo"
  | "acoes"
  | "fii"
  | "cripto"
  | "internacional";

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  renda_fixa_bancaria: "Renda Fixa (CDB / LCI / LCA)",
  tesouro_direto:      "Tesouro Direto",
  fundo_curto_prazo:   "Fundo de Curto Prazo",
  fundo_longo_prazo:   "Fundo de Longo/Médio Prazo",
  acoes:               "Ações",
  fii:                 "Fundo Imobiliário (FII)",
  cripto:              "Criptomoedas",
  internacional:       "Renda Variável Internacional",
};

export interface BenchmarkRates {
  cdiAnnual: number;
  selicAnnual: number;
  ipcaTrailing12m: number;
  fetchedAt: string;
}

export interface HistoricalSimulationPoint {
  label: string;
  month: number;
  year: number;
  invested: number;
  value: number;
  interest: number;
  monthlyReturnPct: number;
}

export interface HistoricalSimulation {
  benchmark: string;
  startDate: string;
  endDate: string;
  totalInvested: number;
  finalValue: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  points: HistoricalSimulationPoint[];
  isPartialData: boolean;
  dataNote: string | null;
}

export interface TaxResult {
  grossGain: number;
  taxRate: number;
  taxAmount: number;
  netGain: number;
  netFinal: number;
  iofAmount: number;
}

// ---------------------------------------------------------------------------
// Catálogo de ativos pré-definidos para o Comparador de Cenários
// Média histórica baseada em dados públicos brasileiros (longo prazo)
// Ativos com API real futura estão marcados com isStub:true
// ---------------------------------------------------------------------------
export type PresetAssetGroup =
  | "renda_fixa"
  | "tesouro"
  | "fundos"
  | "acoes_br"
  | "fiis"
  | "acoes_int"
  | "cripto";

export interface PresetAsset {
  id: string;
  label: string;          // nome exibido
  ticker?: string;        // ticker visível ao usuário (ex: PETR4, MXRF11)
  brapiTicker?: string;   // ticker real na Brapi quando diferente do exibido (ex: ^BVSP para IBOVESPA)
  group: PresetAssetGroup;
  annualRate: number;     // % a.a. base (substituída por CAGR real quando Pro ativo)
  assetCategory: AssetCategory;
  description: string;   // curta explicação da taxa usada
  isStub: boolean;        // true = taxa estimada, false = dado real/formal
  rateSource: string;     // de onde veio a taxa
}

export const PRESET_ASSET_GROUPS: Record<PresetAssetGroup, string> = {
  renda_fixa:  "Renda Fixa",
  tesouro:     "Tesouro Direto",
  fundos:      "Fundos",
  acoes_br:    "Ações BR",
  fiis:        "FIIs",
  acoes_int:   "Ações Internacionais",
  cripto:      "Criptomoedas",
};

// Taxa CDI e SELIC são dinâmicas — o ScenarioComparator vai substituir
// o valor de `annualRate` pelas taxas reais do BACEN quando disponíveis
export const PRESET_ASSETS: PresetAsset[] = [
  // — Renda Fixa —
  {
    id: "cdi_100",
    label: "CDB 100% CDI",
    group: "renda_fixa",
    annualRate: 10.5,
    assetCategory: "renda_fixa_bancaria",
    description: "Rentabilidade atrelada ao CDI (taxa substituída por dado real do BACEN)",
    isStub: false,
    rateSource: "BACEN (dinâmico)",
  },
  {
    id: "cdi_110",
    label: "CDB 110% CDI",
    group: "renda_fixa",
    annualRate: 11.55,
    assetCategory: "renda_fixa_bancaria",
    description: "CDB premium em bancos médios, 110% do CDI",
    isStub: false,
    rateSource: "CDI × 1,1 (BACEN dinâmico)",
  },
  {
    id: "lci_95",
    label: "LCI/LCA 95% CDI",
    group: "renda_fixa",
    annualRate: 9.975,
    assetCategory: "renda_fixa_bancaria",
    description: "Isento de IR para PF — equivale a um CDB ~118% CDI bruto",
    isStub: false,
    rateSource: "CDI × 0,95 (BACEN dinâmico)",
  },
  {
    id: "poupanca",
    label: "Poupança",
    group: "renda_fixa",
    annualRate: 6.17,
    assetCategory: "renda_fixa_bancaria",
    description: "70% da SELIC quando SELIC > 8,5% a.a. — isenta de IR",
    isStub: false,
    rateSource: "Regra legal (SELIC atual)",
  },
  // — Tesouro Direto —
  {
    id: "tesouro_selic",
    label: "Tesouro SELIC 2029",
    group: "tesouro",
    annualRate: 10.75,
    assetCategory: "tesouro_direto",
    description: "Pós-fixado atrelado à SELIC (taxa substituída pelo dado real do BACEN)",
    isStub: false,
    rateSource: "BACEN (dinâmico)",
  },
  {
    id: "tesouro_ipca_2029",
    label: "Tesouro IPCA+ 2029",
    group: "tesouro",
    annualRate: 8.5,
    assetCategory: "tesouro_direto",
    description: "IPCA + ~4% real. Taxa estimada com IPCA médio 4,5% + spread 4%",
    isStub: true,
    rateSource: "IPCA 12m (BACEN) + spread 4% real",
  },
  {
    id: "tesouro_ipca_2045",
    label: "Tesouro IPCA+ 2045",
    group: "tesouro",
    annualRate: 9.0,
    assetCategory: "tesouro_direto",
    description: "IPCA + ~4,5% real. Vencimento longo, mais risco de marcação a mercado",
    isStub: true,
    rateSource: "IPCA 12m (BACEN) + spread 4,5% real",
  },
  {
    id: "tesouro_prefixado",
    label: "Tesouro Prefixado 2027",
    group: "tesouro",
    annualRate: 13.5,
    assetCategory: "tesouro_direto",
    description: "Prefixado — taxa fixa ao ano (taxa estimada com base no mercado atual)",
    isStub: true,
    rateSource: "Média mercado Tesouro Prefixado",
  },
  // — Fundos —
  {
    id: "fundo_rf_cp",
    label: "Fundo RF Curto Prazo",
    group: "fundos",
    annualRate: 9.8,
    assetCategory: "fundo_curto_prazo",
    description: "Fundo DI conservador, sujeito a come-cotas semestral de 20%",
    isStub: true,
    rateSource: "≈ CDI − 0,7% (taxa de admin estimada)",
  },
  {
    id: "fundo_multimercado",
    label: "Fundo Multimercado (médio)",
    group: "fundos",
    annualRate: 12.0,
    assetCategory: "fundo_longo_prazo",
    description: "Média histórica fundos multimercado nível 2. Come-cotas 15%",
    isStub: true,
    rateSource: "Média ANBIMA multimercado L2 (10 anos)",
  },
  {
    id: "fundo_acoes_ibov",
    label: "Fundo de Ações (Ibovespa)",
    group: "fundos",
    annualRate: 12.5,
    assetCategory: "fundo_longo_prazo",
    description: "Fundo passivo no Ibovespa. Come-cotas 15%",
    isStub: true,
    rateSource: "Ibovespa CAGR 10 anos (~12,5% nominal)",
  },
  // — Ações BR —
  {
    id: "ibovespa_avg",
    label: "Ibovespa",
    brapiTicker: "^BVSP",
    group: "acoes_br",
    annualRate: 13.0,
    assetCategory: "acoes",
    description: "Retorno nominal do Ibovespa. CAGR real calculado via Brapi quando disponível.",
    isStub: true,
    rateSource: "Ibovespa CAGR histórico (~13% nominal 10 anos)",
  },
  {
    id: "petr4",
    label: "PETR4 (Petrobras)",
    ticker: "PETR4",
    group: "acoes_br",
    annualRate: 18.0,
    assetCategory: "acoes",
    description: "Retorno estimado com base na média de dividendos + valorização dos últimos 5 anos. Alta volatilidade.",
    isStub: true,
    rateSource: "Média histórica 5 anos com reinvestimento (estimada)",
  },
  {
    id: "vale3",
    label: "VALE3 (Vale)",
    ticker: "VALE3",
    group: "acoes_br",
    annualRate: 14.5,
    assetCategory: "acoes",
    description: "Retorno médio estimado com dividendos. Exposição a commodities.",
    isStub: true,
    rateSource: "Média histórica 5 anos com reinvestimento (estimada)",
  },
  {
    id: "itub4",
    label: "ITUB4 (Itaú)",
    ticker: "ITUB4",
    group: "acoes_br",
    annualRate: 15.0,
    assetCategory: "acoes",
    description: "Blue chip financeiro com dividendos consistentes.",
    isStub: true,
    rateSource: "Média histórica 5 anos com reinvestimento (estimada)",
  },
  {
    id: "small_caps_avg",
    label: "Small Caps BR (média)",
    group: "acoes_br",
    annualRate: 15.0,
    assetCategory: "acoes",
    description: "SMLL Index — pequenas e médias empresas. Maior retorno potencial, maior volatilidade.",
    isStub: true,
    rateSource: "SMLL CAGR histórico ~15% nominal",
  },
  // — FIIs —
  {
    id: "ifix_avg",
    label: "IFIX (FIIs)",
    brapiTicker: "IFIX",
    group: "fiis",
    annualRate: 11.0,
    assetCategory: "fii",
    description: "Retorno do índice IFIX. CAGR real calculado via Brapi quando disponível.",
    isStub: true,
    rateSource: "IFIX histórico + yield médio (estimado)",
  },
  {
    id: "mxrf11",
    label: "MXRF11 (Maxi Renda)",
    ticker: "MXRF11",
    group: "fiis",
    annualRate: 12.0,
    assetCategory: "fii",
    description: "FII de papel, alto yield (~12% a.a.). Dividendos isentos de IR para PF.",
    isStub: true,
    rateSource: "DY médio 12 meses (estimado)",
  },
  {
    id: "knri11",
    label: "KNRI11 (Kinea)",
    ticker: "KNRI11",
    group: "fiis",
    annualRate: 9.5,
    assetCategory: "fii",
    description: "FII híbrido (lajes e galpões). Yield estável ~9–10% a.a.",
    isStub: true,
    rateSource: "DY médio 12 meses (estimado)",
  },
  // — Internacional —
  {
    id: "sp500_brl",
    label: "S&P 500 (em BRL)",
    ticker: "IVVB11",
    group: "acoes_int",
    annualRate: 18.0,
    assetCategory: "internacional",
    description: "S&P 500 via IVVB11 (ETF em BRL). CAGR real calculado via Brapi quando disponível.",
    isStub: true,
    rateSource: "S&P 500 CAGR + câmbio BRL/USD histórico",
  },
  {
    id: "nasdaq_brl",
    label: "Nasdaq 100 (em BRL)",
    ticker: "QQQI11",
    group: "acoes_int",
    annualRate: 22.0,
    assetCategory: "internacional",
    description: "Nasdaq 100 via ETF em BRL. CAGR real calculado via Brapi quando disponível.",
    isStub: true,
    rateSource: "Nasdaq CAGR + câmbio BRL/USD histórico",
  },
  {
    id: "bdr_bova11",
    label: "BDR ETF (BOVA11)",
    ticker: "BOVA11",
    group: "acoes_int",
    annualRate: 13.0,
    assetCategory: "internacional",
    description: "ETF do Ibovespa negociado em BRL. CAGR real calculado via Brapi quando disponível.",
    isStub: true,
    rateSource: "Ibovespa CAGR histórico",
  },
  // — Cripto —
  {
    id: "bitcoin_avg",
    label: "Bitcoin (média histórica 5a)",
    ticker: "BTC",
    group: "cripto",
    annualRate: 60.0,
    assetCategory: "cripto",
    description: "Retorno médio anual do BTC nos últimos 5 anos. ALTÍSSIMA volatilidade. Não representa desempenho futuro.",
    isStub: true,
    rateSource: "BTC CAGR 5 anos (estimado)",
  },
  {
    id: "ethereum_avg",
    label: "Ethereum (média histórica 5a)",
    ticker: "ETH",
    group: "cripto",
    annualRate: 45.0,
    assetCategory: "cripto",
    description: "Retorno médio do ETH nos últimos 5 anos. Alta volatilidade.",
    isStub: true,
    rateSource: "ETH CAGR 5 anos (estimado)",
  },
];

// Scenario for the comparator
export interface SimulationScenario {
  id: string;
  label: string;
  annualRate: number;
  assetCategory: AssetCategory;
  color: string;
  presetId?: string;     // se veio de um preset
  ticker?: string;
  isStub?: boolean;
  rateSource?: string;
}

export type ChartGranularity = "monthly" | "annual";

export const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  monthly: "Mensal",
  annual:  "Anual",
};

// ---------------------------------------------------------------------------
// Portfolio Simulator — backtest histórico + projeção futura de carteira
// ---------------------------------------------------------------------------
export interface PortfolioAsset {
  id: string;              // chave local estável da linha
  ticker: string;          // ticker/benchmark (ex: PETR4, CDI, IBOVESPA)
  name: string;            // nome exibido
  weightPct: number;       // 0–100, soma = 100
  annualRatePct?: number;  // só na projeção; undefined = usar histórico
  category: AssetCategory;  // para cálculo de imposto na projeção
}

export interface PortfolioBacktestRequest {
  assets: { ticker: string; weightPct: number }[];
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  monthlyContribution: number; // centavos
  initialAmount: number;       // centavos
}

export interface PortfolioBacktestPoint {
  label: string;
  month: number;
  year: number;
  invested: number;        // centavos
  value: number;           // centavos
  monthlyReturnPct: number;
}

export interface PortfolioAssetReturn {
  ticker: string;
  totalReturnPct: number;
}

export interface PortfolioBacktestResult {
  points: PortfolioBacktestPoint[];
  assetReturns: PortfolioAssetReturn[];
  totalInvested: number;   // centavos
  finalValue: number;      // centavos
  annualizedReturnPct: number;
  effectiveStartDate: string;
  effectiveEndDate: string;
  isPartialData: boolean;
  dataNote: string | null;
}
