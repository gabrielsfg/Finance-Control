# Spec: Recurrences

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Superfície de gestão de compromissos mensais — assinaturas recorrentes (`RecurringTransaction`) e parcelamentos (`Transaction` Installment) numa visão unificada, com totalizadores de comprometimento da renda.

---

## 1. Visão geral

Recurrences é a **tela de gestão** dos compromissos financeiros que se repetem: assinaturas recorrentes
(Netflix, aluguel, salário…) e parcelamentos (compras divididas em N vezes). Não é onde eles nascem — é
onde o usuário os **acompanha, edita, cancela, reativa e remove**, e onde vê quanto da renda mensal já
está comprometido.

A página combina, numa única resposta de API (`GET /api/recurrences`), três coisas:

- **Recorrências** (`RecurringTransaction`) — os templates, ativos e cancelados.
- **Parcelamentos** (transações "pai" `PaymentType == Installment`, com sumário de progresso pago/restante).
- **Totalizadores** — comprometimento mensal de assinaturas + parcelamentos, contagens de ativos e a
  renda mensal do orçamento ativo (para calcular o % comprometido).

Responsabilidades **fora** deste spec:

- **Criação de uma recorrência a partir do formulário de transação** e a mecânica de centavos/parcelas
  (split do resto na 1ª parcela, transação pai/filha) → `specs/transactions.md`.
  > A criação da recorrência **também** tem um endpoint próprio aqui (`POST /api/recurrences/recurring`),
  > documentado na seção 3. O parcelamento, porém, é sempre criado pelo fluxo de Transactions —
  > inclusive quando disparado pelo botão "Parcelamento" desta tela (ver seção 5).
- **Geração das ocorrências recorrentes ao longo do tempo** (job diário, catch-up, idempotência) →
  `specs/background-jobs.md`. **Esta** chamada de criação grava apenas o template + a 1ª transação na
  `StartDate`; as demais nascem no job.
- **Saldo das contas** afetado pelas transações geradas → `specs/accounts.md`.

---

## 2. Entidades

### `RecurringTransaction` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/RecurringTransaction.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`) |
| `BudgetId` | `int?` | Preenchido só se incluída no orçamento ativo na criação |
| `SubCategoryId` | `int` | Obrigatório |
| `AccountId` | `int` | Conta vinculada |
| `Value` | `int` | **Centavos** (R$ 50,00 → `5000`). Nunca float |
| `Type` | `EnumTransactionType` | `Expense` / `Income` / `Transfer` (UI só usa `Expense`/`Income`) |
| `Description` | `string` | Texto livre |
| `Recurrence` | `EnumRecurrenceType` | Frequência (ver enum abaixo) |
| `StartDate` | `DateOnly` | Data da 1ª ocorrência |
| `EndDate` | `DateOnly?` | Data de encerramento (opcional); também setada no cancel |
| `IsActive` | `bool` | Default `true`; `false` quando cancelada |
| `Budget` | `Budget?` | Navegação |
| `SubCategory` | `SubCategory` | Navegação |
| `Account` | `Account` | Navegação |
| `Transactions` | `ICollection<Transaction>` | Ocorrências geradas (1:N via `Transaction.RecurringTransactionId`) |

### `Transaction` como parcelamento (lado deste spec)

Esta tela **não** define a entidade `Transaction` (ver `specs/transactions.md`), mas consome as transações
"pai" de parcelamento: `PaymentType == Installment`, `ParentTransactionId == null`, `TotalInstallments != null`.
O progresso é derivado da navegação `Transaction.Installments` (as parcelas-filhas, `ParentTransactionId == pai.Id`):

- `PaidInstallments = Installments.Count + 1` (filhas + a própria pai).
- `RemainingInstallments = max(0, TotalInstallments - PaidInstallments)`.

> **Importante:** "paga" aqui significa **gerada/registrada como transação**, não necessariamente
> liquidada/conciliada. As filhas de parcelamento são todas criadas de uma vez no ato (ver `specs/transactions.md`,
> RN-TX-05) — então `PaidInstallments` reflete quantas parcelas já existem como `Transaction`, não um status
> de pagamento real. Ver gap G6.

### Enum `EnumRecurrenceType`
`None`, `Daily`, `WorkDay`, `Weekly`, `Biweekly`, `Monthly`, `Quarterly`, `Semiannually`, `Annually`

> `None` é rejeitado na criação (RN-REC-02). A UI só lista de `Daily` a `Annually`.

---

## 3. Endpoints (API)

Controller: `RecurrenceController` — rota base **`api/recurrences`**. Todos exigem `[Authorize]`.
O `userId` vem sempre do JWT (`GetUserId()`), nunca do corpo. O service é `IRecurrencePageService`
(registrado `Scoped` em `ServicesExtensions`).

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `GET` | `/api/recurrences` | Visão unificada: recorrentes + parcelamentos + totalizadores | `200` `RecurrencePageResponseDto` | — |
| `POST` | `/api/recurrences/recurring` | Cria recorrência + 1ª transação na `StartDate` | `201 Created` `RecurringTransactionResponseDto` | `400` validação |
| `PATCH` | `/api/recurrences/recurring/{id}` | Atualiza recorrência (campos editáveis) | `200` `RecurringTransactionResponseDto` | `400` · `404` |
| `PATCH` | `/api/recurrences/recurring/{id}/cancel` | Desativa (`IsActive = false`, `EndDate = hoje`) | `204 No Content` | `404` (inclui "já inativa") |
| `PATCH` | `/api/recurrences/recurring/{id}/reactivate` | Reativa (`IsActive = true`, `EndDate = null`) | `200` `RecurringTransactionResponseDto` | `404` (inclui "já ativa") |
| `DELETE` | `/api/recurrences/recurring/{id}` | Remove o template; desvincula transações geradas | `204 No Content` | `404` |

> **Nota:** não há endpoint para criar/editar/excluir **parcelamento** neste controller — isso é feito via
> `TransactionController` (`specs/transactions.md`). Aqui só existem recorrências.
> O erro em cancel/reactivate/delete é sempre mapeado para `404 NotFound` com `{ message }`, mesmo quando a
> causa é de estado ("already inactive"/"already active"), não de não-existência — ver gap G5.

### Request — `CreateRecurringTransactionRequestDto`
```
SubCategoryId   : int
AccountId       : int
Value           : int                 // centavos, > 0
Type            : EnumTransactionType
Description     : string              // obrigatório
Recurrence      : EnumRecurrenceType  // != None
StartDate       : DateOnly
EndDate         : DateOnly?           // opcional; se presente, > StartDate
IncludeInBudget : bool
```

### Request — `UpdateRecurringTransactionRequestDto`
```
BudgetId      : int?       // presente no DTO mas IGNORADO pelo service (ver G2)
SubCategoryId : int        // só aplicado se > 0
AccountId     : int        // só aplicado se > 0
Value         : int        // só aplicado se > 0
Description   : string     // só aplicado se != null
EndDate       : DateOnly?  // só aplicado se HasValue
```

> O update é um **patch parcial implícito**: cada campo só é gravado se passar de um teste de "preenchido"
> (`> 0` para ints, `!= null` para `Description`, `HasValue` para `EndDate`). Não há como, por este endpoint,
> **limpar** o `EndDate` (voltar para `null`) nem trocar `Recurrence`/`Type`/`StartDate`. Ver G2 e G3.

### Response — `RecurringTransactionResponseDto`
```
Id, SubCategoryId, SubCategoryName, SubCategoryEmoji?,
CategoryId, CategoryName, CategoryColor?,
AccountId, AccountName,
Value, Type, Description, Recurrence,
StartDate, EndDate?, IsActive, CreatedAt, UpdatedAt?
```

### Response — `InstallmentSummaryResponseDto`
```
Id, SubCategoryId, SubCategoryName, SubCategoryEmoji?,
CategoryId, CategoryName, CategoryColor?,
AccountId, AccountName,
Value,                      // valor de uma parcela (centavos)
TotalValue,                 // Value * TotalInstallments
Type, Description, TransactionDate,
TotalInstallments, PaidInstallments, RemainingInstallments,
RemainingAmount,            // RemainingInstallments * Value
PaymentMethod?
```

### Response — `RecurrencePageResponseDto`
```
TotalMonthlyAmount        : int    // SubscriptionMonthlyAmount + InstallmentMonthlyAmount
SubscriptionMonthlyAmount : int    // soma das recorrências ATIVAS normalizadas p/ mês (gross)
InstallmentMonthlyAmount  : int    // soma das parcelas ainda em aberto (Value de cada pai aberto)
ActiveRecurringCount      : int
ActiveInstallmentCount    : int
MonthlyIncome             : int    // renda alocada no orçamento ativo (centavos)
Recurring                 : RecurringTransactionResponseDto[]
Installments              : InstallmentSummaryResponseDto[]
```

> A resposta carrega **todas** as recorrências (ativas e canceladas) e **todos** os parcelamentos
> (em aberto e quitados). O filtro por período/categoria/conta é 100% client-side (seção 5).

---

## 4. Regras de negócio

### RN-REC-01 — Valores em centavos
`Value`, `TotalValue`, `RemainingAmount`, `*MonthlyAmount`, `MonthlyIncome` são todos `int` em centavos,
na entidade, nos DTOs e no tráfego. O front divide por 100 para exibir e multiplica por 100 ao enviar.

### RN-REC-02 — Validação de criação (`CreateRecurringTransactionValidator`)
- `Description` não vazio.
- `Value > 0`.
- `SubCategoryId > 0`, `AccountId > 0`.
- `Recurrence != None`.
- Se `EndDate` presente: `EndDate > StartDate`.

> Não há, no validator de criação, regra de que `SubCategoryId`/`AccountId` **pertençam ao usuário**. O
> service também **não** valida ownership desses FKs (só escopa as próprias `RecurringTransactions` por
> `UserId`). Ver G7.

### RN-REC-03 — Criação grava template + 1ª transação (`CreateRecurringAsync`)
1. Se `IncludeInBudget == true`, busca o **orçamento ativo** (`IsActive && UserId == userId`) e usa seu `Id`
   como `BudgetId`; se não houver, `BudgetId` fica `null` (silenciosamente — **não** falha, diferente de
   Transactions/RN-TX-04). Ver G8.
2. Insere o `RecurringTransaction` (`IsActive = true`, `StartDate`/`EndDate` do DTO) e salva.
3. Insere **uma** `Transaction` com `RecurringTransactionId = rt.Id`, `TransactionDate = StartDate`,
   `PaymentType = Recurring`, copiando `Value`/`Type`/`Description`/`SubCategoryId`/`AccountId`/`BudgetId`.
4. As próximas ocorrências são geradas pelo **job diário** — não nesta chamada (`specs/background-jobs.md`).

### RN-REC-04 — Update parcial (`UpdateRecurringAsync`)
Carrega a recorrência escopada por `UserId`; se não achar → `Result.Failure("Recurring transaction not found.")`
(→ `404`). Aplica somente os campos "preenchidos" (ver DTO na seção 3). `BudgetId` do DTO é ignorado.
`Recurrence`, `Type` e `StartDate` **não são atualizáveis** por este endpoint. Salva e devolve o DTO mapeado.

> O update altera **apenas o template** — não reprecifica nem regenera transações já criadas. Mudar o `Value`
> aqui só afeta ocorrências **futuras** geradas pelo job. Ver G6.

### RN-REC-05 — Cancelamento NÃO apaga ocorrências (`CancelRecurringAsync`)
- Se não achar → `404`. Se já `IsActive == false` → `Failure("...already inactive.")` (→ `404`).
- Caso contrário: `IsActive = false` **e** `EndDate = DateOnly.FromDateTime(DateTime.UtcNow)`.
- **Nenhuma** `Transaction` já gerada é apagada ou alterada. Cancelar só impede o job de gerar novas
  ocorrências (o job filtra por `IsActive && (EndDate == null || EndDate >= today)`, ver `specs/background-jobs.md`).
- Efeito colateral do `EndDate = hoje`: a recorrência cancelada **continua aparecendo** na lista do mês
  corrente (o filtro client-side mantém canceladas cujo `endDate >= início do mês — ver seção 5).

### RN-REC-06 — Reativação (`ReactivateRecurringAsync`)
- Se não achar → `404`. Se já `IsActive == true` → `Failure("...already active.")` (→ `404`).
- Caso contrário: `IsActive = true` **e** `EndDate = null`. Devolve o DTO.
- A retomada da geração (incluindo **catch-up** das datas perdidas enquanto estava cancelada) é
  responsabilidade do job diário — ver `specs/background-jobs.md` (RN-JOB-01). Como a idempotência do job
  é por data já existente, reativar e deixar o job rodar pode preencher meses pulados; confirmar se é o
  comportamento desejado. Ver G9.

### RN-REC-07 — Delete desvincula, não cascateia (`DeleteRecurringAsync`)
- Se não achar → `404`.
- Faz `ExecuteUpdateAsync` setando `RecurringTransactionId = null` em **todas** as `Transaction` daquela
  recorrência, e então remove o `RecurringTransaction`.
- Ou seja, as transações geradas **permanecem** no histórico (viram lançamentos avulsos órfãos do template),
  apenas perdem o vínculo. Não há `ON DELETE CASCADE` derrubando lançamentos.

### RN-REC-08 — Comprometimento mensal de assinaturas (gross, backend)
`SubscriptionMonthlyAmount = Σ round(r.Value × ToMonthlyFactor(r.Recurrence))` sobre as recorrências
**ativas**, com:

| Recurrence | Fator/mês |
|---|---|
| `Daily` | 30 |
| `WorkDay` | 22 |
| `Weekly` | 4.33 |
| `Biweekly` | 2.17 |
| `Monthly` | 1 |
| `Quarterly` | 1/3 |
| `Semiannually` | 1/6 |
| `Annually` | 1/12 |
| _(default/`None`)_ | 1 |

> Soma **bruta** e **sem sinal**: receitas e despesas entram somadas com o mesmo sinal positivo (não há
> `Income − Expense` aqui). Ver G4 sobre a divergência com o cálculo do front.

### RN-REC-09 — Comprometimento mensal de parcelamentos (backend)
`InstallmentMonthlyAmount = Σ i.Value` sobre os parcelamentos com `RemainingInstallments > 0` (em aberto).
Usa o `Value` de **uma** parcela de cada pai aberto (não o `TotalValue`, não o `RemainingAmount`).
`ActiveInstallmentCount` é a contagem desses pais em aberto.

### RN-REC-10 — Renda mensal do orçamento ativo (`MonthlyIncome`)
`MonthlyIncome = Σ ExpectedValue` de `BudgetSubcategoryAllocations` com `AllocationType == Income` cujo
`Budget.IsActive && Budget.UserId == userId`. É a soma das alocações de **receita esperada** do orçamento
ativo (ver `specs/budgets.md`/`specs/dashboard.md` para o modelo de orçamento). Serve de denominador para o
% de comprometimento exibido no front. Se não houver orçamento ativo / alocações de receita → `0`.

### RN-REC-11 — Escopo por usuário
Todas as queries do service filtram por `UserId` (recorrências, parcelamentos pai, alocações de orçamento).
Nenhum dado de outro usuário é retornado. O que **falta** é a validação de ownership dos FKs enviados na
criação/update (G7).

---

## 5. Front (Web)

- **Rota:** `/recurring` → `app/(app)/recurring/page.tsx` (re-export) → `features/recurring/RecurringPage.tsx`
  (stub de uma linha) → **`features/recurrences/RecurrencesPage.tsx`** (a página real). Item de menu
  "Recorrências" na `Sidebar` aponta para `/recurring`. **Inconsistência de nomes** documentada em G1.
- **Página:** toda a lógica em `RecurrencesPage.tsx` — estado de filtro, drawers (ver/editar/criar), diálogo
  de cancelamento, e **todos os cálculos de exibição** (net mensal, anual, próximo vencimento, barra de
  comprometimento). Usa `usePageNova("Novo", ...)` e `usePageFilter(<RecurrencesFilters/>)` para injetar o
  botão "Novo" e o filtro no header global.

### API client — `lib/api/recurrences.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getPage()` | `GET /recurrences` | principal — devolve `RecurrencePageData` |
| `createRecurring(data)` | `POST /recurrences/recurring` | devolve o `RecurringItem` criado |
| `updateRecurring(id, data)` | `PATCH /recurrences/recurring/{id}` | |
| `cancelRecurring(id)` | `PATCH /recurrences/recurring/{id}/cancel` | sem corpo de resposta |
| `reactivateRecurring(id)` | `PATCH /recurrences/recurring/{id}/reactivate` | |
| `deleteRecurring(id)` | `DELETE /recurrences/recurring/{id}` | |

### Hooks — `features/recurrences/hooks/useRecurrences.ts`
- `useRecurrencePage()` — query `["recurrences"]`.
- `useCreateRecurring` / `useUpdateRecurring` / `useCancelRecurring` / `useReactivateRecurring` /
  `useDeleteRecurring` — mutations; **todas** invalidam `["recurrences"]` no `onSuccess`.

> **Nota de convenção:** o `web/CLAUDE.md` recomenda `setQueryData` (o backend devolve o recurso atualizado).
> Aqui usa-se `invalidateQueries` — mesma divergência apontada em `specs/transactions.md` (G3 de lá). Além
> disso, `useDeleteRecurring` existe no hook mas **não é usado** por nenhum componente da página (não há UI de
> "excluir" recorrência, só "cancelar"). Ver G10.

### Edição de parcelamento usa o domínio de Transactions
- **Recorrência:** `RecurrenceEditDrawer` → `RecurringEditForm` → `useUpdateRecurring` (endpoint de recurrences).
- **Parcelamento (criar e editar):** `RecurrenceCreateDrawer`/`RecurrenceEditDrawer` → `InstallmentCreateForm`/
  `InstallmentEditForm` → `useCreateTransaction`/`useUpdateTransaction` (domínio de **Transactions**,
  `paymentType: "Installment"`). Logo, mutações de parcelamento **invalidam o cache de transactions**, e a
  invalidação de `["recurrences"]` **não** é disparada por elas — a lista de parcelamentos desta tela pode
  ficar desatualizada até um refetch da página. Ver G11.

### Cálculos de exibição (client-side, sobre o conjunto filtrado)
A `RecurrencesPage` **recomputa** quase tudo no cliente, usando os campos do backend só como apoio:

- **`subscriptionNetMonthly`** = Σ sobre recorrências filtradas **ativas** de `(type === "Income" ? +value : −value)`
  — net (receita − despesa), **sem** aplicar o `ToMonthlyFactor` do backend (usa o `value` cru, tratando tudo
  como mensal). Difere do `SubscriptionMonthlyAmount` (gross, com fator) que o backend manda. Ver G4.
- **`installmentNetMonthly`** = Σ sobre parcelamentos filtrados em aberto de `(±value)`.
- **`subscriptionAnnual`** = Σ `value × meses_decorridos × (±1)`, com `meses_decorridos = max(12, meses desde startDate)`.
- **`installmentRemainingNet`** = Σ `remainingAmount × (±1)` dos parcelamentos em aberto.
- **`nextDebit`** = menor data futura entre: cada recorrência ativa (avança `startDate` pela frequência até
  `>= hoje`; meses para Monthly/Quarterly/Semiannually/Annually, dias para o resto via tabela
  `Daily:1, WorkDay:1, Weekly:7, Biweekly:14, Monthly:30, …, Annually:365`) e cada parcelamento aberto
  (mesmo dia-do-mês de `transactionDate`, neste ou no próximo mês). Mostra "hoje"/"amanhã"/"em Nd".
- **Cards (`StatCard`):** "Assinaturas/mês" (`subscriptionNetMonthly`), "Parcelamentos/mês"
  (`installmentNetMonthly`), "Total comprometido" (`subscriptionNetMonthly + installmentNetMonthly`, com
  subtexto `% da renda mensal` = total ÷ `data.monthlyIncome`), e "Próximo vencimento".
- **Barra de comprometimento:** só aparece se `monthlyIncome > 0`. Usa `Math.abs(net)/income` para
  Assinaturas e Parcelamentos, clampando para 100% no total, e "Livre" = resto.
- **Rodapés das listas** (`totalMonthly`) usam diretamente `data.subscriptionMonthlyAmount` /
  `data.installmentMonthlyAmount` (os valores **gross** do backend) — então o rodapé "Total mensal" da lista
  pode **não bater** com o card "Assinaturas/mês" (net) acima. Ver G4.

### Filtro client-side (`RecurrenceFilter`)
- `defaultRecurrenceFilter()` inicia no mês corrente (1º ao último dia). Um `useEffect` **sincroniza o período
  com o orçamento ativo** (`useActiveBudget`) sempre que ele muda — então na prática a janela passa a ser a do
  orçamento, não a do mês civil.
- **Recorrências** entram se: `startDate <= fim do período`; e, se canceladas, só se `endDate >= início do
  período` (mantém canceladas que estiveram ativas no período). Filtro adicional por `subCategoryIds`
  (fonte da verdade; marcar uma categoria auto-marca suas subs), senão por `categoryIds`, e por `accountIds`.
- **Parcelamentos** entram se a janela `[transactionDate, transactionDate + (totalInstallments−1) meses]`
  intersecta o período. Mesmos filtros de categoria/conta.
- `typeFilter` (`All` / `Recurring` / `Installment`) controla se cada lista aparece. Em `All`, layout em 2
  colunas (`RecurringList` + `InstallmentList` compactas); em filtro único, lista expandida (tabela/cards).

### Componentes
- **Usados:** `RecurringList`, `InstallmentList` (cada um com layout compacto e expandido), `RecurrenceDrawer`
  (detalhe ver), `RecurrenceCreateDrawer` (toggle Assinatura/Parcelamento), `RecurrenceEditDrawer`,
  `CancelRecurringDialog`, `RecurrencesFilters`.
- **NÃO usados pela página atual:** `RecurrencesHeader`, `RecurringTable`, `InstallmentGrid`,
  `IncomeCommitmentCard`. São variantes mais antigas (a página monta o header e a barra de comprometimento
  inline). Código morto / a remover ou reaproveitar. Ver G12.

### Strings ao usuário
`CancelRecurringDialog` deixa explícito: *"Esta ação não cancela a assinatura no serviço — apenas remove o
rastreamento daqui."* e estima a economia anual (`value × 12`). Coerente com RN-REC-05 (não apaga histórico).

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Recorrência cancelada ainda visível no mês corrente (RN-REC-05 + filtro client-side).
- Parcelamento quitado (`remaining == 0`) exibido como "Quitado", fora das somas mensais.
- Sem renda definida (`monthlyIncome <= 0`) → card "Total comprometido" sem subtexto de % e barra de
  comprometimento oculta.
- `EndDate <= StartDate` na criação → bloqueado pelo validator.
- Recorrência sem subcategoria/conta carregada → `MapRecurring` cai em `string.Empty`/`0` (null-safe).
- Sobre-comprometimento (> 100% da renda) → barra clampa visualmente; `IncomeCommitmentCard` (não usado) até
  mostra badge "Acima da renda", mas a barra inline da página só clampa sem aviso.

### Gaps / dúvidas a confirmar
- **G1 — Inconsistência de nomes `recurring` vs `recurrences`:** a feature real vive em
  `features/recurrences/`, a API é `api/recurrences`, mas a **rota** é `/recurring` e existe um stub
  `features/recurring/RecurringPage.tsx` que só re-exporta `RecurrencesPage`. Padronizar (rota + pasta stub)
  para evitar confusão.
- **G2 — `UpdateRecurringTransactionRequestDto.BudgetId` ignorado:** o DTO de update carrega `BudgetId`, mas
  `UpdateRecurringAsync` nunca o lê — não há como mudar o orçamento de uma recorrência por este endpoint.
  Remover o campo ou implementar.
- **G3 — Campos não-editáveis no update:** `Recurrence`, `Type` e `StartDate` não podem ser alterados, e o
  `EndDate` não pode ser **limpo** (voltar a `null`) — só adiantado/postergado. A UI de edição de assinatura
  reflete isso (só edita descrição, valor, conta, categoria, encerramento). Confirmar se é intencional.
- **G4 — Comprometimento mensal: gross (backend) × net (front), e fator de frequência:** o backend calcula
  `SubscriptionMonthlyAmount` **bruto** e **com** `ToMonthlyFactor` (ex.: anual = `value/12`), somando
  receita e despesa com o mesmo sinal. O front ignora esse número nos cards e recomputa um **net**
  (`income − expense`) usando o `value` **cru** (sem fator de frequência). Resultado: (a) os cards "/mês" e o
  rodapé "Total mensal" da mesma lista podem divergir; (b) uma anuidade aparece com valor cheio nos cards do
  front mas dividido por 12 no número do backend. Definir a fonte da verdade e unificar.
- **G5 — Erros de estado mapeados como `404`:** "already inactive" (cancel) e "already active" (reactivate)
  retornam `404 NotFound`, semântica imprecisa para um conflito de estado (esperado `409`). O front trata
  qualquer erro genericamente, então não quebra, mas o contrato fica ambíguo.
- **G6 — `PaidInstallments` ≠ pagamento real:** como as parcelas-filhas são todas criadas no ato
  (`specs/transactions.md`, RN-TX-05), `PaidInstallments = Installments.Count + 1` reflete quantas transações
  **existem**, não quantas foram efetivamente liquidadas. A tela rotula como "X/N parcelas" e "Pagas" —
  confirmar se o produto quer um conceito de "pago de verdade" (ex.: por data <= hoje) em vez de "registrado".
- **G7 — Sem validação de ownership dos FKs na criação/update:** nem o validator nem o service checam que
  `SubCategoryId`/`AccountId`/(`BudgetId`) pertencem ao usuário (diferente de Transactions, RN-TX-03). Um id
  de outro usuário seria aceito. Adicionar verificação de propriedade.
- **G8 — `IncludeInBudget` sem orçamento ativo falha silenciosamente:** se `IncludeInBudget == true` e não há
  orçamento ativo, a recorrência é criada com `BudgetId = null` sem erro — divergente do fluxo de Transactions
  (RN-TX-04 retorna "No active budget found."). Hoje a UI sempre envia `includeInBudget: false`, então o caso
  não é exercido, mas o contrato fica inconsistente.
- **G9 — Catch-up após reativação:** reativar zera o `EndDate` e deixa o job retomar; pela idempotência por
  data (`specs/background-jobs.md`, RN-JOB-02), o job **pode** gerar retroativamente as ocorrências do período
  em que esteve cancelada. Confirmar se reativar deve "preencher o buraco" ou só voltar a gerar dali pra frente.
- **G10 — `useDeleteRecurring` sem UI:** o hook e o endpoint `DELETE` existem, mas nenhum componente expõe
  "excluir recorrência" (só "cancelar"). Ou falta a UI, ou o delete é só para uso administrativo/futuro.
- **G11 — Mutações de parcelamento não invalidam `["recurrences"]`:** criar/editar parcelamento por esta tela
  passa pelos hooks de Transactions, que invalidam o cache de transactions, **não** o de recurrences. A lista
  de parcelamentos da página pode mostrar dados velhos até um refetch manual. Invalidar `["recurrences"]`
  também nessas mutações (ou unificar).
- **G12 — Componentes mortos:** `RecurrencesHeader`, `RecurringTable`, `InstallmentGrid`, `IncomeCommitmentCard`
  não são importados pela página. Remover ou consolidar com os usados (`RecurringList`/`InstallmentList`/barra inline).
- **G13 — `IDbContextFactory` vs injeção direta:** `RecurrencePageService` injeta
  `IDbContextFactory<ApplicationDbContext>` e cria contexto por método, enquanto o `apps/api/CLAUDE.md` define
  o padrão de injetar `ApplicationDbContext` direto. Confirmar se é exceção intencional (provavelmente herdada
  do compartilhamento de contexto com o job/hosted service).

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/RecurrenceController.cs`
- `FinanceControl.Services/Services/RecurrencePageService.cs`
- `FinanceControl.Domain/Interfaces/Services/IRecurrencePageService.cs`
- `FinanceControl.Domain/Entities/RecurringTransaction.cs`
- `FinanceControl.Services/Validations/CreateRecurringTransactionValidator.cs`, `UpdateRecurringTransactionValidator.cs`
- `FinanceControl.Shared/Dtos/Request/CreateRecurringTransactionRequestDto.cs`, `UpdateRecurringTransactionRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/RecurrencePageResponseDto.cs` (contém também `RecurringTransactionResponseDto` e `InstallmentSummaryResponseDto`)
- `FinanceControl.Services/Extensions/ServicesExtensions.cs` (registro `Scoped`)

**Web**
- `app/(app)/recurring/page.tsx` (re-export) · `features/recurring/RecurringPage.tsx` (stub)
- `features/recurrences/RecurrencesPage.tsx`
- `features/recurrences/hooks/useRecurrences.ts`
- `features/recurrences/components/`: `RecurringList.tsx`, `InstallmentList.tsx`, `RecurrenceDrawer.tsx`,
  `RecurrenceCreateDrawer.tsx`, `RecurrenceEditDrawer.tsx`, `CancelRecurringDialog.tsx`, `RecurrencesFilters.tsx`
  (e os não usados: `RecurrencesHeader.tsx`, `RecurringTable.tsx`, `InstallmentGrid.tsx`, `IncomeCommitmentCard.tsx`)
- `lib/api/recurrences.ts`
- `lib/types/recurrences.types.ts`

**Specs relacionadas**
- `specs/transactions.md` — criação de recorrência pelo formulário de transação, mecânica de centavos/parcelas, entidade `Transaction`.
- `specs/background-jobs.md` — job diário que gera ocorrências, catch-up, idempotência (RN-JOB-01/02), filtro por `IsActive`/`EndDate`.
- `specs/budgets.md` / `specs/dashboard.md` — modelo de orçamento e `BudgetSubcategoryAllocation` (base do `MonthlyIncome`).
