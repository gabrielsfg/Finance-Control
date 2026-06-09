# Spec: Simulations

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Simuladores financeiros — juros compostos, aposentadoria (FIRE), backtest histórico com dados reais, carteira multiativo, projeção de meta e comparador de cenários.

---

## 1. Visão geral

Simulations é um domínio **stateless**: não possui entidades próprias nem tabelas. O backend
expõe um conjunto de endpoints de leitura que combinam três fontes de dados de mercado para
calcular retornos históricos e taxas de referência:

- **BACEN SGS** (API pública do Banco Central) — séries mensais de CDI (4391), SELIC (4390) e IPCA (433).
- **Brapi** (`brapi.dev`) — preços históricos de índices de ações (Ibovespa, IFIX, S&P 500 em BRL) e CAGR de tickers individuais. Requer token (plano Pro para índices).
- **Base local** (`MarketAsset` + `MarketPriceHistory`) — preços diários sincronizados por job, usados como benchmark dinâmico para qualquer ticker já presente no banco.

Boa parte das telas de Simulações roda **inteiramente no front** (juros compostos, aposentadoria,
projeção de meta, comparador de cenários e a sub-aba de projeção da carteira) usando o motor
`taxCalc.ts`. Apenas dois fluxos chamam o backend: a **Simulação Histórica** (`GET /simulation/historical`)
e o **Backtest de Carteira** (`POST /simulation/portfolio/backtest`). O comparador também consome
`GET /simulation/benchmark-rates` e `GET /simulation/asset-rates` para substituir taxas estimadas por dados reais.

Responsabilidades **fora** deste spec:
- Sincronização de preços de mercado, entidades `MarketAsset`/`MarketPriceHistory` e jobs Brapi → `specs/market-data.md` (este spec apenas **lê** esses dados; não documenta como são populados).
- Carteira real do usuário (posições, dividendos) → domínio Investments.
- Metas persistidas do usuário (`Goal`) → domínio Goals. A "Projeção de Meta" desta aba é uma calculadora client-side e **não** lê/grava `Goal`.

---

## 2. Entidades

**Simulations não tem entidades nem tabelas próprias.** Todo o estado é efêmero (cálculo por request).
O serviço apenas **lê** `MarketAsset` e `MarketPriceHistory` (entidades do domínio market-data) via
`ApplicationDbContext`, e chama APIs externas (BACEN, Brapi). Os contratos relevantes são DTOs e tipos
TS, documentados abaixo.

### DTOs de resposta (API)

#### `BenchmarkRatesDto`
`FinanceControl.Shared/Dtos/Response/Simulation/BenchmarkRatesDto.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `CdiAnnual` | `decimal` | CDI anualizado dos últimos 12 meses (compounding mensal das séries BACEN) |
| `SelicAnnual` | `decimal` | SELIC anualizada (idem) |
| `IpcaTrailing12m` | `decimal` | IPCA acumulado 12 meses |
| `FetchedAt` | `DateTime` | UTC do momento do cálculo |

#### `AvailableBenchmarkDto`
`FinanceControl.Shared/Dtos/Response/Simulation/AvailableBenchmarkDto.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Ticker` | `string` | Ticker do `MarketAsset` |
| `Name` | `string` | Nome do ativo |
| `AssetType` | `string` | `MarketAsset.AssetType.ToString()` (ex: `Stock`, `Fii`, `Crypto`…) |
| `EarliestDate` | `DateOnly` | Primeira data com histórico de preço |
| `LatestDate` | `DateOnly` | Última data com histórico |
| `MonthsAvailable` | `int` | Quantidade de meses distintos (year+month) com preço — usado para ordenar |

#### `AssetRateDto`
`FinanceControl.Shared/Dtos/Response/Simulation/AssetRateDto.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Ticker` | `string` | Ticker consultado |
| `AnnualReturnPct` | `double` | CAGR anualizado (**somente preço**, sem dividendos) |
| `YearsOfData` | `int` | Anos completos usados no cálculo (`floor`) |
| `IsReal` | `bool` | `false` = fallback (sem token, sem dados ou período inválido) — o `RateSource` explica o motivo |
| `RateSource` | `string` | Texto descritivo da origem da taxa (PT-BR, exibido na UI) |

#### `HistoricalSimulationDto` (+ `HistoricalSimulationPointDto`)
`FinanceControl.Shared/Dtos/Response/Simulation/HistoricalSimulationDto.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Benchmark` | `string` | Benchmark/ticker simulado |
| `StartDate` / `EndDate` | `DateOnly` | Janela efetiva |
| `TotalInvested` | `long` | **Centavos** — inicial + aportes |
| `FinalValue` | `long` | **Centavos** — patrimônio final |
| `TotalReturnPct` | `decimal` | `(FinalValue - TotalInvested) / TotalInvested * 100` |
| `AnnualizedReturnPct` | `decimal` | CAGR (ver RN-SIM-07 e gap G3) |
| `Points` | `List<...PointDto>` | Série mês a mês |
| `IsPartialData` | `bool` | `true` quando há fallback/estimativa ou dados ausentes |
| `DataNote` | `string?` | Aviso PT-BR sobre qualidade dos dados |

`HistoricalSimulationPointDto`: `Label` (ex: `jun/26`), `Month`, `Year`, `Invested` (centavos), `Value` (centavos), `Interest` (= `Value - Invested`, centavos), `MonthlyReturnPct` (decimal).

#### `PortfolioBacktestDto` (+ `PortfolioBacktestPointDto`, `PortfolioAssetReturnDto`)
`FinanceControl.Shared/Dtos/Response/Simulation/PortfolioBacktestDto.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Points` | `List<...PointDto>` | Série mês a mês (intervalo efetivo) |
| `AssetReturns` | `List<PortfolioAssetReturnDto>` | Retorno total por ativo no período, dedup por ticker |
| `TotalInvested` | `long` | Centavos |
| `FinalValue` | `long` | Centavos |
| `AnnualizedReturnPct` | `decimal` | CAGR da carteira |
| `EffectiveStartDate` / `EffectiveEndDate` | `string` | `yyyy-MM-dd` (ver gap G5 sobre formato) |
| `IsPartialData` | `bool` | `true` se o período foi reduzido ou houve ticker estimado |
| `DataNote` | `string?` | Aviso PT-BR |

`PortfolioBacktestPointDto`: `Label`, `Month`, `Year`, `Invested` (centavos), `Value` (centavos), `MonthlyReturnPct`.
`PortfolioAssetReturnDto`: `Ticker`, `TotalReturnPct` (decimal).

### DTO de request (API)

#### `PortfolioBacktestRequestDto` (+ `PortfolioAssetInputDto`)
`FinanceControl.Shared/Dtos/Request/Simulation/PortfolioBacktestRequestDto.cs`

```
Assets              : PortfolioAssetInputDto[]   // 2..10 itens
StartDate           : DateOnly
EndDate             : DateOnly
MonthlyContribution : long                       // centavos, >= 0
InitialAmount       : long                       // centavos, >= 0

PortfolioAssetInputDto:
  Ticker    : string   // benchmark fixo OU ticker do banco
  WeightPct : double    // 0 < x <= 100; soma deve dar ~100 (±0.5)
```

### Conjuntos de benchmarks fixos (constantes do service)

`SimulationService` reconhece estes **benchmarks fixos** por nome literal; qualquer outro valor é
tratado como **ticker do banco** (`GetMonthlyReturnsFromDbAsync`):

| Benchmark | Origem dos dados mensais |
|---|---|
| `CDI` | BACEN SGS 4391 |
| `SELIC` | BACEN SGS 4390 |
| `IPCA+6` / `IPCA+5` / `IPCA+4` | BACEN SGS 433 (IPCA) + spread real anual convertido p/ mensal |
| `IBOVESPA` | Brapi símbolo `^BVSP` |
| `IFIX` | Brapi símbolo `IFIX` (não confirmado — ver gap G6) |
| `SP500_BRL` | Brapi símbolo `IVVB11` (ETF proxy em BRL) |

Fallbacks anuais (`FallbackAnnualReturns`, usados quando Brapi/BACEN não retornam): CDI 10.5%, SELIC 10.75%,
IPCA+6 10.5%, IPCA+5 9.5%, IPCA+4 8.5%, IBOVESPA 13.0%, IFIX 11.0%, SP500_BRL 18.0%. Demais → 10%.

---

## 3. Endpoints (API)

Controller: `SimulationController` — rota base `api/simulation`. Todos exigem `[Authorize]`.
**Nenhum endpoint é escopado por `UserId`** — são dados de mercado globais (ver gap G1).

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `GET` | `/api/simulation/benchmark-rates` | CDI/SELIC/IPCA 12m anualizados (BACEN) | `200` `BenchmarkRatesDto` | — |
| `GET` | `/api/simulation/available-benchmarks` | Tickers do banco com histórico + range | `200` `AvailableBenchmarkDto[]` | — |
| `GET` | `/api/simulation/asset-rates?tickers=A,B,C` | CAGR 10a por ticker, via **Brapi** | `200` `AssetRateDto[]` | `400` se `tickers` vazio |
| `GET` | `/api/simulation/asset-rate?ticker=&period=` | CAGR por período, via **base local** | `200` `AssetRateDto` | `400` ticker/período inválido |
| `GET` | `/api/simulation/historical?benchmark=&startDate=&endDate=&monthlyContribution=&initialAmount=` | Backtest de aporte único | `200` `HistoricalSimulationDto` | `400` validações |
| `POST` | `/api/simulation/portfolio/backtest` | Backtest de carteira multiativo | `200` `PortfolioBacktestDto` | `400` validações |

### `GET /asset-rates` — validações no controller
- `tickers` obrigatório (query string, separado por vírgula).
- Split por `,` (remove vazios, trim), `Take(30)`, `Distinct` case-insensitive.

### `GET /asset-rate` — validações no controller
- `ticker` obrigatório, `Length <= 20`.
- `period` ∈ `{ 7D, 30D, 1A, 2A, 5A, 10A, 15A }`.
- Se o service retornar `null` → `400 "Período inválido."`.

### `GET /historical` — validações no controller
- `benchmark`: aceita os fixos OU qualquer string não-vazia com `Length <= 20` (tickers do banco).
- `startDate < endDate`.
- `monthlyContribution >= 0` e `initialAmount >= 0` (default `initialAmount = 0`).
- `endDate` é **clampado** para hoje (UTC) se for futuro.

### `POST /portfolio/backtest` — validações no controller
- `Assets` não nulo, **mínimo 2** e **máximo 10**.
- Cada `Ticker` não-vazio e `Length <= 20`.
- Cada `WeightPct` em `(0, 100]`.
- `|soma dos pesos - 100| <= 0.5`.
- `StartDate < EndDate`; `EndDate` clampado para hoje (UTC).
- Valores `>= 0`.

### Request — query do `/historical` (DTO implícito, parâmetros soltos)
```
benchmark           : string
startDate           : DateOnly
endDate             : DateOnly
monthlyContribution : long      // centavos
initialAmount       : long = 0  // centavos
```

---

## 4. Regras de negócio

### RN-SIM-01 — Valores monetários em centavos (`long`)
Diferente de Transactions (que usa `int`), os endpoints de simulação trafegam dinheiro como **`long`
em centavos** (`monthlyContribution`, `initialAmount`, `Invested`, `Value`, `FinalValue`…). O front
multiplica por 100 ao enviar e divide por 100 ao exibir. Nunca usa `double`/`decimal` para o valor monetário.

### RN-SIM-02 — Roteamento de série mensal por benchmark (`GetMonthlyReturnsForBenchmarkAsync`)
Para `historical` e cada ativo do backtest, o service escolhe a fonte por `switch`:
- `CDI`/`SELIC` → série mensal BACEN direta.
- `IPCA+N` → IPCA mensal (BACEN) + spread real convertido de anual p/ mensal (`BuildIpcaPlusAsync`).
- `IBOVESPA`/`IFIX`/`SP500_BRL` → Brapi (`interval=1mo`), retornos mês a mês de fechamentos consecutivos.
- **qualquer outro valor** → ticker do banco (`MarketPriceHistory`).

### RN-SIM-03 — Benchmark dinâmico via base local (`GetMonthlyReturnsFromDbAsync`)
Para tickers do banco: busca preços diários numa janela que começa 2 meses antes de `from` (para ter
fechamento do mês anterior), agrupa por mês pegando o **último preço de cada mês**, e calcula o retorno
mês a mês `(precoMesAtual / precoMesAnterior - 1)`. Se o ativo não existe ou há menos de 2 preços, retorna vazio.

### RN-SIM-04 — Simulação histórica de aporte único (`GetHistoricalSimulationAsync`)
- Percorre do 1º dia do mês de `startDate` até o 1º dia do mês de `endDate`.
- Em cada mês: soma o aporte (`invested += contribution`, `value += contribution`), depois aplica o retorno do mês (`value *= 1 + r/100`).
- O retorno do mês vem da série; se faltar, o fallback depende do tipo:
  - ticker do banco → **0%** (gap de dados, sem fallback);
  - benchmark fixo → fallback da média histórica (`GetFallbackMonthly`).
- `IsPartialData` fica `true` para tickers do banco/índices sem dados reais; `DataNote` traz o aviso correspondente.

### RN-SIM-05 — IPCA+N (`BuildIpcaPlusAsync`)
O spread anual (4/5/6%) é convertido para taxa mensal equivalente `(1 + a/100)^(1/12) - 1` e **somado**
ao IPCA mensal de cada mês. É uma aproximação aditiva (spread mensal somado ao IPCA mensal), não um produto de fatores.

### RN-SIM-06 — Backtest de carteira (`GetPortfolioBacktestAsync`)
- Busca a série mensal de cada ticker distinto (mesma rota do RN-SIM-02).
- **Benchmarks fixos** recebem fallback para qualquer mês sem dado real, ficando totalmente cobertos; assim o intervalo efetivo é limitado **apenas pelos tickers do banco**.
- O período efetivo é a **interseção** dos meses com dados de **todos** os ativos, cruzada com o range pedido. Se vazio → DTO zerado com `DataNote` explicando.
- Mês a mês aplica o **retorno ponderado** pelos pesos (rebalanceamento mensal implícito).
- Retorno por ativo (`AssetReturns`) é o fator geométrico acumulado no período efetivo, **dedup por ticker**.
- `IsPartialData = true` se o range foi reduzido OU se algum índice ficou estimado; `DataNote` concatena os dois avisos quando aplicável.

### RN-SIM-07 — Retorno anualizado (CAGR)
Backtest de carteira: `(portfolioFactor^(12/meses) - 1) * 100`, base geométrica correta.
Simulação histórica (single): usa `ratio = FinalValue / initialAmount.Clamp(1, …)` — **denominador é o
capital inicial, não o total investido** (ver gap G3).

### RN-SIM-08 — CAGR por ticker via Brapi (`GetCagrForTickerAsync`, usado por `/asset-rates`)
- Sem token Brapi → `IsReal=false`, `RateSource="Sem token Brapi"`.
- Busca `range=10y&interval=1mo`; CAGR = `(close_final/close_inicial)^(1/anos) - 1`.
- **Somente preço** (sem dividendos). Cache de 12h por ticker.
- Erros/dados insuficientes → `IsReal=false` com `RateSource` descritivo.

### RN-SIM-09 — CAGR por período via base local (`GetAssetRateForPeriodAsync`, usado por `/asset-rate`)
- Mapeia o período (`7D`…`15A`) para uma data inicial relativa a hoje.
- Lê `MarketPriceHistories` do ticker (**`ticker.ToUpper()`**) a partir dessa data.
- CAGR usando `anos = dias/365.25`. Menos de 2 preços → `IsReal=false` "Dados insuficientes no período".
- **Importante:** este endpoint usa a **base local**, enquanto `/asset-rates` usa **Brapi** — fontes diferentes para CAGR (ver gap G2).

### RN-SIM-10 — Cache (`IMemoryCache`)
- `available-benchmarks`: 6h. `benchmark-rates`: 6h.
- Séries BACEN: 12h (chave por série+período). Séries/CAGR Brapi: 12h.
- `historical` e `portfolio/backtest` **não** têm cache próprio, mas reaproveitam as séries cacheadas.

### RN-SIM-11 — Anualização das taxas de referência (`GetBenchmarkRatesAsync`)
Pega 12 meses de séries BACEN e anualiza por **compounding**: `∏(1 + r_mensal/100) - 1`, arredondado a 2 casas.
Se a série vier vazia, a taxa correspondente é `0`.

### RN-SIM-12 — Motor de tributação client-side (`taxCalc.ts`)
Usado por todos os simuladores **front-only** (juros compostos, projeção de meta, comparador, projeção de carteira):
- **Renda fixa / Tesouro:** IR regressivo (22,5% ≤180d → 15% >720d) + IOF regressivo nos primeiros 30 dias.
- **Fundos:** come-cotas aproximado — curto prazo 21,5% (20% + drag), longo prazo 16,5% (15% + drag).
- **Ações / Cripto / Internacional:** 15% sobre o ganho. **FII:** 20%.
- Conversão de meses→dias usa `days = months * 30` (aproximação). Tudo isso é **independente do backend** — o backend não calcula imposto.

---

## 5. Front (Web)

- **Rota:** `/simulations` → `app/(app)/simulations/page.tsx` (re-export) → `features/simulations/SimulationsPage.tsx`.
- **Página:** `SimulationsPage.tsx` só monta um `TabChips` com 6 abas; cada aba é um componente próprio.

### Abas (`SimulationsPage.tsx`)
| Aba | Componente | Backend? |
|---|---|---|
| Juros Compostos | `CompoundInterestSimulator` | Só lê `available-benchmarks` + `asset-rate` (referência opcional) |
| Aposentadoria | `RetirementSimulator` | Não (100% front) |
| Simulação Histórica | `HistoricalSimulator` | `GET /historical` |
| Carteira | `PortfolioSimulator` | Backtest: `POST /portfolio/backtest`; Projeção: 100% front |
| Projeção de Meta | `GoalProjection` | Não (100% front) |
| Comparar Cenários | `ScenarioComparator` | Lê `benchmark-rates` + `asset-rates` |

### API client — `lib/api/simulation.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getBenchmarkRates()` | `GET /simulation/benchmark-rates` | |
| `getAvailableBenchmarks()` | `GET /simulation/available-benchmarks` | |
| `getHistoricalSimulation(params)` | `GET /simulation/historical` | params na query |
| `getAssetRates(tickers[])` | `GET /simulation/asset-rates` | junta tickers com vírgula |
| `getAssetRateForPeriod(ticker, period)` | `GET /simulation/asset-rate` | |
| `portfolioBacktest(req)` | `POST /simulation/portfolio/backtest` | |

`AssetRate` e `AvailableBenchmark` são tipados em `simulation.ts` (o client); os demais tipos vêm de `lib/types/simulation.ts`.

### Hooks — `features/simulations/hooks/useSimulation.ts`
- `useAvailableBenchmarks()` / `useBenchmarkRates()` — queries, `staleTime` 6h, `retry: 1`.
- `useAssetRates(tickers)` — query, `staleTime` 12h, `enabled` se houver tickers; queryKey ordena os tickers para estabilidade.
- `useAssetRateForPeriod(ticker, period)` — query, `staleTime` 12h, `enabled` só com ticker+period.
- `useHistoricalSimulation()` / `usePortfolioBacktest()` — **mutations** (disparadas no clique de "Simular").

> **Nota de convenção:** como aqui não há cache de coleção do usuário para atualizar, o padrão
> `setQueryData` do `web/CLAUDE.md` não se aplica — as duas operações "pesadas" são mutations sob demanda. Coerente com o domínio.

### Motor de cálculo client-side — `features/simulations/utils/taxCalc.ts`
- `simulateMonthly(initial, monthly, annualRate, months, category)` — série mensal completa (bruto, líquido, IR, IOF, renda mensal, CAGR). É o coração dos simuladores front.
- `aggregateAnnual(points)` — colapsa a série mensal em anual (último mês de cada ano, somando rendas mensais).
- `calculateTax(...)`, `irRateFixedIncome(...)`, `calculateIof(...)` — tabelas de IR/IOF.
- `simulateCompound` / `aggregateCompoundAnnual` — helpers legados mantidos por compat.

### Componentes e particularidades
- **`CompoundInterestSimulator`** — juros compostos com toggle bruto/líquido, presets de período (1a…30a) ou meses custom, comparação visual com benchmarks **hardcoded** (`BENCHMARK_RATES`: CDI 10.65, IPCA+5 10.2, IBOV 13.0) e um card de "referência histórica" que consome `useAssetRateForPeriod` (CAGR real de um ticker do banco).
- **`HistoricalSimulator`** — dropdown unificado (`BenchmarkSelect`) com índices fixos + tickers do banco; ao escolher ticker, força modo custom e semeia datas a partir de `earliestDate`/`latestDate`. Agrega o gráfico por ano quando ≥ 36 meses. Tabela mês a mês paginada.
- **`PortfolioSimulator`** — duas sub-abas: **Backtest** (backend) e **Projeção** (front, `simulateMonthly` por ativo, área empilhada). Compartilha `PortfolioBuilder` (2–10 ativos, soma 100%, "distribuir igualmente").
- **`PortfolioBuilder`** — `AssetPicker` com índices fixos + tickers do banco; impede ticker duplicado; `categoryFromAssetType` mapeia o tipo do ativo p/ categoria fiscal na projeção.
- **`RetirementSimulator`** — FIRE pela regra dos 4%, em **retorno real** (desconta inflação); patrimônio-alvo = despesas anuais ÷ taxa de retirada; gráfico de patrimônio real vs nominal + curva de inflação. 100% front.
- **`GoalProjection`** — dois modos: "calcular prazo" (itera até atingir a meta, teto 1200 meses) ou "calcular aporte" (fórmula de anuidade). 100% front.
- **`ScenarioComparator`** — até 4 cenários a partir de `PRESET_ASSETS`; `resolveRate` substitui taxas estimadas por dados reais do BACEN (CDI/SELIC e derivados) e CAGR Brapi (`useAssetRates`) quando disponíveis; destaca o "vencedor".
- **`MonthRangePicker`** — seletor de range mês/ano com clamp por `minYearMonth`/`maxYearMonth` (passados pelos tickers do banco); piso default de ano = 1994.

### Catálogo de presets — `lib/types/simulation.ts`
`PRESET_ASSETS` é um catálogo estático grande (renda fixa, tesouro, fundos, ações BR, FIIs, internacional, cripto)
com `annualRate` estimado, `isStub`, `rateSource` e, quando aplicável, `ticker`/`brapiTicker`. Alimenta o
comparador. Algumas taxas são marcadas como dinâmicas (substituídas por BACEN/Brapi em runtime).

---

## 6. Edge cases & gaps

### Edge cases cobertos
- `endDate` futuro → clampado para hoje (UTC) em `historical` e backtest.
- Carteira sem período em comum entre ativos → DTO zerado com `DataNote` explicativo (RN-SIM-06).
- Benchmark/índice sem dado real → fallback de média histórica + `IsPartialData=true` + `DataNote` (RN-SIM-04).
- Ticker do banco com gap de meses → meses faltantes contam como 0% (sem fallback) (RN-SIM-04).
- `/asset-rates`: `Take(30)` + dedup case-insensitive; `/asset-rate`: período fora do conjunto → `400`.
- Soma de pesos da carteira validada com tolerância de ±0.5%.

### Gaps / dúvidas a confirmar
- **G1 — Endpoints não escopados por `UserId`:** todos os `[Authorize]`, mas nenhum filtra por usuário (são dados de mercado globais). É intencional, porém **diverge** da regra "toda query de entidade owned filtra por UserId" — vale registrar que `MarketAsset`/`MarketPriceHistory` **não são** `OwnedEntity`. Confirmar no spec de market-data.
- **G2 — Duas fontes diferentes de CAGR:** `/asset-rates` (batch) busca CAGR na **Brapi** (10a, requer token Pro), enquanto `/asset-rate` (single, por período) calcula CAGR sobre a **base local** (`MarketPriceHistory`). Tickers iguais podem retornar números diferentes dependendo do endpoint. Confirmar se é intencional ou se ambos deveriam usar a base local (mais barata e já sincronizada).
- **G3 — Denominador do CAGR na simulação histórica:** em `GetHistoricalSimulationAsync`, `AnnualizedReturnPct` usa `ratio = FinalValue / initialAmount`. Quando há aportes mensais (`monthlyContribution > 0`), o capital investido é muito maior que `initialAmount`, inflando o CAGR. O backtest de carteira usa fator geométrico correto. Provável bug — confirmar a métrica desejada (deveria considerar o fluxo de aportes, ex. TIR/MWRR).
- **G4 — `FetchBacenMonthlyAsync` redundante:** o método apenas chama `FetchBacenMonthlyDecimalAsync` (o comentário diz "returns values as double (for backward compat)", mas o tipo é `decimal`). Candidato a remoção/limpeza.
- **G5 — Formato de `EffectiveStartDate`/`EffectiveEndDate`:** no caminho de sucesso, são montados como `$"{effectiveStart}-01"` resultando em `yyyy-MM-01`; no caminho de range vazio são `startDate.ToString("yyyy-MM-dd")` (dia real). Formatos não totalmente consistentes entre os dois ramos. O front só usa `slice(0,7)`, então não quebra, mas confirmar padronização.
- **G6 — Símbolos Brapi não confirmados:** comentários no service marcam `IFIX` e `IVVB11`/`SP500_BRL` como "to be validated with a live Pro response". Se os símbolos estiverem errados, esses índices sempre cairão no fallback estimado silenciosamente. Validar com conta Pro.
- **G7 — Benchmarks hardcoded no `CompoundInterestSimulator`:** as taxas de comparação (CDI 10.65%, IPCA+5 10.2%, IBOV 13%) são constantes no componente, **não** vêm de `benchmark-rates`. Divergem das taxas reais exibidas no comparador. Confirmar se devem passar a consumir o endpoint.
- **G8 — Sem testes automatizados:** não há `SimulationServiceTests` em `FinanceControl.Tests` (só Account/Budget/Transaction/User). Lógica não-trivial (interseção de meses, fallback, CAGR) está sem cobertura.
- **G9 — Resiliência das APIs externas:** falhas de BACEN/Brapi são engolidas com `catch { }` (retornam série vazia), o que silenciosamente vira fallback/0%. Bom para não quebrar a UX, mas pode mascarar indisponibilidade — não há sinalização ao usuário de que a fonte real falhou (apenas o `DataNote` genérico).
- **G10 — `days = months * 30` no `taxCalc`:** a conversão meses→dias para faixas de IR/IOF é aproximada; perto das fronteiras (180/360/720 dias) a alíquota pode divergir do cálculo real por data. Aceitável para um simulador, mas documentar.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/SimulationController.cs`
- `FinanceControl.Services/Services/SimulationService.cs`
- `FinanceControl.Domain/Interfaces/Services/ISimulationService.cs`
- `FinanceControl.Services/Brapi/BrapiSettings.cs`
- `FinanceControl.Shared/Dtos/Request/Simulation/PortfolioBacktestRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/Simulation/BenchmarkRatesDto.cs`, `AvailableBenchmarkDto.cs`, `AssetRateDto.cs`, `HistoricalSimulationDto.cs`, `PortfolioBacktestDto.cs`
- _(sem validators FluentValidation — validação inline no controller; sem testes — ver G8)_

**Web**
- `features/simulations/SimulationsPage.tsx`
- `features/simulations/components/CompoundInterestSimulator.tsx`, `HistoricalSimulator.tsx`, `PortfolioSimulator.tsx`, `PortfolioBuilder.tsx`, `RetirementSimulator.tsx`, `GoalProjection.tsx`, `ScenarioComparator.tsx`, `MonthRangePicker.tsx`
- `features/simulations/hooks/useSimulation.ts`
- `features/simulations/utils/taxCalc.ts`
- `lib/api/simulation.ts`
- `lib/types/simulation.ts`

**Relacionados (outros specs)**
- `specs/market-data.md` — entidades `MarketAsset`/`MarketPriceHistory`, sincronização Brapi e jobs (fonte dos dados que este domínio lê).
- `specs/transactions.md` — padrão de spec e convenção de centavos (lá em `int`, aqui em `long`).
