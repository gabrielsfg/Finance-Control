# Plano de Implementação — Recursos do Plano Pro da Brapi

> Gerado em 2026-05-31. Premissa: a conta Brapi será **Pro**.
> Cobre **tudo que o Pro habilita e ainda não está implementado** no Finance-Control.
> Complementa [PLANO-IMPLEMENTACAO-BRAPI.md](./PLANO-IMPLEMENTACAO-BRAPI.md) (job de cotações — já feito) e [PLANO-BRAPI-MAIO-2026.md](./PLANO-BRAPI-MAIO-2026.md) (Tesouro/futuros).

---

## O que o Pro destrava que ainda NÃO está no app

| # | Recurso do Pro | Status hoje | Prioridade | Parte |
|---|---|---|---|---|
| 1 | **Histórico longo (15+ anos)** de cotações | Job faz só `range=1y` | 🟢 **Alta** | [Parte 1](#parte-1) |
| 2 | **Índices reais** (`^BVSP` etc.) p/ simulação histórica | 3 benchmarks são stub fixo | 🟢 **Alta** | [Parte 2](#parte-2) |
| 3 | **Dado real no Comparador de Cenários** (~20 ativos stub) | `PRESET_ASSETS` com taxas chumbadas | 🟡 Média | [Parte 3](#parte-3) |
| 4 | **Tesouro Direto** | Ignorado pelo job | 🟢 **Alta** | ver doc Maio/2026 |
| 5 | **FIIs detalhados** (DY, P/VP, relatórios CVM) | Só preço via `/quote` | 🟡 Média | [Parte 4](#parte-4) |
| 6 | **Fundamentalistas** (P/L, ROE, P/VP, DRE, DFC, DVA) | Não existe | 🔵 Baixa (tela nova) | [Parte 5](#parte-5) |
| 7 | **Lote de 20 ativos/request** (era 10) | `BatchSize = 10` | 🟢 **Fácil** | [Parte 6](#parte-6) |
| — | Futuros / opções / opções s/ futuros | — | ⚪ Adiado | doc Maio/2026 |

**Ordem sugerida de execução:** Parte 6 (trivial) → Parte 1 → Parte 2 → Parte 3 → Tesouro (doc Maio) → Parte 4 → Parte 5.

---

## Fatos da API confirmados (lidos em 2026-05-31)

Confirmados verbatim em `brapi.dev/docs/acoes.mdx` e `/docs/dicionario`:

- **`range` válidos:** `1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max`
- **`interval` válidos:** `1d, 5d, 1wk, 1mo, 3mo`
- **Ibovespa:** símbolo **`^BVSP`** (consultável via `/api/quote/^BVSP`)
- **Módulos fundamentalistas** (param `modules`): `summaryProfile`, `defaultKeyStatistics`, `financialData`, `balanceSheetHistory`(+`Quarterly`), `incomeStatementHistory`(+`Quarterly`), `cashflowHistory`(+`Quarterly`), `valueAddedHistory`(+`Quarterly`)

> ⚠️ **Não confirmado na doc** (a página de FIIs deu 404 no `.mdx` e a de dicionário não listou): símbolos de **IFIX** e **S&P 500/Nasdaq**, e os campos exatos de FII (DY, P/VP, patrimônio). **Validar contra uma resposta real da conta Pro antes de codar esses DTOs.** Ver ressalvas nas Partes 2, 4.

---

<a name="parte-1"></a>
# PARTE 1 — Histórico longo (15+ anos)

## Por quê
Hoje o backfill do job (`BrapiPriceUpdateJobService`) usa `range=1y`. O Pro dá 15+ anos. Histórico longo habilita:
- Gráficos de evolução de carteira de vários anos.
- Simulação histórica real em janelas de 5a/10a (a UI **já tem** botões "5a"/"10a" em [HistoricalSimulator.tsx](../apps/web/src/features/simulations/components/HistoricalSimulator.tsx)).
- Base para análises de risco/IA (drawdown, volatilidade) — ver [[project_drawdown_v2]] e [[project_ai_daily_insight]].

## O que muda
Mínimo e cirúrgico. No `BrapiPriceUpdateJobService`, o backfill de primeiro run:

```diff
- var rangeParam = isFirstRun ? "&range=1y&interval=1d" : string.Empty;
+ var rangeParam = isFirstRun ? $"&range={_settings.BackfillRange}&interval=1d" : string.Empty;
```

E em `BrapiSettings.cs`:
```csharp
public string BackfillRange { get; set; } = "max";   // Pro: "max" ou "10y"; Startup: "1y"
```

> `max` traz tudo disponível; se quiser limitar custo/volume, usar `10y`. Aplica-se **tanto** ao grupo de quote quanto ao de cripto (ambos usam o mesmo `rangeParam`).

## Cuidados
- **Volume de inserts:** 15 anos × ~250 pregões = ~3.750 linhas por ativo no primeiro run. A lógica de `UpsertPriceHistoryAsync` já deduplica por `(InvestmentId, Date)` e só roda no primeiro run — ok, mas o primeiro run fica mais pesado. Aceitável (roda 1x por ativo, à noite).
- **Não precisa de migration** — `InvestmentPriceHistory` já existe e comporta qualquer data.

## Arquivos
| Arquivo | Ação |
|---|---|
| `BrapiSettings.cs` | +`BackfillRange` |
| `BrapiPriceUpdateJobService.cs` | usar `BackfillRange` no `rangeParam` |
| `appsettings.json` | +`"BackfillRange": "max"` na seção `BrapiSettings` |

---

<a name="parte-2"></a>
# PARTE 2 — Índices reais na Simulação Histórica

## Estado atual (no código)
`SimulationService.GetMonthlyReturnsForBenchmarkAsync` ([SimulationService.cs:144](../apps/api/FinanceControl.Services/Services/SimulationService.cs#L144)):
- `CDI`, `SELIC`, `IPCA+X` → **dado real do BACEN** (gratuito, longo). **Não mexer.**
- `IBOVESPA`, `IFIX`, `SP500_BRL` → retornam `[]` → caem no **fallback de taxa fixa** (13%/11%/18% a.a.). A UI marca com `*` e `DataNote` "integração em breve".

O objetivo desta parte é **trocar os 3 stubs por série mensal real da Brapi**, mantendo a renda fixa no BACEN.

## Como fazer
A simulação trabalha com **retornos mensais** (`Dictionary<"yyyy-MM", decimal>`). A Brapi dá preços diários; precisamos derivar retorno mês a mês a partir do preço de fechamento mensal.

Novo método no `SimulationService` (ou um `BrapiIndexClient` dedicado):

```
GetMonthlyReturnsFromBrapiAsync(string brapiSymbol, DateOnly from, DateOnly to):
  1. GET https://brapi.dev/api/quote/{brapiSymbol}?range={range}&interval=1mo&token=...
     (interval=1mo já entrega 1 ponto por mês — evita agregar no código)
  2. Ordenar historicalDataPrice por data.
  3. Para cada mês M: retorno% = (close[M] / close[M-1] - 1) * 100
  4. Retornar dicionário "yyyy-MM" → retorno%.
  Cache em IMemoryCache (ex.: 12h) como já é feito para o BACEN.
```

Mapeamento benchmark → símbolo Brapi:
```csharp
private static readonly Dictionary<string, string> BrapiIndexSymbols = new()
{
    ["IBOVESPA"]  = "^BVSP",      // ✅ confirmado na doc
    ["IFIX"]      = "IFIX",       // ⚠️ símbolo a confirmar (ver ressalva)
    ["SP500_BRL"] = "IVVB11",     // ⚠️ S&P500 nativo pode não existir → proxy ETF em BRL (IVVB11)
};
```

E no switch de benchmark, trocar os stubs vazios:
```diff
- // Equity stubs: return empty so the caller uses fallback monthly rate
- _ => [],
+ "IBOVESPA" or "IFIX" or "SP500_BRL"
+     => await GetMonthlyReturnsFromBrapiAsync(BrapiIndexSymbols[benchmark], from, to),
+ _ => [],
```

Quando a série real existir, `IsStubBenchmark` e o `DataNote` desses 3 devem parar de marcar como estimado.

## Ressalvas (decisões/validações antes de codar)
1. **`^BVSP` confirmado.** **IFIX e S&P 500 NÃO confirmados** na doc. Validar com chamada real na conta Pro:
   - IFIX existe como índice consultável? Qual o símbolo?
   - S&P 500 existe nativo? Se não, usar **proxy**: `IVVB11` (ETF do S&P 500 em BRL, já cotado em reais — bônus: resolve o câmbio sozinho). O label da UI já diz "S&P 500 (BRL)", então o proxy é coerente.
2. **Moeda:** `^BVSP` e `IFIX` são em BRL (ok). Se um dia usar S&P em USD puro, precisaria converter por PTAX — por isso o proxy `IVVB11` (BRL) é preferível.
3. **Profundidade:** com Pro (`range=max`/`10y`) a série cobre as janelas de 5a/10a; com `interval=1mo` o volume é pequeno (~120-180 pontos).

## Arquivos
| Arquivo | Ação |
|---|---|
| `SimulationService.cs` | +`GetMonthlyReturnsFromBrapiAsync`, +mapa de símbolos, trocar stubs no switch; ajustar `IsStubBenchmark`/`GetDataNote` |
| `BrapiSettings.cs` | reutilizar `Token` (já existe) — `SimulationService` hoje não usa Brapi, vai passar a usar |
| `ServicesExtensions.cs` | se criar `BrapiIndexClient` separado, registrar |

> Nenhuma mudança de DTO público nem de frontend é necessária — o contrato de `HistoricalSimulationDto` não muda; só o `isPartialData`/`dataNote` deixam de acender para esses benchmarks.

---

<a name="parte-3"></a>
# PARTE 3 — Dado real no Comparador de Cenários

## Estado atual
[simulation.ts](../apps/web/src/lib/types/simulation.ts) define `PRESET_ASSETS` — catálogo de ~28 ativos usado pelo `ScenarioComparator`. Hoje **a maioria tem `isStub: true`** e taxa anual chumbada:

| Exemplos com `isStub: true` | Taxa fixa hoje | Fonte real possível (Pro) |
|---|---|---|
| `PETR4`, `VALE3`, `ITUB4` | 18% / 14,5% / 15% | histórico real via `/quote/{ticker}` |
| `MXRF11`, `KNRI11` | 12% / 9,5% | histórico real de FII |
| `ibovespa_avg`, `ifix_avg` | 13% / 11% | `^BVSP` / IFIX (Parte 2) |
| `sp500_brl`, `nasdaq_brl`, `bdr_bova11` | 18% / 22% / 13% | proxies BR (`IVVB11`, `BOVA11`) |
| `bitcoin_avg`, `ethereum_avg` | 60% / 45% | cripto via `/api/v2/crypto` |

Os de **renda fixa** já são `isStub: false` (taxa do BACEN dinâmica) — não mexer.

## Como fazer
O comparador usa **uma taxa anual** por ativo (não série). Então a integração é mais leve que a Parte 2: para cada preset com `ticker`, calcular o **CAGR real** a partir do histórico da Brapi.

Opções de arquitetura (escolher uma):

- **(A) Endpoint backend novo** `GET /api/simulation/asset-rates?tickers=PETR4,MXRF11,...` que, para cada ticker, busca histórico na Brapi (cache 12h) e devolve `{ ticker, annualReturnPct }` (CAGR dos últimos N anos). O frontend substitui `annualRate` dos presets que vierem na resposta e zera o `isStub`.
  → **Recomendado.** Mantém token no servidor; reaproveita a infra de cache já usada no `SimulationService`.

- **(B) Reusar dados já no banco.** Vários desses tickers (PETR4 etc.) podem já estar em `Investment`/`InvestmentPriceHistory` por causa do job diário. Dá para calcular o CAGR direto do banco, **sem nova chamada à Brapi**. Limitação: só funciona para tickers que **algum usuário possui**; presets que ninguém tem não teriam dado.
  → Bom como otimização combinada com (A): usa banco quando tem, Brapi quando falta.

CAGR: `((preço_fim / preço_início) ^ (1/anos) - 1) * 100`. Para FIIs/ações, idealmente **total return** (com dividendos reinvestidos), mas v1 pode ser só preço — documentar a aproximação no `rateSource`.

## Ressalvas
- **Decisão de produto:** trocar taxa "média histórica redonda" por CAGR real muda os números que o usuário vê hoje. Pode ser bom (mais honesto) ou estranho (CAGR de 5 anos de PETR4 é muito volátil). Considerar usar **janela longa (10a)** para suavizar, e manter o `rateSource` explicando.
- **Escopo:** isto é mais "nice to have" que as Partes 1-2. Pode ficar para depois.

## Arquivos
| Arquivo | Ação |
|---|---|
| `SimulationService.cs` (+interface, +controller) | +método/endpoint de asset-rates (opção A) |
| `AssetRatesDto.cs` | **Novo** — `{ ticker, annualReturnPct, source }` |
| `simulation.ts` / `ScenarioComparator.tsx` | consumir as taxas reais e limpar `isStub` dos que retornarem |

---

<a name="parte-4"></a>
# PARTE 4 — FIIs detalhados (DY, P/VP, relatórios CVM)

## Por quê
Você já trata FII como `EnumAssetType.FII` no job (entra no `QuoteAssetTypes`), mas só pega **preço**. O Pro dá dados próprios de FII: **dividend yield, P/VP, patrimônio líquido, relatórios CVM, histórico de dividendos**. Isso enriquece a tela de detalhe do ativo (`MarketAssetDetailDto`) e a carteira de FIIs.

## ⚠️ Ressalva forte (validar antes)
A documentação de FIIs **não foi extraível** (404 no `.mdx`, landing genérica). **Não vou inventar nomes de campos.** Antes de implementar:
1. Fazer 1 chamada real na conta Pro a um FII (ex.: `MXRF11`) e capturar o JSON.
2. Confirmar se os dados de FII vêm:
   - via `/api/quote/MXRF11?fundamental=true` / `modules=...`, **ou**
   - via endpoint dedicado (a doc cita "relatórios CVM" — pode haver path próprio).
3. Mapear os campos reais (prováveis, **a confirmar**): `dividendYield`, `priceToBook` (P/VP), `netWorth`/`patrimonio`, lista de proventos.

## Esboço (sujeito à validação)
- Estender `MarketAssetDetailDto` com bloco opcional `FiiData` (DY, P/VP, patrimônio) preenchido só quando `AssetType == FII`.
- O job já insere dividendos de ações em `InvestmentDividend`; **reaproveitar o mesmo fluxo** para dividendos de FII se vierem no mesmo formato `cashDividends`.

## Arquivos (estimativa, pós-validação)
| Arquivo | Ação |
|---|---|
| `Brapi/BrapiQuoteResponse.cs` | +campos de FII no `BrapiQuoteResult` (após confirmar nomes) |
| `MarketAssetDetailDto.cs` | +`FiiData` opcional |
| `MarketService.cs` | preencher `FiiData` quando FII |
| `BrapiPriceUpdateJobService.cs` | (talvez) capturar DY/P/VP no run |

---

<a name="parte-5"></a>
# PARTE 5 — Fundamentalistas (P/L, ROE, balanços) — opcional / tela nova

## Por quê
O Pro dá fundamentos completos (16 anos): BP, DRE, DFC, DVA trimestrais + indicadores (P/L, ROE, P/VP, EV/EBITDA). **Mas o app não tem tela para isso hoje** — seria feature nova ("Fundamentos do ativo"). Por isso é **baixa prioridade**: só faz sentido se você quiser construir essa tela.

## O que a API dá (confirmado)
Via `/api/quote/{ticker}?modules=<lista>`:
- `defaultKeyStatistics` → P/L, P/VP, ROE, Dividend Yield (TTM)
- `financialData` → ebitda, márgens, ROA, ROE, dívida, caixa, receita, fluxo de caixa…
- `balanceSheetHistory`/`Quarterly` → BP (ativos, passivos, patrimônio)
- `incomeStatementHistory`/`Quarterly` → DRE
- `cashflowHistory`/`Quarterly` → DFC
- `valueAddedHistory`/`Quarterly` → DVA
- `summaryProfile` → setor, indústria, CNPJ, descrição

## Recomendação
**Não implementar agora.** Registrar como feature V2+ ("Análise fundamentalista do ativo"). Quando for fazer, é leitura on-demand (não precisa ir pro job diário) — buscar os módulos quando o usuário abrir a tela de detalhe, com cache curto. Provavelmente vale uma entidade/cache próprio para não bater na Brapi toda hora.

---

<a name="parte-6"></a>
# PARTE 6 — Lote de 20 ativos por request

## Por quê
Pro permite **20 ativos/request** (Startup era 10). Dobrar o lote = **metade das chamadas** de quote/cripto no job diário. Trivial.

## O que muda
Só configuração — o job já usa `_settings.BatchSize` em `Chunk(...)`:
```diff
// appsettings.json → BrapiSettings
- "BatchSize": 10,
+ "BatchSize": 20,
```
Nenhuma mudança de código (o `Chunk(BatchSize)` e o `string.Join(",", ...)` já são genéricos).

> ⚠️ Confirmar que o endpoint `/api/quote/{lista}` aceita 20 tickers no Pro (a doc diz "20 ativos por requisição" no plano). O de Tesouro (`indicators`) e o de crypto também são "até 20".

---

## Resumo executivo

**Ganhos imediatos e baratos (fazer já):**
- **Parte 6** — `BatchSize: 10 → 20` (1 linha).
- **Parte 1** — `BackfillRange: "max"` (1 setting + 1 linha) → histórico de 15 anos.

**Alto valor de produto (fazer em seguida):**
- **Parte 2** — índices reais (`^BVSP` ✅; IFIX/S&P a confirmar → proxy `IVVB11`) substituem os 3 stubs da simulação histórica. Conecta com IA/risco.
- **Tesouro Direto** — ver [PLANO-BRAPI-MAIO-2026.md](./PLANO-BRAPI-MAIO-2026.md), já documentado com schema confirmado.

**Médio / opcional:**
- **Parte 3** — CAGR real nos ~20 presets stub do Comparador de Cenários.
- **Parte 4** — FIIs detalhados (**validar JSON real antes** — doc indisponível).
- **Parte 5** — fundamentos (P/L, ROE, balanços) — só se for criar a tela; V2+.

**Validações pendentes contra a conta Pro (1 chamada real cada):**
1. Símbolo do **IFIX** e existência de **S&P 500** nativo (senão `IVVB11`). → Parte 2
2. Como vêm os dados de **FII** (módulo no `/quote` vs. endpoint próprio) e nomes dos campos. → Parte 4
3. Confirmar `BatchSize=20` aceito em todos os endpoints. → Parte 6

### Decisões abertas para você
1. **Backfill:** `max` (tudo) ou `10y` (limita volume)? (Parte 1)
2. **Comparador (Parte 3):** trocar as médias "redondas" por CAGR real vale o esforço agora, ou deixar para depois?
3. **Fundamentos (Parte 5):** entra no radar de V2 ou descartar?
