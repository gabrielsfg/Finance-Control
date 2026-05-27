# Plano de Implementação — Integração Brapi

> Gerado em 2026-05-19. Todas as decisões estão tomadas. Este documento é a referência para execução.

---

## Contexto rápido

O job busca cotações da Brapi **1x por dia às 22h UTC (19h BRT)**, após o fechamento da B3.  
Roda como `IHostedService` dentro da própria WebApi — sem container separado.  
Paralelismo: lotes de 10 tickers, 3 lotes simultâneos (`SemaphoreSlim(3)` + `Task.WhenAll`).  
Retry: lote que falha aguarda 3 minutos e tenta mais 1 vez. Se falhar novamente, loga e segue.

---

## Separação de responsabilidades: dados de mercado vs. posição do usuário

Este plano trata de **dois domínios distintos**:

### 1. Dados de mercado — globais, sem dono

`InvestmentPriceHistory` armazena o histórico de preços de um ativo **como dado de mercado global** — não pertence a nenhum usuário específico. Por isso herda de `BaseEntity` (sem `UserId`). O mesmo ativo (ex: `PETR4`) aparece uma única vez no sistema; vários usuários compartilham os mesmos registros de preço. O job da Brapi atualiza esses dados uma vez por dia para todos.

### 2. Posição do usuário — quanto cada um tem investido

`Investment` representa a posição que **um usuário específico** tem em um ativo — quantidade, preço médio, corretora. Herda de `OwnedEntity` (tem `UserId`). Cada usuário tem seu próprio registro de `Investment` para `PETR4`, independente do preço de mercado que é compartilhado.

A separação futura a implementar é: criar uma tabela de **ativos de mercado** (sem `UserId`, dados da Brapi) e manter `Investment` como a **posição do usuário naquele ativo** (com `UserId`, dados do próprio usuário). Isso evita duplicar dados de mercado (nome, logo, tipo de ativo, histórico de preços) para cada usuário que possui o mesmo ticker.

> **Resumo:** Brapi alimenta dados de mercado (globais). O usuário registra quanto ele tem de cada ativo (individual). São tabelas e lógicas separadas.

---

## Convenções do projeto (não alterar)

- Toda entidade herda de `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt?`) ou `OwnedEntity` (`BaseEntity` + `UserId`)
- `CreatedAt`/`UpdatedAt` são gerenciados automaticamente pelo `ApplicationDbContext.UpdateOrCreateEntity()`
- Valores monetários: `long` em centavos. Conversão da Brapi: `(long)Math.Round(price * 100)`
- Uma tabela por hierarquia — sem tabelas separadas por tipo de ativo
- `InvestmentPriceHistory` **é o log de variação de preços** — série temporal diária, suficiente para derivar qualquer variação histórica sem tabela de auditoria separada

---

## CAMADA 1 — Domain

### 1.1 Alterar `Investment.cs`

Herda de `OwnedEntity` (já tem `Id`, `CreatedAt`, `UpdatedAt?`, `UserId`).

Adicionar dois campos:

```csharp
public string? LogoUrl { get; set; }
public string Currency { get; set; } = "BRL";
```

`Currency` é necessário para ativos internacionais (`Stock`, `Reit`, `ETFInternacional`) que são cotados em USD.  
`LogoUrl` vem da Brapi (`logourl` para ações, `coinImageUrl` para cripto) — mapeamento transparente no job.

---

### 1.2 Alterar `InvestmentDividend.cs`

Herda de `OwnedEntity` (já tem `Id`, `CreatedAt`, `UpdatedAt?`, `UserId`).

Remover o campo genérico `Date` e substituir pelos dois campos de data que a Brapi retorna, com os mesmos nomes:

```
REMOVER:
  DateOnly Date

ADICIONAR:
  DateOnly? PaymentDate    — data em que o dinheiro cai na conta
  DateOnly? LastDatePrior  — último dia para ter direito ao dividendo (data "com")
```

Ambos nullable porque dividendos inseridos manualmente pelo usuário podem não ter as duas datas, e dividendos automáticos da Brapi podem ter apenas uma delas preenchida.

---

### 1.3 Nova entidade `InvestmentPriceHistory.cs`

Herda de `BaseEntity` (tem `Id`, `CreatedAt`, `UpdatedAt?`).  
**Não herda de `OwnedEntity` e não tem `UserId`** — histórico de preço é um dado de mercado global. O mesmo registro de preço de `PETR4` em uma data é compartilhado por todos os usuários que possuem esse ativo. Cada usuário tem seu próprio `Investment` (posição), mas o preço de mercado é único por ativo por dia.

```csharp
public class InvestmentPriceHistory : BaseEntity
{
    public int InvestmentId { get; set; }
    public DateOnly Date { get; set; }
    public long Price { get; set; }       // centavos

    public Investment Investment { get; set; } = null!;
}
```

Esta tabela é o **log histórico de preços**. O job insere 1 linha por ativo por dia. A partir dela é possível:
- Gráficos de evolução da carteira
- Rentabilidade histórica por ativo
- Comparação com CDI/IBOV nas simulações
- Derivar qualquer variação de preço (preço[D] - preço[D-1])

Índice único em `(InvestmentId, Date)` — garante idempotência se o job rodar duas vezes no mesmo dia.

**Backfill no primeiro run:** quando um ativo não tem nenhum registro em `InvestmentPriceHistory`, o job busca `range=1y&interval=1d` para popular o último ano de uma vez. Runs subsequentes buscam apenas o dia corrente. Se ficarem faltando tokens para o backfill completo de todos os ativos no primeiro mês, o job continua o retroativo nos dias seguintes para os ativos ainda sem histórico.

---

## CAMADA 2 — Data

### 2.1 Novos/alterados Mappings

**`InvestmentMap.cs`** — adicionar mapeamento dos novos campos:
```
LogoUrl  → coluna text nullable
Currency → coluna text not null, default "BRL"
```

**`InvestmentDividendMap.cs`** — alterar mapeamento de datas:
```
Remover: Date
Adicionar: PaymentDate (date nullable), LastDatePrior (date nullable)
```

**`InvestmentPriceHistoryMap.cs`** — novo arquivo:
```
Tabela: InvestmentPriceHistories
Colunas: Id, InvestmentId (FK → Investments, cascade delete), Date (date), Price (bigint), CreatedAt, UpdatedAt
Índice único: (InvestmentId, Date)
FK navigation: Investment
```

### 2.2 Alterar `ApplicationDbContext.cs`

```csharp
public DbSet<InvestmentPriceHistory> InvestmentPriceHistories { get; set; }
```

### 2.3 Migrations (você executa manualmente)

Três migrations a criar nessa ordem:

| # | Nome sugerido | O que faz |
|---|---------------|-----------|
| 1 | `AddBrapiFieldsToInvestment` | Adiciona `LogoUrl` (text nullable) e `Currency` (text, default 'BRL') em `Investments` |
| 2 | `RefactorInvestmentDividendDates` | Remove coluna `Date`, adiciona `PaymentDate` (date nullable) e `LastDatePrior` (date nullable) em `InvestmentDividends` |
| 3 | `CreateInvestmentPriceHistory` | Cria tabela `InvestmentPriceHistories` com índice único `(InvestmentId, Date)` |

> **Atenção na migration 2:** a coluna `Date` tem dados existentes. Decidir antes de rodar se os dados existentes vão para `PaymentDate` ou serão descartados.

---

## CAMADA 3 — Shared (DTOs)

### 3.1 Alterar DTOs existentes

**`InvestmentDto.cs`** — adicionar:
```csharp
public string? LogoUrl { get; set; }
public string Currency { get; set; } = "BRL";
```

**`InvestmentDividendDto.cs`** — alterar:
```
REMOVER: DateOnly Date
ADICIONAR:
  DateOnly? PaymentDate
  DateOnly? LastDatePrior
```

**`CreateInvestmentDividendRequestDto.cs`** — alterar:
```
REMOVER: DateOnly Date
ADICIONAR:
  DateOnly? PaymentDate
  DateOnly? LastDatePrior
```

### 3.2 Novos DTOs

**`InvestmentPriceHistoryDto.cs`** (Response):
```csharp
public class InvestmentPriceHistoryDto
{
    public DateOnly Date { get; set; }
    public long Price { get; set; }
}
```

**`BrapiJobStatusDto.cs`** (Response — retornado pelo endpoint de status):
```csharp
public class BrapiJobStatusDto
{
    public DateTime? LastRunAt { get; set; }
    public int AssetsUpdated { get; set; }
    public int DividendsInserted { get; set; }
    public int ErrorCount { get; set; }
    public List<string> Errors { get; set; } = [];
}
```

### 3.3 DTOs internos do job (não expostos ao frontend)

Ficam em `FinanceControl.Services/Brapi/` — usados apenas para deserializar a resposta da Brapi:

**Para `/api/quote/{tickers}`:**
```csharp
record BrapiQuoteResponse(List<BrapiQuoteResult> Results, DateTime RequestedAt, int Took);

record BrapiQuoteResult(
    string Symbol,
    string Currency,
    string? LogoUrl,           // campo "logourl" na API
    decimal? RegularMarketPrice,
    DateTime? RegularMarketTime,
    BrapiDividendsData? DividendsData,
    List<BrapiHistoricalPrice>? HistoricalDataPrice
);

record BrapiDividendsData(List<BrapiCashDividend> CashDividends);

record BrapiCashDividend(
    string? PaymentDate,       // "paymentDate" — string ISO na API
    string? LastDatePrior,     // "lastDatePrior" — string ISO na API
    decimal Rate,              // valor por ação (em BRL, não centavos)
    string Label               // "DIVIDENDO" | "JCP"
);

record BrapiHistoricalPrice(
    long Date,                 // timestamp UNIX
    decimal? Close
);
```

**Para `/api/v2/crypto`:**
```csharp
record BrapiCryptoResponse(List<BrapiCryptoCoin> Coins, DateTime RequestedAt, int Took);

record BrapiCryptoCoin(
    string Coin,
    string Currency,
    string? CoinImageUrl,      // campo "coinImageUrl" na API → salvo em LogoUrl
    decimal? RegularMarketPrice,
    DateTime? RegularMarketTime,
    List<BrapiHistoricalPrice>? HistoricalDataPrice
);
```

---

## CAMADA 4 — Services

### 4.1 Nova classe `BrapiSettings.cs`

```csharp
public class BrapiSettings
{
    public string Token { get; set; } = string.Empty;
    public int BatchSize { get; set; } = 10;           // limite do plano Startup
    public int MaxParallelBatches { get; set; } = 3;
    public int TimeoutSeconds { get; set; } = 30;
    public int RetryDelayMinutes { get; set; } = 3;
    public int TargetHourUtc { get; set; } = 22;
}
```

### 4.2 Novo `BrapiPriceUpdateJobService.cs`

Lógica principal do job. Usa `IServiceScopeFactory` (mesmo padrão do job de recorrências).

**Fluxo completo:**

```
1. Abrir scope → buscar ApplicationDbContext
2. Buscar todos Investment com AssetType elegível:
   quoteGroup  → Acao, FII, BDR, ETF, Stock, Reit, ETFInternacional
   cryptoGroup → Cripto
   (TesouroDireto, RendaFixa, FundoInvestimento, Outro → ignorar)

3. Para cada grupo → Chunk(BatchSize=10)

4. Task.WhenAll com SemaphoreSlim(MaxParallelBatches=3):
   Para cada lote:
     a. Verificar se algum ativo do lote é "primeiro run"
        (SELECT COUNT(*) FROM InvestmentPriceHistories WHERE InvestmentId = X) = 0
     b. Montar URL:
        - Primeiro run de algum ativo no lote: range=1y&interval=1d&dividends=true
        - Runs subsequentes: dividends=true (sem range)
     c. Chamar Brapi com timeout configurado
     d. Se falhar (timeout/429/5xx):
        - Aguardar RetryDelayMinutes (3 min)
        - Tentar 1 vez mais
        - Se falhar novamente: logar erro e continuar (não travar o job)
     e. Para cada ativo na resposta:
        - Atualizar Investment: CurrentPrice, LogoUrl, Currency, LastPriceUpdate
        - Inserir em InvestmentPriceHistories (ON CONFLICT DO NOTHING por índice único)
          * Para primeiro run: inserir todas as linhas do historicalDataPrice[]
          * Para runs normais: inserir apenas o dia corrente
        - Para cada cashDividend em dividendsData:
          * Verificar se já existe: SELECT WHERE InvestmentId = X AND PaymentDate = Y AND Type = Z
          * Se não existir: inserir em InvestmentDividends

5. Logar resultado: ativos atualizados, linhas de histórico inseridas, dividendos inseridos, erros
```

**Mapeamento de `label` da Brapi → `EnumDividendType`:**
```
"DIVIDENDO"  → EnumDividendType.Dividend
"JCP"        → EnumDividendType.JurosCapitalProprio
(outros)     → EnumDividendType.Dividend  (fallback)
```

> Dividendos inseridos automaticamente pelo job **não geram `LinkedTransaction`** — o campo fica `null`. Apenas dividendos registrados manualmente pelo usuário (via `RegisterDividendAsync`) geram a transação financeira vinculada na conta.

### 4.3 Novo `BrapiPriceUpdateHostedService.cs`

Mesmo padrão de `RecurringTransactionHostedService`:

```csharp
// Timer inicial: tempo até 22h UTC do próximo ciclo
// Período: TimeSpan.FromDays(1)

private static TimeSpan ComputeDelayUntilNext22hUtc()
{
    var now = DateTime.UtcNow;
    var todayAt22h = now.Date.AddHours(22);
    var target = now < todayAt22h ? todayAt22h : todayAt22h.AddDays(1);
    return target - now;
}
```

### 4.4 Alterar `InvestmentService.cs`

- `MapToDto` → incluir `LogoUrl` e `Currency`
- `GetDividendsAsync` → retornar `PaymentDate` e `LastDatePrior` em vez de `Date`
- `RegisterDividendAsync` → aceitar `PaymentDate`/`LastDatePrior`; usar `PaymentDate ?? DateTime.UtcNow` como data da `LinkedTransaction`
- Adicionar novo método:

```csharp
Task<List<InvestmentPriceHistoryDto>> GetPriceHistoryAsync(int investmentId, int userId);
```

Retorna todas as linhas de `InvestmentPriceHistories` do ativo, ordenadas por `Date ASC`.

### 4.5 Alterar `IInvestmentService.cs`

Adicionar assinatura:
```csharp
Task<List<InvestmentPriceHistoryDto>> GetPriceHistoryAsync(int investmentId, int userId);
```

### 4.6 Alterar `ServicesExtensions.cs`

```csharp
services.Configure<BrapiSettings>(configuration.GetSection("BrapiSettings"));
services.AddSingleton<BrapiPriceUpdateJobService>();
services.AddHostedService<BrapiPriceUpdateHostedService>();
```

`AddAplicationServices` precisa receber `IConfiguration configuration` como parâmetro, ou a configuração pode ser lida via `IOptions<BrapiSettings>` no próprio job.

---

## CAMADA 5 — WebApi

### 5.1 Alterar `InvestmentController.cs`

Adicionar endpoint:

```
GET /api/investment/{id}/price-history
→ IInvestmentService.GetPriceHistoryAsync(id, userId)
→ retorna List<InvestmentPriceHistoryDto>
```

Mesmo padrão dos outros endpoints do controller: validar `id > 0`, tratar `KeyNotFoundException` com 404.

### 5.2 Alterar `appsettings.json`

Adicionar seção:

```json
"BrapiSettings": {
  "Token": "",
  "BatchSize": 10,
  "MaxParallelBatches": 3,
  "TimeoutSeconds": 30,
  "RetryDelayMinutes": 3,
  "TargetHourUtc": 22
}
```

O `Token` fica vazio no `appsettings.json` e é preenchido via variável de ambiente ou `appsettings.Development.json` (nunca commitar o token).

---

## Resumo de todos os arquivos

| Arquivo | Ação | Camada |
|---------|------|--------|
| `Investment.cs` | Alterar — +`LogoUrl`, +`Currency` | Domain |
| `InvestmentDividend.cs` | Alterar — remover `Date`, +`PaymentDate`, +`LastDatePrior` | Domain |
| `InvestmentPriceHistory.cs` | **Novo** | Domain |
| `InvestmentMap.cs` | **Novo** | Data |
| `InvestmentDividendMap.cs` | **Novo** | Data |
| `InvestmentPriceHistoryMap.cs` | **Novo** | Data |
| `ApplicationDbContext.cs` | Alterar — +`DbSet<InvestmentPriceHistory>` | Data |
| Migration 1 — `AddBrapiFieldsToInvestment` | **Nova** (você roda) | Data |
| Migration 2 — `RefactorInvestmentDividendDates` | **Nova** (você roda) | Data |
| Migration 3 — `CreateInvestmentPriceHistory` | **Nova** (você roda) | Data |
| `InvestmentDto.cs` | Alterar — +`LogoUrl`, +`Currency` | Shared |
| `InvestmentDividendDto.cs` | Alterar — datas | Shared |
| `CreateInvestmentDividendRequestDto.cs` | Alterar — datas | Shared |
| `InvestmentPriceHistoryDto.cs` | **Novo** | Shared |
| `BrapiJobStatusDto.cs` | **Novo** | Shared |
| `BrapiSettings.cs` | **Novo** | Services |
| `Brapi/BrapiQuoteResponse.cs` (+ internos) | **Novo** | Services |
| `Brapi/BrapiCryptoResponse.cs` (+ internos) | **Novo** | Services |
| `BrapiPriceUpdateJobService.cs` | **Novo** | Services |
| `BrapiPriceUpdateHostedService.cs` | **Novo** | Services |
| `InvestmentService.cs` | Alterar — +método, mapeamentos, datas | Services |
| `IInvestmentService.cs` | Alterar — +assinatura | Services |
| `ServicesExtensions.cs` | Alterar — +3 registros | Services |
| `InvestmentController.cs` | Alterar — +endpoint `/price-history` | WebApi |
| `appsettings.json` | Alterar — +seção `BrapiSettings` | WebApi |

**Total: 9 arquivos alterados · 13 arquivos novos · 3 migrations**

---

## Ordem de execução recomendada

1. Domain — entidades (`Investment`, `InvestmentDividend`, `InvestmentPriceHistory`)
2. Data — mappings + DbContext + migrations (você roda as 3 em sequência)
3. Shared — DTOs (alterar existentes + criar novos)
4. Services — `BrapiSettings` → DTOs internos → `JobService` → `HostedService` → alterações no `InvestmentService` + interface
5. WebApi — controller + appsettings
