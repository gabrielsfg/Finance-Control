# Spec: Dashboard / Main Page

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Página inicial (Dashboard) — agregação de leitura de múltiplas fontes num único request.

---

## 1. Visão geral

O Dashboard é a **tela inicial** do app. Ele não possui domínio próprio: é uma **camada de agregação read-only** que reúne, numa única chamada HTTP (`GET /api/mainpage/summary`), cinco recortes derivados de outros domínios:

1. **BalanceSummary** — totais de receita/despesa e saldo no período.
2. **RecentTransactions** — as 5 transações mais recentes.
3. **BudgetSummary** — execução do orçamento (esperado vs. gasto) + top 4 subcategorias.
4. **TopCategories** — top 5 categorias por gasto.
5. **SpendingPrediction** — curva acumulada de gasto do mês atual vs. média histórica dos últimos 6 meses (com detecção de despesas de data fixa).

Pontos estruturais importantes:

- O endpoint vive no `MainPageController`, mas **toda a lógica está no `TransactionService`** (métodos `GetSummaryBalanceAsync`, `GetRecentTransactionsAsync`, `GetBudgetSummaryAsync`, `GetTopCategoriesAsync`, `GetSpendingPredictionAsync`). O contrato (rota + DTOs) é do MainPage; a implementação é emprestada do domínio de transações.
- As cinco agregações rodam **em paralelo** (`Task.WhenAll`), cada uma com sua própria conexão (`IDbContextFactory`) — ver RN-DASH-02.
- O Dashboard lê `Transaction`, `Budget`, `BudgetSubcategoryAllocation`, `SubCategory` e `Category`. Nenhuma dessas entidades é definida aqui.

Responsabilidades **fora** deste spec:
- Modelo de `Transaction` (campos, tipos, parcelamento, recorrência) → `specs/transactions.md`.
- Modelo de `Budget` / `Area` / `BudgetSubcategoryAllocation` (esperado vs. gasto por subcategoria) → **não há `specs/budgets.md` ainda** (ver gap G7); por ora a estrutura é descrita inline onde necessário.
- Gráfico "Evolução Mensal" e cartão "Próximas contas a pagar" da página — **não** vêm deste endpoint (ver Front, seção 5, e gaps G4/G5).

---

## 2. Entidades

**O Dashboard não tem entidades próprias.** Ele apenas **lê** entidades de outros domínios (`Transaction`, `Budget`, `BudgetSubcategoryAllocation`, `SubCategory`, `Category`) e monta DTOs de resposta. Não há tabela, `DbSet`, mapping nem migration associados a esta feature.

O que ele "define" são os **DTOs de resposta** (todos em `FinanceControl.Shared/Dtos/Others/`, exceto o envelope em `Dtos/Response/` e o filtro em `Dtos/Request/`). Como são valores agregados, todos usam **centavos (`int`)** para dinheiro, seguindo a regra global (ver `specs/transactions.md` RN-TX-01).

### `MainPageSummaryRequestDto` (`Dtos/Request/`)
Filtro interno montado pelo controller a partir da query string + `userId` do JWT.

| Campo | Tipo | Notas |
|---|---|---|
| `BudgetId` | `int?` | Opcional; filtra todas as agregações por orçamento |
| `StartDate` | `DateOnly` | Início da janela (inclusivo) |
| `FinishDate` | `DateOnly` | Fim da janela (inclusivo) |
| `UserId` | `int` | Vem do JWT, **nunca** do cliente |

### `MainPageSummaryResponseDto` (`Dtos/Response/`)
Envelope retornado pelo endpoint.

| Campo | Tipo | Notas |
|---|---|---|
| `BalanceSummary` | `BalanceSummaryDto` | Sempre presente (objeto vazio se sem dados) |
| `RecentTransactions` | `List<RecentTransactionDto>` | Até 5 itens |
| `BudgetSummary` | `BudgetSummaryDto?` | **Null** se o usuário não tem orçamento (ou o `budgetId` não bate) |
| `TopCategories` | `List<TopCategoryItemDto>` | Até 5 itens |
| `SpendingPrediction` | `List<SpendingPredictionItemDto>` | Um item por dia do mês atual |

### `BalanceSummaryDto` (`Dtos/Others/`)
| Campo | Tipo | Notas |
|---|---|---|
| `TotalIncome` | `int` | Soma de `Income` no período (centavos) |
| `TotalExpenses` | `int` | Soma de `Expense` no período (centavos) |
| `Balance` | `int` | `TotalIncome - TotalExpenses` (calculado no service) |

> Não há `netWorth` nem campos de variação (`*Change`/`previous*`) no backend — o tipo do front espera vários deles (ver gaps G1, G2).

### `RecentTransactionDto` (`Dtos/Others/`)
| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | |
| `Description` | `string` | |
| `Value` | `int` | Centavos |
| `Type` | `EnumTransactionType` | `Expense` / `Income` / `Transfer` (serializado como string) |
| `SubCategoryName` | `string` | |
| `SubCategoryEmoji` | `string?` | |
| `CategoryName` | `string` | Nome da categoria-pai |

> Não há `isRecurring`/`isAutomatic` no backend — o front espera ambos (ver gap G3).

### `BudgetSummaryDto` (`Dtos/Others/`)
| Campo | Tipo | Notas |
|---|---|---|
| `TotalExpected` | `int` | Soma das alocações de tipo `Expense` (centavos) |
| `TotalSpent` | `int` | Soma das despesas no período (centavos) |
| `SpentPercentage` | `decimal` | `TotalSpent / TotalExpected * 100`, arredondado a 2 casas; `0` se `TotalExpected == 0` |
| `HasAllocations` | `bool` | `true` se existe ao menos uma `BudgetSubcategoryAllocation` |
| `TopSubCategories` | `List<BudgetSubCategorySummaryDto>` | Até 4 itens, ordenados por `Spent` desc |

### `BudgetSubCategorySummaryDto` (mesmo arquivo de `BudgetSummaryDto`)
> Exceção à regra "uma classe por arquivo" do backend: `BudgetSubCategorySummaryDto` está no **mesmo arquivo** que `BudgetSummaryDto` (ver gap G8).

| Campo | Tipo | Notas |
|---|---|---|
| `SubCategoryName` | `string` | |
| `SubCategoryEmoji` | `string?` | |
| `CategoryName` | `string` | |
| `CategoryColor` | `string?` | Cor da categoria-pai |
| `Spent` | `int` | Gasto na subcategoria no período (centavos) |
| `Allocated` | `int` | Valor esperado (`ExpectedValue`) da alocação (centavos) |
| `SpentPercentage` | `decimal` | `Spent / Allocated * 100`, 2 casas; `0` se `Allocated == 0` |

### `TopCategoryItemDto` (`Dtos/Others/`)
| Campo | Tipo | Notas |
|---|---|---|
| `CategoryName` | `string` | |
| `Color` | `string?` | Cor da categoria |
| `TotalSpent` | `int` | Soma de despesas da categoria no período (centavos) |

### `SpendingPredictionItemDto` (`Dtos/Others/`)
| Campo | Tipo | Notas |
|---|---|---|
| `Day` | `int` | Dia do mês (1..N) |
| `CurrentExpense` | `int?` | Gasto **acumulado** real até esse dia; `null` para dias futuros (`> hoje`) |
| `HistoricalAverage` | `int` | Gasto **acumulado** projetado pela média histórica até esse dia |

### Enums usados
- `EnumTransactionType`: `Expense`, `Income`, `Transfer` (ver `specs/transactions.md`).
- `EnumAllocationType`: `Income`, `Expense` — usado para filtrar alocações de orçamento (só `Expense` entram em `TotalExpected`/`TopSubCategories`).

---

## 3. Endpoints (API)

Controller: `MainPageController` — rota base `api/mainpage`. Exige `[Authorize]`.
O `userId` vem sempre do JWT (`GetUserId()`), nunca da query.

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `GET` | `/api/mainpage/summary` | Resumo agregado da home | `200` `MainPageSummaryResponseDto` | `400` se `budgetId` ≤ 0 |

### Request — query string
```
budgetId   : int?       // opcional; se informado, deve ser > 0 (senão 400)
startDate  : DateOnly    // janela inclusiva (obrigatório de fato — ver G6)
finishDate : DateOnly    // janela inclusiva
```
- O único parâmetro validado é `budgetId` (via `this.ValidatePositiveId(budgetId.Value, "budgetId")` quando presente → `400 ValidationProblemDetails`).
- `startDate`/`finishDate` **não têm validação** — se omitidos, fazem bind para `DateOnly` default (`0001-01-01`); ver gap G6.

### Response — `MainPageSummaryResponseDto`
```
BalanceSummary      : BalanceSummaryDto
RecentTransactions  : RecentTransactionDto[]      // até 5
BudgetSummary       : BudgetSummaryDto | null     // null se sem orçamento
TopCategories       : TopCategoryItemDto[]        // até 5
SpendingPrediction  : SpendingPredictionItemDto[] // 1 por dia do mês atual
```

O controller monta o `MainPageSummaryRequestDto`, dispara as 5 tasks, faz `await Task.WhenAll(...)` e devolve `Ok(result)`. Não há `Result<T>` aqui — os métodos do service retornam objetos/coleções diretamente, então o controller faz `Ok` direto (padrão do backend para serviços que não retornam `Result<T>`).

---

## 4. Regras de negócio

### RN-DASH-01 — Lógica no `TransactionService`, contrato no MainPage
O `MainPageController` injeta apenas `ITransactionService`. As cinco agregações são métodos públicos desse service (`GetSummaryBalanceAsync`, `GetRecentTransactionsAsync`, `GetBudgetSummaryAsync`, `GetTopCategoriesAsync`, `GetSpendingPredictionAsync`), agrupados sob o comentário `// Main Page Endpoints`. Não existe `MainPageService`.

### RN-DASH-02 — Agregação paralela com contexto por task
As cinco tasks são iniciadas **sem `await`** e resolvidas juntas via `Task.WhenAll`. Cada método de agregação abre seu **próprio `ApplicationDbContext`** via `_contextFactory.CreateDbContext()` (`await using`), em vez de usar o `_context` injetado (scoped). Isso é necessário porque o `DbContext` do EF Core **não é thread-safe** — rodar 5 queries concorrentes no mesmo contexto lançaria exceção. As demais operações do `TransactionService` (create/update/delete) continuam usando o `_context` scoped.

### RN-DASH-03 — Escopo por usuário e filtros comuns
Toda agregação filtra por `UserId == requestDto.UserId` (ownership obrigatório). Os filtros de janela e orçamento são aplicados via `WhereIf` (helper que só adiciona o `Where` se a condição for verdadeira):
- `WhereIf(BudgetId.HasValue, t => t.BudgetId == BudgetId)` — só filtra por orçamento se `budgetId` veio na query.
- `Where(t => t.TransactionDate >= StartDate && t.TransactionDate <= FinishDate)` — janela **inclusiva** nos dois extremos.

> Atenção: o filtro de período é aplicado em `BalanceSummary`, `RecentTransactions`, `TopCategories` e nas somas de `BudgetSummary`. **`SpendingPrediction` ignora `StartDate`/`FinishDate`** e usa sempre o mês corrente + 6 meses anteriores (ver RN-DASH-08).

### RN-DASH-04 — BalanceSummary (`GetSummaryBalanceAsync`)
- Agrupa as transações do período por `GroupBy(_ => 1)` e soma `Income` e `Expense` separadamente (`Sum((int?)Value) ?? 0`, para tolerar conjunto vazio).
- Se não houver nenhuma transação, retorna `new BalanceSummaryDto()` (tudo zero).
- `Balance = TotalIncome - TotalExpenses`, calculado em memória após a query.
- Transferências (`Transfer`) **não** entram em nenhuma soma.

### RN-DASH-05 — RecentTransactions (`GetRecentTransactionsAsync`)
- Mesmo escopo (usuário + período + budget opcional), **sem** filtrar por tipo.
- Ordena por `TransactionDate` desc, depois `CreatedAt` desc (desempate por data de criação), e pega `Take(5)`.
- Projeta nome/emoji da subcategoria e nome da categoria-pai.
- **Não** filtra contas de sistema (`IsSystem`) — diferente das listagens normais de transação (ver `specs/transactions.md` RN-TX-09). Transações de contas virtuais (Goals) **podem** aparecer aqui (ver gap G9).

### RN-DASH-06 — BudgetSummary (`GetBudgetSummaryAsync`)
1. **Existência:** verifica se há `Budget` do usuário (e, se `budgetId` informado, com aquele id). Se não houver, retorna **`null`** (o front trata como "nenhum orçamento").
2. **`HasAllocations`:** `true` se existe ao menos uma `BudgetSubcategoryAllocation` do usuário (filtrada por budget quando aplicável).
3. **`TotalExpected`:** soma de `ExpectedValue` das alocações com `AllocationType == Expense`. **Não** aplica filtro de período (alocação é do orçamento como um todo).
4. **`TotalSpent`:** soma de `Value` das transações `Expense` do usuário no período (e budget, se informado).
5. **`SpentPercentage`:** `Round(TotalSpent / TotalExpected * 100, 2)`; `0` se `TotalExpected == 0` (evita divisão por zero).
6. **`TopSubCategories`:** para cada alocação `Expense`, calcula o gasto via **subquery correlacionada** (transações daquela `SubCategoryId`, `Expense`, no período), ordena por `Spent` desc, pega `Take(4)`. Cada item recalcula seu próprio `SpentPercentage` (`Spent / Allocated * 100`, ou `0`).

> O gasto da subcategoria casa por `SubCategoryId` **e período**, mas **não** por `BudgetId` — então `TopSubCategories[].Spent` pode incluir despesas fora do orçamento filtrado, ainda que `TotalSpent` (acima) respeite o budget. Inconsistência sutil (ver gap G10).

### RN-DASH-07 — TopCategories (`GetTopCategoriesAsync`)
- Só `Expense`, no período (e budget opcional).
- `GroupBy` por `{ Category.Name, Category.Color }`, soma `Value`, ordena desc, `Take(5)`.
- Agrupa na **categoria-pai** (não na subcategoria). A cor vem da categoria.

### RN-DASH-08 — SpendingPrediction (`GetSpendingPredictionAsync`) — algoritmo

> Este é o trecho mais elaborado do spec. O objetivo é desenhar duas curvas acumuladas para o **mês corrente**: o gasto real até hoje e uma projeção baseada no histórico dos últimos 6 meses. **Ignora `StartDate`/`FinishDate` do filtro** — usa sempre o mês atual (`DateTime.UtcNow`).

**Passo 0 — Janelas de tempo**
- `today = DateOnly.FromDateTime(DateTime.UtcNow)`.
- `currentMonth = 1º dia do mês de hoje`; `daysInMonth = nº de dias do mês`.
- `historyStart = currentMonth - 6 meses`; `historyEnd = currentMonth - 1 dia` (último dia do mês anterior). Janela histórica = os 6 meses anteriores completos.

**Passo 1 — Coleta de dados**
- `currentByDay`: dicionário `dia → soma de despesas` do mês atual, de `currentMonth` até `today` (só dias já decorridos).
- `historicalExpenses`: lista de `(Year, Month, Day, Value)` de todas as despesas na janela histórica (materializada em memória).
- `pastMonths`: os meses `currentMonth-1 .. currentMonth-6` que **têm pelo menos uma despesa** no histórico (meses sem dados são descartados — o algoritmo se adapta a histórico curto).

**Passo 2 — Detecção de despesas de data fixa (`fixedDayAvg`)**
Para cada dia-do-mês `d` de 1 a 31:
1. Para cada mês em `pastMonths`, soma as despesas que caíram **exatamente nesse dia `d`** (se `d` não existe no mês — ex.: dia 31 em fevereiro —, é ignorado/`null`).
2. Mantém só os valores `> 0`, ordenados.
3. Se houver **< 3 ocorrências**, o dia não é fixo → pula.
4. Calcula a **mediana** dos valores (`amounts[count/2]`).
5. Conta quantos valores estão **dentro de ±10% da mediana** (`|v - median| <= median * 0.10`).
6. Se **≥ 3** valores forem consistentes nessa faixa, o dia `d` é considerado **fixo**, e `fixedDayAvg[d] = média de todos os valores daquele dia` (`(int)amounts.Average()`).

> Em resumo: **um dia-do-mês é "fixo" se um valor semelhante (±10% da mediana) apareceu naquele mesmo dia em pelo menos 3 dos últimos 6 meses.** Isso captura contas recorrentes (aluguel, assinaturas) que caem sempre no mesmo dia.

**Passo 3 — Média por dia da semana (`weekdayAvg`), para os dias não-fixos**
Para cada `DayOfWeek` (domingo..sábado):
- Percorre **todos os dias** de todos os meses em `pastMonths`.
- Considera só os dias cujo `DayOfWeek` bate **e que não são dias fixos** (`!fixedDayAvg.ContainsKey(d)` — exclui os dias já cobertos pelo passo 2).
- Soma o gasto desses dias e conta as ocorrências.
- `weekdayAvg[dow] = totalSpend / occurrences` (média de gasto naquele dia da semana), ou `0` se não houve ocorrências.

> Observação: a exclusão de dias fixos usa o **dia-do-mês** (`d`), não a data específica. Logo, se o dia 5 é fixo, **todo** dia 5 dos meses históricos é excluído do cálculo de média por dia-da-semana, independentemente do dia da semana em que caiu.

**Passo 4 — Construção das curvas acumuladas**
Itera `day` de 1 a `daysInMonth`, mantendo dois acumuladores (`runningCurrent`, `runningHistorical`):
- Se `day <= today.Day`: soma `currentByDay[day]` (ou 0) em `runningCurrent`.
- `dailyDelta` do dia = `fixedDayAvg[day]` **se** o dia for fixo, **senão** `weekdayAvg[DayOfWeek do dia]`.
- `runningHistorical += dailyDelta`.
- Adiciona `SpendingPredictionItemDto { Day, CurrentExpense = (day <= today.Day ? runningCurrent : null), HistoricalAverage = runningHistorical }`.

Resultado: `CurrentExpense` é uma curva acumulada que só existe até hoje (depois `null`); `HistoricalAverage` é a curva acumulada projetada para o mês inteiro.

> Há um detalhe de robustez: `weekdayAvg[date.DayOfWeek]` é indexado sem `TryGetValue`. Como o `weekdayAvg` é populado para **todos** os `DayOfWeek` no Passo 3 (mesmo que com valor 0), a chave sempre existe — não há risco de `KeyNotFoundException`.

### RN-DASH-09 — Tudo é leitura
Nenhuma das cinco agregações chama `SaveChangesAsync`. O endpoint é 100% read-only.

---

## 5. Front (Web)

- **Rota:** `/dashboard` → `app/(app)/dashboard/page.tsx` (re-export de uma linha) → `features/dashboard/DashboardPage.tsx`.
- **Página:** toda a composição em `DashboardPage.tsx`.

### Derivação do período (`DashboardPage`)
1. Busca o **orçamento ativo** via `useActiveBudget()` (que deriva o período corrente de `budget.startDate` + `budget.recurrence` com `computeActivePeriod`).
2. Se há orçamento ativo: `range = { startDate: activeBudget.startDate, finishDate: toInclusiveEnd(activeBudget.endDate) }`. O `endDate` do orçamento é **exclusivo** (1º dia do próximo período); `toInclusiveEnd` subtrai 1 dia porque a API do dashboard é **inclusiva**.
3. Se não há orçamento: cai em `getCurrentMonthRange()` (1º ao último dia do mês corrente).
4. Chama `useDashboard({ ...range, budgetId: activeBudget?.budget.id })`.
- O `periodLabel` exibido é o intervalo do orçamento (`d MMM – d MMM yyyy`) ou o mês corrente (`MMMM yyyy`), em pt-BR.

### API client — `lib/api/dashboard.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `getSummary(params)` | `GET /mainpage/summary` | `params`: `{ startDate, finishDate, budgetId? }` → vão como query string |

### Hook — `features/dashboard/hooks/useDashboard.ts`
- `useDashboard(params)` — `useQuery(["dashboard", params])`, `staleTime: 60_000` (60s). Sem mutations (é read-only).

### Composição da página (ordem de render)
1. **`DashboardStatsRow`** — 4 `StatCard`: Patrimônio Líquido, Receitas, Despesas (valor negativo, `lowerIsBetter`), Saldo. Divide centavos por 100.
2. **`SpendingPredictionChart`** — `LineChart` (Recharts) com 3 séries: `historicalAverage`, `currentExpense` e uma **`forecastExpense` calculada no front**. Linha de referência vertical em "hoje".
3. **Grid:** `MonthlyEvolutionChart` (esquerda) + `CategoryDonutChart` (direita).
4. **Grid:** `RecentTransactions` (esquerda) + coluna com `AiInsightCard` e `ActiveBudgetCard` (direita).
5. **`UpcomingBillsCard`** (largura total).

### Tipos — `lib/types/dashboard.types.ts`
Espelham os DTOs do backend em camelCase, **porém com campos extras que o backend não envia** (ver gaps G1–G3): `BalanceSummary` declara `netWorth`, `incomeChange`, `expenseChange`, `balanceChange`, `netWorthChange`, `previousIncome`, `previousExpenses`, `previousBalance`, `previousNetWorth` (todos opcionais); `RecentTransaction` declara `isRecurring?` e `isAutomatic?`.

### Detalhes notáveis por componente
- **`DashboardStatsRow` / `StatCard`:** o card só renderiza o bloco de variação (`%` + "vs. mês anterior") quando `change !== undefined`. Como o backend nunca envia `*Change`/`previous*`, **esses deltas nunca aparecem hoje** (ver G2). `netWorth` lido como `balanceSummary.netWorth ?? 0` → sempre 0 (G1).
- **`SpendingPredictionChart`:** a série de **previsão** (`forecastExpense`) é derivada **no front**, não vem da API. Lógica: para dias `>= hoje`, `forecastExpense = currentBase + (historicalAverage_do_dia - historicalAverage_de_hoje)`, onde `currentBase` é o `currentExpense` de hoje. Ou seja, projeta a partir do gasto real de hoje, somando o incremento que a curva histórica acumula daqui pra frente. Tooltip e eixos dividem por 100.
- **`CategoryDonutChart`:** usa `topCategories.slice(0,5)`, cor resolvida por `getCategoryColor(c.color, c.categoryName)` (fallback por nome quando a API não manda cor). Link "Ver categorias" aponta para `/categories`.
- **`RecentTransactions`:** sinal e cor por tipo (`Income` verde com `+`, `Transfer` neutro sem sinal, `Expense` com `-`). Renderiza badges "Recorrente"/"Auto" **se** `tx.isRecurring`/`tx.isAutomatic` — campos que o backend não envia, então hoje não aparecem (G3). Tem `CATEGORY_COLORS` hardcoded por nome em pt-BR (não usado para muito além de fallback visual).
- **`ActiveBudgetCard`:** três estados — sem orçamento (`budget == null`), com orçamento mas `!hasAllocations`, e completo (com `topSubCategories` e barras de progresso). É o consumidor real de `budgetSummary`.
- **`MonthlyEvolutionChart`:** **NÃO usa o endpoint do dashboard.** Tem `useQuery(["monthly-evolution"])` próprio chamando `analyticsApi.getIncomeExpense(...)` para os últimos 12 meses (ver `specs/...analytics`, se existir). `staleTime` 5min.
- **`UpcomingBillsCard`:** **placeholder** — usa `PLACEHOLDER_BILLS` hardcoded (aluguel, energia, etc.). Não consome dado real. Link "Ver todas" → `/recurring` (ver G5).
- **`AiInsightCard`:** **placeholder de feature premium** ("Insight da IA / Em breve", botão desabilitado). Corresponde ao "AI Daily Insight" do `web/CLAUDE.md` (Claude Haiku, prompt caching, premium, TTL 24h; spec em `financeControlFilesDocumentation/Documents/ai-daily-insight.md`). Ver G11.

### Componentes órfãos (não usados pela página)
`NetWorthHero.tsx`, `SavingsRateCard.tsx`, `BudgetSummaryCard.tsx` e `TopCategoriesCard.tsx` existem em `features/dashboard/components/` mas **não são importados** por `DashboardPage.tsx` nem por nenhum outro lugar (ver G12). `SavingsRateCard` inclusive usa histórico mock (`DEFAULT_HISTORY`) e `NetWorthHero` tem cotações FX hardcoded.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Conjunto vazio em qualquer agregação → somas `?? 0`, `BalanceSummaryDto` vazio, listas vazias.
- Usuário sem orçamento → `BudgetSummary == null` (front mostra estado "criar orçamento").
- Orçamento sem alocações → `HasAllocations == false` (front mostra "alocar valores").
- Divisão por zero em percentuais → `SpentPercentage == 0` quando denominador é 0.
- Histórico curto (< 6 meses de dados) → `pastMonths` filtra meses sem despesa; detecção de dia fixo exige ≥ 3 ocorrências, então degrada para média por dia-da-semana.
- Dia inexistente no mês histórico (ex.: 31/fev) → ignorado na detecção de fixo.
- Concorrência das 5 queries → contexto por task (RN-DASH-02).

### Gaps / dúvidas a confirmar
- **G1 — `netWorth` inexistente no backend:** `BalanceSummaryDto` não tem `netWorth`, mas o tipo TS e `DashboardStatsRow`/`NetWorthHero` leem `balanceSummary.netWorth`. Hoje resolve para `undefined → 0`. O card "Patrimônio Líquido" sempre mostra **R$ 0,00**. Confirmar se o backend deveria computar patrimônio (saldo de contas + investimentos) ou se o card deve sair do dashboard.
- **G2 — Variações vs. período anterior:** o front espera `incomeChange`, `expenseChange`, `balanceChange`, `netWorthChange`, `previousIncome`, `previousExpenses`, `previousBalance`, `previousNetWorth`; o backend **não envia nenhum**. Como `StatCard` só renderiza o delta quando `change !== undefined`, os comparativos "vs. mês anterior" **nunca aparecem**. (Mesmo gap conceitual de `previousBalance` em `specs/transactions.md` G1.) Confirmar qual lado é a fonte da verdade.
- **G3 — `isRecurring`/`isAutomatic` em RecentTransactions:** `RecentTransactionDto` não expõe esses campos; `RecentTransactions.tsx` os renderiza (badges "Recorrente"/"Auto") mas nunca aparecem. Os dados existem na entidade `Transaction` (`RecurringTransactionId`, etc.) — falta projetá-los no DTO.
- **G4 — "Evolução Mensal" fora do contrato do dashboard:** `MonthlyEvolutionChart` consome `analyticsApi.getIncomeExpense` num query separado, não o `MainPageSummaryResponseDto`. Não é bug, mas o "dashboard" depende de **dois** endpoints. Documentar/centralizar se desejado.
- **G5 — "Próximas contas a pagar" é mock:** `UpcomingBillsCard` usa `PLACEHOLDER_BILLS` hardcoded; não há endpoint que liste recorrências/parcelas a vencer. Link aponta para `/recurring` (rota cuja existência não foi confirmada neste spec). Feature pendente.
- **G6 — `startDate`/`finishDate` sem validação:** o controller só valida `budgetId`. Se as datas forem omitidas, fazem bind para `DateOnly` default (`0001-01-01`), o que retornaria conjuntos vazios em vez de um erro claro. Avaliar validação explícita (obrigatórias, `start <= finish`).
- **G7 — Falta `specs/budgets.md`:** este spec referencia o modelo de orçamento (`Budget`, `Area`, `BudgetSubcategoryAllocation`, `ExpectedValue`, `AllocationType`) mas não existe spec dedicada para linkar. Criar.
- **G8 — Duas classes num arquivo (backend):** `BudgetSummaryDto` e `BudgetSubCategorySummaryDto` coabitam `BudgetSummaryDto.cs`, violando a regra "uma classe por arquivo" do `apps/api/CLAUDE.md`. Separar.
- **G9 — RecentTransactions não filtra contas de sistema:** diferente das listagens normais (RN-TX-09), as transações recentes do dashboard **não** excluem `Account.IsSystem`. Transações de contas virtuais (Goals) podem aparecer na home. Confirmar se é intencional.
- **G10 — `Spent` de subcategoria ignora `BudgetId`:** em `TopSubCategories`, a subquery de gasto casa por `SubCategoryId` + período, mas **não** por `BudgetId`, enquanto `TotalSpent` (no mesmo método) respeita o budget filtrado. Pode gerar `soma(TopSubCategories.Spent) != TotalSpent`. Confirmar regra desejada.
- **G11 — AI Daily Insight (premium):** `AiInsightCard` é placeholder ("Em breve", botão disabled). Feature premium planejada (Claude Haiku, prompt caching, TTL 24h) descrita em `web/CLAUDE.md` e `financeControlFilesDocumentation/Documents/ai-daily-insight.md`. Item de roadmap, não implementado.
- **G12 — Componentes órfãos:** `NetWorthHero`, `SavingsRateCard`, `BudgetSummaryCard`, `TopCategoriesCard` não são usados por nenhuma tela. `SavingsRateCard` e `NetWorthHero` contêm dados mock (histórico de poupança, cotações FX). Decidir entre integrar (depende de G1/G2) ou remover (dead code).
- **G13 — Janela de `SpendingPrediction` ignora o filtro:** a previsão sempre usa o mês corrente + 6 meses anteriores (`DateTime.UtcNow`), ignorando `StartDate`/`FinishDate`. Quando o período do dashboard for o de um orçamento que **não** é o mês corrente, a previsão fica desalinhada do resto da tela. Confirmar se é intencional (a curva é conceitualmente "do mês atual").
- **G14 — UTC vs. fuso local:** `today` em `SpendingPrediction` usa `DateTime.UtcNow`; o front calcula `today` com `new Date().getDate()` (local). Perto da virada do dia/mês os dois podem divergir, deslocando a linha "hoje" e o ponto de corte da curva. Confirmar política de fuso.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/MainPageController.cs`
- `FinanceControl.Services/Services/TransactionService.cs` (métodos `GetSummaryBalanceAsync`, `GetRecentTransactionsAsync`, `GetBudgetSummaryAsync`, `GetTopCategoriesAsync`, `GetSpendingPredictionAsync`)
- `FinanceControl.Domain/Interfaces/Services/ITransactionService.cs`
- `FinanceControl.Shared/Dtos/Request/MainPageSummaryRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/MainPageSummaryResponseDto.cs`
- `FinanceControl.Shared/Dtos/Others/BalanceSummaryDto.cs`, `RecentTransactionDto.cs`, `BudgetSummaryDto.cs` (contém também `BudgetSubCategorySummaryDto`), `TopCategoryItemDto.cs`, `SpendingPredictionItemDto.cs`
- `FinanceControl.Shared/Helpers/QueryableHelper.cs` (`WhereIf`)
- `FinanceControl.WebApi/Extensions/ControllerValidationExtensions.cs` (`ValidatePositiveId`)
- `FinanceControl.Shared/Enums/EnumAllocationType.cs`

**Web**
- `features/dashboard/DashboardPage.tsx`
- `features/dashboard/hooks/useDashboard.ts`
- `features/dashboard/components/`: `DashboardStatsRow.tsx`, `SpendingPredictionChart.tsx`, `CategoryDonutChart.tsx`, `RecentTransactions.tsx`, `ActiveBudgetCard.tsx`, `MonthlyEvolutionChart.tsx`, `UpcomingBillsCard.tsx`, `AiInsightCard.tsx`
- Órfãos: `NetWorthHero.tsx`, `SavingsRateCard.tsx`, `BudgetSummaryCard.tsx`, `TopCategoriesCard.tsx`
- `features/budgets/hooks/useActiveBudget.ts`
- `components/shared/StatCard.tsx`
- `lib/api/dashboard.ts`
- `lib/types/dashboard.types.ts`
- `app/(app)/dashboard/page.tsx` (re-export)

**Specs relacionadas**
- `specs/transactions.md` — modelo de `Transaction`, enums, regra de centavos.
- `specs/budgets.md` — **a criar** (ver G7).
