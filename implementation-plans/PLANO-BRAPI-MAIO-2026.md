# Plano de Integração — Novos Endpoints Brapi (Maio/2026)

> Gerado em 2026-05-31. Documento complementar ao [PLANO-IMPLEMENTACAO-BRAPI.md](./PLANO-IMPLEMENTACAO-BRAPI.md), que já foi implementado (job de cotações, hosted service, camada Market).
> Este arquivo cobre **apenas** os novos domínios anunciados no comunicado da Brapi de Maio/2026 e como (ou se) integrá-los.

---

## O que mudou na Brapi (comunicado Maio/2026)

A Brapi lançou quatro novidades:

1. **Futuros** — `/api/v2/futures/*` (mini Ibov, mini Dólar, DI, boi, café, milho, soja, etc.)
2. **Opções sobre futuros** — `/api/v2/futures/options/*` (sobre BGI, ICF, CCM, SJC, etc.)
3. **Tesouro Direto** — `/api/v2/treasury/*` (renda fixa pública)
4. **Melhorias em opções** — filtros, dicionário de campos, orientação sobre valores nulos, e mensagens mais claras quando um ticker deve ser consultado num endpoint específico.

### Endpoints `/api/v2/options/*` (ações/ETFs/índices) continuam iguais
A novidade de opções **sobre futuros** fica em `/api/v2/futures/options/*` e **não** substitui `/api/v2/options/*`.

---

## Decisão de escopo deste documento

| Domínio | Decisão | Motivo |
|---|---|---|
| **Tesouro Direto** | ✅ **Documentar para implementação** | Encaixa direto na carteira atual: `Investment` já tem `MaturityDate` e `ExpectedYieldPct`, e `EnumAssetType.TesouroDireto` já existe (hoje ignorado pelo job). |
| **Futuros** | 📖 **Documentar como referência** | Modelo de contrato com vencimento/alavancagem/ajuste diário não encaixa na carteira de posições atual. Ver explicação abaixo. |
| **Opções sobre futuros** | ⏸️ **Fora de escopo agora** | Derivativos avançados; só faria sentido depois de futuros. |
| **Melhorias em opções** | 📖 **Nota de robustez** | Aplicar a orientação de valores nulos ao job existente (ver no fim). |

---

# PARTE 1 — Tesouro Direto (`/api/v2/treasury/*`)

## 1.1 O que é

Renda fixa emitida pelo governo. Cada título tem um **vencimento**, um **indexador** (Selic, prefixado, IPCA, IGP-M) e uma **taxa** (% a.a.). A Brapi expõe a listagem de títulos, taxas/preços indicativos atuais e o histórico diário desde 2005.

Símbolos usam slugs públicos da Brapi:
- `tesouro-selic-01032031`
- `tesouro-prefixado-com-juros-semestrais-01012037`
- `tesouro-ipca-com-juros-semestrais-15082060`

## 1.2 Endpoints

> ✅ Os campos abaixo foram confirmados contra a documentação oficial da Brapi (páginas `/docs/tesouro-direto`, `/listagem`, `/indicadores`, `/indicadores-historico`, lidas em 2026-05-31). Nomes e nesting estão verbatim.

> ⚠️ **Restrição de plano (importante):** os três endpoints de Tesouro exigem **plano Pro**. No sandbox (sem token) só respondem para **3 títulos fixos**: `tesouro-selic-01032031`, `tesouro-prefixado-com-juros-semestrais-01012037`, `tesouro-ipca-com-juros-semestrais-15082060`. O plano **Startup** (usado hoje pelo job de ações — ver `BrapiSettings.BatchSize = 10`) **não tem acesso** a Tesouro. Confirmar o plano da conta antes de implementar. Ver §1.4.

### `GET /api/v2/treasury/list`
Lista paginada dos títulos disponíveis. Bom para popular um "catálogo" e para o usuário escolher o slug correto.

| Query param | Tipo | Obrigatório | Valores (default) |
|---|---|---|---|
| `page` | int | não | `>= 0` (default `1`) |
| `limit` | int | não | `>= 0` (default `20`) |
| `search` | string | não | símbolo ou nome do título (ex.: `tesouro-selic-01032031`) |
| `indexer` | string | não | `selic`, `prefixado`, `ipca`, `igpm` |
| `couponType` | string | não | `zero`, `semestral` |
| `sortBy` | string | não | `symbol`, `bondType`, `maturityDate`, `durationDays`, `baseDate`, `buyRate`, `sellRate`, `buyPrice`, `sellPrice`, `basePrice` (default `maturityDate`) |
| `sortOrder` | string | não | `asc`, `desc` (default `asc`) |

Resposta (`200`):
```json
{
  "results": [
    {
      "symbol": "string",          // slug (ex.: "tesouro-selic-01032031")
      "bondType": "string",        // nome público (ex.: "Tesouro Selic")
      "indexer": "string",         // selic | prefixado | ipca | igpm
      "couponType": "string",      // zero | semestral
      "maturityDate": "YYYY-MM-DD",
      "durationDays": 0,
      "baseDate": "YYYY-MM-DD",    // data de referência da taxa/preço
      "buyRate": 0.0,
      "sellRate": 0.0,
      "buyPrice": 0.0,             // preço unitário em reais
      "sellPrice": 0.0,
      "basePrice": 0.0,
      "rateInfo": {
        "rateType": "string",
        "rateUnit": "string",      // ex.: "% a.a."
        "description": "string"
      }
    }
  ],
  "pagination": {
    "page": 0, "limit": 0, "totalItems": 0, "totalPages": 0, "hasNextPage": true
  },
  "requestedAt": "ISO-8601",
  "took": 0
}
```

### `GET /api/v2/treasury/indicators`
Taxas e preços indicativos **atuais** de títulos específicos. **É este o endpoint que o job usa no run diário.**

| Query param | Tipo | Obrigatório | Valores |
|---|---|---|---|
| `symbols` | string | **sim** | slugs separados por vírgula, **máx. 20** (ex.: `tesouro-selic-01032031,tesouro-ipca-15052035`) |

Resposta (`200`) — `results[]` com os **mesmos campos por item** do `/list` acima (`symbol`, `bondType`, `indexer`, `couponType`, `maturityDate`, `durationDays`, `baseDate`, `buyRate`, `sellRate`, `buyPrice`, `sellPrice`, `basePrice`, `rateInfo{rateType,rateUnit,description}`), mais `requestedAt` e `took`. **Não** tem `pagination`.

Notas de interpretação das taxas (do dicionário oficial):
- **Selic:** `buyRate`/`sellRate` são o **spread** acima da Selic.
- **Prefixado:** taxas nominais.
- **IPCA+:** taxas reais acima da inflação.

### `GET /api/v2/treasury/indicators/history`
Série diária histórica de taxas e preços. **É este o endpoint que o job usa no backfill.** Observe que a série vem **aninhada em `history[]` dentro de cada `results[]`** — diferente do `historicalDataPrice[]` plano das ações.

| Query param | Tipo | Obrigatório | Valores |
|---|---|---|---|
| `symbols` | string | **sim** | slugs separados por vírgula, **máx. 20** |
| `startDate` | string | não | `YYYY-MM-DD` — **omitir = últimos 12 meses** |
| `endDate` | string | não | `YYYY-MM-DD` — **omitir = últimos 12 meses** |
| `sortBy` | string | não | `baseDate`, `buyRate`, `sellRate`, `buyPrice`, `sellPrice`, `basePrice` (default `baseDate`) |
| `sortOrder` | string | não | `asc`, `desc` (default `desc`) |

Resposta (`200`):
```json
{
  "results": [
    {
      "symbol": "string",
      "bondType": "string",
      "indexer": "string",
      "couponType": "string",
      "maturityDate": "YYYY-MM-DD",
      "rateInfo": { "rateType": "string", "rateUnit": "string", "description": "string" },
      "history": [
        {
          "baseDate": "YYYY-MM-DD",
          "buyRate": 0.0,
          "sellRate": 0.0,
          "buyPrice": 0.0,
          "sellPrice": 0.0,
          "basePrice": 0.0
        }
      ]
    }
  ],
  "requestedAt": "ISO-8601",
  "took": 0
}
```

> 💡 Como o history aceita **até 20 símbolos por chamada** e devolve cada série em `history[]`, o backfill pode ser feito **por lote** (não precisa de 1 chamada por título) — mais econômico em tokens. Mas como o default sem datas já é "últimos 12 meses", basta chamar **sem `startDate`/`endDate`** para o backfill anual, igual ao `range=1y` das ações.

## 1.3 Como encaixa no que já existe

A boa notícia: **não precisa de nova entidade nem de nova arquitetura.** O modelo atual já comporta Tesouro Direto.

| Campo da Brapi | Campo existente em `Investment` | Observação |
|---|---|---|
| `sellPrice` (preço de venda/mercado, reais) | `CurrentPrice` (`long`, centavos) | `(long)Math.Round(sellPrice * 100)` — mesma conversão do job de ações. (`basePrice`/`buyPrice` disponíveis se preferir outra referência.) |
| `maturityDate` (`YYYY-MM-DD`) | `MaturityDate` (`DateOnly?`) | **já existe** — hoje preenchido manualmente; agora dá pra sincronizar da API |
| `sellRate` (% a.a.) | `ExpectedYieldPct` (`decimal?`) | **já existe**. Atenção à semântica: para Selic é spread, prefixado é nominal, IPCA+ é taxa real (ver `rateInfo`) |
| `history[].sellPrice` por `baseDate` | `InvestmentPriceHistory` (1 linha/ativo/dia) | mesma tabela usada por ações/cripto; usar `baseDate` como `Date` |
| `bondType`, `indexer`, `couponType` | — | metadados sem campo equivalente hoje; ignorar ou guardar em `Name` se útil |
| — | `AssetType = EnumAssetType.TesouroDireto` | **já existe no enum**, mas hoje está na lista de ignorados do job |

### O que muda no job existente (`BrapiPriceUpdateJobService`)
Hoje o job tem dois grupos: `QuoteAssetTypes` (ações/FIIs/etc.) e cripto. `TesouroDireto` cai no "ignorar". A integração adiciona um **terceiro grupo**:

```
treasuryGroup → AssetType == EnumAssetType.TesouroDireto
```

Fluxo do lote de Tesouro (espelha o fluxo de quote, com 3 diferenças):
1. Montar `symbols` com os slugs dos títulos do lote (até 20).
2. **Preço atual:** `GET /api/v2/treasury/indicators?symbols={...}` → para cada `results[]`: `CurrentPrice = round(sellPrice*100)`, `LastPriceUpdate = now`, e opcionalmente sincronizar `ExpectedYieldPct = sellRate` e `MaturityDate = maturityDate`.
3. **Backfill (primeiro run):** `GET /api/v2/treasury/indicators/history?symbols={lote}` (sem datas = últimos 12 meses) → para cada `results[].history[]`, inserir em `InvestmentPriceHistory` usando `baseDate` como data e `round(sellPrice*100)` como preço. Aceita até 20 símbolos por chamada, então pode reusar o mesmo lote do passo 2.
4. **Sem dividendos** — Tesouro não paga dividendo; títulos "com juros semestrais" pagam cupom, mas isso fica fora desta primeira camada (não há campo de cupom na Brapi além do `couponType`).

> ⚠️ **Decisão a tomar:** o ticker do usuário hoje pode estar num formato diferente do slug da Brapi (`tesouro-selic-01032031`). Definir se:
> - (a) o `Ticker` do `Investment` passa a guardar o slug da Brapi, ou
> - (b) cria-se um campo de mapeamento (`BrapiSymbol`) separado do ticker amigável exibido ao usuário.
>
> Recomendado **(b)** se o usuário já cadastrou Tesouro com nomes livres; senão **(a)** é mais simples.

### Arquivos afetados (estimativa)

| Arquivo | Ação |
|---|---|
| `Brapi/BrapiTreasuryResponse.cs` | **Novo** — DTOs internos (ver sketch abaixo) |
| `BrapiPriceUpdateJobService.cs` | Alterar — +`treasuryGroup`, +`ProcessTreasuryBatchAsync` |
| `Investment.cs` (opção b) | Alterar — +`BrapiSymbol` (string?) |
| `InvestmentMap.cs` (opção b) | Alterar — mapear `BrapiSymbol` |
| Migration (opção b) | Nova — `AddBrapiSymbolToInvestment` (você roda) |

Nenhuma mudança em `MarketController`/`MarketService` é obrigatória — eles já leem de `Investment` + `InvestmentPriceHistory` genericamente.

### DTOs internos (sketch — segue o padrão de `BrapiQuoteResponse.cs`)

Schema confirmado; `decimal?` em taxas/preços porque a Brapi pode omitir conforme o título/data (orientação de valores nulos do dicionário). Datas chegam como string `YYYY-MM-DD` → parsear com o helper `TryParseDate` já existente no job.

```csharp
// indicators (run diário)
internal record BrapiTreasuryResponse(
    [property: JsonPropertyName("results")] List<BrapiTreasuryIndicator> Results);

internal record BrapiTreasuryIndicator(
    [property: JsonPropertyName("symbol")] string Symbol,
    [property: JsonPropertyName("bondType")] string? BondType,
    [property: JsonPropertyName("indexer")] string? Indexer,
    [property: JsonPropertyName("couponType")] string? CouponType,
    [property: JsonPropertyName("maturityDate")] string? MaturityDate,
    [property: JsonPropertyName("sellRate")] decimal? SellRate,
    [property: JsonPropertyName("sellPrice")] decimal? SellPrice,
    [property: JsonPropertyName("basePrice")] decimal? BasePrice);

// indicators/history (backfill) — série aninhada em history[]
internal record BrapiTreasuryHistoryResponse(
    [property: JsonPropertyName("results")] List<BrapiTreasuryHistoryResult> Results);

internal record BrapiTreasuryHistoryResult(
    [property: JsonPropertyName("symbol")] string Symbol,
    [property: JsonPropertyName("history")] List<BrapiTreasuryHistoryPoint>? History);

internal record BrapiTreasuryHistoryPoint(
    [property: JsonPropertyName("baseDate")] string BaseDate,
    [property: JsonPropertyName("sellPrice")] decimal? SellPrice,
    [property: JsonPropertyName("sellRate")] decimal? SellRate);
```

## 1.4 Bloqueador: plano Pro

Esta é a única dependência externa real e **precisa ser resolvida antes de implementar**:

- Os endpoints `/treasury/*` exigem **plano Pro**. O **Startup** (atual) **não acessa**.
- Sandbox (sem token) só responde para os **3 títulos fixos** listados em §1.2 — útil para desenvolver/testar os DTOs e o fluxo do job sem upgrade, mas **não serve em produção** se o usuário tiver outros títulos.

Implicações de design:
- O job **não deve quebrar** se Tesouro retornar `401/403` (plano insuficiente): tratar como os outros lotes — logar warning, incrementar `ErrorCount`, e **continuar** com ações/cripto. Reusar o `try/catch` por lote que já existe.
- Vale um *flag* de configuração (ex.: `BrapiSettings.TreasuryEnabled = false`) para ligar Tesouro só quando a conta for Pro, evitando chamadas garantidamente falhas todo dia.

> **Pergunta para você:** a conta Brapi já é Pro, ou seguimos só com os 3 títulos de sandbox por enquanto? Isso decide se a Parte 1 vai para produção agora ou fica em modo de desenvolvimento.

---

# PARTE 2 — Futuros (`/api/v2/futures/*`) — referência

## 2.1 O que são futuros

Um **contrato futuro** é um acordo de comprar/vender um ativo numa **data futura** a um **preço travado hoje**. Ao contrário de uma ação:

- **Tem vencimento** — cada contrato expira num mês. Ex.: `WINM26` = mini Ibovespa vencendo em **junho/2026**. Depois disso, "rola-se" para o próximo vencimento.
- **É alavancado** — deposita-se margem, não o valor cheio; ganhos/perdas são ajustados diariamente (ajuste/settlement).
- **Serve para especular ou fazer hedge** — ex.: produtor de soja trava o preço da colheita; trader aposta na direção do dólar/índice.

Principais na B3: **mini Ibov (WIN)**, **mini Dólar (WDO)**, **DI** (juros), e commodities **boi gordo (BGI)**, **café (ICF)**, **milho (CCM)**, **soja (SJC)**.

## 2.2 Quais dados a Brapi traz

| Endpoint | Método | O que traz | Query params |
|---|---|---|---|
| `/api/v2/futures/list` | GET | Lista de contratos | `asset`, `segment` |
| `/api/v2/futures/quote` | GET | Cotação de fechamento (até 20 contratos) | `symbols` |
| `/api/v2/futures/specs` | GET | Especificações: multiplicador, tamanho do lote, vencimento, ISIN, CFI | `symbols` |
| `/api/v2/futures/historical` | GET | Série diária (~1 ano) com **OHLC** + ajuste (settlement) | `symbol` (um só) |
| `/api/v2/futures/term-structure` | GET | **Curva de vencimentos** — todos os vencimentos de um ativo + último ajuste | `asset` |

Formato do símbolo: `{ATIVO}{LETRA_MÊS}{ANO}` → `WINM26`. Letras de mês: F(jan) … Z(dez), ano com 2 dígitos.

Cobertura/limites:
- Histórico de ~1 ano, atualizado após o fechamento (após 19h BRT).
- Sandbox (sem token): apenas **WIN** e **WDO**.
- Acesso completo exige **plano Pro**.

## 2.3 Por que NÃO integrar agora

O Finance-Control modela uma **carteira de posições de longo prazo** (`Investment`: preço médio + quantidade, marcação simples a mercado). Futuros quebram esse modelo:

- **Vencimento e rolagem** — um contrato morre no vencimento; a "posição" do usuário não é contínua como numa ação.
- **Alavancagem e margem** — o valor exposto ≠ valor investido; o conceito de "preço médio × quantidade" não representa o risco real.
- **Ajuste diário** — P&L é creditado/debitado todo dia, não só na venda.

Integrar exigiria um **modelo próprio** (entidade de contrato com vencimento, margem, marcação a mercado diária, rolagem) — escopo grande, perfil especulativo, baixo encaixe com o produto atual de controle financeiro pessoal.

**Recomendação:** manter como referência. Se um dia entrar, tratar como módulo separado (ex.: "Trading/Derivativos"), não dentro de `Investment`.

---

# PARTE 3 — Melhorias em opções / robustez do job atual

A Brapi melhorou os filtros e a documentação de opções, adicionou um **dicionário de campos** com orientação sobre **valores nulos**, e deixou a API mais clara quando um ticker deve ser consultado num endpoint específico.

> Isto se refere ao dicionário de campos de **opções** (`/api/v2/options/*`), não ao de Tesouro (esse já está confirmado em §1.2). Os detalhes finos do dicionário de opções não foram extraídos aqui — **conferir em `brapi.dev/docs` se/quando for mexer em opções**.

### Ações de robustez recomendadas para o job já existente
Independentemente dos novos endpoints, vale endurecer o `BrapiPriceUpdateJobService` contra valores nulos (a orientação nova da Brapi reforça isso):

1. **Já tratado:** o job hoje pula `result.RegularMarketPrice is null` e `point.Close is null`. ✅
2. **Revisar:** garantir que `dividendsData`/`cashDividends` nulos não quebrem o loop (hoje há guarda `?.` — confirmar). ✅
3. **Considerar:** se a Brapi passar a retornar uma mensagem indicando "consulte este ticker no endpoint X" (ex.: um ativo de futuros/Tesouro caindo em `/api/quote`), logar isso como warning em vez de erro genérico, para facilitar diagnóstico.

Nenhuma dessas é bloqueante; são melhorias de resiliência.

---

## Resumo executivo

- **Implementar agora:** Tesouro Direto — encaixe alto, reusa `Investment` (`MaturityDate`, `ExpectedYieldPct`) e a tabela de histórico; só precisa de um terceiro grupo no job (`ProcessTreasuryBatchAsync`) e (talvez) um campo `BrapiSymbol`.
- **Schema confirmado** ✅ — nomes de campos, params e nesting verificados contra as 4 páginas oficiais (2026-05-31); DTOs internos já esboçados em §1.3.
- **Único bloqueador:** os endpoints `/treasury/*` exigem **plano Pro** (Startup atual não acessa; sandbox = 3 títulos fixos). Resolver isso decide se a Parte 1 vai a produção ou fica em modo dev. Ver §1.4.
- **Adiar:** Futuros e opções sobre futuros — exigem modelo próprio; documentados aqui como referência.

### Decisões abertas para você
1. **Plano Pro** já está ativo na conta Brapi? (§1.4) — bloqueia produção.
2. **Mapeamento de ticker:** `Ticker` vira o slug da Brapi, ou criar `BrapiSymbol` separado? (§1.3)
