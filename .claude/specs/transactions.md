# Spec: Transactions

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Lançamentos financeiros (receita / despesa / transferência), nos modos avulso, parcelado e recorrente.

---

## 1. Visão geral

Transactions é o domínio central do app. Toda movimentação financeira é uma `Transaction`,
sempre vinculada a uma **subcategoria** e a uma **conta**. O saldo das contas é derivado da
soma das transações (ver `specs/accounts.md`) — transações são a fonte da verdade.

Três modos de pagamento (`PaymentType`):

- **OneTime** — uma única transação.
- **Installment** — parcelamento: gera N transações (uma "pai" + N-1 "filhas" via `ParentTransactionId`), uma por mês.
- **Recurring** — cria um template `RecurringTransaction` + a primeira transação; as demais são geradas por um job diário (ver `specs/recurrences.md` e `specs/background-jobs.md`).

Responsabilidades **fora** deste spec:
- Geração das ocorrências recorrentes ao longo do tempo → `specs/recurrences.md`.
- Cálculo de saldo da conta → `specs/accounts.md`.
- Agregações do dashboard (resumo, top categorias, previsão de gastos) → `specs/dashboard.md` (a lógica vive em `TransactionService`, mas o contrato é do MainPage).

---

## 2. Entidades

### `Transaction` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Transaction.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`) |
| `BudgetId` | `int?` | Preenchido só se incluída no orçamento ativo |
| `SubCategoryId` | `int` | Obrigatório — toda transação tem subcategoria |
| `AccountId` | `int` | Conta de origem |
| `DestinationAccountId` | `int?` | Conta destino (apenas transferências) — **ver gap G4** |
| `RecurringTransactionId` | `int?` | Aponta para o template, se recorrente |
| `ParentTransactionId` | `int?` | Aponta para a 1ª parcela, nas parcelas 2..N |
| `Value` | `int` | **Centavos** (R$ 150,50 → `15050`). Nunca float |
| `Type` | `EnumTransactionType` | `Expense` / `Income` / `Transfer` |
| `Description` | `string` | Texto livre |
| `TransactionDate` | `DateOnly` | Data do lançamento (sem hora) |
| `PaymentType` | `EnumPaymentType` | `OneTime` / `Installment` / `Recurring` |
| `PaymentMethod` | `EnumPaymentMethod?` | Opcional |
| `InstallmentNumber` | `int?` | Nº da parcela (1..N), só em Installment |
| `TotalInstallments` | `int?` | Total de parcelas, só em Installment |
| `Tags` | `ICollection<Tag>` | Many-to-many |

### `Tag` (`OwnedEntity`)
Many-to-many com `Transaction`. Nome único por usuário (case-insensitive) — ver `specs/categories.md` se as tags migrarem de spec; por ora documentadas aqui por serem criadas no fluxo de transação.

### Enums
`EnumTransactionType`: `Expense`, `Income`, `Transfer`
`EnumPaymentType`: `OneTime`, `Installment`, `Recurring`
`EnumRecurrenceType`: `None`, `Daily`, `WorkDay`, `Weekly`, `Biweekly`, `Monthly`, `Quarterly`, `Semiannually`, `Annually`

---

## 3. Endpoints (API)

Controller: `TransactionController` — rota base `api/transaction`. Todos exigem `[Authorize]`.
O `userId` vem sempre do JWT (`GetUserId()`), nunca do corpo.

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `POST` | `/api/transaction` | Cria transação (OneTime / Installment / Recurring) | `201 Created` com `{ transactions: [...] }` | `400` validação · `404` conta/subcategoria/orçamento inválido |
| `GET` | `/api/transaction` | Lista todas do usuário (sem filtro, exclui contas system) | `200` array | — |
| `GET` | `/api/transaction/filtered` | Lista paginada + filtros + totais | `200` `GetTransactionsFilteredResponseDto` | — |
| `GET` | `/api/transaction/{id}` | Detalhe por id | `200` | `404` |
| `PATCH` | `/api/transaction/{id}` | Atualiza | `200` com `{ transactions: [...] }` | `400` · `404` |
| `DELETE` | `/api/transaction/{id}` | Remove | `200` (lista atualizada) | `404` |

### Request — `CreateTransactionRequestDto`
```
IncludeInBudget : bool
SubCategoryId   : int
AccountId       : int
Value           : int            // centavos, > 0
Type            : EnumTransactionType
Description     : string
TransactionDate : DateOnly
PaymentType     : EnumPaymentType
PaymentMethod   : EnumPaymentMethod?
TotalInstallments : int?         // obrigatório (>1) se Installment; deve ser null caso contrário
Recurrence      : EnumRecurrenceType?  // obrigatório se Recurring
Tags            : string[]?      // nomes; criados on-the-fly se não existirem
```

### Request — `GetTransactionsFilterRequestDto` (query string)
```
StartDate, FinishDate : DateOnly   // obrigatórios — janela aplicada sempre
BudgetIds, AccountIds, CategoryIds, SubCategoryIds : int[]?
Page      : int = 1
PageSize  : int = 20               // clamp 1..100 no service
SortField : string = "date"        // "date" | "value"
SortOrder : string = "desc"        // "asc" | "desc"
```

### Response — `GetTransactionResponseDto` (item)
```
Id, BudgetId?, SubCategoryId, SubCategoryName, SubCategoryEmoji?,
AccountId, AccountName, RecurringTransactionId?, ParentTransactionId?,
Value, Type, Description, TransactionDate, PaymentType, PaymentMethod?,
InstallmentNumber?, TotalInstallments?, AreaId?, AreaName?, Tags[]
```

### Response — `GetTransactionsFilteredResponseDto`
```
TotalIncome  : int
TotalExpense : int
Balance      : int            // TotalIncome - TotalExpense
Page : PagedResponse<GetTransactionResponseDto> {
  CurrentPage, TotalPages, PageSize, TotalItems, RowCount, Items[]
}
```

### Response de mutação — `CreateTransactionResponseDto`
`{ Transactions: GetTransactionResponseDto[] }` — em Installment retorna todas as parcelas; em OneTime/Recurring, um único item.

---

## 4. Regras de negócio

### RN-TX-01 — Valores em centavos
`Value` é sempre `int` em centavos, na entidade, no DTO e no tráfego HTTP. O front divide por 100 para exibir e multiplica por 100 ao enviar. Nunca usar float/decimal para dinheiro.

### RN-TX-02 — Validação de criação (`CreateTransactionValidator`)
- `SubCategoryId`, `AccountId` > 0.
- `Value` > 0.
- `Type` e `PaymentType` devem ser enums válidos.
- `TransactionDate` obrigatória.
- Se `PaymentType == Installment`: `TotalInstallments > 1`.
- Se `PaymentType != Installment`: `TotalInstallments` deve ser `null`.
- Se `PaymentType == Recurring`: `Recurrence` obrigatória (e enum válido).

### RN-TX-03 — Propriedade dos recursos
`AccountId` e `SubCategoryId` precisam pertencer ao `userId` autenticado, senão falha com `"Invalid parameters."` (→ `404`). Toda query é escopada por `UserId`.

### RN-TX-04 — Inclusão em orçamento
Se `IncludeInBudget == true`, o service busca o **orçamento ativo** do usuário e vincula `BudgetId`. Se não houver orçamento ativo, a criação falha com `"No active budget found."`. Não é possível escolher um orçamento específico — é sempre o ativo.

### RN-TX-05 — Parcelamento (Installment)
`CalculateInstallmentValues(total, n)`:
- `base = total / n` (divisão inteira), `resto = total % n`.
- **1ª parcela** = `base + resto`; **demais** = `base`. O resto cai na primeira parcela.
- A 1ª parcela é a "pai" (`InstallmentNumber = 1`, sem `ParentTransactionId`); parcelas 2..N têm `ParentTransactionId = pai.Id` e `TransactionDate = data + (i-1) meses`.
- Tudo numa transação de banco (`BeginTransactionAsync`); rollback em erro.

### RN-TX-06 — Recorrência (Recurring)
Cria um `RecurringTransaction` (template, `IsActive = true`, `StartDate = TransactionDate`) **e** a primeira `Transaction` (com `RecurringTransactionId` preenchido). As próximas ocorrências são geradas pelo job diário — **não** nesta chamada. `Recurrence == None` é rejeitado (retorna lista vazia → `"Invalid payment type."`).

### RN-TX-07 — Tags on-the-fly (`AssociateTagsAsync`)
Nomes em `Tags` são normalizados (trim, distinct case-insensitive). Tags existentes do usuário são reaproveitadas; nomes novos viram `Tag` nova. Em seguida a associação many-to-many é reescrita (`Clear` + re-add) para cada transação criada.

### RN-TX-08 — Update com troca de PaymentType
Se o `PaymentType` mudou no update, o service **deleta** a transação e **recria** via `CreateTransactionAsync` (efetivamente um replace). Se o `PaymentType` é o mesmo, faz update in-place dos campos e reassocia tags. `IncludeInBudget` no update revincula/desvincula `BudgetId` para o orçamento ativo.

### RN-TX-09 — Listagem exclui contas de sistema
`GetTransactionQuery` filtra `!t.Account.IsSystem` — transações de contas virtuais (usadas por Goals) não aparecem nas listagens normais.

### RN-TX-10 — Totais e paginação (filtered)
Totais (`TotalIncome`, `TotalExpense`) são somados sobre **todo o conjunto filtrado**, não só a página. `Balance = TotalIncome - TotalExpense`. Ordenação por `date` (default) ou `value`, asc/desc. `PageSize` é clampado em 1..100.

### RN-TX-11 — `AreaId`/`AreaName` derivados
Não são colunas de `Transaction`: são resolvidos por subconsulta em `BudgetSubcategoryAllocations` casando `SubCategoryId` + `BudgetId`. Indicam em qual área do orçamento a transação cai.

---

## 5. Front (Web)

- **Rota:** `/transactions` → `app/(app)/transactions/page.tsx` (re-export) → `features/transactions/TransactionsPage.tsx`.
- **Página:** toda a lógica em `TransactionsPage.tsx` (filtros, busca, paginação, drawers).

### API client — `lib/api/transactions.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getAll()` | `GET /transaction` | raramente usado |
| `getFiltered(params)` | `GET /transaction/filtered` | principal |
| `create(data)` | `POST /transaction` | retorna `res.data.transactions` |
| `update(id, data)` | `PATCH /transaction/{id}` | retorna `res.data.transactions` |
| `delete(id)` | `DELETE /transaction/{id}` | |

### Hooks — `features/transactions/hooks/`
- `useTransactions()` — query simples (`["transactions"]`).
- `useTransactionsFiltered(params)` — query principal (`["transactions","filtered",params]`).
- `useCreateTransaction` / `useUpdateTransaction` / `useDeleteTransaction` — mutations; todas invalidam `["transactions","filtered"]` no `onSuccess`.
- `useSubCategories()` — popular selects de subcategoria.
- `useTags()` — popular o `TagInput`.

> **Nota de convenção:** o `web/CLAUDE.md` recomenda atualizar o cache via `setQueryData` (o backend retorna a lista atualizada). Aqui os hooks usam `invalidateQueries`. Não é bug, mas é uma divergência do padrão — ver gap G3.

### Componentes principais
`TransactionDrawer` (create/edit/detail), `CreateTransactionModal`, `EditTransactionModal`, `DeleteTransactionModal`, `TransactionsList`, `TransactionsTable`, `TransactionsFilters`/`TransactionsFilterBar`, `TransactionsPagination`, `TransactionsSummary`, `TagInput`, `TransactionTypeTag`, `RecurringBanner`.

### Filtragem em duas camadas
A página combina **filtro server-side** (datas, budget/account/category/subcategory, paginação, ordenação — vão na query) com **filtro client-side** adicional sobre a página atual: busca textual (descrição/tag, normalizada sem acento), `typeFilter`, `tagIds` e `filterDay`. Ou seja, parte da filtragem ocorre só sobre os itens já paginados.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Parcelamento com valor não divisível → resto na 1ª parcela (RN-TX-05).
- Tags duplicadas / com espaços → normalizadas (RN-TX-07).
- Troca de PaymentType no update → delete+recreate (RN-TX-08).
- `PageSize` fora de 1..100 → clamp.
- Conjunto filtrado vazio → totais zerados, `TotalPages` mínimo 1.

### Gaps / dúvidas a confirmar
- **G1 — `previousTotalIncome` / `previousTotalExpense` / `previousBalance`:** a `TransactionsPage` lê esses campos da resposta (`response?.previousBalance` etc.), mas o `GetTransactionsFilteredResponseDto` do backend **não os expõe**. Ou o tipo TS do front está à frente do backend, ou falta implementar a comparação com período anterior na API. **Confirmar qual lado é a fonte da verdade.**
- **G2 — Transferências (`Transfer`):** o enum `EnumTransactionType.Transfer` e os campos `DestinationAccountId` existem na entidade, e `specs/accounts.md` descreve o efeito de transferências no saldo. Porém o `TransactionService` **não tem fluxo de criação de transferência** (não escreve `DestinationAccountId`, não cria a perna de entrada na conta destino). O filtro de UI para "Transfer" inclusive usa uma heurística estranha (`recurringTransactionId === null && parentTransactionId === null`). **Confirmar se transferência está implementada em outro lugar ou se é funcionalidade pendente.**
- **G3 — Cache do front:** hooks usam `invalidateQueries` em vez de `setQueryData` (padrão do `web/CLAUDE.md`). Alinhar intencionalmente ou padronizar.
- **G4 — Update de parcelamento:** trocar de/para Installment recria via delete+create, mas o delete remove **apenas a transação alvo** (`DeleteTransactionAsync` por id), não as parcelas irmãs. Verificar se ao editar uma parcela o comportamento esperado é mexer só naquela ou na série inteira.
- **G5 — Delete de série recorrente:** deletar a transação que tem `RecurringTransactionId` não desativa o template `RecurringTransaction`. Confirmar se é o comportamento desejado (provavelmente o cancelamento é responsabilidade do fluxo de Recurrences).

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/TransactionController.cs`
- `FinanceControl.Services/Services/TransactionService.cs`
- `FinanceControl.Services/Validations/CreateTransactionValidator.cs`, `UpdateTransactionValidator.cs`
- `FinanceControl.Domain/Entities/Transaction.cs`
- `FinanceControl.Shared/Dtos/Request/CreateTransactionRequestDto.cs`, `UpdateTransactionRequestDto.cs`, `GetTransactionsFilterRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/GetTransactionResponseDto.cs`, `GetTransactionsFilteredResponseDto.cs`, `CreateTransactionResponseDto.cs`
- `FinanceControl.Tests/Unit/TransactionServiceTests.cs`, `Validators/CreateTransactionValidatorTests.cs`

**Web**
- `features/transactions/TransactionsPage.tsx`
- `features/transactions/hooks/useTransactions.ts`, `useSubCategories.ts`, `useTags.ts`
- `lib/api/transactions.ts`, `lib/api/tags.ts`, `lib/api/subcategories.ts`
- `lib/types/transactions.types.ts`
