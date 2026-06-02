# Spec: Accounts

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Contas financeiras (Checking / Savings / Credit / Cash) — saldo derivado das transações, nunca armazenado.

---

## 1. Visão geral

Accounts é o domínio que representa as "carteiras" do usuário: conta corrente, poupança, cartão
de crédito e dinheiro. Toda `Transaction` aponta para uma conta de origem (`AccountId`), e
transferências apontam também para uma conta destino (`DestinationAccountId`).

A regra central deste domínio: **o saldo da conta nunca é armazenado**. `Account` não tem coluna
de saldo — `CurrentAmount` é sempre **calculado em tempo de leitura** a partir da soma das
transações (ver RN-ACC-04). Transações são a fonte da verdade (ver `specs/transactions.md`).

Outras particularidades:

- **Conta padrão** (`IsDefaultAccount`): no máximo uma por usuário a qualquer momento (RN-ACC-02).
- **Contas de sistema** (`IsSystem`): contas virtuais usadas por Goals; **excluídas** de todas as
  listagens/leituras normais de conta (RN-ACC-06).
- **Saldo inicial / ajuste de saldo**: não são campos da conta — viram uma `Transaction` de
  "Initial balance" / "Balance adjustment" gerada pelo service (RN-ACC-03, RN-ACC-08).
- **Histórico de saldo** (`balance-history`): série diária reconstruída para os últimos N dias
  (default 30) (RN-ACC-09).

Responsabilidades **fora** deste spec:
- Modelo de transações (criação, parcelamento, recorrência, transferências) → `specs/transactions.md`.
- Contas virtuais sob a ótica de metas → `specs/goals.md` (este spec só documenta que elas são
  excluídas das listagens via `IsSystem`).
- Listagem de transações por conta com filtros/paginação → `specs/transactions.md`.

---

## 2. Entidades

### `Account` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Account.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`) |
| `Name` | `string` | Obrigatório (`IsRequired` no mapping) |
| `Type` | `EnumAccountType` | `Checking` / `Savings` / `Credit` / `Cash`; persistido como **string** (`HasConversion<string>`) |
| `GoalAmount` | `int?` | Meta de saldo em **centavos** — opcional. Aceito em create/update, mas **só retornado** em `GetAccountByIdResponseDto` (ver gap G5) |
| `IsDefaultAccount` | `bool` | Conta padrão; no máximo uma por usuário (RN-ACC-02) |
| `IsSystem` | `bool` | Default `false`. Conta virtual (Goals) — excluída das listagens (RN-ACC-06). **Não é exposta em nenhum DTO** |
| `BillingDueDay` | `int?` | Dia de vencimento (1..31); só para `Credit`/`Checking` (RN-ACC-05) |
| `CreditLimit` | `int?` | Limite em **centavos**; só para `Credit`/`Checking` (RN-ACC-05) |
| `Transactions` | `ICollection<Transaction>` | Transações cuja origem é esta conta (`AccountId`) |
| `IncomingTransfers` | `ICollection<Transaction>` | Transferências cujo destino é esta conta (`DestinationAccountId`) — inverse configurado em `TransactionMap` |
| `RecurringTransactions` | `ICollection<RecurringTransaction>` | Templates recorrentes ligados à conta |
| `CreatedAt` / `UpdatedAt` | `DateTime` / `DateTime?` | De `BaseEntity`; `CreatedAt` default `now()` no banco |

> **Não há coluna de saldo.** `CurrentAmount` (nos DTOs de resposta) é sempre derivado — ver RN-ACC-04.

### Enum
`EnumAccountType` (`apps/api/FinanceControl.Shared/Enums/EnumAccountType.cs`): `Checking`, `Savings`, `Credit`, `Cash`. Serializado como string (`JsonStringEnumConverter` global).

### DTOs auxiliares (`Dtos/Others`)
- `RecentTransactionDto` — usado dentro de `GetAccountByIdResponseDto`: `Id`, `Description`, `Value` (centavos), `Type` (`EnumTransactionType`), `SubCategoryName`, `SubCategoryEmoji?`, `CategoryName`.
- `BalanceHistoryItemDto` — item da série de histórico: `Date` (`DateOnly`), `Balance` (`int`, centavos).

---

## 3. Endpoints (API)

Controller: `AccountController` — rota base `api/account`. Todos exigem `[Authorize]`.
O `userId` vem sempre do JWT (`GetUserId()`), nunca do corpo. Ids de rota validados com
`this.ValidatePositiveId(id, "id")`.

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `POST` | `/api/account` | Cria conta (+ saldo inicial opcional) | `201 Created` com a **lista** de contas | `400` validação |
| `GET` | `/api/account` | Lista contas do usuário (exclui `IsSystem`), com `CurrentAmount` | `200` array | — |
| `GET` | `/api/account/{id}` | Detalhe + 5 transações recentes | `200` `GetAccountByIdResponseDto` | `404` not found / `400` id inválido |
| `PATCH` | `/api/account/{id}` | Atualiza conta (+ ajuste de saldo opcional) | `200` com a **lista** de contas | `404` not found / `400` validação/id |
| `GET` | `/api/account/{id}/balance-history` | Série diária de saldo (query `days`, default 30) | `200` `BalanceHistoryItemDto[]` | `404` not found / `400` id inválido |
| `DELETE` | `/api/account/{id}` | Remove conta (e cascateia transações) | `200` com a **lista** de contas | `404` not found / `400` id inválido |

> Operações de mutação (create/update/delete) retornam **a lista completa e atualizada** de contas
> (padrão do backend), e o front usa isso para atualizar o cache via `setQueryData`.

### Request — `CreateAccountRequestDto`
```
Name             : string
Type             : EnumAccountType
GoalAmount       : int?            // centavos, opcional
IsDefaultAccount : bool = true     // default no DTO é true
BillingDueDay    : int?            // 1..31, obrigatório se Credit/Checking
CreditLimit      : int?            // centavos, > 0, obrigatório se Credit/Checking
InitialBalance   : int?            // centavos; se != 0 vira uma Transaction (RN-ACC-03)
```

### Request — `UpdateAccountRequestDto`
```
Id               : int             // preenchido pelo controller a partir da rota
Name             : string
Type             : EnumAccountType
GoalAmount       : int?            // centavos
IsDefaultAccount : bool
BillingDueDay    : int?            // 1..31, obrigatório se Credit/Checking
CreditLimit      : int?            // centavos, > 0, obrigatório se Credit/Checking
NewBalance       : int?            // centavos; se presente, gera transação de ajuste (RN-ACC-08)
```

### Request — `DeleteAccountRequestDto`
```
Password : string = ""             // ENVIADO pelo front, mas NÃO lido/validado no backend (ver G1)
```

### Response — `GetAccountItemResponseDto` (item da lista)
```
Id, Name, Type, CurrentAmount (int, centavos, derivado),
IsDefaultAccount (bool), CreditLimit (int?)
```
> Note que **não** traz `GoalAmount`, `BillingDueDay` nem `IsSystem`.

### Response — `GetAccountByIdResponseDto` (detalhe)
```
Id, Name, Type, CurrentAmount (int, centavos, derivado),
GoalAmount (int?), IsDefaultAccount (bool), BillingDueDay (int?), CreditLimit (int?),
RecentTransactions : RecentTransactionDto[]   // até 5, mais recentes
```

### Response — `BalanceHistoryItemDto[]`
```
[ { Date : DateOnly, Balance : int }, ... ]   // um item por dia no intervalo [cutoff..hoje]
```

---

## 4. Regras de negócio

### RN-ACC-01 — Valores em centavos
`GoalAmount`, `CreditLimit`, `InitialBalance`, `NewBalance`, `CurrentAmount`, `Balance` e `Value`
(das transações recentes) são todos `int` em **centavos**. O front divide por 100 para exibir e
multiplica por 100 (via `Math.round(parseFloat(x) * 100)`) ao enviar. Nunca float/decimal para dinheiro.

### RN-ACC-02 — Conta padrão única (`IsDefaultAccount`)
No **create** (`CreateAccountAsync`):
- Se o usuário **não tem nenhuma conta** ainda, a nova conta é forçada a `IsDefaultAccount = true`
  (ignora o que veio no DTO).
- Caso contrário, se a nova conta vem com `IsDefaultAccount = true`, a conta padrão atual é
  rebaixada para `false` antes de salvar.

No **update** (`UpdateAccountAsync`): `IsDefaultAccount` é gravado diretamente do DTO, **sem**
rebaixar a conta padrão anterior nem garantir unicidade (ver gap G2). O `SetDefaultAccountModal`
do front depende dessa rota para "promover" uma conta.

### RN-ACC-03 — Saldo inicial vira transação (create)
Se `InitialBalance` tem valor e é `!= 0`, o service procura a subcategoria do usuário chamada
`"Other income"` **ou** `"Outras receitas"` e cria uma `Transaction` `OneTime` com
`Description = "Initial balance"`, `Value = |InitialBalance|`, `Type = Income` se positivo /
`Expense` se negativo, `TransactionDate = hoje (UTC)`. Se a subcategoria não existir, **nenhuma
transação é criada** (o saldo inicial é silenciosamente ignorado — ver gap G3).

### RN-ACC-04 — Saldo derivado (`CurrentAmount`), nunca armazenado
O saldo é sempre computado a partir das transações. Para uma conta `a`:
```
CurrentAmount =
    Σ (transações com AccountId == a)        // "outbound"
        Income   → +Value
        Expense  → -Value
        Transfer → -Value                    // perna de saída
  + Σ (transações com DestinationAccountId == a && Type == Transfer)  // "inbound"
        → +Value
```
- Em `GetAllAccountAsync` o cálculo é uma subconsulta dentro do `Select` (executada no banco).
- Em `GetAccountByIdAsync` e no ajuste de saldo do update, são duas queries (`outbound` + `inbound`)
  e o inbound usa `Sum((int?)Value) ?? 0` para tolerar conjunto vazio.
- **Observação:** no cálculo de `GetAllAccountAsync`, o `else` final do ternário é `0`; em
  `GetAccountByIdAsync`/update, o ramo "não Income/não Expense" assume `-Value` (i.e. trata
  qualquer outro tipo como saída). Para os enums atuais (`Income`/`Expense`/`Transfer`) os dois
  caminhos coincidem, porque a perna inbound da transferência é somada à parte separadamente.

### RN-ACC-05 — Campos de crédito só para `Credit`/`Checking`
Tanto no service quanto nos validators, `BillingDueDay` e `CreditLimit` só fazem sentido quando
`Type ∈ { Credit, Checking }`:
- **Service** (`CreateAccountAsync`/`UpdateAccountAsync`): `hasCreditFields = Type == Credit || Type == Checking`. Se falso, grava `BillingDueDay = null` e `CreditLimit = null` (ignora o que veio no DTO — confirmado pelo teste `CreateAccount_NonCreditType_CreditFieldsAreNull`).
- **Validators** (`CreateAccountValidator` / `UpdateAccountValidator`, idênticos):
  - Quando `Credit`/`Checking`: `CreditLimit` `NotNull` e `> 0`; `BillingDueDay` `NotNull` e `InclusiveBetween(1, 31)`.
  - Quando **não** `Credit`/`Checking`: `CreditLimit` e `BillingDueDay` devem ser `Null` (senão falha).
  - `Name` sempre `NotEmpty`.

> Consequência: para **Checking**, o backend **exige** `CreditLimit` e `BillingDueDay`. O front do
> `AccountDrawer` (componente em uso) trata só `Credit` como "campos de crédito" — divergência G4.

### RN-ACC-06 — Listagens excluem contas de sistema (`IsSystem`)
`GetAllAccountAsync`, `GetAccountByIdAsync` e `GetBalanceHistoryAsync` filtram `&& !a.IsSystem`.
Contas virtuais usadas por Goals nunca aparecem nessas leituras. `UpdateAccountAsync` e
`DeleteAccountByIdAsync` **não** filtram por `IsSystem` (buscam só por `UserId` + `Id`) — ver gap G6.

### RN-ACC-07 — Ordenação e escopo por usuário
`GetAllAccountAsync` ordena por `Name` (`OrderBy(a => a.Name)`). Toda query é escopada por
`UserId` (ownership). `GetAccountByIdAsync` retorna `null` se não achar a conta do usuário → o
controller responde `404 { error = "Account not found." }`.

### RN-ACC-08 — Ajuste de saldo vira transação (update)
Se `NewBalance` tem valor, o service recalcula o saldo atual (mesma fórmula da RN-ACC-04),
calcula `diff = NewBalance - currentBalance` e, se `diff != 0`, cria uma `Transaction` `OneTime`
com `Description = "Balance adjustment"`, `Value = |diff|`:
- `diff > 0` → `Type = Income`, subcategoria `"Other income"` / `"Outras receitas"`.
- `diff < 0` → `Type = Expense`, subcategoria `"Other expense"` / `"Outras despesas"`.
Se a subcategoria correspondente não existir, o ajuste é silenciosamente ignorado (mesmo padrão da
RN-ACC-03 — gap G3).

### RN-ACC-09 — Histórico de saldo (`balance-history`)
`GetBalanceHistoryAsync(accountId, userId, days = 30)`:
- `cutoff = hoje(UTC) - (days - 1)` → janela inclui hoje, totalizando `days` dias.
- Carrega outbound (por `AccountId`) e inbound (transferências por `DestinationAccountId`) em memória.
- `baseBalance` = soma de **todos os deltas anteriores** ao `cutoff` (saldo de abertura da janela).
- Agrupa os deltas dentro da janela por `TransactionDate` e percorre dia a dia de `cutoff` até
  `hoje`, acumulando (`running += delta`), emitindo um `BalanceHistoryItemDto` por dia (saldo de
  fechamento daquele dia). Dias sem movimento repetem o saldo anterior.
- `days` não é validado/clampado (ver gap G7). Retorna `null` se a conta não existir / for `IsSystem` → `404`.

### RN-ACC-10 — Delete cascateia transações
`DeleteAccountByIdAsync` remove a `Account` (`_context.Remove`). O mapping `AccountMap` configura a
FK `User → Account` com `OnDelete(Cascade)`; as transações vinculadas à conta são removidas por
cascade no banco (a UI avisa: "irá remover todas as transações vinculadas"). **A senha enviada pelo
front não é verificada** (ver gap G1).

---

## 5. Front (Web)

- **Rota:** `/accounts` → `app/(app)/accounts/page.tsx` (re-export de uma linha) → `features/accounts/AccountsPage.tsx`.
- **Página:** `AccountsPage.tsx` concentra layout, hero, grid de cards, drawer e modais; o cabeçalho
  ("Contas" + contagem) é inline (não usa `AccountsHeader`, que está órfão — G8).
- **Header de página:** `usePageNova("Nova conta", ...)` registra o CTA global "Nova conta" que abre o drawer em modo `create`.

### API client — `lib/api/accounts.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getAll()` | `GET /account` | principal — alimenta a lista |
| `getById(id)` | `GET /account/{id}` | retorna `AccountDetail`; **sem consumidor** no front (G9) |
| `create(data)` | `POST /account` | retorna `AccountItem[]` (lista atualizada) |
| `update(id, data)` | `PATCH /account/{id}` | retorna `AccountItem[]` |
| `delete(id, data)` | `DELETE /account/{id}` | envia `{ password }` no corpo; retorna `AccountItem[]` |
| `getBalanceHistory(id, days=30)` | `GET /account/{id}/balance-history` | retorna `BalanceHistoryItem[]`; **sem consumidor** no front (G9) |

### Hooks — `features/accounts/hooks/useAccounts.ts`
- `useAccounts()` — query principal (`["accounts"]`, `staleTime 60s`).
- `useCreateAccount` / `useUpdateAccount` / `useDeleteAccount` — mutations; `onSuccess` faz
  `setQueryData(["accounts"], updated)` (segue o padrão do `web/CLAUDE.md`, diferente do gap de
  Transactions).
- `useBalanceHistory(accountId, days=30)` — query (`enabled: accountId > 0`); **definida mas não
  usada** por nenhum componente (G9).

### Tipos — `lib/types/accounts.types.ts`
`AccountType` (`"Checking" | "Savings" | "Credit" | "Cash"`), `AccountItem`, `AccountDetail`,
`CreateAccountRequest`, `UpdateAccountRequest`, `DeleteAccountRequest`, `BalanceHistoryItem`.
> `AccountDetail` no front **não** inclui `recentTransactions`, embora o backend retorne — ver G5/G9.

### Config — `lib/config/accountTypes.ts`
`ACCOUNT_TYPE_CONFIG`: por tipo, `{ label (pt-BR), color, Icon (Lucide) }`:
`Checking`→Landmark/azul, `Savings`→PiggyBank/verde, `Credit`→CreditCard/roxo, `Cash`→Banknote/amarelo.
(Decisão de produto: V1 usa ícones Lucide por tipo; V2 migra para SVGs de banco — ver `web/CLAUDE.md`.)

### Componentes
**Em uso (via `AccountsPage`):**
- `AccountDrawer` — drawer lateral com três modos (`create` / `detail` / `edit`); contém `CreateForm`,
  `EditForm` e `DetailView` internos. `CREDIT_TYPES = ["Credit"]` (só crédito mostra limite/vencimento — G4).
- `AccountCard` — card por conta: ícone/tipo, badge "Manual"/"Conectado" (hardcoded `isConnected=false`),
  saldo (ou "Fatura atual" para crédito), barra de uso de limite, ações editar/excluir, toggle de conta padrão.
- `AccountsNetWorthHero` — três `StatCard`: Patrimônio Líquido, Fatura Atual, Limite Disponível.
- `AccountsEmptyState` — vazio.
- `DeleteAccountModal` — pede senha (campo obrigatório no front) e chama `delete`.
- `SetDefaultAccountModal` — promove conta a padrão via `update` (`isDefaultAccount: true`).

**Órfãos / legados (sem import em nenhum lugar — G8):**
- `CreateAccountModal`, `EditAccountModal` (versões em `Dialog`, substituídas pelo `AccountDrawer`).
  Nessas versões `CREDIT_TYPES = ["Credit", "Checking"]` (alinhado ao backend) — divergem do drawer ativo.
- `AccountsHeader` (cabeçalho substituído pelo inline + `usePageNova`).

### UI / cálculos derivados no front (`AccountsPage`)
- `netWorth` = Σ `currentAmount` das contas **não-Credit**.
- `totalInvoice` = Σ `|currentAmount|` das contas Credit.
- `totalCreditAvailable` = Σ `(creditLimit - |currentAmount|)` das contas Credit com `creditLimit`.
- Cartão de crédito: saldo exibido como "Fatura atual"; barra de limite com cores por faixa
  (≥90% vermelho, ≥70% laranja, senão roxo).
- Bloco "Open Finance" é um **placeholder V2** ("Em breve", bancos hardcoded, sem ação).

### Formulários (create/edit no `AccountDrawer`)
- Zod (`zod/v4`) com `superRefine`: para tipo em `CREDIT_TYPES` (=`["Credit"]`), exige `billingDueDay`
  (1..31) e `creditLimit`.
- Conversão centavos no submit (`Math.round(parseFloat(x) * 100)`); campos vazios viram `null`.
- **Create:** envia `initialBalance`. **Edit:** envia `newBalance` (mostra preview da transação que
  será criada: "receita"/"despesa"). No edit, `creditLimit` é pré-preenchido de
  `account.creditLimit / 100`; `goalAmount` **não** é pré-preenchido (sempre começa vazio — G5).

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Primeira conta do usuário sempre vira padrão, mesmo com `IsDefaultAccount=false` (RN-ACC-02; teste `CreateAccount_FirstAccount_AutoSetAsDefault`).
- Segunda conta como padrão rebaixa a anterior (teste `CreateAccount_SecondAccountAsDefault_PreviousDefaultLosesDefault`).
- Conta sem transações → `CurrentAmount = 0` (teste `..._NoTransactions_BalanceIsZero`).
- Income +, Expense − no saldo (teste `..._IncomePositiveExpenseNegative`).
- Campos de crédito em tipo não-crédito são zerados pelo service e barrados pelos validators (testes de service e de validator).
- `balance-history`: dias sem movimento mantêm o saldo; `baseBalance` cobre movimento anterior à janela.

### Gaps / dúvidas a confirmar
- **G1 — Senha no delete não é verificada (frontend ⇄ backend):** o front envia `DeleteAccountRequestDto { password }` no corpo do `DELETE`, e a UI bloqueia o botão sem senha. Porém `AccountController.DeleteAccountByIdAsync([FromRoute] int id)` **não tem parâmetro de corpo** e `DeleteAccountByIdAsync(id, userId)` **não valida senha alguma**. Ou seja, a confirmação por senha é puramente cosmética no servidor. **Confirmar se a verificação de senha deve ser implementada na API** (alto risco de segurança/UX: usuário acha que está protegido).
- **G2 — Update não garante conta padrão única:** diferente do create, `UpdateAccountAsync` grava `IsDefaultAccount` direto do DTO sem rebaixar a padrão anterior. Promover uma conta via `SetDefaultAccountModal` pode resultar em **duas contas padrão** simultâneas (ou nenhuma, se desmarcar a única). **Confirmar regra esperada e centralizar a unicidade.**
- **G3 — Saldo inicial / ajuste silenciosamente ignorados:** em `CreateAccountAsync` (InitialBalance) e `UpdateAccountAsync` (NewBalance), se a subcategoria `"Other income/expense"`/`"Outras receitas/despesas"` não existir para o usuário, **nenhuma transação é criada e nenhum erro é retornado** — o saldo informado é perdido silenciosamente. Depende do seed de subcategorias. **Confirmar fallback/erro explícito.**
- **G4 — `Checking` exige campos de crédito no backend, mas o drawer ativo não os mostra:** validators e service tratam `Credit || Checking` como contas com `CreditLimit`/`BillingDueDay`; para `Checking` esses campos são **obrigatórios** (`NotNull`). O componente em uso (`AccountDrawer`) usa `CREDIT_TYPES = ["Credit"]`, então ao criar/editar uma conta `Checking` **não envia** esses campos → a API rejeita com `400` ("CreditLimit is required for Credit/Checking accounts."). Já os componentes órfãos (`CreateAccountModal`/`EditAccountModal`) usavam `["Credit", "Checking"]`. **Confirmar se `Checking` realmente deve ter limite/vencimento; alinhar front e validators.**
- **G5 — `GoalAmount` aceito mas mal exposto/preenchido:** `GoalAmount` é gravado em create/update e retornado **apenas** em `GetAccountByIdResponseDto` (não em `GetAccountItemResponseDto`, que é o único usado pelo front). No edit, o campo "Meta de saldo" **nunca é pré-preenchido** (começa vazio), então salvar o form **sobrescreve `GoalAmount` para `null`** silenciosamente. `AccountDetail` (TS) sequer lê o valor. **Confirmar se a meta de saldo é funcionalidade ativa ou resíduo.**
- **G6 — Update/Delete não filtram `IsSystem`:** `UpdateAccountAsync` e `DeleteAccountByIdAsync` buscam só por `UserId` + `Id`, sem `!IsSystem`. Em tese uma conta virtual de Goal poderia ser editada/excluída por id (apesar de não aparecer nas listagens). **Confirmar se contas de sistema devem ser imutáveis por esses endpoints.**
- **G7 — `days` do balance-history sem validação:** o parâmetro é só `[FromQuery] int days = 30`, sem clamp/limite superior. Valores grandes podem materializar listas longas em memória; `days <= 0` produziria janela degenerada. **Confirmar limites.**
- **G8 — Componentes órfãos:** `CreateAccountModal`, `EditAccountModal` e `AccountsHeader` não são importados por nenhum arquivo — substituídos por `AccountDrawer` e cabeçalho inline. Candidatos a remoção (tech debt). (`EditAccountModal` ainda passa um prop `items` ao `Select` que os demais não usam.)
- **G9 — `getById` / `balance-history` sem consumidor no front:** `accountsApi.getById`, o tipo `AccountDetail`, `RecentTransactions` e o hook `useBalanceHistory` existem mas **nenhuma tela os consome**. A tela de detalhe (`AccountDrawer` modo `detail`) usa apenas o `AccountItem` já em cache (não busca detalhe nem histórico). **Confirmar se a tela de detalhe/gráfico de saldo está pendente de implementação.**

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/AccountController.cs`
- `FinanceControl.WebApi/Controllers/Base/BaseController.cs` (`GetUserId()`)
- `FinanceControl.Services/Services/AccountService.cs`
- `FinanceControl.Services/Validations/CreateAccountValidator.cs`, `UpdateAccountValidator.cs`
- `FinanceControl.Domain/Entities/Account.cs`
- `FinanceControl.Domain/Interfaces/Services/IAccountService.cs`
- `FinanceControl.Data/Mappings/AccountMap.cs` (FK `User`→`Account` cascade; `Type` como string)
- `FinanceControl.Shared/Enums/EnumAccountType.cs`
- `FinanceControl.Shared/Dtos/Request/CreateAccountRequestDto.cs`, `UpdateAccountRequestDto.cs`, `DeleteAccountRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/GetAccountItemResponseDto.cs`, `GetAccountByIdResponseDto.cs`
- `FinanceControl.Shared/Dtos/Others/RecentTransactionDto.cs`, `BalanceHistoryItemDto.cs`
- `FinanceControl.Tests/Unit/AccountServiceTests.cs`, `Unit/Validators/AccountValidatorTests.cs`

**Web**
- `app/(app)/accounts/page.tsx` (re-export)
- `features/accounts/AccountsPage.tsx`
- `features/accounts/hooks/useAccounts.ts`
- `features/accounts/components/AccountDrawer.tsx`, `AccountCard.tsx`, `AccountsNetWorthHero.tsx`, `AccountsEmptyState.tsx`, `DeleteAccountModal.tsx`, `SetDefaultAccountModal.tsx`
- `features/accounts/components/CreateAccountModal.tsx`, `EditAccountModal.tsx`, `AccountsHeader.tsx` _(órfãos — G8)_
- `lib/api/accounts.ts`
- `lib/types/accounts.types.ts`
- `lib/config/accountTypes.ts`
