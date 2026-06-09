# Spec: Budgets

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Orçamentos por período (recorrência configurável), organizados em áreas, com alocações de receita/despesa por subcategoria.

---

## 1. Visão geral

Budgets é o domínio de planejamento financeiro do app. Um `Budget` é um período nomeado com
recorrência (`Weekly`..`Annually`) e um **dia de início** (`StartDate`, um inteiro 1–31). Dentro
de cada orçamento há **áreas** (`Area`) — agrupadores lógicos — e dentro de cada área há
**alocações por subcategoria** (`BudgetSubcategoryAllocation`), cada uma com um valor esperado
(`ExpectedValue`, em centavos) e um tipo (`AllocationType` = `Income` ou `Expense`).

O orçamento **não armazena datas de início/fim concretas** — apenas o dia do mês (`StartDate`) e
a recorrência. As datas reais do ciclo são **calculadas em runtime** (`ComputePeriod`) a partir de
uma data de referência (default = hoje). Isso permite visualizar ciclos passados e futuros passando
`referenceDate`. O "gasto" (spent) de cada alocação é a soma das `Transaction` vinculadas ao
orçamento (`BudgetId`) dentro da janela `[start, finish)`, agrupadas por `SubCategoryId` + `Type`.

Apenas **um orçamento ativo por usuário** por vez (`IsActive`). Transações entram no orçamento ativo
quando criadas com `IncludeInBudget = true` (ver `specs/transactions.md`, RN-TX-04 / RN-TX-11).

Responsabilidades **fora** deste spec:
- Vínculo transação → orçamento (`BudgetId`, `IncludeInBudget`) e derivação de `AreaId`/`AreaName` na transação → `specs/transactions.md`.
- Resumo de orçamento no dashboard (`GetBudgetSummaryAsync`, card de orçamento ativo, top subcategorias) → `specs/dashboard.md` (a lógica vive em `TransactionService.GetBudgetSummaryAsync`, mas o contrato é do MainPage).
- Geração de ocorrências de transações recorrentes que caem no orçamento → `specs/recurrences.md` / `specs/background-jobs.md`.

---

## 2. Entidades

### `Budget` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Budget.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`) |
| `Name` | `string` | Nome livre (default `""`) |
| `StartDate` | `int` | **Dia do mês** (1–31), **não** uma data. O ciclo concreto é calculado em runtime |
| `Recurrence` | `EnumBudgetRecurrence` | Periodicidade do ciclo |
| `IsActive` | `bool` | No máximo um ativo por usuário (ver RN-BUD-04) |
| `BudgetSubcategoryAllocations` | `ICollection<BudgetSubcategoryAllocation>` | Alocações (nav) |
| `Transactions` | `ICollection<Transaction>` | Transações vinculadas (nav) |
| `RecurringTransactions` | `ICollection<RecurringTransaction>` | Recorrências vinculadas (nav) |

EF mapping (`BudgetMap`): `Recurrence` persistido como string; `CreatedAt` default `now()`; FK `UserId` → `User` com `OnDelete(Cascade)`; índice **não-único** `IX_Budgets_UserId_IsActive` em `(UserId, IsActive)`.

### `Area` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Area.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `UserId` | `int` | Dono |
| `BudgetId` | `int` | Orçamento ao qual pertence |
| `Name` | `string` | Nome da área (sem default — ver gap G6) |
| `BudgetSubcategoryAllocations` | `ICollection<BudgetSubcategoryAllocation>` | Alocações da área (nav) |

EF mapping (`AreaMap`): FKs `UserId` → `User` e `BudgetId` → `Budget`, ambas `OnDelete(Cascade)` (deletar o orçamento apaga as áreas). A área **não** carrega o `AllocationType` — esse tipo é por alocação, não por área (ver gap G1).

### `BudgetSubcategoryAllocation` (`BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/BudgetSubcategoryAllocation.cs`

> **Atenção:** herda `BaseEntity`, **não** `OwnedEntity` — não tem `UserId` próprio. A propriedade do
> recurso é inferida via `Budget`/`Area` (que têm `UserId`). Toda query de alocação é escopada pelo
> `UserId` do `Budget`/`Area`, nunca diretamente.

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `BudgetId` | `int` | Orçamento (FK + nav `Budget`) |
| `AreaId` | `int` | Área (FK + nav `Area`) |
| `SubCategoryId` | `int` | Subcategoria (FK + nav `SubCategory`) |
| `ExpectedValue` | `int` | **Centavos**. Valor planejado para a subcategoria no ciclo |
| `AllocationType` | `EnumAllocationType` | `Income` ou `Expense` — define se a alocação é receita ou despesa |

EF mapping (`BudgetSubcategoryAllocationMap`): `AllocationType` persistido como string e `IsRequired`; três FKs (`Budget`, `Area`, `SubCategory`) todas `OnDelete(Cascade)`; dois índices **não-únicos**: `IX_BudgetSubcategoryAllocations_SubCategoryId_BudgetId` em `(SubCategoryId, BudgetId)` e `IX_BudgetSubcategoryAllocations_BudgetId_AllocationType` em `(BudgetId, AllocationType)`. **Não há unique constraint** garantindo "uma subcategoria por área/orçamento" — ver gap G2.

### Enums

`EnumBudgetRecurrence` (`apps/api/FinanceControl.Shared/Enums/EnumBudgetRecurrence.cs`):
`Weekly`, `Biweekly`, `Monthly`, `Semiannually`, `Annually`.

> Diferente do `EnumRecurrenceType` usado por transações (que tem `Daily`, `WorkDay`, `Quarterly`,
> etc.). O orçamento **não** suporta `Daily`, `WorkDay` nem `Quarterly` — ver gap G3.

`EnumAllocationType` (`apps/api/FinanceControl.Shared/Enums/EnumAllocationType.cs`):
`Income`, `Expense`. Mapeia para `EnumTransactionType` ao casar gasto: `Income → EnumTransactionType.Income`, `Expense → EnumTransactionType.Expense` (ver RN-BUD-06).

---

## 3. Endpoints (API)

Controller: `BudgetController` — rota base `api/budget`. Todos exigem `[Authorize]`.
O `userId` vem sempre do JWT (`GetUserId()`), nunca do corpo.

> **Não existe `AreaController` nem endpoints dedicados de alocação.** Áreas e alocações são
> criadas/editadas/removidas **exclusivamente** de forma aninhada, via os DTOs de create/update do
> orçamento (`POST /api/budget` e `PATCH /api/budget/{id}`). Ver gap G4.

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `POST` | `/api/budget` | Cria orçamento + áreas + alocações (aninhado) | `201 Created` com `GetBudgetWithAreasResponseDto` | `400` validação |
| `GET` | `/api/budget` | Lista todos do usuário, com spent/percentuais calculados para `referenceDate` | `200` array de `GetAllBudgetResponseDto` | — |
| `GET` | `/api/budget/{id}` | Detalhe "leve" (só datas/recorrência, **sem** áreas/alocações) | `200` `GetBudgetByIdResponseDto` | `404` |
| `GET` | `/api/budget/{id}/allocation` | Orçamento com áreas + alocações + spent por subcategoria | `200` `GetBudgetWithAreasResponseDto` | `404` |
| `PATCH` | `/api/budget/{id}` | Atualiza orçamento + upsert/delete de áreas e alocações | `200` `GetBudgetWithAreasResponseDto` | `400` · `404` |
| `DELETE` | `/api/budget/{id}` | Remove o orçamento (cascade nas áreas/alocações) | `200` lista atualizada (`GetAllBudgetResponseDto[]`) | `404` |
| `PATCH` | `/api/budget/{id}/activate` | Ativa este orçamento e desativa o ativo anterior | `200` lista atualizada (`GetAllBudgetResponseDto[]`) | `404` |

> **Inconsistência de retorno:** `POST` e `PATCH /{id}` retornam **um** `GetBudgetWithAreasResponseDto`;
> `DELETE` e `PATCH /{id}/activate` retornam a **lista** `GetAllBudgetResponseDto[]`. O front trata
> tudo como "lista atualizada" (`Budget[]`) — ver gap G5.

### Query param comum — `referenceDate`
`GET /api/budget` e `GET /api/budget/{id}/allocation` aceitam `?referenceDate=YYYY-MM-DD` (`DateOnly?`).
Quando ausente, usa-se `DateTime.UtcNow`. Define a "âncora" do ciclo calculado por `ComputePeriod`
(permite ver ciclos passados/futuros). `GET /api/budget/{id}` **não** aceita `referenceDate` (usa sempre hoje).

### Request — `CreateBudgetRequestDto`
```
Name       : string
StartDate  : int                       // dia do mês 1..31
Recurrence : EnumBudgetRecurrence
IsActive   : bool
Areas      : CreateAreaInBudgetDto[]
  └ Name        : string
    Allocations : CreateAllocationInBudgetDto[]
      └ SubCategoryId  : int
        ExpectedValue  : int            // centavos, >= 0
        AllocationType : EnumAllocationType
```

### Request — `UpdateBudgetRequestDto`
```
Id         : int                        // setado pela rota (BudgetController)
Name       : string
StartDate  : int
Recurrence : EnumBudgetRecurrence
IsActive   : bool
Areas      : UpsertAreaInBudgetDto[]
  └ Id          : int?                  // null = nova área; preenchido = update
    Name        : string
    Allocations : UpsertAllocationInBudgetDto[]
      └ Id             : int?           // null = nova alocação; preenchido = update
        SubCategoryId  : int
        ExpectedValue  : int
        AllocationType : EnumAllocationType
```

### Response — `GetBudgetWithAreasResponseDto` (POST / PATCH / GET `/{id}/allocation`)
```
Id, Name,
StartDate  : DateOnly                   // calculado por ComputePeriod
FinishDate : DateOnly
Recurrence : EnumBudgetRecurrence
IsActive   : bool
Areas : AreaInBudgetResponseDto[] {
  Id, Name,
  Allocations : AllocationInBudgetResponseDto[] {
    Id, SubCategoryId, SubCategoryName, SubCategoryEmoji?,
    ExpectedValue, SpentValue, AllocationType
  }
}
```
> Em `POST`/`PATCH` (via `BuildBudgetWithAreasResponse`) o `SpentValue` **não** é calculado —
> a montagem não consulta transações, então `SpentValue` sai `0`. Só `GET /{id}/allocation`
> popula `SpentValue` de fato. Ver gap G7.

### Response — `GetAllBudgetResponseDto` (GET `/`, DELETE, activate)
```
Id, Name, Recurrence, IsActive,
StartDate, EndDate : DateOnly           // ciclo calculado p/ referenceDate
TotalAllocated : int                    // Σ ExpectedValue das alocações Expense
TotalSpent     : int                    // Σ gasto Expense no período
SpentPercentage: double                 // TotalSpent / TotalAllocated * 100 (0 se base 0)
TotalIncome    : int                    // Σ ExpectedValue das alocações Income
TotalReceived  : int                    // Σ "spent" Income no período
Available      : int                    // TotalAllocated - TotalSpent
Allocations : BudgetAllocationFlatResponseDto[] {   // achatado (área vira campo AreaName)
  Id, SubCategoryId, SubCategoryName, SubCategoryEmoji?,
  CategoryName, CategoryColor?, AreaName,
  Allocated, Spent, SpentPercentage, AllocationType
}
```

### Response — `GetBudgetByIdResponseDto` (GET `/{id}`)
```
Id, Name, StartDate, FinishDate, Recurrence
```
> Não inclui `IsActive` nem áreas/alocações. Endpoint pouco usado pelo front (ver §5).

### DTO de dashboard — `BudgetSummaryDto`
`apps/api/FinanceControl.Shared/Dtos/Others/BudgetSummaryDto.cs` — `TotalExpected`, `TotalSpent`,
`SpentPercentage` (decimal), `HasAllocations`, `TopSubCategories[]`. Produzido por
`TransactionService.GetBudgetSummaryAsync` para o MainPage — **documentado em `specs/dashboard.md`**,
não aqui.

---

## 4. Regras de negócio

### RN-BUD-01 — Valores em centavos
`ExpectedValue` e todos os agregados (`TotalAllocated`, `TotalSpent`, `Spent`, `Available`, etc.) são
`int` em centavos, na entidade, nos DTOs e no tráfego HTTP. O front divide por 100 para exibir e
multiplica por 100 ao enviar. Nunca float/decimal para dinheiro (`SpentPercentage` é `double`/`decimal`
por ser percentual, não valor).

### RN-BUD-02 — Ciclo calculado em runtime (`ComputePeriod`)
O orçamento guarda só o dia (`StartDate`, 1–31) e a recorrência. `ComputePeriod(startDay, recurrence, referenceDate?)`:
- `anchor = referenceDate ?? hoje (UtcNow)`.
- `clampedDay = min(startDay, diasNoMês(anchor))` — dia 31 em fevereiro vira o último dia do mês.
- `start = (anchor.Year, anchor.Month, clampedDay)`.
- `finish`: `Weekly → +7d`, `Biweekly → +14d`, `Monthly → +1 mês`, `Semiannually → +6 meses`, `Annually → +1 ano`. **Default (qualquer outro) → +1 mês.**

A janela de gastos é **semiaberta** `[start, finish)` (`>= start && < finish`).

### RN-BUD-03 — Primeiro orçamento vira ativo automaticamente
Em `CreateBudgetAsync`, se o usuário **não tem nenhum** orçamento ainda, o novo é forçado a
`IsActive = true` independentemente do que veio no DTO.

### RN-BUD-04 — Apenas um orçamento ativo por usuário
Sempre que um orçamento é marcado ativo (em create com `IsActive=true`, em update com `IsActive=true`,
ou via `activate`), o ativo anterior do usuário (`Id != atual`) é setado para `IsActive = false`.
A exclusividade é garantida **por lógica de serviço**, não por constraint de banco (o índice
`IX_Budgets_UserId_IsActive` é não-único). Ver gap G8.

### RN-BUD-05 — Ativação (`ActivateBudgetAsync`)
`PATCH /{id}/activate` busca o orçamento (escopado por `userId`), desativa o ativo anterior, marca o
alvo como ativo e retorna **a lista completa** recalculada (`GetAllBudgetAsync`). Não altera áreas/alocações.

### RN-BUD-06 — Cálculo de "spent" por alocação
Em `GetAllBudgetAsync` e `GetBudgetWithAllocationsAsync`, as transações são agrupadas por
`(SubCategoryId, Type)` dentro de `[start, finish)`, filtradas por `BudgetId` + `UserId`. Para cada
alocação, o "spent" casa pelo tipo: `AllocationType.Income → soma de Income`, `AllocationType.Expense → soma de Expense`. `SpentPercentage = round(spent / ExpectedValue * 100, 2)`, ou `0` se `ExpectedValue == 0`.

### RN-BUD-07 — Totais do orçamento (`GetAllBudgetAsync`)
Os agregados de topo só consideram alocações de **despesa** para `TotalAllocated`/`TotalSpent`/`Available`/`SpentPercentage`, e só **receita** para `TotalIncome`/`TotalReceived`. Ou seja:
- `TotalAllocated = Σ Allocated(Expense)`; `TotalSpent = Σ Spent(Expense)`.
- `TotalIncome = Σ Allocated(Income)`; `TotalReceived = Σ Spent(Income)`.
- `Available = TotalAllocated - TotalSpent`; `SpentPercentage = round(TotalSpent / TotalAllocated * 100, 2)`.

### RN-BUD-08 — Update: diff de áreas (`UpdateBudgetAsync`)
- Áreas existentes não presentes no request (por `Id`) são **removidas** (`RemoveRange`); o cascade do banco apaga as alocações filhas.
- Áreas com `Id` preenchido têm o `Name` atualizado; se o `Id` não existir no orçamento → falha `"Area {id} not found in this budget."`.
- Áreas sem `Id` são **criadas** (salvas primeiro para obter o `Id` real).

### RN-BUD-09 — Update: upsert de alocações por área
Para cada área (existente ou nova): alocações existentes não presentes no request são removidas;
alocações com `Id` têm `SubCategoryId`/`ExpectedValue`/`AllocationType` atualizados (falha
`"Allocation {id} not found."` se o `Id` não bater); alocações sem `Id` são criadas. Cada
mutação marca `area.UpdatedAt = UtcNow`.

### RN-BUD-10 — Propriedade dos recursos
Toda query de `Budget`/`Area` é escopada por `UserId` (e alocações via `Budget`/`Area`). Orçamento
inexistente ou de outro usuário → `Result.Failure("Budget not found.")` → `404`. **Não há validação**
de que `SubCategoryId` das alocações pertence ao usuário no `BudgetService` — ver gap G9.

### RN-BUD-11 — Validação de create/update (`CreateBudgetValidator` / `UpdateBudgetValidator`)
- `Name` obrigatório (`NotEmpty`).
- `StartDate`: `> 0` e `<= 31`.
- `Recurrence`: enum válido (`IsInEnum`).
- Para cada área: `Name` obrigatório.
- Para cada alocação: `SubCategoryId > 0`, `ExpectedValue >= 0`, `AllocationType` enum válido.
- No update: `Id > 0` adicionalmente.

Os validadores são **idênticos** exceto pela regra de `Id` no update. Note que `ExpectedValue >= 0`
permite alocação de valor **zero** (apesar de o front bloquear `cents <= 0`) — ver gap G10.

### RN-BUD-12 — Delete em cascata
`DeleteBudgetAsync` remove o `Budget`; o cascade configurado (`Budget → Area → BudgetSubcategoryAllocation`)
apaga áreas e alocações. Retorna a lista atualizada. **Não** trata o caso de deletar o orçamento
**ativo** (não promove outro a ativo) — ver gap G11.

---

## 5. Front (Web)

- **Rota:** `/budgets` → `app/(app)/budgets/page.tsx` (re-export) → `features/budgets/BudgetsPage.tsx`.
- **Página:** `BudgetsPage.tsx` orquestra navegação de período, lista de cards e modais.

### API client — `lib/api/budgets.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getAll(referenceDate?)` | `GET /budget` | passa `?referenceDate` quando definido |
| `create(data)` | `POST /budget` | tipado como retorno `Budget` (mas backend devolve `GetBudgetWithAreasResponseDto`) |
| `update(id, data)` | `PATCH /budget/{id}` | tipado como `Budget[]` (mas backend devolve **um** objeto) — ver G5 |
| `activate(id)` | `PATCH /budget/{id}/activate` | retorna `Budget[]` |
| `delete(id)` | `DELETE /budget/{id}` | retorna `void` (ignora o corpo) |

> O endpoint `GET /budget/{id}/allocation` e `GET /budget/{id}` **não são chamados pelo front** —
> a lista (`GET /budget`) já traz `allocations` achatadas com `areaName`, suficiente para os cards e
> para reconstruir o draft de edição. Ver gap G12.

### Hooks — `features/budgets/hooks/`
- `useBudgets(referenceDate?)` — query principal (`["budgets", referenceDate ?? "current"]`), `staleTime` 60s.
- `useCreateBudget` — mutation; `onSuccess` faz `invalidateQueries(["budgets"])`.
- `useUpdateBudget` — mutation; `onSuccess` faz `setQueryData(["budgets"], updated)`.
- `useActivateBudget` — mutation; `onSuccess` faz `setQueryData(["budgets"], updated)`.
- `useDeleteBudget` — mutation; `onSuccess` faz `invalidateQueries(["budgets"])`.
- `useActiveBudget()` — deriva o orçamento ativo + datas do ciclo atual via `computeActivePeriod` (usado por outras features, ex. transações).

> **Inconsistências de cache:** (a) create/delete usam `invalidateQueries`, update/activate usam
> `setQueryData` — mistura de padrões; (b) `setQueryData(["budgets"], updated)` escreve na key
> **sem** o sufixo de `referenceDate`, mas a query real usa `["budgets", referenceDate ?? "current"]`,
> então o `setQueryData` **não atinge** a entrada ativa do cache. Ver gap G13.

### Cálculo de período no front (`BudgetsPage` + `lib/utils/budgetPeriod.ts`)
O front **reimplementa** `ComputePeriod` em TS para a navegação de ciclos (`shiftDate`/`shiftByRecurrence`,
`computePeriod`). Fluxo:
1. `useBudgets()` (sem `referenceDate`) carrega os orçamentos do ciclo atual e identifica o ativo.
2. A partir do `startDate`/`recurrence` do ativo e de um `periodOffset` (0 = atual, `<0` passado, `>0` futuro), calcula `referenceDate`, label do período (`d MMM – d MMM`), `totalDays` e `dayOfPeriod`.
3. Para `offset != 0`, refaz `useBudgets(referenceDate)`; com `offset == 0` reaproveita o carregamento base.
4. Um badge "Futuro" aparece quando `periodOffset > 0`.

> O front converte `startDate` da resposta com `parseLocalDate`/`startDayFromDate` tratando-o como
> **data ISO `YYYY-MM-DD`** (extrai o dia via `split("-")[2]`), pois o backend já devolve o
> `StartDate` da entidade (um `int`) como `DateOnly` calculado. Ver gap G14.

### Componentes principais
- `BudgetCard` — card por orçamento: barras de despesa/receita, badge de status (`Normal`/`Atenção` >80% / `Estourado` >100%), contagem de áreas/subcategorias, detalhe inline expansível, ações editar/excluir (delete com confirmação em dois cliques).
- `BudgetsSummaryBar` — KPIs agregados dos ativos (Orçamento Total, Gasto, Disponível, Dias Restantes), barra de progresso e **projeção** ("no ritmo atual você vai estourar em ~N dias"), calculada client-side a partir de `dailyRate = totalSpent / dayOfPeriod`. Ver `specs/dashboard.md` para a projeção equivalente do dashboard.
- `BudgetAreaBreakdown` — agrupa alocações por `areaName` (`groupByArea`), com barras de despesa e receita por área e drill-down por subcategoria.
- `budgetModalShared.tsx` — wizard de 3 passos compartilhado por create/edit: **Step1** (nome, recorrência, dia 1–31), **Step2** (áreas + alocações, com `SubcategoryPicker` e entrada de valor em centavos digitando dígitos), **Step3** (resumo: receitas/despesas/saldo e distribuição por área).
- `CreateBudgetModal` / `EditBudgetModal` — drawers laterais que pilotam o wizard. Ambos enviam **sempre** `isActive: true` no submit (ver gap G15) e filtram áreas sem alocações antes de enviar; áreas sem nome viram `"Área"`.

### Tipos — `lib/types/budgets.types.ts`
`BudgetRecurrence`, `AllocationType`, `Budget`, `BudgetAllocation` (espelha o flat DTO),
`CreateBudgetRequest`, `UpdateBudgetRequest` (e os DTOs aninhados de área/alocação). `UpdateBudgetRequest`
**reutiliza** `CreateAreaInBudgetRequest` — ou seja, o front **não envia `Id` de área/alocação** no
update, mesmo o backend suportando upsert por `Id`. Consequência prática em G16.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Dia de início > dias do mês (ex. 31 em fevereiro) → clamp para o último dia (`ComputePeriod`, RN-BUD-02).
- `ExpectedValue == 0` (base) → `SpentPercentage` = 0 em vez de divisão por zero (RN-BUD-06/07).
- Primeiro orçamento do usuário → forçado a ativo (RN-BUD-03).
- Janela de gastos semiaberta `[start, finish)` evita contar o primeiro dia do ciclo seguinte.
- Áreas/alocações removidas no update → diff por `Id` + cascade (RN-BUD-08/09).

### Gaps / dúvidas a confirmar

- **G1 — "Areas exclusivamente Income OU Expense":** o briefing afirmava que cada `Area` é
  exclusivamente de receita **ou** despesa. **No código não é assim:** o `AllocationType` está na
  **alocação** (`BudgetSubcategoryAllocation`), não na `Area`. Uma mesma área pode misturar alocações
  `Income` e `Expense` (o front até soma os dois separadamente por área em `BudgetAreaBreakdown`).
  Confirmar se a regra "área é só receita ou só despesa" deveria existir (e não existe) ou se o
  briefing estava incorreto.

- **G2 — Sem unique constraint "subcategoria única por área/orçamento":** o briefing menciona
  constraint única (cada subcategoria em no máximo uma área por orçamento). **Não há unique index**
  no banco — apenas índices não-únicos. A unicidade é garantida **só no front** (`allUsedIds` no
  `Step2` impede repetir subcategoria). É possível, via API direta, criar duas alocações com a mesma
  `SubCategoryId` no mesmo orçamento (em áreas diferentes ou na mesma). Decidir se vira constraint de
  banco / validação de serviço.

- **G3 — Recorrências divergentes do enum de transação:** `EnumBudgetRecurrence` tem apenas
  `Weekly, Biweekly, Monthly, Semiannually, Annually`. Não há `Daily`, `WorkDay` nem `Quarterly`
  (que existem em `EnumRecurrenceType`). O briefing falava "Weekly→Annually"; confirmar se a ausência
  de `Quarterly` (trimestral) é intencional.

- **G4 — Não existe `AreaController` nem endpoints de alocação:** áreas e alocações são gerenciadas
  100% de forma aninhada via `POST`/`PATCH /api/budget`. Não há CRUD independente de área ou alocação.
  Se o roadmap previa endpoints dedicados, eles ainda não existem.

- **G5 — Tipo de retorno inconsistente entre endpoints:** `POST` e `PATCH /{id}` devolvem **um**
  `GetBudgetWithAreasResponseDto`; `DELETE` e `activate` devolvem **lista** `GetAllBudgetResponseDto[]`.
  O client TS tipa `update` como `Budget[]` (errado — é objeto único) e `create` como `Budget`. Como o
  front depende de `invalidate`/refetch para create e do `setQueryData` (que erra a key, G13) para
  update, a divergência não quebra a UI hoje, mas o tipo está incorreto. Padronizar o contrato.

- **G6 — `Area.Name` sem default:** `Budget.Name` tem default `""`, mas `Area.Name` é `string` sem
  inicializador (pode ser `null` se criado fora do fluxo normal). O validador exige `NotEmpty`, então
  na prática não chega null pela API; mas o modelo permite. Considerar `= string.Empty`.

- **G7 — `SpentValue` zerado em create/update:** `BuildBudgetWithAreasResponse` (usado por `POST`/`PATCH`)
  não consulta transações, então `SpentValue` das alocações volta `0` na resposta de mutação. Só
  `GET /{id}/allocation` calcula spent. Como o front ignora essa resposta e refaz `GET /budget`, não
  aparece bug — mas o DTO de retorno é enganoso. Confirmar se deveria calcular ou documentar como "0 esperado".

- **G8 — Exclusividade de ativo só por lógica:** "um ativo por usuário" é garantido por código, não
  por constraint. Uma escrita concorrente (duas ativações simultâneas) poderia, em teoria, deixar dois
  ativos. O índice `(UserId, IsActive)` é não-único. Avaliar partial unique index `WHERE IsActive`.

- **G9 — Sem validação de propriedade de `SubCategoryId`:** o `BudgetService` não verifica se as
  subcategorias das alocações pertencem ao `userId`. Diferente de `TransactionService` (RN-TX-03), que
  valida. É possível alocar uma subcategoria de outro usuário (FK só garante existência). Confirmar se
  é risco real (subcategorias podem ser seedadas/compartilhadas).

- **G10 — Alocação de valor zero permitida no backend:** `ExpectedValue >= 0` no validador aceita 0,
  mas o front exige `cents > 0` para confirmar. Inconsistência frontend/backend; decidir o piso.

- **G11 — Deletar o orçamento ativo não promove outro:** `DeleteBudgetAsync` apenas remove. Se o
  deletado era o ativo, o usuário fica **sem nenhum** orçamento ativo (transações com
  `IncludeInBudget=true` passam a falhar com `"No active budget found."`, ver `specs/transactions.md`
  RN-TX-04). Confirmar se deveria promover automaticamente outro orçamento.

- **G12 — Endpoints `GET /{id}` e `GET /{id}/allocation` órfãos no front:** nenhum dos dois é chamado
  pelo web client. A lista achatada cobre tudo. Verificar se são usados por mobile/outro consumidor ou
  se são candidatos a remoção.

- **G13 — `setQueryData` na key errada:** `useUpdateBudget`/`useActivateBudget` fazem
  `setQueryData(["budgets"], updated)`, mas as queries reais usam `["budgets", referenceDate ?? "current"]`.
  A escrita não atinge a entrada renderizada → a UI só atualiza no próximo refetch/stale. Além disso
  `updated` de `update` é um objeto único (não lista). Alinhar a key e o formato (ou trocar por
  `invalidateQueries`).

- **G14 — `startDate` tratado como data no front, é `int` no backend:** a entidade guarda `StartDate`
  como dia (int), mas os DTOs de resposta expõem `StartDate` como `DateOnly` (já calculado). O front
  reextrai o dia com `startDayFromDate(split("-")[2])`. Funciona, mas é frágil: depende do backend
  sempre devolver a data calculada com o dia correto no terceiro componente. Documentar/encapsular.

- **G15 — Edição força `isActive: true`:** `EditBudgetModal` (e `CreateBudgetModal`) sempre enviam
  `isActive: true`. Logo, **editar qualquer orçamento inativo o torna ativo** (e desativa o atual,
  RN-BUD-04) — provavelmente efeito colateral indesejado. Confirmar comportamento esperado ao editar
  um orçamento inativo.

- **G16 — Update sempre recria áreas/alocações (perde `Id`):** embora o backend suporte upsert por
  `Id` (RN-BUD-08/09), o tipo `UpdateBudgetRequest` do front reutiliza `CreateAreaInBudgetRequest` e
  **não envia `Id`** de área nem de alocação. Resultado prático: todo update apaga as áreas/alocações
  antigas e cria novas (novos `Id`s), perdendo `CreatedAt` e quebrando qualquer referência por `Id`.
  Avaliar enviar os `Id`s para aproveitar o upsert.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/BudgetController.cs` (não há `AreaController`)
- `FinanceControl.Services/Services/BudgetService.cs`
- `FinanceControl.Services/Validations/CreateBudgetValidator.cs`, `UpdateBudgetValidator.cs`
- `FinanceControl.Domain/Interfaces/Services/IBudgetService.cs`
- `FinanceControl.Domain/Entities/Budget.cs`, `Area.cs`, `BudgetSubcategoryAllocation.cs`
- `FinanceControl.Data/Mappings/BudgetMap.cs`, `AreaMap.cs`, `BudgetSubcategoryAllocationMap.cs`
- `FinanceControl.Shared/Enums/EnumBudgetRecurrence.cs`, `EnumAllocationType.cs`
- `FinanceControl.Shared/Dtos/Request/CreateBudgetRequestDto.cs`, `UpdateBudgetRequestDto.cs`, `CreateAreaInBudgetDto.cs`, `CreateAllocationInBudgetDto.cs`, `UpsertAreaInBudgetDto.cs`, `UpsertAllocationInBudgetDto.cs`
- `FinanceControl.Shared/Dtos/Response/GetBudgetWithAreasResponseDto.cs`, `AreaInBudgetResponseDto.cs`, `AllocationInBudgetResponseDto.cs`, `GetAllBudgetResponseDto.cs`, `GetBudgetByIdResponseDto.cs`
- `FinanceControl.Shared/Dtos/Others/BudgetSummaryDto.cs` (consumido pelo dashboard — ver `specs/dashboard.md`)
- `FinanceControl.Services/Services/TransactionService.cs` → `GetBudgetSummaryAsync` (ver `specs/dashboard.md`)

**Web**
- `features/budgets/BudgetsPage.tsx`
- `features/budgets/components/BudgetCard.tsx`, `BudgetsSummaryBar.tsx`, `BudgetAreaBreakdown.tsx`, `budgetModalShared.tsx`, `CreateBudgetModal.tsx`, `EditBudgetModal.tsx`
- `features/budgets/hooks/useBudgets.ts`, `useActiveBudget.ts`
- `lib/api/budgets.ts`
- `lib/types/budgets.types.ts`
- `lib/utils/budgetPeriod.ts`
