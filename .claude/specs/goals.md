# Spec: Goals

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Metas de poupança / lista de desejos — dois tipos: `Item` (juntar dinheiro para uma compra) e `Investment` (atingir um patrimônio em uma classe de ativo / ticker).

---

## 1. Visão geral

Goals é o domínio de **metas financeiras**. Cada `Goal` tem um valor-alvo (`TargetAmount`, em centavos), um prazo (`TargetDate`), prioridade, cor e status. Há dois tipos (`EnumGoalType`):

- **Item** — meta de "juntar dinheiro" para comprar algo (um sonho / item de wishlist). No momento da criação o backend cria uma **conta virtual** (`Account` com `IsSystem = true`) exclusiva da meta; todo o dinheiro "guardado" vive como transações nessa conta. O `CurrentAmount` da meta é o **saldo derivado** dessa conta virtual. Suporta as operações `contribute` (aportar), `withdraw` (retirar) e `purchase` (registrar a compra, zerando o saldo).
- **Investment** — meta de atingir um patrimônio (`TargetAmount`) em uma classe de ativo (`TargetAssetType`) e/ou em um ticker específico (`TargetTicker`). **Não** tem conta virtual nem aportes próprios: o `CurrentAmount` é calculado on-the-fly somando o valor de mercado das posições da carteira de Investments que casam com o filtro. A única operação dedicada é listar as `investment-transactions` associadas.

**Wishlist:** o conceito de "wishlist" foi **incorporado a Goals** — não existe feature de wishlist separada. A busca global (`GlobalSearch.tsx`) mapeia a palavra-chave `"wishlist"` (junto de `"metas"`, `"meta"`, `"objetivo"`) para a rota `/goals`. Na UI, a aba `Item` é rotulada como "Itens & Sonhos".

Responsabilidades **fora** deste spec:
- Mecânica de saldo de conta (Income/Expense/Transfer) e a regra de exclusão de contas `IsSystem` das listagens normais → `specs/accounts.md`. As contas virtuais de metas Item são exatamente essas contas `IsSystem`.
- Cálculo do valor de mercado das posições, `CurrentQuantity` e `CurrentPrice` de cada `Investment` → `specs/investments.md`.
- Origem/atualização dos preços (`MarketAsset.CurrentPrice`) usados no cálculo das metas Investment → `specs/market-data.md`.
- Modelo de `Transaction` (centavos, tipos, `DestinationAccountId`) → `specs/transactions.md`.

---

## 2. Entidades

### `Goal` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Goal.cs` · mapeamento `apps/api/FinanceControl.Data/Mappings/GoalMap.cs` (tabela `Goals`).

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`); FK para `User`, `OnDelete: Cascade` |
| `Name` | `string` | Obrigatório, máx. 200. Em metas Item, espelhado no `Name` da conta virtual |
| `Description` | `string?` | Máx. 1000 |
| `Type` | `EnumGoalType` | `Item` / `Investment`. Persistido como string |
| `TargetAmount` | `int` | **Centavos**. Valor-alvo da meta |
| `Priority` | `EnumGoalPriority` | `Low` / `Medium` / `High`. Default `Medium`. String |
| `Status` | `EnumGoalStatus` | `Active` / `Achieved` / `Cancelled`. Default `Active`. String |
| `Color` | `string?` | Hex `#RRGGBB`, máx. 7 |
| `TargetDate` | `DateOnly` | Prazo da meta. Obrigatório (NOT NULL no banco; default `0001-01-01`) |
| `IncludeInNetWorth` | `bool` | Default `false`. **Hardcoded `false` na criação**; só muda via update — ver G6 |
| `AchievedAt` | `DateTime?` | Marcado quando `CurrentAmount >= TargetAmount`; pode ser "desmarcado" — ver RN-GOAL-08 |
| `AccountId` | `int?` | **Item-only.** FK para a conta virtual (`IsSystem`); `OnDelete: SetNull`. `null` em metas Investment |
| `Url` | `string?` | **Item-only.** Link do produto (wishlist), máx. 500 |
| `ImageUrl` | `string?` | **Item-only.** Máx. 500. Aceito no DTO mas **não exposto na UI de criação** — ver G7 |
| `TargetAssetType` | `EnumAssetType?` | **Investment-only.** Classe de ativo alvo. String. Ver `specs/investments.md` para os valores |
| `TargetTicker` | `string?` | **Investment-only.** Ticker específico, máx. 20 |
| `Account` | `Account?` | Navegação para a conta virtual |
| `CreatedAt` / `UpdatedAt` | `DateTime` / `DateTime?` | De `BaseEntity` |

> **`CurrentAmount` não é coluna** — é sempre calculado (saldo da conta virtual para Item; soma do valor de mercado das posições para Investment).

### Enums
- `EnumGoalType`: `Item`, `Investment`
- `EnumGoalStatus`: `Active`, `Achieved`, `Cancelled`
- `EnumGoalPriority`: `Low`, `Medium`, `High`
- `EnumAssetType` — definido no domínio de Investments (`Acao`, `Stock`, `FII`, `Reit`, `ETF`, `ETFInternacional`, `BDR`, `FundoInvestimento`, `TesouroDireto`, `RendaFixa`, `Cripto`, `Outro`); usado por metas Investment.
- `EnumTransactionType` (`Income`/`Expense`/`Transfer`) e `EnumPaymentType` (`OneTime`) — usados nas transações geradas pela meta Item.

### Entidade removida — `GoalCheckpoint`
Existiu uma tabela `GoalCheckpoints` (`GoalId`, `Amount`, `RecordedAt`), **dropada** na migration `20260518202616_GoalTransferSeed_AccountServiceFixes`. Restaram, órfãos, o `RecordGoalCheckpointRequestDto` e o `RecordGoalCheckpointValidator` (ambos com testes), mas **sem entidade, sem método de service e sem endpoint** — ver G2.

---

## 3. Endpoints (API)

Controller: `GoalController` — rota base **`api/goals`** (rota literal, não `api/[controller]`). Todos exigem `[Authorize]`. O `userId` vem sempre do JWT (`GetUserId()`), nunca do corpo.

> **Atenção (G1):** diferente de todos os outros controllers, `GoalController` **não injeta nenhum `IValidator<T>`** e **não chama `ToActionResult()`**. `CreateGoalValidator` e `UpdateGoalValidator` existem e estão registrados no DI (`AddValidatorsFromAssembly`), mas **nunca são executados** no pipeline de request. Toda validação de entrada (nome vazio, `TargetAmount <= 0`, cor inválida etc.) hoje **não acontece** no backend de Goals.

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `POST` | `/api/goals` | Cria meta (Item cria conta virtual) | `201 Created` com `GoalResponseDto` | — (sem validação; ver G1) |
| `GET` | `/api/goals?type=&status=` | Lista metas do usuário, filtros opcionais por `type`/`status` | `200` array `GoalResponseDto` | — |
| `GET` | `/api/goals/{id}` | Detalhe (inclui `Transactions` para Item) | `200` `GoalDetailResponseDto` | `404` |
| `PATCH` | `/api/goals/{id}` | Atualiza campos parciais | `200` `GoalResponseDto` | `404` |
| `DELETE` | `/api/goals/{id}?returnToAccountId=` | Remove meta (e conta virtual) | `204 No Content` | `404` · `422` se há saldo e falta `returnToAccountId` |
| `POST` | `/api/goals/{id}/contribute` | Aporta valor (Item) | `200` `GoalResponseDto` | `404` (`"not found"`) · `422` outros erros |
| `POST` | `/api/goals/{id}/withdraw` | Retira valor (Item) | `200` `GoalResponseDto` | `404` · `422` (ex.: saldo insuficiente) |
| `POST` | `/api/goals/{id}/purchase` | Registra compra: zera saldo + `Achieved` (Item) | `200` `GoalResponseDto` | `404` · `422` |
| `GET` | `/api/goals/{id}/investment-transactions` | Lista transações de investimento associadas (Investment) | `200` array `InvestmentTransactionDto` | `404` · `422` (se meta não é Investment) |

**Mapeamento de erros (controller):** o service devolve `Result<T>` com `Error` em texto. O controller decide o HTTP por **substring**:
- `Error.Contains("not found")` → `404 NotFound`.
- `DeleteAsync`: `Error.Contains("balance")` → `422 UnprocessableEntity`; caso contrário `404`.
- Demais (`contribute`/`withdraw`/`purchase`/`investment-transactions`) → `422 UnprocessableEntity` com `{ message }`.

> A divisão por substring é frágil — ver G8.

### Request — `CreateGoalRequestDto`
```
Name            : string            // obrigatório (validador existe mas não roda — G1)
Description     : string?
Type            : EnumGoalType      // Item | Investment
TargetAmount    : int               // centavos
Priority        : EnumGoalPriority = Medium
Color           : string?           // hex #RRGGBB
TargetDate      : DateOnly
Url             : string?           // Item-only
ImageUrl        : string?           // Item-only (não usado na UI)
TargetAssetType : EnumAssetType?    // Investment-only
TargetTicker    : string?           // Investment-only
```
> O DTO **não tem campo `Status`** (toda meta nasce `Active`). Nada no backend impede combinações inconsistentes (ex.: criar `Item` com `TargetTicker`, ou `Investment` com `Url`) — ver G3.

### Request — `UpdateGoalRequestDto` (todos opcionais, patch parcial)
```
Name, Description, Color, Url, ImageUrl, TargetTicker : string?
TargetAmount : int?
Priority     : EnumGoalPriority?
Status       : EnumGoalStatus?
TargetAssetType : EnumAssetType?
TargetDate   : DateOnly?
IncludeInNetWorth : bool?
```
Cada campo só é aplicado quando não-nulo (`HasValue` / `is not null`). Alterar `Name` em meta Item também renomeia a conta virtual.

### Request — operações
```
RecordGoalContributionRequestDto { Amount: int; SourceAccountId: int?; Description: string? }
WithdrawGoalRequestDto           { Amount: int; DestinationAccountId: int?; Description: string? }
RegisterGoalPurchaseRequestDto   { SubCategoryId: int; Description: string? }
// DELETE usa query string: ?returnToAccountId=int?
```

### Response — `GoalResponseDto` / `GoalDetailResponseDto`
```
GoalResponseDto {
  Id, Name, Description?, Type, TargetAmount, Priority, Status,
  Color?, Url?, ImageUrl?, TargetDate, TargetAssetType?, TargetTicker?,
  CurrentAmount : int?,          // saldo (Item) ou valor de mercado (Investment)
  IncludeInNetWorth : bool,
  AchievedAt? , AccountId?, CreatedAt, UpdatedAt?
}
GoalDetailResponseDto : GoalResponseDto {
  Transactions : GoalTransactionDto[]   // sempre [] para Investment
}
GoalTransactionDto { Id, Amount, Type: EnumTransactionType, Description, TransactionDate }
```

### Response — `InvestmentTransactionDto`
Compartilhado com o domínio de Investments (`Dtos/Response/Investment/`):
```
Id, InvestmentId, Ticker, Name, Operation ("Buy"|"Sell"), Date,
Quantity, UnitPrice, OtherCosts, TotalValue
```

---

## 4. Regras de negócio

### RN-GOAL-01 — Valores em centavos
`TargetAmount`, `CurrentAmount`, `Amount` (aporte/retirada) e os valores das transações são sempre `int` em centavos. O front divide por 100 para exibir e multiplica por 100 (`Math.round(parseFloat(x) * 100)`) ao enviar. (Os valores de Investment — `Quantity`, `UnitPrice`, `CurrentPrice` — são `decimal`; o valor de mercado resultante é arredondado para centavos.)

### RN-GOAL-02 — Criação de meta Item cria conta virtual
Se `Type == Item`, `CreateAsync` cria um `Account` com `Name = dto.Name`, `Type = Checking`, `IsSystem = true`, `IsDefaultAccount = false`, salva, e grava `goal.AccountId = virtualAccount.Id`. Essa conta é a "carteira" da meta. Por ser `IsSystem`, ela é **excluída das listagens normais de contas e transações** (regra em `specs/accounts.md` / RN-TX-09 de `specs/transactions.md`). Metas `Investment` **não** criam conta (`AccountId` fica `null`).

### RN-GOAL-03 — `CurrentAmount` de meta Item = saldo da conta virtual
Calculado por `ComputeAccountBalancesAsync` somando as transações da conta virtual: `Income +value`, `Expense -value`, `Transfer` (saída) `-value`, `Transfer` (entrada via `DestinationAccountId`) `+value`. É a mesma fórmula de saldo de `specs/accounts.md`, aplicada só àquela conta.

### RN-GOAL-04 — `CurrentAmount` de meta Investment = valor de mercado das posições
`GetInvestmentPortfolioValueAsync` soma `round(CurrentQuantity * CurrentPrice)` das `Investments` do usuário com `CurrentQuantity > 0`, filtrando por `TargetTicker` (se houver) **ou**, senão, por `TargetAssetType` (se houver). Sem nenhum dos dois, **todas** as posições entram (meta "Geral"). É um valor derivado em tempo real — não há aportes próprios da meta.

### RN-GOAL-05 — Aporte (`contribute`, só Item)
Falha se a meta não é Item / não tem conta (`422`) ou se o saldo já atingiu o alvo (`"Goal target already reached."`). Gera uma `Transaction` `OneTime` na subcategoria de transferência do sistema (RN-GOAL-09):
- **Com `SourceAccountId`** → `Transfer` da conta de origem para a conta da meta (`DestinationAccountId = goal.AccountId`). Move dinheiro de uma conta real para a meta.
- **Sem `SourceAccountId`** → `Income` direto na conta da meta ("aporte externo", dinheiro que entra de fora sem debitar conta).
Recalcula `newBalance = balance + Amount`; se atingiu o alvo e `AchievedAt` é nulo, marca `AchievedAt`. Não altera `Status` para `Achieved` automaticamente (continua `Active`).

### RN-GOAL-06 — Retirada (`withdraw`, só Item)
Falha se não é Item (`422`) ou se `Amount > saldo` (`"Insufficient balance in goal."`). Gera `Transaction` `OneTime`:
- **Com `DestinationAccountId`** → `Transfer` da meta para a conta destino (devolve dinheiro para uma conta real).
- **Sem `DestinationAccountId`** → `Expense` na conta da meta ("retirada direta", dinheiro sai do sistema).
Se `newBalance < TargetAmount`, `AchievedAt` não-nulo e `Status != Achieved`, zera `AchievedAt`.

### RN-GOAL-07 — Registrar compra (`purchase`, só Item)
Falha se não é Item (`422`). Cria **uma `Expense`** na conta da meta com `Value = saldo atual inteiro` (zera o saldo), usando a `SubCategoryId` informada no DTO (categoria real escolhida pelo usuário — é aqui que a despesa "real" da compra entra na contabilidade). Define `Status = Achieved` e `AchievedAt ??= now`. O `MapToResponse` é devolvido com `currentAmount: 0`.

> A compra **não valida** se o saldo cobre o `TargetAmount` — registra a despesa pelo saldo existente, mesmo que abaixo do alvo. Ver G4.

### RN-GOAL-08 — `AchievedAt` reativo (em `GetAllAsync`)
Ao listar, para cada meta o service recalcula `currentAmount` e **persiste** ajustes em `AchievedAt`:
- `currentAmount >= TargetAmount && AchievedAt == null` → marca `AchievedAt = now`.
- `currentAmount < TargetAmount && AchievedAt != null` → zera `AchievedAt` (para Item, só se `Status != Achieved`).
Ou seja, a simples listagem pode gravar no banco (`SaveChangesAsync` se houve mudança). `Status` **não** é alterado automaticamente — só `purchase` (Item) seta `Achieved`; metas Investment nunca viram `Achieved` por si (ver G5).

### RN-GOAL-09 — Subcategoria de transferência do sistema
Aportes/retiradas/devolução usam `GetSystemTransferSubCategoryIdAsync`: busca a `SubCategory` `IsSystem` chamada `"Transferência"`/`"Transfer"` do usuário; se não existir (contas legadas / seed não rodou), **cria on demand** uma categoria `"Outros"`/`"Other"` (se preciso) e a subcategoria `"Transferência"` `IsSystem`. O seed correspondente entrou junto da migration `GoalTransferSeed_AccountServiceFixes`.

### RN-GOAL-10 — Exclusão de meta + devolução de saldo
`DeleteAsync(id, returnToAccountId?)`:
- Se a meta tem conta virtual com **saldo > 0**:
  - sem `returnToAccountId` → falha `"Goal has remaining balance. Provide returnToAccountId."` → `422`.
  - com `returnToAccountId` → cria uma `Transfer` da conta da meta para a conta informada (`"Devolução da meta: {Name}"`), devolvendo o saldo.
- Remove a conta virtual (`context.Accounts.Remove`) e a `Goal`. Como a FK `Goal.AccountId` é `SetNull` e a conta é apagada, ambos somem. **Atenção:** a transação de devolução referencia `AccountId = conta da meta`, que é removida na mesma operação — ver G9.

### RN-GOAL-11 — Detalhe (`GetByIdAsync`)
Para Item, carrega as transações da conta virtual (origem **ou** destino), recalcula `CurrentAmount` pela mesma fórmula de saldo e devolve a lista em `Transactions` (mapeada para `GoalTransactionDto`). Para Investment, `CurrentAmount` vem do valor de mercado e `Transactions` fica **vazia** (o histórico de aportes vem do endpoint dedicado `investment-transactions`). Diferente de `GetAllAsync`, **não** persiste mudança de `AchievedAt`.

### RN-GOAL-12 — Transações de investimento associadas
`GetInvestmentTransactionsAsync` exige `Type == Investment` (senão `422`). Filtra `InvestmentTransactions` do usuário por `TargetTicker` (ou `TargetAssetType`, ou todas), ordena por `Date` desc e projeta para `InvestmentTransactionDto`. É apenas leitura — a criação dessas transações é do domínio de Investments (`specs/investments.md`).

### RN-GOAL-13 — Propriedade dos recursos
Toda query de `Goal` é escopada por `UserId` (`g.UserId == userId`). As queries de saldo/posições também filtram pelo usuário. Não há, porém, verificação de que `SourceAccountId` / `DestinationAccountId` / `returnToAccountId` / `SubCategoryId` informados **pertençam** ao usuário antes de criar a transação — ver G10.

---

## 5. Front (Web)

- **Rota:** `/goals` → `app/(app)/goals/page.tsx` (re-export de uma linha) → `features/goals/GoalsPage.tsx`.
- **Página:** `GoalsPage.tsx` é um **componente único e muito grande (~1.760 linhas)** que concentra tudo: helpers de data/CAGR, os dois cards (`ItemGoalCard`, `InvestmentGoalCard`), e **cinco drawers** definidos no mesmo arquivo — `ContributeDrawer`, `WithdrawDrawer`, `PurchaseDrawer`, `GoalDetailDrawer` e `AddGoalDrawer`. Todos os drawers são painéis laterais (`fixed right-0`, fecham no `Escape`/overlay). Ver G11.
- **Header:** `usePageNova("Nova meta", () => openAdd("Item"))` registra o botão de ação do header; `usePageSearch()` liga a busca da página.

### API client — `lib/api/goals.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getAll(params?)` | `GET /goals` | `params = { type?, status? }` |
| `getById(id)` | `GET /goals/{id}` | retorna `GoalDetail` (com `transactions`) |
| `create(data)` | `POST /goals` | retorna a `Goal` criada |
| `update(id, data)` | `PATCH /goals/{id}` | retorna a `Goal` atualizada |
| `delete(id, returnToAccountId?)` | `DELETE /goals/{id}` | `returnToAccountId` vira query string |
| `contribute(id, data)` | `POST /goals/{id}/contribute` | |
| `withdraw(id, data)` | `POST /goals/{id}/withdraw` | |
| `purchase(id, data)` | `POST /goals/{id}/purchase` | |
| `getInvestmentTransactions(id)` | `GET /goals/{id}/investment-transactions` | |

### Hooks — `features/goals/hooks/useGoals.ts`
- `useGoals(params?)` — lista (`["goals", params]`), `staleTime 60s`.
- `useGoalDetail(id)` — detalhe (`["goals", id]`), `enabled` só com id.
- `useGoalInvestmentTransactions(id)` — (`["goals", id, "investment-transactions"]`).
- `useCreateGoal` / `useDeleteGoal` / `useContributeGoal` / `useWithdrawGoal` / `usePurchaseGoal` — mutations que fazem `invalidateQueries(["goals"])` no `onSuccess`.
- `useUpdateGoal` — único que usa `setQueryData(["goals", updated.id], updated)` (não invalida a lista).

> **Nota de convenção (G12):** o `web/CLAUDE.md` recomenda atualizar o cache via `setQueryData` (o backend devolve o objeto atualizado). Aqui quase todas as mutations usam `invalidateQueries`; só `useUpdateGoal` segue o padrão `setQueryData` — e, mesmo assim, atualiza apenas `["goals", id]`, não a lista `["goals"]`, então a lista pode ficar defasada após editar.

### Componentes / drawers
- **`ItemGoalCard`** — meta Item: progresso (guardado/alvo), métricas derivadas no cliente (economia média/mês = `saved/mesesDesdeCriação`, necessário/mês = `restante/mesesAtéPrazo`, ETA, callout de suficiência over/ok/under), e ações `Aportar` / `Retirar` (se `saved > 0`) / `Comprar` (se atingiu o alvo) / excluir.
- **`InvestmentGoalCard`** — meta Investment: mesmas métricas; mostra badges de `TargetAssetType` e `TargetTicker`; única ação é excluir, com a nota "Progresso via carteira de investimentos".
- **`ContributeDrawer`** — campo valor, `Select` de conta de origem opcional (com texto "Aporte externo (sem conta)"), descrição.
- **`WithdrawDrawer`** — valor com validação client-side `exceedsBalance` (`Amount*100 > currentAmount`), conta destino opcional, descrição.
- **`PurchaseDrawer`** — exibe que "o saldo será zerado", exige `Select` de subcategoria (varre `categories[].subCategories[]`), descrição.
- **`GoalDetailDrawer`** — progresso + grid de infos (prazo, prioridade, conquista, descrição, link); para Item lista `detail.transactions`, para Investment lista `investmentTxs`. Footer só para Item ativo (Aportar/Retirar/Comprar). Usa o `goal` da lista para dados-resumo + `useGoalDetail` para o histórico.
- **`AddGoalDrawer`** — toggle `Item` / `Investment`, nome, descrição, valor-alvo, prioridade, 8 cores predefinidas, prazo (`DatePickerField` próprio), e campos condicionais: `Url` (Item) ou `TargetAssetType` + `TargetTicker` (Investment, com opção "Geral").

### KPIs e filtros (página)
A `GoalsPage` deriva 4 KPIs no cliente sobre as metas **ativas** (Total Guardado, Total das Metas, Progresso Geral, Concluídas N/total) e filtra por aba (`all` / `Item` / `Investment`). A ordenação coloca `Active` antes de não-ativas e depois por prioridade (`High` < `Medium` < `Low`). Toda a filtragem/ordenação/KPI é **client-side** sobre `useGoals()` (sem filtro server-side, embora a API aceite `type`/`status`).

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Aporte com conta de origem → `Transfer`; sem conta → `Income` (RN-GOAL-05).
- Retirada acima do saldo → bloqueada no backend (`422`) e no front (`exceedsBalance`) (RN-GOAL-06).
- Aporte com alvo já atingido → bloqueado (`"Goal target already reached."`).
- Excluir meta com saldo sem `returnToAccountId` → `422` (RN-GOAL-10).
- `AchievedAt` recalculado/persistido na listagem ao cruzar/desfazer o alvo (RN-GOAL-08).
- Meta Investment "Geral" (sem ticker nem assetType) → soma toda a carteira (RN-GOAL-04).

### Gaps / dúvidas a confirmar
- **G1 — Validação de Goal não roda:** `GoalController` é o único controller que **não injeta `IValidator<T>`** nem chama `ToActionResult()`. `CreateGoalValidator`/`UpdateGoalValidator` existem, têm testes e estão registrados via `AddValidatorsFromAssembly`, mas **nunca são executados** em request. Logo, `Name` vazio, `TargetAmount <= 0`, `Color` fora de `#RRGGBB`, `Url`/`ImageUrl` longos, `TargetDate` ausente etc. passam direto. **Confirmar** se é esquecimento (provável) e ligar os validadores no controller.
- **G2 — `RecordGoalCheckpoint` órfão (dead code):** a tabela `GoalCheckpoints` foi dropada, mas `RecordGoalCheckpointRequestDto` + `RecordGoalCheckpointValidator` (e dois testes) permanecem sem entidade, service ou endpoint. Remover, ou reintroduzir o recurso de "checkpoints" se ainda for desejado.
- **G3 — Sem coerência Item × Investment na criação:** nada impede criar `Item` com `TargetTicker`/`TargetAssetType` preenchidos, nem `Investment` com `Url`/`ImageUrl`. O front oculta os campos conforme o toggle, mas a API aceita qualquer combinação. **Confirmar** se deve haver validação cruzada por `Type`.
- **G4 — `purchase` não cobre o alvo:** `RegisterPurchaseAsync` zera o saldo e marca `Achieved` mesmo que o saldo seja menor que `TargetAmount` (a UI só mostra "Comprar" quando atingiu, mas a API não valida). Confirmar se compra parcial deveria ser permitida.
- **G5 — Metas Investment nunca viram `Status = Achieved`:** `GetAllAsync` só ajusta `AchievedAt` (data), nunca `Status`. Só `purchase` (Item) seta `Achieved`. Assim, uma meta Investment que bateu o alvo fica `Active` com `AchievedAt` preenchido; a UI trata "achieved" por `status === "Achieved"`, então o card de Investment **nunca** mostra o estado "Conquistada". **Confirmar** comportamento esperado para metas Investment atingidas.
- **G6 — `IncludeInNetWorth` sem consumidor:** é hardcoded `false` na criação, só editável via `PATCH`, e **nenhuma feature de patrimônio (net worth) o consome** no código atual. Verificar se há (ou haverá) cálculo de patrimônio que use esse flag, ou se é campo prematuro.
- **G7 — `ImageUrl` aceito mas não usado:** existe no DTO/entidade/validador e é exibido no card como `ExternalLink` apenas quando há `url`, mas o `AddGoalDrawer` **não tem campo para `ImageUrl`** e nenhum lugar renderiza a imagem. Confirmar se é funcionalidade pendente.
- **G8 — Mapeamento de erro por substring:** o controller decide `404` vs `422` por `Error.Contains("not found")` / `Contains("balance")`. Qualquer mudança no texto das mensagens (que estão em inglês no service, exceto descrições de transação em PT) quebra o status HTTP. Padronizar com códigos/erros tipados.
- **G9 — Devolução referencia conta apagada:** em `DeleteAsync`, a `Transfer` de devolução tem `AccountId = conta da meta`, que é `Remove`ida na **mesma** `SaveChangesAsync`. Verificar a ordem de persistência / se a transação de devolução fica com FK órfã ou é perdida (a conta destino existe, mas a conta de origem deixa de existir). Possível inconsistência no saldo da conta destino vs. histórico.
- **G10 — Sem validação de propriedade das contas/subcategoria nas operações:** `SourceAccountId`, `DestinationAccountId`, `returnToAccountId` e `SubCategoryId` são usados para criar transações **sem checar** se pertencem ao `userId`. Em tese um usuário poderia referenciar IDs de outro. Confirmar e adicionar checagem de ownership (padrão do `apps/api/CLAUDE.md`).
- **G11 — `GoalsPage.tsx` monolítico (~1.760 linhas):** os 5 drawers, 2 cards, date picker e helpers vivem todos no mesmo arquivo. Candidato a quebra em `features/goals/components/`.
- **G12 — Cache do front inconsistente:** mutations usam `invalidateQueries(["goals"])`, exceto `useUpdateGoal` que faz `setQueryData(["goals", id])` sem atualizar a lista — diverge do padrão do `web/CLAUDE.md` e pode deixar a lista defasada após edição.
- **G13 — Métricas client-side podem distorcer:** "economia média/mês" usa `currentAmount / mesesDesdeCriação`. Para metas Item, retiradas reduzem `currentAmount`, então a "média" mistura aportes e saques; para Investment, oscilação de preço muda a "média" sem aporte real. É só informativo, mas pode confundir. Confirmar a intenção do cálculo.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/GoalController.cs` (rota `api/goals`)
- `FinanceControl.Services/Services/GoalService.cs`
- `FinanceControl.Domain/Interfaces/Services/IGoalService.cs`
- `FinanceControl.Domain/Entities/Goal.cs`
- `FinanceControl.Data/Mappings/GoalMap.cs`
- `FinanceControl.Shared/Dtos/Request/CreateGoalRequestDto.cs`, `UpdateGoalRequestDto.cs`, `RecordGoalContributionRequestDto.cs`, `WithdrawGoalRequestDto.cs`, `RegisterGoalPurchaseRequestDto.cs`, `RecordGoalCheckpointRequestDto.cs` *(órfão — G2)*
- `FinanceControl.Shared/Dtos/Response/GoalResponseDto.cs` (contém `GoalResponseDto`, `GoalDetailResponseDto`, `GoalTransactionDto`)
- `FinanceControl.Shared/Dtos/Response/Investment/InvestmentTransactionDto.cs`
- `FinanceControl.Shared/Enums/EnumGoalType.cs`, `EnumGoalStatus.cs`, `EnumGoalPriority.cs`
- `FinanceControl.Services/Validations/CreateGoalValidator.cs`, `UpdateGoalValidator.cs`, `RecordGoalCheckpointValidator.cs` *(não acoplados ao controller — G1/G2)*
- `FinanceControl.Data/Migrations/20260503054147_NewGoal.cs`, `20260518202616_GoalTransferSeed_AccountServiceFixes.cs` (dropa `GoalCheckpoints`, adiciona colunas de Goal/Account e `Transactions.DestinationAccountId`)
- `FinanceControl.Tests/Unit/Validators/OtherValidatorsTests.cs` (testes de `CreateGoalValidator` e `RecordGoalCheckpointValidator`) — **não há testes de `GoalService`**

**Web**
- `features/goals/GoalsPage.tsx` (página + todos os cards/drawers)
- `features/goals/hooks/useGoals.ts`
- `lib/api/goals.ts`
- `lib/types/goal.types.ts`
- `components/layout/GlobalSearch.tsx` (keyword `"wishlist"` → `/goals`)
- `app/(app)/goals/page.tsx` (re-export)

**Specs relacionados**
- `specs/accounts.md` — saldo de conta e exclusão de contas `IsSystem` (contas virtuais das metas Item)
- `specs/transactions.md` — modelo de `Transaction`, centavos, `DestinationAccountId`
- `specs/investments.md` — posições, `CurrentQuantity`/`CurrentPrice`, `InvestmentTransaction`
- `specs/market-data.md` — origem dos preços usados nas metas Investment
