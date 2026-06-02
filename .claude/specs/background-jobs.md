# Spec: Background Jobs / Workers

> **Status:** Descritivo (documenta o código atual em `apps/api`) com seção de gaps. Spec cross-cutting — não há um único controller nem entidade própria.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Tarefas agendadas em background (geração de recorrências e sincronização de preços de mercado via Brapi). Cobre schedules, trigger, catch-up, idempotência, retenção, paralelismo e tratamento de falhas — **não** o modelo de dados sobre o qual operam.

---

## 1. Visão geral

O backend roda quatro background jobs, todos registrados como `IHostedService` no `Program.cs` e ativados no boot da `WebApi`. Eles cuidam de duas frentes:

- **Recorrências** — gerar instâncias de `Transaction` a partir dos templates `RecurringTransaction` ao longo do tempo.
- **Dados de mercado (Brapi)** — manter o universo de ativos (`MarketAsset`), o histórico diário de preços (`MarketPriceHistory`), os ticks intraday (`MarketPriceIntraday`) e os dividendos (`InvestmentDividend`) sincronizados com a API pública da [Brapi](https://brapi.dev).

### Separação Workers / Services (per `api/CLAUDE.md`)

O monorepo segue o padrão **"hosted service no projeto `Workers`, lógica no projeto `Services`"**:

- **`FinanceControl.Workers/`** — só hospeda a infraestrutura de agendamento: cada classe é um `IHostedService` que cria um `Timer`, calcula o atraso até o próximo horário-alvo e, a cada tick, invoca o *job service* correspondente. **Não contém regra de negócio.**
- **`FinanceControl.Services/`** — contém os *job services* (`XxxJobService`), onde mora toda a lógica: abrir scope, consultar o `ApplicationDbContext`, chamar a Brapi, gravar dados, montar status.

| Hosted service (Workers) | Job service (Services) | Método chamado |
|---|---|---|
| `RecurringTransactionHostedService` | `RecurringTransactionJobService` | `RunAsync` |
| `BrapiPriceUpdateHostedService` | `BrapiPriceUpdateJobService` | `RunAsync` |
| `BrapiIntradayHostedService` | `BrapiPriceUpdateJobService` | `RunIntradayAsync` |
| `BrapiCleanupHostedService` | `BrapiCleanupJobService` | `RunAsync` |

Note que `BrapiPriceUpdateHostedService` e `BrapiIntradayHostedService` compartilham o **mesmo** job service (`BrapiPriceUpdateJobService`), apenas chamando métodos diferentes.

### Registro e ciclo de vida (DI)

- Os hosted services são registrados em `Program.cs` via `AddHostedService<T>()` (linhas 30–33), nesta ordem: `RecurringTransactionHostedService`, `BrapiPriceUpdateHostedService`, `BrapiIntradayHostedService`, `BrapiCleanupHostedService`.
- Os job services são registrados como **`Singleton`** em `ServicesExtensions.AddAplicationServices()`:
  - `RecurringTransactionJobService`
  - `BrapiPriceUpdateJobService` (singleton para que o `LastStatus` sobreviva entre runs e seja lido pelo `AdminController`)
  - `BrapiCleanupJobService`
- Como os job services são singletons mas o `ApplicationDbContext` é `Scoped`, **cada job abre seu próprio scope** via `IServiceScopeFactory.CreateAsyncScope()` e resolve o `ApplicationDbContext` de dentro dele. Os batches da Brapi abrem **um scope por batch** (o `DbContext` não é thread-safe — ver RN-JOB-08).

### Padrão comum dos hosted services

Os quatro workers seguem exatamente o mesmo esqueleto (`IHostedService, IDisposable`):

1. `StartAsync` cria um `CancellationTokenSource` linkado ao token do host, calcula `initialDelay` até o próximo horário-alvo, loga a previsão e arma um `Timer`.
2. `OnTimerTick` dispara `_ = RunJobAsync()` em **fire-and-forget** (não aguarda).
3. `RunJobAsync` checa cancelamento, chama o job service e captura exceções: `OperationCanceledException` é silenciada (shutdown), qualquer outra é logada como erro (`LogError`) — **a exceção nunca derruba o host**.
4. `StopAsync` cancela o CTS e desarma o timer (`Change(Timeout.Infinite, ...)`).
5. `Dispose` libera timer e CTS.

Modelo de agendamento: **`System.Threading.Timer`** (não `BackgroundService`/`PeriodicTimer`). Os intervalos repetem via o `period` do timer (`TimeSpan.FromDays(1)` para os diários; `15 min` para o intraday).

---

## 2. Workers e schedules

Todos os horários são em **UTC** e calculados a partir de `DateTime.UtcNow`. As referências a BRT nos comentários do código assumem `UTC-3` (sem horário de verão).

| Worker | Horário (UTC) | Intervalo de repetição | Dispara | Propósito |
|---|---|---|---|---|
| `RecurringTransactionHostedService` | **00:00** (próxima meia-noite) | a cada 1 dia | `RecurringTransactionJobService.RunAsync` | Gera as `Transaction` recorrentes vencidas de todos os templates `RecurringTransaction` ativos (com catch-up). |
| `BrapiPriceUpdateHostedService` | **19:00** (hardcoded) | a cada 1 dia | `BrapiPriceUpdateJobService.RunAsync` | Sync completo: descobre/atualiza o universo de ativos, grava 1 linha de histórico diário por ativo, atualiza `CurrentPrice` e insere dividendos. No 1º run de cada ativo faz backfill do histórico. |
| `BrapiIntradayHostedService` | só entre **13:00–21:00** | a cada 15 min (alinhado a `:00/:15/:30/:45`) | `BrapiPriceUpdateJobService.RunIntradayAsync` | Atualiza `CurrentPrice` e grava 1 tick `MarketPriceIntraday` por ativo, durante o pregão da B3. Fora da janela, o tick é ignorado. |
| `BrapiCleanupHostedService` | **09:30** | a cada 1 dia | `BrapiCleanupJobService.RunAsync` | Deleta ticks `MarketPriceIntraday` com mais de 7 dias (`ExecuteDeleteAsync`). |

### Detalhe de cálculo do `initialDelay`

- **Recurring** (`ComputeDelayUntilNextMidnightUtc`): `now.Date.AddDays(1) - now`. Sempre a próxima meia-noite UTC — o primeiro run nunca acontece no mesmo dia, mesmo que a app suba 00:01.
- **PriceUpdate** (`ComputeDelayUntilNext19hUtc`): hoje às 19:00 se ainda não passou, senão amanhã às 19:00. Comentário no código justifica 19:00 UTC = 16:00 BRT, "após fechamento + after-market" para garantir que o último preço seja o close oficial. **O valor 19 está hardcoded no worker** (ver G1).
- **Cleanup** (`ComputeDelayUntilNextTarget`): hoje às `09:30` se ainda não passou, senão amanhã. Constantes `TargetHourUtc = 9`, `TargetMinuteUtc = 30` declaradas no próprio worker. Comentário: 30 min antes do pré-abertura da B3.
- **Intraday** (`ComputeDelayUntilNextSlot`): alinha o primeiro tick ao próximo múltiplo de 15 min do relógio (`:00/:15/:30/:45`). A janela de mercado é checada **no tick**, não no agendamento (o timer dispara 24h/dia; ticks fora da janela apenas retornam cedo).

### Janela de mercado do intraday

Constantes em `BrapiIntradayHostedService`: `MarketOpenUtc = 13`, `MarketCloseUtc = 21`. Gating: o tick é ignorado (`LogDebug` + `return`) se `nowUtc.Hour < 13 || nowUtc.Hour >= 21`. Ou seja, a janela efetiva é `[13:00, 21:00)` UTC = 10:00–18:00 BRT. Roda **todos os dias da semana** — não há checagem de dia útil nem de feriado (ver G5).

---

## 3. Trigger manual (API)

Controller: `AdminController` — rota base `api/admin`. Decorado com `[ApiController]` e `[Authorize]` (**qualquer usuário autenticado** pode chamar — não há gate de role/admin; ver G2). Injeta apenas `BrapiPriceUpdateJobService`.

| Método | Rota | Descrição | Resposta |
|---|---|---|---|
| `POST` | `/api/admin/brapi-job/run` | Dispara o job de price update **imediatamente**, em fire-and-forget (`_ = _jobService.RunAsync(...)`). Útil para popular histórico sem esperar o agendamento. | `202 Accepted` com `{ message, hint }` (mensagens em PT-BR) |
| `GET` | `/api/admin/brapi-job/status` | Lê o `LastStatus` do último run do job de price update. | `200 OK` com `BrapiJobStatusDto` |

Observações:
- **Só o job de price update** tem trigger/status manual. **Não há endpoint** para disparar ou consultar o job de recorrências, o intraday ou o cleanup (ver G3).
- O trigger manual chama `RunAsync` (sync completo), **não** `RunIntradayAsync`.
- Como é fire-and-forget e o `CancellationToken` da request é repassado, há risco de o token cancelar ao fim da request HTTP enquanto o job (que pode levar minutos no backfill) ainda roda (ver G4).
- O `AdminController` está sob a policy de rate limit `"general"` (100 req/min), igual aos demais controllers.

### `BrapiJobStatusDto`

`FinanceControl.Shared/Dtos/Response/Investment/BrapiJobStatusDto.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `IsRunning` | `bool` | `true` enquanto o run está em andamento |
| `StartedAt` | `DateTime?` | Início do run (UTC) |
| `FinishedAt` | `DateTime?` | Fim do run (UTC) |
| `LastRunAt` | `DateTime?` | "kept for compatibility" — setado = `StartedAt` |
| `AssetsDiscovered` | `int` | Novos ativos criados no sync do universo |
| `AssetsUpdated` | `int` | Ativos com preço atualizado |
| `DividendsInserted` | `int` | Dividendos novos inseridos |
| `ErrorCount` | `int` | Nº de erros acumulados |
| `Errors` | `List<string>` | Mensagens de erro (1 por batch/etapa que falhou) |

---

## 4. Regras de negócio

### RN-JOB-01 — Catch-up das recorrências
`RecurringTransactionJobService.ProcessRecurrenceAsync` calcula a última data já gerada (`MAX(TransactionDate)` das transações com aquele `RecurringTransactionId`). O ponto de partida é `NextOccurrenceAfter(rt.Recurrence, lastDate)` ou, se nunca houve instância, `rt.StartDate`. A partir daí, **enumera todas as datas** até `today` (inclusive) avançando pelo passo da recorrência. Assim, se a app ficou dias fora do ar, o run seguinte gera **todas** as ocorrências perdidas de uma vez. Se `startFrom > today`, retorna 0 (nada a fazer).

### RN-JOB-02 — Passo de recorrência (`NextOccurrenceAfter`)
`Daily` +1d · `WorkDay` próximo dia útil (pula sábado/domingo) · `Weekly` +7d · `Biweekly` +14d · `Monthly` +1 mês · `Quarterly` +3 meses · `Semiannually` +6 meses · `Annually` +1 ano. Default (inclui `None`) → +1 dia. `WorkDay` considera só fins de semana — **não trata feriados** (ver G6).

### RN-JOB-03 — Filtro de recorrências ativas
Só processa templates com `IsActive == true` **e** (`EndDate == null` **ou** `EndDate >= today`). Recorrências expiradas ou desativadas são ignoradas. O `EndDate` filtra na query, mas a janela de geração ainda usa o `<= today` da iteração — confirmar interação fina entre `EndDate` e a última ocorrência gerada (ver G7).

### RN-JOB-04 — Idempotência das recorrências
Antes de inserir, o job carrega num único query as datas já existentes para aquele `RecurringTransactionId` dentro do conjunto a gerar e monta um `HashSet<DateOnly>`. Datas já presentes são puladas. Logo, rodar o job duas vezes no mesmo dia **não** duplica transações. As novas transações são criadas com `PaymentType = Recurring` e herdam `UserId`, `BudgetId`, `SubCategoryId`, `AccountId`, `Value`, `Type`, `Description` do template.

### RN-JOB-05 — Isolamento de falha por recorrência
O loop sobre `activeRecurrences` envolve cada template num `try/catch`: um template que estoura é logado e adicionado a `errors`, mas **não interrompe** o processamento dos demais. Ao final, loga total de recorrências processadas, total gerado e contagem de erros (`LogWarning` com a lista se houver).

### RN-JOB-06 — First-run / backfill de histórico (Brapi)
Por batch, `HasAnyFirstRunAsync` verifica se **algum** ativo do batch ainda não tem nenhuma linha em `MarketPriceHistory`. Se sim (`isFirstRun = true`), a chamada à Brapi inclui `&range={BackfillRange}&interval=1d` (default `BackfillRange = "max"`) e o job grava **todo o histórico** retornado (deduplicando por data já existente). Caso contrário, grava apenas **1 linha** para `today` (se ainda não existir), usando o `CurrentPrice` corrente. **Atenção:** a flag é por batch, não por ativo — se qualquer ativo do batch for first-run, o range estendido é pedido para o batch inteiro (ver G8).

### RN-JOB-07 — Idempotência do histórico e dos ticks (Brapi)
- **Histórico diário (`MarketPriceHistory`)**: no first-run, deduplica contra o set de datas já existentes do ativo; no run normal, só insere se não existir linha para `today` (`AnyAsync`). 1 linha por ativo por dia.
- **Tick intraday (`MarketPriceIntraday`)**: o timestamp é truncado ao slot de 15 min (`now.Minute / 15 * 15`) e o insert só ocorre se não existir tick naquele slot para o ativo. Garante no máximo 1 tick por ativo por janela de 15 min, mesmo com ticks repetidos.
- **Dividendos (`InvestmentDividend`)**: deduplica por (`InvestmentId`, `PaymentDate`, `Type`). `JCP` vira `EnumDividendType.JurosCapitalProprio`, o resto vira `Dividend`. Dividendos são **por investimento** (por usuário): o job busca todos os `Investment` que apontam para o `MarketAsset` e insere o dividendo em cada um.

### RN-JOB-08 — Paralelismo com semáforo (Brapi)
Tanto `RunAsync` quanto `RunIntradayAsync` particionam os ativos em dois grupos — `QuoteAssetTypes` (Acao, FII, BDR, ETF, Stock, Reit, ETFInternacional, FundoInvestimento, Index) e `Cripto` — e os fatiam em batches de `BatchSize` (default 20). Os batches são processados em paralelo com `Task.WhenAll`, mas limitados por um `SemaphoreSlim(MaxParallelBatches)` (default 3) compartilhado entre os dois grupos. **Cada batch abre seu próprio scope + `ApplicationDbContext`** porque o `DbContext` não é thread-safe. O `BrapiJobStatusDto.Errors` é mutado sob `lock (status.Errors)`; já os incrementos de `AssetsUpdated`/`DividendsInserted` no caminho crypto **não** estão sob lock (ver G9).

### RN-JOB-09 — Resiliência de rede (Brapi)
Toda chamada externa passa por `FetchWithRetryAsync`: timeout de `TimeoutSeconds` (30s) por request; em qualquer exceção, espera `RetryDelayMinutes` (3 min) e **tenta uma única vez mais**. Se a segunda tentativa também falhar, o batch é marcado como erro (incrementa `ErrorCount`, adiciona a `Errors`) e é pulado — o run continua nos outros batches. O sync do universo de ativos tem try/catch próprio; a descoberta de cripto falha de forma "soft" (`LogWarning` e segue sem ela).

### RN-JOB-10 — Sync do universo de ativos (Brapi, só no `RunAsync`)
`SyncAssetUniverseAsync` pagina `/api/quote/list` (`limit=200`, até 2000 páginas de guarda, ou até `HasNextPage == false`) e faz **upsert** de cada ativo (nome, tipo via `MapAssetType`, logo, `CurrentPrice` derivado de `close`). Semeia os índices benchmark `^BVSP` (Ibovespa) e `IFIX`, e descobre criptomoedas via `/api/v2/crypto/available`. Esse passo **não roda** no `RunIntradayAsync` (intraday assume que o universo já existe).

### RN-JOB-11 — Retenção / cleanup do intraday
`BrapiCleanupJobService` usa `IntradayRetentionDays = 7` (constante hardcoded). Calcula `cutoff = UtcNow.AddDays(-7)` e executa `MarketPriceIntradays.Where(h => h.Timestamp < cutoff).ExecuteDeleteAsync()` — delete em massa direto no banco, sem materializar entidades. Loga a contagem deletada. Mantém ~7 dias de ticks intraday; o histórico diário (`MarketPriceHistory`) **nunca** é apagado.

### RN-JOB-12 — Tracking de `LastStatus`
Somente `BrapiPriceUpdateJobService` expõe `LastStatus` (`BrapiJobStatusDto`, propriedade pública). É atribuído no início do `RunAsync` (com `IsRunning = true`) e ao final (com `IsRunning = false`, `FinishedAt` setado), e é o que o `AdminController` retorna. **`RunIntradayAsync` constrói um `status` local mas nunca o atribui a `LastStatus`** — runs intraday não aparecem no endpoint de status (ver G10). `RecurringTransactionJobService` e `BrapiCleanupJobService` **não têm `LastStatus`** — seu único feedback é o log.

### RN-JOB-13 — Sufixo `.SA` da Brapi
`FindAssetBySymbolAsync` (caminho quote) tenta casar o símbolo exato; se não achar e o símbolo terminar em `.SA` (ex.: `IFIX.SA`), tenta de novo com o sufixo removido. O caminho crypto casa direto por `Ticker == coin.Coin`, sem esse fallback.

### RN-JOB-14 — Sem guarda de sobreposição (overlap)
Nenhum worker impede que um run comece enquanto o anterior ainda roda. O `OnTimerTick` apenas dispara `_ = RunJobAsync()`. Se um run de price update (que pode levar minutos no backfill) ultrapassar o próximo tick, **dois runs podem rodar concorrentemente** (mais provável no intraday, com janela de 15 min). A idempotência (RN-JOB-04, RN-JOB-07) mitiga duplicação de dados, mas não a carga duplicada na Brapi (ver G11).

---

## 5. Front (Web)

**Não há UI de administração de jobs no app web.** Buscas por `api/admin`, `brapi-job/run` e `brapi-job/status` em `apps/web` não retornaram nenhuma ocorrência, e não existe rota/página `admin`. O trigger manual (`POST /api/admin/brapi-job/run`) e o status (`GET /api/admin/brapi-job/status`) são acionáveis apenas via chamada direta à API (Swagger/curl/Postman).

Os **dados produzidos** por estes jobs (preços de ativos, histórico, dividendos, recorrências geradas) são consumidos pelas telas de Investimentos, Mercado, Simulação e Recorrências — mas o agendamento/execução em si não tem superfície no front.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- App offline por dias → recorrências fazem catch-up de todas as datas perdidas no run seguinte (RN-JOB-01).
- Job rodado 2x no mesmo dia → sem duplicar transações nem histórico/ticks (RN-JOB-04, RN-JOB-07).
- Falha de rede na Brapi → 1 retry após 3 min; batch que falha é pulado sem derrubar o run (RN-JOB-09).
- Tick intraday fora do pregão → ignorado (RN-JOB-08 gating do worker).
- Exceção não tratada no job → logada, host segue de pé (padrão `RunJobAsync`).
- Símbolo com sufixo `.SA` → resolvido por fallback (RN-JOB-13).

### Gaps / dúvidas a confirmar

- **G1 — Horário do price update hardcoded vs. config ignorada:** `BrapiSettings.TargetHourUtc` existe (default `19` na classe, **`22`** em `appsettings.json`), mas **nenhum worker o lê**. `BrapiPriceUpdateHostedService.ComputeDelayUntilNext19hUtc()` fixa `19` em código. Resultado: o `TargetHourUtc` do appsettings (22) é morto e enganoso. Decidir se o schedule deve passar a respeitar a config ou se o campo deve ser removido.
- **G2 — `AdminController` sem gate de admin:** decorado só com `[Authorize]` — **qualquer usuário logado** pode disparar o sync global da Brapi (operação cara, fire-and-forget) e ler o status. Não há checagem de role/claim de administrador. Confirmar se isso é intencional ou se falta uma policy de autorização.
- **G3 — Trigger/status só para 1 dos 4 jobs:** não há endpoint manual nem status para o job de **recorrências**, o **intraday** ou o **cleanup**. Confirmar se é desejado expor trigger/status dos demais.
- **G4 — Fire-and-forget com token da request:** `RunBrapiJob` faz `_ = _jobService.RunAsync(cancellationToken)` passando o `CancellationToken` da request HTTP. Quando a request termina (202 imediato), esse token pode ser cancelado e abortar o job no meio do backfill. Provavelmente deveria usar `CancellationToken.None` (ou um token de aplicação).
- **G5 — Intraday roda em dias não úteis:** a janela só checa hora (`13–21h UTC`), não dia da semana nem feriado da B3. Em sábados/domingos/feriados o job dispara, bate na Brapi e grava ticks sem pregão (preços parados). Confirmar se há custo/limite de API a evitar.
- **G6 — `WorkDay` não trata feriados:** `NextWorkDay` pula só sábado/domingo. Recorrências `WorkDay` cairão em feriados nacionais/bancários. Confirmar se feriados importam para o domínio.
- **G7 — Interação `EndDate` × catch-up:** o filtro usa `EndDate >= today`, mas a geração itera `current <= today`. Para uma recorrência com `EndDate` no passado recente porém `>= today` falso, ela some do processamento; já uma com `EndDate` futuro gera normalmente. Não há corte explícito de `current > EndDate` dentro do loop de datas — confirmar se ocorrências podem ser geradas além do `EndDate` quando `EndDate` cai entre a última gerada e `today`.
- **G8 — `isFirstRun` por batch, não por ativo:** se um único ativo do batch nunca teve histórico, o `range=max&interval=1d` é pedido para os ~20 ativos do batch, baixando histórico completo de todos (inclusive os que só precisariam de 1 dia) — porém o upsert deduplica por data, então não duplica, apenas aumenta o payload/custo. Confirmar se vale tornar a decisão por ativo.
- **G9 — Mutação de status sem lock no caminho crypto:** `ProcessQuoteBatchAsync` incrementa `status.AssetsUpdated` sob `lock (status.Errors)`, mas `ProcessCryptoBatchAsync` faz `status.AssetsUpdated++` e `status.DividendsInserted++` **sem lock**, apesar de batches rodarem em paralelo. Possível contagem subestimada por race. Confirmar/alinhar a estratégia de sincronização.
- **G10 — Status do intraday não persiste:** `RunIntradayAsync` monta um `BrapiJobStatusDto` local mas **não** atribui a `LastStatus` (só `RunAsync` faz). O endpoint `GET /api/admin/brapi-job/status` nunca reflete runs intraday. Confirmar se é esperado.
- **G11 — Sem guarda de sobreposição:** runs podem se sobrepor (RN-JOB-14), em especial o intraday se um run passar de 15 min. Idempotência evita dados duplicados, mas não chamadas duplicadas à Brapi (limite/custo). Avaliar um flag de "já rodando" / `SemaphoreSlim` de nível de job.
- **G12 — Specs de modelo de dados referenciadas ainda não existem:** este spec aponta para `specs/recurrences.md` e `specs/market-data.md` (modelo de `RecurringTransaction`, `MarketAsset`, `MarketPriceHistory`, `MarketPriceIntraday`), mas no momento da sincronização **só existe `specs/transactions.md`** em `.claude/specs/`. Criar as specs de destino ou ajustar os links.
- **G13 — Sem persistência de histórico de execução:** não há tabela de "job run log". `LastStatus` é só o último run em memória e some no restart da app. Confirmar se é aceitável ou se falta auditoria/observabilidade.

---

## 7. Arquivos de referência

**Workers (agendamento)**
- `FinanceControl.Workers/RecurringTransactionHostedService.cs`
- `FinanceControl.Workers/BrapiPriceUpdateHostedService.cs`
- `FinanceControl.Workers/BrapiIntradayHostedService.cs`
- `FinanceControl.Workers/BrapiCleanupHostedService.cs`

**Job services (lógica)**
- `FinanceControl.Services/Services/RecurringTransactionJobService.cs`
- `FinanceControl.Services/Brapi/BrapiPriceUpdateJobService.cs`
- `FinanceControl.Services/Brapi/BrapiCleanupJobService.cs`
- `FinanceControl.Services/Brapi/BrapiSettings.cs`
- `FinanceControl.Services/Brapi/BrapiAssetListResponse.cs`, `BrapiQuoteResponse.cs`, `BrapiCryptoResponse.cs`, `BrapiCryptoAvailableResponse.cs` (DTOs de resposta da Brapi)

**API / DI / config**
- `FinanceControl.WebApi/Controllers/AdminController.cs`
- `FinanceControl.WebApi/Program.cs` (registro dos hosted services — linhas 30–33)
- `FinanceControl.Services/Extensions/ServicesExtensions.cs` (registro dos job services como `Singleton` + `Configure<BrapiSettings>`)
- `FinanceControl.WebApi/appsettings.json` (seção `BrapiSettings`)
- `FinanceControl.Shared/Dtos/Response/Investment/BrapiJobStatusDto.cs`

**Modelo de dados (specs correlatas)**
- `specs/transactions.md` — entidade `Transaction` gerada pelo job de recorrências.
- `specs/recurrences.md` — entidade `RecurringTransaction` (**a criar — ver G12**).
- `specs/market-data.md` — `MarketAsset`, `MarketPriceHistory`, `MarketPriceIntraday`, `InvestmentDividend` (**a criar — ver G12**).
