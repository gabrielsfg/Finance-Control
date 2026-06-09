# Spec: Investments

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Carteira de investimentos — posições por ativo, operações de compra/venda, dividendos/rendimentos e acompanhamento de preço.

---

## 1. Visão geral

Investments modela a **carteira** do usuário. Cada posição é um `Investment` — quanto o usuário possui de um ativo (`CurrentQuantity`) e a que preço médio (`AveragePrice`). Os dados de mercado do ativo (nome, tipo, preço atual, logo, histórico) **não** vivem em `Investment`: vivem em `MarketAsset`, uma entidade **global compartilhada entre todos os usuários** (a mesma linha de `PETR4` serve qualquer um que possua o papel).

A movimentação acontece em dois registros:

- **`InvestmentTransaction`** — cada compra (`Buy`) ou venda (`Sell`). Recalcula a posição (`CurrentQuantity` + `AveragePrice`) e cria uma `Transaction` financeira "espelho" na conta (saída de caixa na compra, entrada na venda).
- **`InvestmentDividend`** — cada provento recebido (dividendo, JCP, rendimento de FII, cupom, rendimento). Cria uma `Transaction` financeira de `Income` na conta.

Tanto operações quanto dividendos geram uma `Transaction` vinculada (`LinkedTransactionId`) para que o dinheiro reflita no saldo da conta — ou seja, Investments **escreve** em Transactions (ver `specs/transactions.md` e `specs/accounts.md` para o efeito no saldo).

Responsabilidades **fora** deste spec:
- Atualização automática de preços e histórico (jobs Brapi, `MarketAsset`, `MarketPriceHistory`, busca de ativos, fundamentos) → `specs/market-data.md`. Aqui só documentamos a **leitura** desses dados e a atualização **manual** de preço.
- Metas de investimento (investment goals) e suas contas virtuais → `specs/goals.md`.
- Efeito das `Transaction` vinculadas no saldo da conta → `specs/accounts.md`.

---

## 2. Entidades

### `Investment` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Investment.cs`

A posição do usuário em um ativo. Índice único `(UserId, MarketAssetId)` — **uma posição por usuário por ativo**.

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`) |
| `MarketAssetId` | `int` | FK para `MarketAsset` (global). `OnDelete: Restrict` |
| `Broker` | `string?` | Corretora (texto livre, opcional) |
| `CurrentQuantity` | `decimal` | **Exceção à regra de centavos** — quantidade pode ser fracionária (cripto, fundos). `> 0` para aparecer na carteira |
| `AveragePrice` | `long` | Preço médio **em centavos** (custo unitário ponderado) |
| `MaturityDate` | `DateOnly?` | Vencimento (renda fixa / tesouro). Nunca preenchido no fluxo atual — **ver gap G6** |
| `ExpectedYieldPct` | `decimal?` | Rentabilidade esperada. Nunca preenchido no fluxo atual — **ver gap G6** |
| `AccountId` | `int` | Conta associada à posição. `OnDelete: Restrict` |
| `Transactions` | `ICollection<InvestmentTransaction>` | Operações |
| `Dividends` | `ICollection<InvestmentDividend>` | Proventos |

### `InvestmentTransaction` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/InvestmentTransaction.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `UserId` | `int` | Dono |
| `InvestmentId` | `int` | FK para `Investment`. `OnDelete: Cascade` |
| `Operation` | `EnumInvestmentOperation` | `Buy` / `Sell` |
| `Date` | `DateOnly` | Data da operação |
| `Quantity` | `decimal` | Quantidade negociada (fracionária permitida) |
| `UnitPrice` | `long` | Preço unitário **em centavos** |
| `OtherCosts` | `long` | Custos adicionais (corretagem etc.) **em centavos** |
| `TotalValue` | `long` | **Centavos**. `round(Quantity * UnitPrice) + OtherCosts` |
| `LinkedTransactionId` | `int?` | FK para a `Transaction` financeira espelho. `OnDelete: SetNull` |

### `InvestmentDividend` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/InvestmentDividend.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `UserId` | `int` | Dono |
| `InvestmentId` | `int` | FK para `Investment`. `OnDelete: Cascade` |
| `PaymentDate` | `DateOnly?` | Data do pagamento (`date` no banco) |
| `LastDatePrior` | `DateOnly?` | Data-com / último dia para ter direito (`date` no banco) |
| `Amount` | `long` | Valor recebido **em centavos** |
| `Type` | `EnumDividendType` | Mapeado como `string` no banco (`HasConversion<string>`) |
| `LinkedTransactionId` | `int?` | FK para a `Transaction` de `Income`. `OnDelete: SetNull` |

### `MarketAsset` (`BaseEntity`) — global, leitura aqui
`apps/api/FinanceControl.Domain/Entities/MarketAsset.cs`

Documentado em detalhe em `specs/market-data.md`. Campos consumidos por Investments: `Ticker`, `Name`, `AssetType`, `CurrentPrice` (long, centavos), `LastPriceUpdate`, `LogoUrl`, `Currency` (default `"BRL"`). Não é `OwnedEntity` — não tem `UserId`.

### Enums
`apps/api/FinanceControl.Shared/Enums/`

`EnumInvestmentOperation`: `Buy`, `Sell`
`EnumDividendType`: `Dividend`, `JurosCapitalProprio`, `RendimentoFII`, `Cupom`, `Rendimento`
`EnumAssetType`: `Acao`, `FundoInvestimento`, `FII`, `Cripto`, `Stock`, `Reit`, `BDR`, `ETF`, `ETFInternacional`, `TesouroDireto`, `RendaFixa`, `Index`, `Outro`

> **Atenção:** `EnumAssetType` tem **13 valores** no backend, mas o front (`investments.types.ts`, `useInvestmentVisibility`, labels dos modais) só conhece **12** — `Index` está ausente em todo o front. Ver gap G1.

---

## 3. Endpoints (API)

Controller: `InvestmentController` — rota base `api/investment`. Todos exigem `[Authorize]`.
O `userId` vem sempre do JWT (`GetUserId()`), nunca do corpo. Não há `IValidator<T>` para este domínio — **a validação é feita inline no controller** (guard clauses), diferente do padrão FluentValidation usado em Transactions/Accounts (ver gap G7).

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `GET` | `/api/investment` | Carteira completa (posições com `CurrentQuantity > 0` + totais + alocação) | `200` `InvestmentPortfolioDto` | — |
| `GET` | `/api/investment/{id}` | Detalhe de uma posição | `200` `InvestmentDto` | `404` not found |
| `GET` | `/api/investment/{id}/transactions` | Operações da posição (desc por data) | `200` array | `400` id inválido |
| `GET` | `/api/investment/{id}/dividends` | Dividendos da posição (desc por `PaymentDate`) | `200` array | `400` id inválido |
| `GET` | `/api/investment/{id}/price-history` | Histórico de preço do ativo (asc por data) | `200` array | `404` not found |
| `POST` | `/api/investment/transactions` | Registra compra/venda; recalcula posição; retorna carteira | `200` `InvestmentPortfolioDto` | `400` validação / regra |
| `DELETE` | `/api/investment/transactions/{id}` | Remove operação; reverte posição; remove `Transaction` espelho | `200` `InvestmentPortfolioDto` | `404` · `400` |
| `POST` | `/api/investment/dividends` | Registra provento; cria `Transaction` de `Income`; retorna carteira | `200` `InvestmentPortfolioDto` | `400` validação · `404` posição |
| `PATCH` | `/api/investment/{id}/price` | Atualiza manualmente o preço do `MarketAsset` | `200` `InvestmentDto` | `400` preço · `404` |

> **Nota:** mutações retornam a **carteira inteira** (`InvestmentPortfolioDto`), exceto `PATCH /{id}/price`, que retorna apenas o `InvestmentDto` da posição. `RegisterTransaction`/`RegisterDividend`/`DeleteTransaction` retornam `200 OK` (não `201`), divergindo do `201 Created` usado em Transactions.

### Request — `CreateInvestmentTransactionRequestDto`
```
Ticker     : string                  // obrigatório; normalizado p/ UpperInvariant no service
Name       : string                  // obrigatório (usado só ao criar o MarketAsset)
AssetType  : EnumAssetType           // usado só ao criar o MarketAsset
Broker     : string?
Operation  : EnumInvestmentOperation // Buy | Sell
Date       : DateOnly
Quantity   : decimal                 // > 0
UnitPrice  : long                    // centavos, > 0
OtherCosts : long                    // centavos, >= 0
AccountId  : int                     // > 0
```

### Request — `CreateInvestmentDividendRequestDto`
```
InvestmentId  : int                  // > 0
PaymentDate   : DateOnly?            // default: hoje (UtcNow) no service se null
LastDatePrior : DateOnly?
Amount        : long                 // centavos, > 0
Type          : EnumDividendType
AccountId     : int                  // > 0
```

### Request — `UpdateInvestmentPriceRequestDto`
```
CurrentPrice : long                  // centavos, > 0
```

### Response — `InvestmentDto` (item da carteira / detalhe)
```
Id, Ticker, Name,
AssetType  : EnumAssetType,
AssetClass : string,                 // rótulo PT-BR derivado do AssetType (ver RN-INV-08)
Broker?,
CurrentQuantity : decimal,
AveragePrice    : long,              // centavos
CurrentPrice    : long,              // centavos (do MarketAsset)
CurrentValue    : long,              // round(CurrentQuantity * CurrentPrice)
TotalInvested   : long,              // round(CurrentQuantity * AveragePrice)
TotalReturn     : long,              // CurrentValue - TotalInvested
TotalReturnPercent : decimal,        // %
PreviousClose   : long?,             // penúltimo preço do histórico (ver RN-INV-09)
DayChangeAbs    : long,              // round(CurrentQuantity * (CurrentPrice - PreviousClose))
DayChangePct    : decimal,           // %
LastPriceUpdate : DateTime?,
MaturityDate    : DateOnly?,
ExpectedYieldPct: decimal?,
AccountId       : int,
LogoUrl?        : string,
Currency        : string             // default "BRL"
```

### Response — `InvestmentPortfolioDto`
```
Investments        : InvestmentDto[]
CurrentValue       : long            // soma dos CurrentValue
TotalInvested      : long            // soma dos TotalInvested
TotalReturn        : long            // CurrentValue - TotalInvested
TotalReturnPercent : decimal
Allocations        : AllocationDto[] // agrupado por AssetType, desc por valor
```

### Response — `AllocationDto`
```
AssetType  : EnumAssetType
AssetClass : string                  // rótulo PT-BR
Value      : long                    // soma do CurrentValue do grupo
Percent    : decimal                 // % do CurrentValue total (1 casa)
Color      : string                  // cor hex por AssetType (ver RN-INV-08)
```

### Response — `InvestmentTransactionDto`
```
Id, InvestmentId, Ticker, Name,
Operation : EnumInvestmentOperation,
Date : DateOnly, Quantity : decimal,
UnitPrice : long, OtherCosts : long, TotalValue : long
```

### Response — `InvestmentDividendDto`
```
Id, InvestmentId, Ticker,
PaymentDate?  : DateOnly,
LastDatePrior?: DateOnly,
Amount : long,
Type   : EnumDividendType
```

### Response — `InvestmentPriceHistoryDto`
```
Date  : DateOnly
Price : long                         // centavos
```

---

## 4. Regras de negócio

### RN-INV-01 — Quantidade em `decimal`, dinheiro em centavos
`CurrentQuantity` e `Quantity` são `decimal` (exceção explícita à regra geral de centavos-como-int, documentada no `apps/api/CLAUDE.md`), porque ativos como cripto e fundos têm posições fracionárias. **Todo o resto** (`AveragePrice`, `UnitPrice`, `OtherCosts`, `TotalValue`, `Amount`, `CurrentPrice`, `CurrentValue`, etc.) continua em `long`/`int` de **centavos**. O front divide por 100 para exibir e multiplica por 100 ao enviar valores monetários — mas envia `Quantity` como número decimal puro.

### RN-INV-02 — `MarketAsset` global, find-or-create por ticker
Ao registrar uma operação (`RegisterTransactionAsync`), o ticker é normalizado para `ToUpperInvariant()` e o service procura um `MarketAsset` existente com esse ticker (sem filtrar por usuário — é global). Se não existir, cria um novo com `Name`/`AssetType`/`CurrentPrice = UnitPrice` do DTO. Se existir mas nunca teve preço de mercado (`LastPriceUpdate is null`), usa o `UnitPrice` da operação como melhor estimativa do `CurrentPrice`.

### RN-INV-03 — Posição: find-or-create por `(UserId, MarketAssetId)`
Existe no máximo uma `Investment` por usuário por ativo (índice único). Na primeira compra de um ativo, a posição é criada com `CurrentQuantity = 0` e `AveragePrice = 0` e depois recalculada. **Vender um ativo sem posição** (`Investment` inexistente + `Operation == Sell`) falha com `"Cannot sell an asset that does not exist in the portfolio."`.

### RN-INV-04 — Recálculo da posição na compra (preço médio ponderado)
Em `Buy`:
- `newTotalCost = (CurrentQuantity * AveragePrice) + (Quantity * UnitPrice) + OtherCosts`
- `newTotalQty  = CurrentQuantity + Quantity`
- `AveragePrice = round(newTotalCost / newTotalQty)` (0 se `newTotalQty <= 0`)
- `CurrentQuantity = newTotalQty`

Ou seja, **`OtherCosts` entra no custo médio** (encarece a posição).

### RN-INV-05 — Recálculo da posição na venda
Em `Sell`:
- Se `Quantity > CurrentQuantity` → falha `"Sell quantity exceeds current position."`
- Senão `CurrentQuantity -= Quantity`. **A venda não altera o `AveragePrice`** — só reduz a quantidade (não há realização de lucro/prejuízo no custo médio).

### RN-INV-06 — Transaction financeira espelho
Toda operação cria uma `Transaction` (`PaymentType = OneTime`) na conta `AccountId`:
- `Buy`  → `Type = Expense`, descrição `"Compra: {Ticker}"`
- `Sell` → `Type = Income`, descrição `"Venda: {Ticker}"`
- `Value = min(TotalValue, int.MaxValue)` (clamp — `Value` da `Transaction` é `int`, mas `TotalValue` é `long`; ver gap G3)
- `SubCategoryId` é resolvido por `GetInvestmentSubCategoryIdAsync` (RN-INV-10).

O id da `Transaction` criada é gravado em `InvestmentTransaction.LinkedTransactionId`. Não há `BeginTransactionAsync`/rollback explícito — cada passo faz seu próprio `SaveChangesAsync` (ver gap G4).

### RN-INV-07 — Dividendo cria Transaction de Income
`RegisterDividendAsync` exige uma posição existente do usuário (`InvestmentId` + `UserId`), senão `404`. Cria uma `Transaction` `Income` com `Value = min(Amount, int.MaxValue)`, descrição `"Dividendo: {Ticker}"`, `TransactionDate = PaymentDate ?? hoje (UtcNow)`, e `SubCategoryId` resolvido por `GetDividendSubCategoryIdAsync`. O `InvestmentDividend` é então gravado com `LinkedTransactionId`. **Dividendo não altera `CurrentQuantity` nem `AveragePrice`** — é puramente um evento de caixa.

### RN-INV-08 — Rótulos (`AssetClass`) e cores por tipo
O service mantém dois dicionários estáticos por `EnumAssetType`:
- `AssetTypeLabels` → rótulo PT-BR (`Acao` → "Ação", `FII` → "FII", `Cripto` → "Cripto", …). Default `"Outro"`.
- `AssetTypeColors` → cor hex usada nos gráficos de alocação. Default `"#8A95A3"`.

Ambos os dicionários **não contêm a chave `Index`** (existe no enum mas não nos mapas → cai no default). Esses valores derivados vão no `AssetClass`/`Color` dos DTOs; o front mantém **suas próprias** cópias de cores/rótulos em paralelo (ver gap G1).

### RN-INV-09 — `PreviousClose` e variação do dia derivados do histórico
`PreviousClose` **não é coluna** de nenhuma entidade. É o **penúltimo** preço de `MarketPriceHistories` para o ativo, obtido por `OrderByDescending(Date).Skip(1).First()`:
- No portfolio, em lote, via `LoadPrevCloseMapAsync` (group by `MarketAssetId`).
- Em `GetByIdAsync` e `UpdatePriceAsync`, por consulta individual.

A variação do dia é calculada em `MapToDto`: se há `PreviousClose > 0`, `unitChange = CurrentPrice - PreviousClose`, `DayChangeAbs = round(CurrentQuantity * unitChange)`, `DayChangePct = round(unitChange / PreviousClose * 100, 2)`. Sem histórico suficiente, ambos ficam `0` e o front exibe "—". (Este padrão substituiu uma antiga coluna `PreviousClose` em `MarketAsset` — ver commit `e1b2647`.)

### RN-INV-10 — Resolução da subcategoria (com fallback frágil)
As `Transaction` espelho precisam de uma `SubCategoryId`. O service procura uma subcategoria do usuário pelo **nome exato** (case-sensitive na query):
- Operações → nome `"investments"` (`GetInvestmentSubCategoryIdAsync`)
- Dividendos → nome `"dividends"` (`GetDividendSubCategoryIdAsync`)

Se não encontrar, faz **fallback para a primeira subcategoria qualquer** do usuário (`FirstAsync`, sem `OrDefault`). Isso significa: (a) depende de subcategorias semeadas com esses nomes exatos; (b) lança exceção não tratada se o usuário não tiver **nenhuma** subcategoria. Ver gap G2.

### RN-INV-11 — Delete reverte posição e remove a Transaction espelho
`DeleteTransactionAsync`:
- `Buy` removida → `CurrentQuantity -= Quantity` e **recalcula `AveragePrice`** a partir das compras restantes (`sum(Quantity*UnitPrice + OtherCosts) / sum(Quantity)`); se não sobrar nenhuma compra, `AveragePrice = 0`.
- `Sell` removida → `CurrentQuantity += Quantity` (devolve a quantidade).
- Se houver `LinkedTransactionId`, remove a `Transaction` financeira correspondente.
- Remove a `InvestmentTransaction` e retorna a carteira recalculada.

> A posição **não é apagada** quando `CurrentQuantity` chega a 0 — apenas deixa de aparecer na carteira (filtro `CurrentQuantity > 0`). Ver gap G5.

### RN-INV-12 — Carteira só mostra posições com quantidade positiva
`GetPortfolioAsync` e `BuildPortfolioFromDbAsync` filtram `CurrentQuantity > 0` e ordenam por `Ticker`. Posições zeradas (totalmente vendidas) somem da listagem mas continuam no banco com seu histórico de operações/dividendos.

### RN-INV-13 — Atualização manual de preço afeta o ativo global
`UpdatePriceAsync` grava `CurrentPrice` e `LastPriceUpdate = UtcNow` **no `MarketAsset`**, que é compartilhado. Ou seja, um usuário atualizando manualmente o preço de `PETR4` altera o preço visto por **todos** os usuários que possuem `PETR4`. Ver gap G8.

### RN-INV-14 — Totais e alocação da carteira
`BuildPortfolio` soma `CurrentValue`/`TotalInvested` de todas as posições, calcula `TotalReturn = CurrentValue - TotalInvested` e `TotalReturnPercent` (0 se `TotalInvested <= 0`). `Allocations` agrupa por `AssetType`, soma o valor por grupo, calcula `Percent` sobre o `CurrentValue` total (1 casa) e ordena desc por valor.

---

## 5. Front (Web)

- **Rota:** `/investments` → `app/(app)/investments/page.tsx` (re-export de uma linha) → `features/investments/InvestmentsPage.tsx`.
- **Página:** estado e composição em `InvestmentsPage.tsx`. Usa o header global (`usePageNova` para o botão "Nova operação", `usePageSearch`, `usePageFilter` para a barra de busca/export/dividendo).

### API client — `lib/api/investments.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getPortfolio()` | `GET /investment` | principal; alimenta a página |
| `getById(id)` | `GET /investment/{id}` | hook existe, sem uso direto na página |
| `getTransactions(id)` | `GET /investment/{id}/transactions` | usado no detail modal |
| `getDividends(id)` | `GET /investment/{id}/dividends` | usado no detail modal |
| `registerTransaction(dto)` | `POST /investment/transactions` | retorna a carteira |
| `deleteTransaction(id)` | `DELETE /investment/transactions/{id}` | retorna a carteira |
| `registerDividend(dto)` | `POST /investment/dividends` | retorna a carteira |
| `updatePrice(id, dto)` | `PATCH /investment/{id}/price` | retorna `InvestmentDto` |
| `getPriceHistory(id)` | `GET /investment/{id}/price-history` | tipado como `PricePoint[]` (de `market.types`) |

### Hooks — `features/investments/hooks/`
`useInvestments.ts`:
- `useInvestments()` — query principal (`["investments"]`, `staleTime 60s`).
- `useInvestmentById(id)` / `useInvestmentTransactions(id)` / `useInvestmentDividends(id)` / `useInvestmentPriceHistory(id)` — queries auxiliares (`enabled: id > 0`, `staleTime 5min`).
- `useRegisterTransaction` / `useDeleteTransaction` / `useRegisterDividend` — mutations que fazem **`setQueryData(["investments"], data)`** com a carteira retornada (segue o padrão do `web/CLAUDE.md`).
- `useUpdateInvestmentPrice` — **diverge**: usa `invalidateQueries(["investments"])` em vez de `setQueryData` (o retorno é só o `InvestmentDto`, não a carteira). Ver gap G9.

`useInvestmentVisibility.ts`:
- Persiste os tipos de ativo **ocultos** dentro de `UserPreferences.analyticsConfig` (string JSON), sob a chave `"investments"`. Expõe `visibleTypes`/`allTypes`/`setVisibleTypes`. A lista `ALL_ASSET_TYPES` tem **12 tipos** (sem `Index`). Usa `profileApi.getPreferences` / `updatePreferences`.

### Tipos — `lib/types/investments.types.ts`
`AssetType` (12 valores, sem `Index`), `InvestmentOperation`, `DividendType`, `Investment`, `Allocation`, `InvestmentPortfolio`, `InvestmentTransaction`, `InvestmentDividend`, `CreateInvestmentTransactionRequest`, `CreateInvestmentDividendRequest`, `UpdateInvestmentPriceRequest`. Mantém um alias legado `InvestmentSummary = InvestmentPortfolio`.

> **Mismatch de campos de dividendo:** o tipo TS `InvestmentDividend` e `CreateInvestmentDividendRequest` usam um único campo `date: string`, mas o backend usa `PaymentDate` + `LastDatePrior` e **não tem** campo `date`. Ver gap G10.

### Componentes principais
`features/investments/components/`:
- `InvestmentsKpiCards` — 4 KPIs (Patrimônio Total, Retorno Total, Variação, Rentabilidade). **Nota:** os cards "Variação" e "Rentabilidade" exibem ambos `totalReturnPercent` — não há métrica de variação do dia agregada na carteira (ver gap G11).
- `InvestmentsAllocationChart` — donut (Recharts) por classe; permite drill-down por ticker via `PillSelect`.
- `InvestmentsPriceChart` — área dos últimos 30 pontos do histórico do ticker selecionado; mostra mensagem de "histórico ainda não disponível" (preenchido pelo job da Brapi).
- `InvestmentsTable` — agrupa posições por classe (cards colapsáveis); aplica busca client-side (`matchesSearch` por nome/ticker/keywords do tipo) e o filtro de tipos visíveis. Calcula variação do dia agregada por grupo só sobre ativos com `previousClose`.
- `InvestmentTypeFilter` — dropdown para mostrar/ocultar tipos (mantém ao menos um visível); persiste via `useInvestmentVisibility`.
- `RegisterTransactionModal` — drawer de compra/venda (RHF + Zod). Inclui busca de ativo (`useMarketSearch` → `specs/market-data.md`) com opção "criar manualmente"; `unitPrice`/`otherCosts` são capturados como centavos via handlers de teclado; envia `quantity` como `parseFloat`. Decimais de quantidade dependem do tipo (`Cripto` 8, fundos/renda fixa 2, ações 0).
- `RegisterDividendModal` — drawer de provento (RHF + Zod). Envia `amount` em centavos (`round(value*100)`) e um campo `date` (ver gap G10).
- `InvestmentDetailModal` — dialog com resumo da posição, abas "Operações"/"Rendimentos", exclusão de operação (com confirmação) e atalho para fundamentos (`FundamentalsDrawer` → `specs/market-data.md`) para tipos elegíveis.
- `InvestmentsSummaryHero` — **componente órfão**: definido mas não importado por nenhuma página (a página usa `InvestmentsKpiCards`). Ver gap G12.

### UI patterns
- Valores monetários em centavos: dividir por 100 ao exibir, `* 100` ao enviar (`Amount`, `unitPrice`, `otherCosts`).
- Quantidade tratada como número decimal (não centavos): formatada com casas variáveis por tipo de ativo.
- Drawers (operação/dividendo) seguem o mesmo layout lateral; dialogs (detalhe/confirmação) usam o `Dialog` compartilhado.
- O `DatePickerField` é **duplicado** inline em `RegisterTransactionModal` e `RegisterDividendModal` (mesmo código).

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Vender ativo inexistente → erro `"Cannot sell an asset that does not exist in the portfolio."` (RN-INV-03).
- Vender mais que a posição → erro `"Sell quantity exceeds current position."` (RN-INV-05).
- Ativo sem preço de mercado ainda (job nunca rodou) → usa o preço da operação como estimativa (RN-INV-02).
- Sem histórico suficiente para `PreviousClose` → variação do dia zerada, front mostra "—" (RN-INV-09).
- Posição totalmente vendida → some da carteira (filtro `CurrentQuantity > 0`), histórico preservado (RN-INV-11/12).
- Recálculo de preço médio ao excluir uma compra (RN-INV-11).
- `TotalValue`/`Value` acima de `int.MaxValue` → clamp em `min(..., int.MaxValue)` (RN-INV-06/07).

### Gaps / dúvidas a confirmar
- **G1 — `EnumAssetType.Index` ausente no front e nos mapas do service:** o enum backend tem 13 valores, mas o front (`AssetType`, `ALL_ASSET_TYPES`, labels dos modais e da tabela) e os dicionários `AssetTypeLabels`/`AssetTypeColors` do `InvestmentService` só cobrem 12 — `Index` cai sempre no default `"Outro"`/`"#8A95A3"` e não é selecionável/filtrável no front. Confirmar se `Index` deve ser exposto ou removido.
- **G2 — Resolução de subcategoria por nome literal + fallback que pode lançar:** `GetInvestmentSubCategoryIdAsync`/`GetDividendSubCategoryIdAsync` buscam subcategorias pelos nomes exatos `"investments"`/`"dividends"` (case-sensitive) e, se não acharem, pegam a **primeira subcategoria qualquer** do usuário via `FirstAsync` — que lança `InvalidOperationException` se o usuário não tiver nenhuma subcategoria. Confirmar se esses nomes são garantidos pelo seed (`specs/categories.md`) e tratar o caso de usuário sem subcategorias.
- **G3 — `Transaction.Value` é `int`, mas `TotalValue`/`Amount` são `long`:** a `Transaction` espelho recebe `Value = min(totalValue, int.MaxValue)`. Para posições muito grandes (> ~R$ 21,4 mi em centavos), o valor financeiro fica truncado/saturado, divergindo do `TotalValue` registrado na `InvestmentTransaction`. Confirmar limite aceitável ou migrar `Transaction.Value` para `long`.
- **G4 — Falta de transação de banco em operações de escrita:** `RegisterTransactionAsync`/`RegisterDividendAsync` fazem múltiplos `SaveChangesAsync` sequenciais (cria asset, cria posição, cria Transaction, cria InvestmentTransaction, recalcula) **sem** `BeginTransactionAsync`. Uma falha no meio pode deixar estado parcial (ex.: `MarketAsset`/posição criados, mas operação não). Transactions usa transação de banco para parcelamento (RN-TX-05); aqui não. Confirmar se atomicidade é necessária.
- **G5 — Posições zeradas nunca são removidas:** após vender tudo (`CurrentQuantity == 0`), a `Investment` permanece no banco (some só da listagem). Excluir a posição não tem endpoint. Confirmar se é intencional (preservar histórico) ou se falta um cleanup/arquivamento.
- **G6 — `MaturityDate` / `ExpectedYieldPct` sem caminho de escrita:** existem na entidade e no `InvestmentDto`, mas nenhum DTO de request os preenche e o service nunca os seta — sempre `null`. Confirmar se renda fixa/tesouro vão precisar desses campos (e de UI correspondente) ou removê-los.
- **G7 — Validação inline em vez de FluentValidation:** `InvestmentController` valida no próprio controller (guard clauses), contrariando o padrão do `apps/api/CLAUDE.md` (validators em `FinanceControl.Services/Validations/`). Não há `CreateInvestmentTransactionValidator` etc. Confirmar se deve ser migrado para FluentValidation por consistência.
- **G8 — Atualização manual de preço afeta todos os usuários:** `UpdatePriceAsync` escreve no `MarketAsset` global (RN-INV-13). Um usuário sobrescreve o preço/`LastPriceUpdate` visto por todos que possuem o mesmo ticker, e ainda compete com o job da Brapi. Confirmar se o preço manual deveria ser por-usuário ou se isso é aceitável (ativos custom sem cobertura Brapi).
- **G9 — `useUpdateInvestmentPrice` usa `invalidateQueries`:** diverge dos demais hooks de mutation (que usam `setQueryData`) e do padrão recomendado. Como o endpoint retorna só o `InvestmentDto` (não a carteira), `invalidateQueries` é defensável aqui — mas vale alinhar a decisão.
- **G10 — Mismatch de campos no fluxo de dividendo (front × back):** o tipo TS `InvestmentDividend` e `CreateInvestmentDividendRequest` usam um único `date`, e o `RegisterDividendModal` envia `{ ..., date }`. O backend espera `PaymentDate` (+ opcional `LastDatePrior`) e **ignora** `date` — então `PaymentDate` chega `null` e o service usa a data de hoje (RN-INV-07). Na exibição, `InvestmentDetailModal` lê `div.date`, mas o `InvestmentDividendDto` retorna `paymentDate`/`lastDatePrior` (sem `date`) → a data renderizada provavelmente fica inválida (`undefined`). Alinhar contrato (renomear no front para `paymentDate` ou aceitar `date` no back).
- **G11 — Card "Variação" duplica "Rentabilidade":** em `InvestmentsKpiCards`, tanto "Variação" quanto "Rentabilidade" exibem `totalReturnPercent` (e "Variação" mostra o ganho/perda absoluto = `currentValue - totalInvested`, idêntico a `totalReturn`). Não há KPI de variação **do dia** agregada na carteira, apesar de cada `InvestmentDto` trazer `DayChangeAbs`/`DayChangePct`. Confirmar a intenção dos dois cards.
- **G12 — `InvestmentsSummaryHero` órfão:** componente completo, sem nenhum import/uso (a página usa `InvestmentsKpiCards`). Provável resíduo de refatoração. Remover ou reaproveitar.
- **G13 — Export CSV não implementado:** o botão "Exportar CSV" no header da página tem `onClick={() => {/* export CSV */}}` (no-op). Confirmar se é funcionalidade pendente (consistente com itens pendentes do v1).
- **G14 — Precisão decimal de `Quantity`/`CurrentQuantity` não configurada no EF:** `InvestmentTransactionMap` não declara `HasPrecision`/`HasColumnType` para `Quantity` (nem `InvestmentMap` para `CurrentQuantity`), ficando no default do Npgsql para `decimal`. Para cripto (até 8 casas) confirmar se a precisão padrão da coluna é suficiente para não truncar.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/InvestmentController.cs`
- `FinanceControl.WebApi/Extensions/ControllerValidationExtensions.cs` (`ValidatePositiveId`)
- `FinanceControl.Services/Services/InvestmentService.cs`
- `FinanceControl.Domain/Interfaces/Services/IInvestmentService.cs`
- `FinanceControl.Domain/Entities/Investment.cs`, `InvestmentTransaction.cs`, `InvestmentDividend.cs`, `MarketAsset.cs`
- `FinanceControl.Data/Mappings/InvestmentMap.cs`, `InvestmentTransactionMap.cs`, `InvestmentDividendMap.cs`
- `FinanceControl.Shared/Dtos/Request/CreateInvestmentTransactionRequestDto.cs`, `CreateInvestmentDividendRequestDto.cs`, `UpdateInvestmentPriceRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/Investment/InvestmentDto.cs`, `InvestmentPortfolioDto.cs`, `AllocationDto.cs`, `InvestmentTransactionDto.cs`, `InvestmentDividendDto.cs`, `InvestmentPriceHistoryDto.cs`
- `FinanceControl.Shared/Enums/EnumInvestmentOperation.cs`, `EnumDividendType.cs`, `EnumAssetType.cs`
- _(Sem validators FluentValidation para este domínio — ver gap G7.)_

**Web**
- `features/investments/InvestmentsPage.tsx`
- `features/investments/hooks/useInvestments.ts`, `useInvestmentVisibility.ts`
- `features/investments/components/InvestmentsKpiCards.tsx`, `InvestmentsAllocationChart.tsx`, `InvestmentsPriceChart.tsx`, `InvestmentsTable.tsx`, `InvestmentTypeFilter.tsx`, `RegisterTransactionModal.tsx`, `RegisterDividendModal.tsx`, `InvestmentDetailModal.tsx`, `InvestmentsSummaryHero.tsx` _(órfão, gap G12)_
- `lib/api/investments.ts`
- `lib/types/investments.types.ts`
- `app/(app)/investments/page.tsx` (re-export)
