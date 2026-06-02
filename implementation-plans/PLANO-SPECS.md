# Plano de Specs — Finance Control (API + Web)

> Documento de planejamento. Lista todos os specs de implementação sugeridos para o
> projeto, organizados **por domínio de negócio** — cada spec cobre o backend (API) e o
> frontend (Web) da mesma feature, descrevendo **como funciona no código**, não no papel.
>
> Escopo: `apps/api` e `apps/web`. Mobile fora de escopo por enquanto.
>
> Diretório sugerido: `specs/` na raiz do repositório.

---

## Por que specs (e não só a documentação existente)

O projeto já tem `FinanceControlFilesDocumentation/` — SRS formal (ISO/IEC/IEEE 29148),
business rules, user stories, use cases. Essa documentação descreve **requisitos**.

Os specs abaixo são complementares: são **guias técnicos de implementação** para quem vai
codar ou dar manutenção. Respondem "como o saldo é calculado no código", "quais hooks o
front expõe", "qual job atualiza o quê" — coisas que hoje estão espalhadas entre
controllers, services, workers e components.

---

## Specs de domínio

| # | Spec | Por quê (o que torna não trivial) | API | Web |
|---|------|-----------------------------------|-----|-----|
| 1 | `specs/authentication.md` | Fluxo JWT + refresh token, rotação de token, account lockout, rate limiting (`auth` 5req/15min), interceptor do Axios que faz refresh no 401, sincronia token↔cookie. Lógica crítica espalhada entre `UserService`, middleware e `authStore`. | `UserController`, `UserService`, `RefreshToken` | `auth/`, `authStore`, `axios.ts`, `proxy.ts` |
| 2 | `specs/accounts.md` | Saldo **nunca armazenado** — sempre computado da soma de transações (Income +, Expense −, Transfer ±). Conta default única, contas virtuais (system) para goals, histórico de saldo de 30 dias. | `AccountController`, `AccountService`, `Account` | `accounts/`, `useAccounts`, `useBalanceHistory` |
| 3 | `specs/categories.md` | Hierarquia de 2 níveis (Category → SubCategory), categorias de sistema (BalanceUpdate, Transfer) não deletáveis, auto-criação no signup por país, update em lote. | `CategoryController`, `SubCategoryController`, `CategoryService`, `SubCategoryService` | `categories/`, `useCategories` |
| 4 | `specs/transactions.md` | O domínio mais complexo. Tipos OneTime/Installment/Recurring; parcelamento com resto na 1ª parcela; valores em **centavos (int)**; transferências entre contas próprias neutras no patrimônio; tags many-to-many; inclusão em budget; filtros + paginação. | `TransactionController`, `TransactionService`, `Transaction`, `Tag` | `transactions/`, `useTransactionsFiltered`, `TagInput` |
| 5 | `specs/recurrences.md` | Template de recorrência gera instâncias via job diário; cancelamento não apaga instâncias já criadas; reativação; catch-up de recorrências perdidas; view unificada (income + bills + installments) com totais mensais. | `RecurrenceController`, `RecurrencePageService`, `RecurringTransaction` | `recurrences/`, `useRecurrencePage` |
| 6 | `specs/budgets.md` | Recorrência por período (semanal→anual), start day 1-31, Areas exclusivamente Income **ou** Expense, cada subcategoria em no máximo uma área (constraint única), apenas um budget ativo por usuário, projeções de ciclos passados/futuros. | `BudgetController`, `AreaController`, `BudgetService`, `Budget`, `Area`, `BudgetSubcategoryAllocation` | `budgets/`, `useBudgets`, `useActiveBudget` |
| 7 | `specs/dashboard.md` | Agregação paralela de múltiplas fontes (saldo, transações recentes, status do budget, top categorias, previsão de gastos) numa chamada. Contrato do `mainpage/summary` e como o front monta os cards/charts. | `MainPageController`, `TransactionService` | `dashboard/`, `useDashboard` |
| 8 | `specs/goals.md` | Goals tipo Item (cria conta virtual/system) vs tipo Investment (ativo-alvo). Contribuição, saque, registro de compra, transações de investimento associadas. Máquina de estados complexa no front (drawers de contribute/withdraw/purchase). | `GoalController`, `GoalService`, `Goal` | `goals/`, `useGoals`, `useContributeGoal`, `usePurchaseGoal` |
| 9 | `specs/investments.md` | **Em progresso ativo.** Portfólio com custo médio, quantidade, composição por tipo de ativo. Buy/sell, dividendos, histórico de preço. Day change derivado do histórico (não de coluna). Valores em `decimal` (exceção à regra de centavos). | `InvestmentController`, `InvestmentService`, `Investment`, `InvestmentTransaction`, `InvestmentDividend` | `investments/`, `useInvestments`, `useRegisterTransaction` |
| 10 | `specs/market-data.md` | **Integração Brapi.** Listagem/busca/detalhe/fundamentals de ativos, cache via `IMemoryCache`. Universo de ativos sincronizado do `/quote/list`. Histórico diário + ticks intraday (15min). Base para investments e simulations. | `MarketController`, `MarketService`, `MarketAsset`, `MarketPriceHistory`, `MarketPriceIntraday` | `market/`, `useMarketSearch`, `useFundamentals` |
| 11 | `specs/simulations.md` | **Em progresso ativo.** Juros compostos, backtest histórico com aporte mensal + capital inicial. Benchmarks dinâmicos do BACEN SGS (CDI 4391, SELIC 4390, IPCA 433) + índices via Brapi. CAGR real de ativos com fallback sem token Pro. | `SimulationController`, `SimulationService` | `simulations/`, `useHistoricalSimulation`, `useAssetRates` |
| 12 | `specs/analytics.md` | A maior superfície de API (24 endpoints). Séries temporais (income/expense, evolução de saldo/categoria/patrimônio), projeções (balance, category, net worth, passive income, portfolio), milestones, performance de investimento (vs CDI, vs benchmarks, retornos anuais). | `AnalyticsController`, `AnalyticsService` | `analytics/`, 23 hooks de query |
| 13 | `specs/import.md` | Parse de OFX/CSV (limite 10MB), **categorização via Claude API** (Anthropic), detecção de duplicatas por data/valor/descrição, fluxo de 2 passos (parse → review → confirm). | `ImportController`, `ImportService` | `import/`, `useImportFlow`, `useParseImportFile` |
| 14 | `specs/profile-preferences.md` | Perfil, preferências (moeda, idioma, tema, notificações), troca de senha, reset de senha por token, **reset/delete destrutivo de dados** do usuário. | `UserController`, `UserService`, `User`, `UserPreferences` | `profile/`, `useProfile`, `usePreferences`, `useResetData` |

---

## Specs transversais (cross-cutting)

Não pertencem a um domínio único; descrevem mecanismos que atravessam várias features.

| # | Spec | Por quê | Onde vive |
|---|------|---------|-----------|
| 15 | `specs/background-jobs.md` | 4 hosted services com horários distintos: recorrências (meia-noite UTC), Brapi daily (19h UTC), Brapi intraday (15min em pregão), cleanup (09:30 UTC, retém 7 dias de intraday). Fácil esquecer o comportamento esperado de cada um. Inclui trigger manual via `AdminController`. | `FinanceControl.Workers`, `FinanceControl.Services/Brapi`, `AdminController` |
| 16 | `specs/api-conventions.md` | Padrão `Result<T>`, sem camada de repository (services usam `DbContext` direto), `OwnedEntity` para isolamento multi-usuário, `BaseController.GetUserId()`, FluentValidation (nunca DataAnnotations), um DTO por arquivo, valores em centavos. | `FinanceControl.*` (todas as camadas) |
| 17 | `specs/web-conventions.md` | Convenção de feature (`features/<x>/<X>Page.tsx` com re-export na rota), React Query (staleTime 60s, retry 1), stores Zustand (auth/ui/header), design tokens em `globals.css`, padrões de form (RHF + Zod), interceptor Axios. Já parcialmente coberto no CLAUDE.md do web. | `apps/web/src` |

---

## Resumo

- **14 specs de domínio** — um por feature de negócio (API + Web juntos).
- **3 specs transversais** — jobs, convenções de API, convenções de Web.
- **Total: 17 specs.**

### Ordem sugerida de criação

Priorizar o que está em desenvolvimento ativo ou é fundação para o resto:

1. `specs/investments.md` — em progresso ativo (branch atual)
2. `specs/simulations.md` — em progresso ativo (branch atual)
3. `specs/market-data.md` — fundação para investments e simulations
4. `specs/transactions.md` — domínio central, lógica mais complexa
5. `specs/authentication.md` — fundação, lógica crítica espalhada
6. `specs/background-jobs.md` — comportamento de jobs fácil de esquecer

O restante pode ser criado conforme cada feature receber manutenção.

### Decisões de organização

- **Por domínio**, não separando API/Web — mantém a feature inteira num só lugar e evita
  duplicar contexto. Um spec descreve o contrato da API e como o front o consome.
- **Pasta `specs/` na raiz** — separada de `FinanceControlFilesDocumentation/` (requisitos
  formais) e de `implementation-plans/` (roadmaps pontuais como os planos Brapi).
