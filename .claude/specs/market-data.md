# Spec: Market Data (Brapi)

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-05.
> **Domínio:** Dados de mercado de ativos (cotações, histórico diário, ticks intraday, fundamentos) provenientes da [Brapi](https://brapi.dev). Catálogo global, compartilhado por todos os usuários.

---

## 1. Visão geral

Market Data é a camada de **dados de mercado global** do app: o catálogo de ativos (ações, FIIs, ETFs, BDRs, cripto, índices, moedas/câmbio, Tesouro Direto) com cotação atual, histórico de preço diário, ticks intraday, indicadores fundamentalistas e um feed de indicadores macro. Tudo vem da Brapi.

Diferente da maioria das entidades, `MarketAsset` **não** herda `OwnedEntity` — herda `BaseEntity` direto e **não tem `UserId`**. A mesma linha `PETR4` é compartilhada por todos os usuários que a possuem. A deduplicação é garantida por um índice único em `Ticker`.

Esta camada é a **fundação** de dois outros domínios:
- **Investments** — cada `Investment` aponta para um `MarketAssetId`; preço atual, variação do dia e dividendos derivam daqui (ver `specs/investments.md`).
- **Simulations** — usa `MarketPriceHistories` para calcular CAGR histórico de qualquer ativo local e busca benchmarks no banco (ver `specs/simulation.md`).

O preenchimento e a atualização dos dados acontecem por **jobs em background** (sync do universo de ativos, preço diário, ticks de 15 min, limpeza). A API documentada aqui é majoritariamente **somente leitura** (listar, buscar, detalhar, fundamentos).

Responsabilidades **fora** deste spec:
- Agendamento e orquestração dos jobs Brapi (`BrapiPriceUpdateHostedService`, `BrapiIntradayHostedService`, `BrapiCleanupHostedService` e seus horários) → `specs/background-jobs.md`. Aqui apenas mencionamos que existem e descrevemos *o que* eles gravam, não *quando* rodam.
- Carteira do usuário, posições, dividendos vinculados a transações → `specs/investments.md`.
- Cálculo de CAGR/projeções a partir do histórico → `specs/simulation.md`.

> **Observação de escopo:** as chamadas Brapi feitas pelo **próprio `MarketService`** (search/list no banco, detalhe, fundamentos com cache) estão **dentro** deste spec. As chamadas Brapi feitas por `SimulationService` (CAGR mensal `range=10y&interval=1mo`) e por `InvestmentService` pertencem aos seus respectivos specs.

---

## 2. Entidades

As três entidades vivem em `apps/api/FinanceControl.Domain/Entities/` e herdam `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt?`) — **nenhuma é owned**.

### `MarketAsset` (`BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/MarketAsset.cs`

Catálogo global de um ativo. Uma linha por ticker.

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `Ticker` | `string` | Símbolo (ex.: `PETR4`, `BTC`, `^BVSP`). **Índice único** — chave de dedup |
| `Name` | `string` | Nome do ativo / empresa |
| `AssetType` | `EnumAssetType` | Tipo do ativo (persistido como string) |
| `CurrentPrice` | `long` | **Centavos** (R$ 132,12 → `13212`). `0` enquanto não cotado |
| `LastPriceUpdate` | `DateTime?` | UTC da última atualização de preço; `null` até a 1ª cotação |
| `LogoUrl` | `string?` | URL do logo (coluna `text`) |
| `Currency` | `string` | Default `"BRL"`; cripto entra como `"USD"` no seed |
| `PriceHistory` | `ICollection<MarketPriceHistory>` | Histórico diário (1:N, cascade delete) |
| `PriceIntraday` | `ICollection<MarketPriceIntraday>` | Ticks intraday (1:N, cascade delete) |
| `Investments` | `ICollection<Investment>` | Posições de usuários neste ativo (1:N) |

> Note bem: a entidade **não armazena** `PreviousClose` nem `DayChangePct`. Ambos são **derivados em tempo de leitura** a partir do `MarketPriceHistories` (ver RN-MKT-04). Uma migration que adicionava `PreviousClose` foi revertida (commit `e1b2647`).

### `MarketPriceHistory` (`BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/MarketPriceHistory.cs`

Log de preço **diário**. Uma linha por ativo por dia, compartilhada entre todos os donos.

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `MarketAssetId` | `int` | FK → `MarketAsset` (cascade delete) |
| `Date` | `DateOnly` | Dia (coluna `date`, sem hora) |
| `Price` | `long` | **Centavos**, fechamento do dia |
| `MarketAsset` | `MarketAsset` | Navegação |

Índice **único** em `(MarketAssetId, Date)` — idempotência: uma linha por ativo por dia.

### `MarketPriceIntraday` (`BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/MarketPriceIntraday.cs`

Tick intraday. Uma linha por ativo por slot de 15 min. Linhas com mais de **7 dias** são purgadas pelo job de cleanup (ver `specs/background-jobs.md`).

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `MarketAssetId` | `int` | FK → `MarketAsset` (cascade delete) |
| `Timestamp` | `DateTime` | UTC, truncado ao slot de 15 min (`timestamp with time zone`) |
| `Price` | `long` | **Centavos** |
| `MarketAsset` | `MarketAsset` | Navegação |

Índices: **único** em `(MarketAssetId, Timestamp)` (idempotência por slot) + índice em `Timestamp` (range queries de cleanup/gráfico).

> **Note bem:** nenhum endpoint deste spec lê `MarketPriceIntraday` hoje. A tabela é gravada pelo job intraday e purgada pelo cleanup, mas a API de leitura (detalhe) só retorna o histórico **diário** (`MarketPriceHistory`). Ver gap **G6**.

### `MarketAssetFundamentals` (`BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/MarketAssetFundamentals.cs`

Snapshot 1:1 de indicadores fundamentalistas por ativo, persistido **em massa** para permitir ranquear/filtrar o universo por métrica (DY, P/L, P/VP, valor de mercado, receita). Global — não owned. Só ativos equity-like (ações, FIIs, ETFs, BDRs) carregam fundamentos.

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `MarketAssetId` | `int` | FK → `MarketAsset` (**índice único**, cascade delete) |
| `DividendYield` | `decimal?` | fração (0.0713 = 7,13%) |
| `PriceToEarnings` | `decimal?` | P/L |
| `PriceToBook` | `decimal?` | P/VP |
| `ReturnOnEquity` | `decimal?` | fração |
| `MarketCap` | `long?` | reais (não centavos) |
| `TotalRevenue` | `decimal?` | reais |
| `NetIncome` | `decimal?` | reais |
| `FetchedAt` | `DateTime?` | UTC do último refresh |

Preenchido pela passada de fundamentos do job diário (`ProcessFundamentalsBatchAsync`, via `/api/quote/{tickers}?modules=defaultKeyStatistics,financialData`). Migration: `AddDbIndexes` (cria a tabela `MarketAssetFundamentals`).

### Enum `EnumAssetType`
`apps/api/FinanceControl.Shared/Enums/EnumAssetType.cs` — serializado como **string** (`HasConversion<string>()` no mapping e `JsonStringEnumConverter` global).

`Acao`, `FundoInvestimento`, `FII`, `Cripto`, `Stock`, `Reit`, `BDR`, `ETF`, `ETFInternacional`, `TesouroDireto`, `RendaFixa`, `Index`, `Moeda`, `Outro`

**Label legível (`AssetClass`)** — mapa estático em `MarketService.AssetTypeLabels`, usado para preencher o campo `AssetClass` nos DTOs:

| `EnumAssetType` | `AssetClass` |
|---|---|
| `Acao` | `Ação` |
| `FundoInvestimento` | `Fundo de Investimento` |
| `FII` | `FII` |
| `Cripto` | `Cripto` |
| `Stock` | `Stock` |
| `Reit` | `REIT` |
| `BDR` | `BDR` |
| `ETF` | `ETF` |
| `ETFInternacional` | `ETF Internacional` |
| `TesouroDireto` | `Tesouro Direto` |
| `RendaFixa` | `Renda Fixa` |
| `Index` | `Índice` |
| `Moeda` | `Moeda` |
| `Outro` | `Outro` |

> **Note bem:** `TesouroDireto` e `RendaFixa` existem no enum e no mapa de labels, mas **nenhum** fluxo (job de sync ou `MapAssetType`) os atribui hoje — não há origem desses tipos vindo da Brapi. Ver gap **G5**.

---

## 3. Endpoints (API)

Controller: `MarketController` — rota base `api/market`. Todos exigem `[Authorize]`.
Não há escopo por usuário (dados são globais), e nenhum corpo de requisição — tudo é `GET` por query/rota.

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `GET` | `/api/market` | Lista ativos em destaque (ordenados/filtrados) | `200` `MarketAssetDto[]` | — |
| `GET` | `/api/market/search` | Busca por ticker ou nome | `200` `MarketAssetDto[]` | `400` se `q` vazio |
| `GET` | `/api/market/{ticker}` | Detalhe de um ativo + histórico diário | `200` `MarketAssetDetailDto` | `400` ticker vazio · `404` não encontrado |
| `GET` | `/api/market/{ticker}/fundamentals` | Fundamentos (chamada Brapi ao vivo + cache 6h) | `200` `FundamentalsDto` | `400` · `404` sem dados · `503` token não configurado |
| `GET` | `/api/market/{ticker}/fii` | Indicadores de FII (`/api/v2/fii/list` ao vivo + cache 6h) | `200` `FiiIndicatorsDto` | `400` · `404` sem dados · `503` token não configurado |
| `GET` | `/api/market/macro` | Indicadores macro curados (`/api/v2/macro` ao vivo + cache 6h) | `200` `MacroIndicatorDto[]` | `503` token não configurado |

### `GET /api/market` — parâmetros (query string)
```
type  : string?  = null            // nome do EnumAssetType (ex.: "Acao", "FII"); inválido/null → sem filtro
sort  : string   = "change_desc"   // preço/variação: "change_desc" | "change_asc" | "price_desc"
                                   // fundamentalista (join MarketAssetFundamentals): "dy_desc" |
                                   // "marketcap_desc" | "revenue_desc" | "pl_asc" | "pvp_asc" | "roe_desc"
limit : int      = 20              // clamp 1..100 no controller
```

### `GET /api/market/search` — parâmetros
```
q : string   // obrigatório; trim().Length >= 1, senão 400 "Query must have at least 1 character."
```

### Response — `MarketAssetDto` (item de list e search)
`apps/api/FinanceControl.Shared/Dtos/Response/Market/MarketAssetDto.cs`
```
Id              : int
Ticker          : string
Name            : string
AssetType       : EnumAssetType      // string no JSON
AssetClass      : string             // label legível (mapa AssetTypeLabels)
LogoUrl         : string?
Currency        : string             // default "BRL"
CurrentPrice    : long               // centavos
LastPriceUpdate : DateTime?
PreviousClose   : long?              // derivado (penúltimo close do histórico)
DayChangePct    : decimal?           // derivado, 2 casas; null se não houver previous close
```

### Response — `MarketAssetDetailDto`
`apps/api/FinanceControl.Shared/Dtos/Response/Market/MarketAssetDetailDto.cs` — igual ao `MarketAssetDto` mais:
```
PriceHistory : InvestmentPriceHistoryDto[]   // { Date: DateOnly, Price: long }, ordenado por Date asc
```

### Response — `FundamentalsDto`
`apps/api/FinanceControl.Shared/Dtos/Response/Market/FundamentalsDto.cs` — agregado de vários módulos Brapi. Todos os campos são nullable (preenchidos conforme a Brapi retorna). Agrupado por origem:

```
Ticker      : string
FetchedAt   : DateTime               // UTC do fetch (usado no rodapé do drawer)

// summaryProfile
CompanyName, Sector, Industry, Website, BusinessSummary : string?
FullTimeEmployees : int?
AdministratorName : string?          // FII/fundo

// quote top-level + defaultKeyStatistics
PriceToEarnings  : decimal?          // P/L (priceEarnings ?? trailingPE)
EarningsPerShare : decimal?          // LPA (earningsPerShare ?? trailingEps)
MarketCap        : long?             // em reais (não centavos)
PriceToBook      : decimal?          // P/VP
DividendYield    : decimal?          // DY (fração; front multiplica por 100)
Beta             : decimal?
EnterpriseValue  : decimal?
AnnualNetIncome  : decimal?          // de netIncomeToCommon (defaultKeyStatistics)
BookValue        : decimal?          // VPA
SharesOutstanding: long?

// financialData
Ebitda, TotalRevenue, GrossMargin, EbitdaMargin, OperatingMargin,
ProfitMargin, ReturnOnEquity, ReturnOnAssets, DebtToEquity,
TotalCash, TotalDebt, FreeCashflow : decimal?
AnnualRevenue     : decimal?         // = totalRevenue (financialData)
AnnualGrossProfit : decimal?         // = grossProfits (financialData)

// balanceSheetHistory[0] (statement mais recente)
TotalAssets, TotalLiabilities, TotalStockholderEquity, Cash, LongTermDebt : decimal?

// dividendsData.cashDividends (até 12 itens)
RecentDividends : FundamentalDividendDto[]   // { PaymentDate: DateOnly?, Rate: decimal, Label: string }
```

> Margens e ROE/ROA vêm como **fração** da Brapi (o front aplica `* 100`). `MarketCap` é tratado como reais inteiros (não centavos) por ser muito grande. Ver comentários no DTO.

---

## 4. Regras de negócio

### RN-MKT-01 — Preços sempre em centavos (`long`)
`CurrentPrice`, `MarketPriceHistory.Price` e `MarketPriceIntraday.Price` são `long` em centavos. A conversão de `decimal` da Brapi → centavos é `(long)Math.Round(value * 100)`. O front divide por 100 para exibir. **Exceção:** os campos de `FundamentalsDto` são `decimal`/`long` em unidades "cruas" da Brapi (P/L, margens em fração, `MarketCap` em reais) — não são centavos.

### RN-MKT-02 — `MarketAsset` é global, não owned
`MarketAsset`/`MarketPriceHistory`/`MarketPriceIntraday` herdam `BaseEntity` (sem `UserId`). As queries de Market **não** são escopadas por usuário (e não devem ser) — o catálogo é compartilhado. O índice único em `Ticker` é a garantia de uma linha por ativo.

### RN-MKT-03 — Listagem (`ListAsync`): pool, ordenação e filtro de preço
- Considera apenas ativos com `CurrentPrice > 0` (descarta os não cotados ainda).
- Filtro opcional por `type`: só aplica se o valor casar com um `EnumAssetType` válido (`Enum.TryParse`); valor inválido é **silenciosamente ignorado** (lista sem filtro).
- Para `sort = change_desc | change_asc` o service precisa do previous close, então puxa um **pool maior** (`limit * 5`) ordenado por `CurrentPrice desc` (proxy de relevância/liquidez), calcula `DayChangePct`, descarta quem não tem variação e só então aplica `Take(limit)`. Para os demais sorts, puxa direto `limit` linhas.
- Ordenações: `change_desc` (variação desc), `change_asc` (variação asc), `price_desc` (preço desc), **default/qualquer outro** → ordem do pool (preço desc), `Take(limit)`.

### RN-MKT-04 — `PreviousClose` e `DayChangePct` derivados do histórico
Nenhum dos dois é coluna. O previous close é o **penúltimo** registro de `MarketPriceHistories` por data desc (`OrderByDescending(Date).Skip(1).First`) — em `List`/`Search` via group-by por `MarketAssetId`; no detalhe via `history[^2]`. A variação é:
```
DayChangePct = round((CurrentPrice - PreviousClose) / PreviousClose * 100, 2)
```
Se não houver previous close (`< 2` pontos no histórico) ou ele for `0`, `PreviousClose` e `DayChangePct` saem `null`.

### RN-MKT-05 — Busca (`SearchAsync`)
- Normaliza `q` para `Trim().ToUpperInvariant()`.
- Casa `Ticker` **ou** `Name` por `Contains` (case-insensitive via `ToUpper()`), ordena por `Ticker`, `Take(20)` (limite fixo, não parametrizável).
- Para cada resultado, deriva `PreviousClose`/`DayChangePct` igual à listagem (RN-MKT-04).
- Não filtra por `CurrentPrice > 0` (diferente da listagem) — ativos sem cotação ainda aparecem na busca.

### RN-MKT-06 — Detalhe (`GetDetailAsync`)
- Normaliza ticker para `Trim().ToUpperInvariant()` e busca por igualdade exata de `Ticker`.
- Ticker inexistente → lança `KeyNotFoundException` → controller responde `404`.
- Carrega **todo** o histórico diário (`MarketPriceHistories`) ordenado por `Date asc`, mapeado para `InvestmentPriceHistoryDto`. Não há paginação nem recorte de janela no backend — o recorte por período é feito no front (RN-MKT-10).

### RN-MKT-07 — Fundamentos: chamada Brapi ao vivo + cache 6h (`GetFundamentalsAsync`)
- Chave de cache `fundamentals_{TICKER}` em `IMemoryCache`; hit retorna direto. Miss → chama a Brapi e grava no cache por **6 horas**.
- Sem `BrapiSettings.Token` configurado → lança `InvalidOperationException("Brapi token not configured.")` → controller responde **`503`**.
- URL: `https://brapi.dev/api/quote/{TICKER}?modules=summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory&dividends=true&token=...`, timeout **15s**.
- `results` vazio/ausente → lança `KeyNotFoundException` → `404`.
- O parse é defensivo: helpers `GetString/GetDecimal/GetLong/GetInt` retornam `null` se o campo faltar ou o tipo não bater; vários campos têm fallback (ex.: `priceEarnings ?? trailingPE`, `totalStockholderEquity ?? shareholdersEquity`, `longTermDebt ?? longTermLoansAndFinancing`). `RecentDividends` pega até 12 itens de `dividendsData.cashDividends`.

### RN-MKT-08 — `AssetClass` é label derivado
`AssetClass` nos DTOs não é coluna: vem de `AssetTypeLabels.GetValueOrDefault(AssetType, "Outro")`. É o rótulo legível em PT-BR exibido na UI; `AssetType` (enum cru) também é serializado para o front decidir cores/ícones.

### RN-MKT-09 — Origem dos dados (jobs Brapi) — resumo
Os dados deste domínio são preenchidos por jobs (detalhados em `specs/background-jobs.md`). O que **este** spec precisa saber sobre o que eles gravam:
- **Sync do universo** (`SyncAssetUniverseAsync`): paginação de `/api/quote/list` (limit 200) faz upsert de `MarketAsset` (name, type via `MapAssetType`, logo, preço); semeia os benchmarks `^BVSP` (Ibovespa) e `IFIX` como `Index`; descobre criptos via `/api/v2/crypto/available` (entram como `Cripto`, `Currency = "USD"`, preço 0); descobre pares de câmbio via `/api/v2/currency/available` (entram como `Moeda`, ticker no formato `USD-BRL`, `Currency = "BRL"`, preço 0); descobre títulos do Tesouro via `/api/v2/treasury/list` paginado (entram como `TesouroDireto`, ticker = slug em maiúsculo ex. `TESOURO-SELIC-01032031`, `Currency = "BRL"`).
- **Preço diário** (`RunAsync` → batches de quote/crypto/currency/treasury): atualiza `CurrentPrice`/`LastPriceUpdate`/`LogoUrl`/`Currency` e grava **uma** linha de `MarketPriceHistory` por ativo por dia. No 1º run de um ativo (sem histórico), faz **backfill**: quote/crypto via `range=max&interval=1d` (histórico inline); moedas via `/api/v2/currency/historical` (série PTAX diária); Tesouro via `/api/v2/treasury/indicators` (preço atual) + `/api/v2/treasury/indicators/history` (série diária), usando o primeiro preço positivo entre buy/base/sell convertido a centavos.
- **Intraday** (`RunIntradayAsync`): atualiza `CurrentPrice` (quote/crypto/currency) e grava um tick `MarketPriceIntraday` no slot de 15 min (idempotente por slot). **Não** sincroniza universo nem grava histórico diário (nem faz backfill de moedas). **Tesouro não entra no intraday** — indicadores são publicados 1×/dia.
- **Fundamentos** (`ProcessFundamentalsBatchAsync`, só no job diário): passada separada e best-effort sobre o `quoteGroup` que chama `/api/quote/{tickers}?modules=defaultKeyStatistics,financialData`, faz upsert de `MarketAssetFundamentals` (DY, P/L, P/VP, ROE, marketCap, receita, lucro). **Isolada** dos batches de preço — uma falha de módulos nunca quebra a atualização de preço. Não roda no intraday.
- **Cleanup** (`BrapiCleanupJobService`): apaga `MarketPriceIntraday` com `Timestamp` anterior a `now - 7 dias` (`IntradayRetentionDays = 7`).
- **Matching de símbolo:** a Brapi às vezes devolve sufixo `.SA` (ex.: `IFIX` → `IFIX.SA`); `FindAssetBySymbolAsync` casa pelo símbolo exato e, em fallback, pelo símbolo sem o sufixo.
- **Dividendos:** quando a Brapi retorna `cashDividends`, o job insere `InvestmentDividend` **por dono** do ativo (lógica de Investments) — ver `specs/investments.md`.

### RN-MKT-10 — Cache no front
`useFundamentals` usa `staleTime` de **6h** explicitamente alinhado ao cache do backend; `useMarketList` 5 min; `useMarketSearch`/`useMarketAssetDetail` 60s. São apenas queries de leitura (não há mutação neste domínio). Diferente do `web/CLAUDE.md`, aqui não há `setQueryData` porque não há mutação.

---

## 5. Front (Web)

- **Rotas:** `/market` → `MarketPage.tsx` (dashboard); `/market/[ticker]` → `MarketAssetPage.tsx` (página dedicada do ativo, lê o ticker via `useParams()`); `/market/ranking/[sort]?type=` → `MarketRankingPage.tsx` (lista completa de um ranking, `useSearchParams` em `Suspense`). Todos via `page.tsx` re-export de uma linha. No menu lateral aparece como **"Mercado"** (`Sidebar.tsx`).
- **Layout (redesign):** o `/market` virou um **dashboard**: grade de indicadores (`MarketIndicators` — cards no padrão `StatCard` num grid responsivo `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, cada um com ícone tintado, índices IBOV/IFIX + moedas USD-BRL/EUR-BRL com variação do dia + macro Selic/CDI/IPCA/IGP-M com valor anterior), filtro de classe (`PillSelect`) e cards de ranking (`RankingCard`) — Maiores altas/quedas (preço/variação) e, para classes equity, Maiores DY / Maior Valor de Mercado (sorts fundamentalistas), cada um com "Ver ranking". Clicar numa linha (`MarketAssetRow`, `Link` → `/market/[ticker]`) abre a página do ativo, que mostra `MarketAssetCard` + `MarketPriceChart` + fundamentos inline (`FundamentalsPanel`) ou indicadores de FII (`FiiPanel`). A busca de tickers vive no header (`GlobalSearch`, seção "Mercado" via `/market/search`). O `FundamentalsDrawer` continua só no `InvestmentDetailModal`.

### API client — `lib/api/market.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `list(params)` | `GET /market` | `{ type?, sort?, limit? }` |
| `search(q)` | `GET /market/search` | |
| `getDetail(ticker)` | `GET /market/{ticker}` | retorna `MarketAssetDetail` (com `priceHistory`) |
| `getFundamentals(ticker)` | `GET /market/{ticker}/fundamentals` | |

### Hooks — `features/market/hooks/useMarket.ts`
- `useMarketList({type, sort, limit})` — `["market","list",...]`, `staleTime` 5 min.
- `useMarketSearch(q)` — `["market","search",q]`, `enabled` só se `q.trim().length >= 1`, `staleTime` 60s.
- `useMarketAssetDetail(ticker)` — `["market","detail",ticker]`, `enabled` se `ticker.length > 0`, `staleTime` 60s.
- `useFundamentals(ticker | null)` — `["market","fundamentals",ticker]`, `enabled` se ticker truthy, `staleTime` 6h, `retry: 1`.

### Tipos — `lib/types/market.types.ts`
`MarketAsset`, `MarketAssetDetail = MarketAsset & { priceHistory: PricePoint[] }`, `PricePoint { date, price }`, `Fundamentals`, `FundamentalDividend`. Em geral espelham os DTOs do backend (camelCase).

### Componentes principais
- **`MarketPage`** — estado de `query`, `selectedTicker`, `fundamentalsTicker`. Decide entre overview e busca por `query.trim().length >= 1`.
- **`MarketOverview`** (interno do `MarketPage`) — tira de **abas** que mapeiam para `(type, sort)`: *Maiores altas* (`change_desc`), *Maiores quedas* (`change_asc`), *Ações* (`Acao`), *FIIs* (`FII`), *ETFs* (`ETF`), *Cripto* (`Cripto`), *BDRs* (`BDR`) — todas com `limit: 20`.
- **`MarketSearchResults`** — lista de resultados de busca (logo, ticker, nome, preço, variação do dia).
- **`MarketAssetCard`** — header (logo/ticker/`assetClass`/currency), preço grande + variação do dia (% e valor absoluto), e uma **grade de métricas calculadas no client**: fechamento anterior + variações de Semana/Mês/12 meses (ver RN-MKT-11).
- **`MarketPriceChart`** — gráfico de área (Recharts) sobre `priceHistory`, com presets `1D/7D/15D/1M/3M/6M/1A/5A/10A/15A` + período personalizado, amostragem para ~300 pontos. Recorte é **client-side** sobre o histórico completo do detalhe.
- **`FundamentalsDrawer`** — drawer com abas *Indicadores / Balanço / DRE / Empresa* + bloco de proventos; só renderiza métricas com valor. Botão "Ver fundamentos da empresa" aparece só para tipos em `FUNDAMENTAL_TYPES` (`Acao, BDR, Stock, Reit, ETF, ETFInternacional, FundoInvestimento`). Erro → mensagem citando plano Pro/token Brapi.

### RN-MKT-11 — Variações de Semana/Mês/12m são heurísticas client-side
No `MarketAssetCard`, "Semana" usa `priceHistory[len-5]`, "Mês" usa `[len-22]` e "12 meses" usa `[0]` (o ponto mais antigo do histórico), assumindo ~5 pregões/semana e ~22/mês. Não são janelas de calendário exatas e dependem de o histórico ter pontos suficientes; senão exibem `—`. O preset `1D` do gráfico mostra os 2 últimos pontos (não 1 dia real).

### Busca: origem do termo
O campo de busca é injetado pelo header global via `usePageSearch((q) => setQuery(q), "Buscar ticker ou nome...")`, **não** pelo componente `MarketSearchBar`. Ver gap **G3**.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Ativo sem 2º ponto de histórico → `PreviousClose`/`DayChangePct` = `null`, UI mostra `—` (RN-MKT-04).
- Ativo ainda não cotado (`CurrentPrice == 0`) → some da listagem, mas aparece na busca (RN-MKT-03 vs RN-MKT-05).
- `type` inválido na listagem → ignorado (lista sem filtro).
- `limit` fora de 1..100 → clamp no controller.
- `q` vazio na busca → `400`.
- Símbolo Brapi com sufixo `.SA` → fallback de matching (RN-MKT-09).
- Histórico vazio no gráfico → mensagem "Histórico de preço não disponível ainda.".
- Fundamentos com campos faltando → parse defensivo, drawer esconde métricas sem valor.

### Gaps / dúvidas a confirmar
- **G1 — `503` de fundamentos só cobre token ausente, não falha de plano/HTTP:** o controller mapeia `InvalidOperationException` (token não configurado) para `503` e `KeyNotFoundException` para `404`. Mas se a Brapi responder erro HTTP (ex.: 401/403 por plano sem Pro, ou 5xx), `GetStringAsync`/`EnsureSuccessStatusCode`... na prática `GetFundamentalsAsync` usa `client.GetStringAsync`, que lança `HttpRequestException` **não tratada** pelo controller — cai no `GlobalExceptionMiddleware` (provável `500`), enquanto a UI sugere "verifique plano Pro/token". **Confirmar o status esperado para token inválido/sem Pro** (hoje não é o `503`/`404` que a mensagem sugere).
- **G2 — `TargetHourUtc` divergente:** `appsettings.json` define `TargetHourUtc = 22`, mas o default de `BrapiSettings` é `19`. Como o agendamento é do escopo de `specs/background-jobs.md`, registrar aqui apenas a divergência de configuração e confirmar qual valor vale em produção.
- **G3 — `MarketSearchBar` órfão:** o componente `features/market/components/MarketSearchBar.tsx` existe mas **não é importado** em `MarketPage` (a busca vem do `usePageSearch` do header). Confirmar se é código morto/legado ou se deveria estar em uso.
- **G4 — `ListAsync`/`SearchAsync` sem cache de servidor:** apenas `GetFundamentalsAsync` usa `IMemoryCache`. List e search batem no banco a cada request (com group-by de previous close), embora sejam dados globais idênticos para todos. O `staleTime` de 5 min do front mitiga, mas não há cache server-side. Confirmar se é aceitável para a carga esperada.
- **G5 — `RendaFixa` sem origem:** `TesouroDireto` agora **tem origem** (descoberta via `/api/v2/treasury/list` + preços via `/treasury/indicators`). `RendaFixa` continua sem nenhum job que o produza — **confirmar** se é reservado para fonte futura (CDB/LCI/LCA) ou se deve sair do enum/UI por ora.
- **G6 — `MarketPriceIntraday` gravado mas nunca lido por esta API:** os jobs gravam ticks de 15 min e o cleanup os mantém por 7 dias, mas nenhum endpoint deste spec os consome — o detalhe só retorna histórico **diário**, e o preset `1D` do gráfico apenas fatia os 2 últimos pontos diários. **Confirmar** se há (ou haverá) um consumidor de intraday (ex.: gráfico intradiário em Investments) ou se a coleta intraday está adiantada em relação à leitura.
- **G7 — Detalhe carrega histórico completo sem recorte:** `GetDetailAsync` retorna **todo** o `MarketPriceHistories` do ativo (com backfill `max`, potencialmente milhares de pontos) em todas as chamadas, deixando o recorte por período para o client. Para ativos com histórico longo isso pode ficar pesado; avaliar paginação/limite por janela no backend.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/MarketController.cs`
- `FinanceControl.Services/Services/MarketService.cs`
- `FinanceControl.Domain/Interfaces/Services/IMarketService.cs`
- `FinanceControl.Domain/Entities/MarketAsset.cs`, `MarketPriceHistory.cs`, `MarketPriceIntraday.cs`
- `FinanceControl.Data/Mappings/MarketAssetMap.cs`, `MarketPriceHistoryMap.cs`, `MarketPriceIntradayMap.cs`
- `FinanceControl.Shared/Enums/EnumAssetType.cs`
- `FinanceControl.Shared/Dtos/Response/Market/MarketAssetDto.cs`, `MarketAssetDetailDto.cs`, `FundamentalsDto.cs`, `FundamentalDividendDto.cs`, `FiiIndicatorsDto.cs`, `MacroIndicatorDto.cs`
- `FinanceControl.Shared/Dtos/Response/Investment/InvestmentPriceHistoryDto.cs` (reusado no detalhe), `BrapiJobStatusDto.cs`
- `FinanceControl.Services/Brapi/` — `BrapiSettings.cs`, `BrapiPriceUpdateJobService.cs`, `BrapiCleanupJobService.cs`, `BrapiAssetListResponse.cs`, `BrapiQuoteResponse.cs`, `BrapiCryptoResponse.cs`, `BrapiCryptoAvailableResponse.cs`, `BrapiCurrencyAvailableResponse.cs`, `BrapiCurrencyResponse.cs`, `BrapiCurrencyHistoricalResponse.cs`, `BrapiTreasuryResponse.cs`, `BrapiTreasuryHistoryResponse.cs`, `BrapiMacroResponse.cs`, `BrapiFiiListResponse.cs`
- `FinanceControl.Workers/` — `BrapiPriceUpdateHostedService.cs`, `BrapiIntradayHostedService.cs`, `BrapiCleanupHostedService.cs` *(agendamento documentado em `specs/background-jobs.md`)*
- `FinanceControl.Services/Extensions/ServicesExtensions.cs` (DI: `IMarketService` Scoped, `BrapiSettings` bind), `FinanceControl.WebApi/Program.cs` (`AddMemoryCache`), `FinanceControl.WebApi/appsettings.json` (`BrapiSettings`)

**Web**
- `features/market/MarketPage.tsx`
- `features/market/components/MarketAssetCard.tsx`, `MarketPriceChart.tsx`, `MarketSearchResults.tsx`, `MarketSearchBar.tsx`, `FundamentalsDrawer.tsx`
- `features/market/hooks/useMarket.ts`
- `lib/api/market.ts`
- `lib/types/market.types.ts`
- `app/(app)/market/page.tsx` (re-export)

**Specs relacionados**
- `specs/background-jobs.md` — agendamento/orquestração dos jobs Brapi.
- `specs/investments.md` — carteira que consome `MarketAsset`/`MarketPriceHistory` e os dividendos inseridos pelo job.
- `specs/simulation.md` — CAGR histórico e benchmarks a partir de `MarketPriceHistories`.
