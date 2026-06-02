# Portfolio Simulator — Plano de Implementação

## Visão Geral

Adicionar uma sexta aba "Carteira" na tela de Simulações com duas sub-abas:

- **Backtest de Carteira** — simula o desempenho histórico real de uma carteira composta por N ativos com pesos definidos pelo usuário
- **Projeção de Carteira** — projeta o crescimento futuro da carteira usando juros compostos com taxa por ativo (histórica ou manual)

A feature é uma extensão direta das simulações existentes: reutiliza o motor de cálculo do `HistoricalSimulator` (backend) e o `simulateMonthly()` do `taxCalc.ts` (frontend), adicionando a camada de alocação/pesos por cima.

---

## Feature Detalhada

### Sub-aba 1: Backtest de Carteira

O usuário monta uma carteira com N ativos (qualquer ticker disponível no banco ou benchmark fixo como CDI/IBOVESPA), define o peso percentual de cada um (soma = 100%), e escolhe o período. O sistema simula mês a mês o retorno ponderado da carteira com base nos dados históricos reais.

**Como funciona o cálculo:**

Para cada mês `t`:
```
retorno_carteira(t) = Σ (peso_i × retorno_i(t))
```

O valor da carteira evolui assim:
```
valor(t) = valor(t-1) × (1 + retorno_carteira(t)) + aporte_mensal
```

O `aporte_mensal` é distribuído entre os ativos pelos mesmos pesos (rebalanceamento implícito a cada mês).

**Saídas:**
- Gráfico de linha: valor da carteira vs valor investido ao longo do tempo
- Comparação opcional com 1 benchmark (CDI, IBOVESPA, etc.)
- Retorno anualizado (CAGR) da carteira
- Retorno de cada ativo individualmente no período
- Tabela paginada com breakdown mensal

**Indicação de dados parciais:** se algum ativo não tiver dados para o período completo, o sistema reduz automaticamente o range para o intervalo com cobertura total de todos os ativos, e exibe um aviso.

---

### Sub-aba 2: Projeção de Carteira

O usuário monta a carteira com N ativos, define a taxa anual de cada ativo (pode usar o retorno histórico como sugestão ou editar manualmente), e projeta o crescimento futuro.

**Como funciona o cálculo:**

Para cada mês, aplica `simulateMonthly()` por ativo com seu peso:
```
valor_ativo_i(t) = valor_ativo_i(t-1) × (1 + taxa_mensal_i) + aporte_i
```

onde `aporte_i = aporte_total × peso_i`.

O valor total da carteira = Σ valor_ativo_i(t).

Impostos são calculados por ativo de acordo com a categoria fiscal (renda fixa, ações, FII, etc.) — o mesmo mecanismo do `CompoundInterestSimulator` existente.

**Saídas:**
- Gráfico de área empilhado: composição da carteira ao longo do tempo por ativo
- Valor final bruto e líquido (após impostos por categoria)
- Taxa anualizada composta da carteira
- Tabela anual com breakdown por ativo

---

## Arquitetura Técnica

### Frontend

#### Novo componente: `PortfolioSimulator.tsx`
Local: `apps/web/src/features/simulations/components/PortfolioSimulator.tsx`

Estrutura interna:
```
PortfolioSimulator
├── sub-tabs: ["backtest", "projection"]
├── PortfolioBuilder (componente compartilhado)
│   ├── AssetRow × N (ticker picker, peso %, taxa anual — só na projeção)
│   ├── Botão "Adicionar Ativo"
│   └── Validação: soma dos pesos = 100%
├── [backtest]  PortfolioBacktest
│   ├── MonthRangePicker (já existe no HistoricalSimulator)
│   ├── Input: aporte mensal inicial (opcional)
│   └── Chart + Tabela
└── [projection] PortfolioProjection
    ├── Input: período (meses), aporte mensal total
    └── Chart empilhado + Tabela anual
```

**Estado compartilhado da carteira:** o `PortfolioSimulator` mantém a lista de ativos e pesos em estado local. Ao trocar de sub-aba, a carteira persiste.

#### Novos tipos: `apps/web/src/lib/types/simulation.ts`

```typescript
type PortfolioAsset = {
  ticker: string;
  name: string;
  weightPct: number;       // 0–100, soma = 100
  annualRatePct?: number;  // só na projeção; undefined = usar histórico
  category: AssetCategory; // para cálculo de imposto na projeção
};

type PortfolioBacktestResult = {
  points: PortfolioBacktestPoint[];
  totalInvested: number;  // cents
  finalValue: number;     // cents
  annualizedReturnPct: number;
  assetReturns: { ticker: string; totalReturnPct: number }[];
  dataNote?: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
};

type PortfolioBacktestPoint = {
  label: string;
  month: number;
  year: number;
  invested: number;
  value: number;
  monthlyReturnPct: number;
};
```

#### Novo hook: `usePortfolioBacktest()`
Em `apps/web/src/features/simulations/hooks/useSimulation.ts`:

```typescript
export const usePortfolioBacktest = () =>
  useMutation({
    mutationFn: (req: PortfolioBacktestRequest) =>
      simulationApi.portfolioBacktest(req),
  });
```

#### Nova função API: `apps/web/src/lib/api/simulation.ts`

```typescript
portfolioBacktest: async (req: PortfolioBacktestRequest) => {
  const { data } = await api.post<PortfolioBacktestResult>(
    '/simulation/portfolio/backtest', req
  );
  return data;
};
```

A **projeção de carteira** é calculada inteiramente no frontend — sem chamada de API — usando o `simulateMonthly()` existente por ativo, depois somando os valores. Mesma abordagem do `CompoundInterestSimulator`.

---

### Backend

#### Novo endpoint: `POST /simulation/portfolio/backtest`

**Request body:**
```json
{
  "assets": [
    { "ticker": "PETR4", "weightPct": 40 },
    { "ticker": "CDI",   "weightPct": 30 },
    { "ticker": "IVVB11","weightPct": 30 }
  ],
  "startDate": "2022-01-01",
  "endDate":   "2024-12-31",
  "monthlyContribution": 50000,
  "initialAmount": 1000000
}
```

**Response:** `PortfolioBacktestDto` (ver abaixo)

#### Novo método na interface `ISimulationService.cs`:

```csharp
Task<PortfolioBacktestDto> GetPortfolioBacktestAsync(
    IReadOnlyList<PortfolioAssetInput> assets,
    DateOnly startDate,
    DateOnly endDate,
    long monthlyContribution,
    long initialAmount
);
```

#### Lógica em `SimulationService.cs`:

1. Para cada ativo, busca retornos mensais via `GetMonthlyReturnsForBenchmarkAsync()` — o mesmo método já usado pelo `HistoricalSimulator`. CDI/SELIC/IPCA+X → BACEN. IBOVESPA/IFIX/SP500_BRL → Brapi. Qualquer outro → DB.
2. Encontra o intervalo com cobertura total (interseção de todos os meses com dados para todos os ativos).
3. Loop mês a mês:
   ```csharp
   // retorno ponderado da carteira naquele mês
   var weightedReturn = assets.Sum(a => a.WeightPct/100.0 * monthlyReturns[a.Ticker][month]);
   value = value * (1 + weightedReturn/100) + monthlyContribution;
   ```
4. Calcula CAGR final e retorno individual por ativo.
5. Retorna `PortfolioBacktestDto`.

#### Novos DTOs: `FinanceControl.Shared/Dtos/`

```csharp
// Request
public record PortfolioAssetInput(string Ticker, double WeightPct);
public record PortfolioBacktestRequestDto(
    IReadOnlyList<PortfolioAssetInput> Assets,
    DateOnly StartDate,
    DateOnly EndDate,
    long MonthlyContribution,
    long InitialAmount
);

// Response
public record PortfolioBacktestPointDto(
    string Label, int Month, int Year,
    long Invested, long Value,
    double MonthlyReturnPct
);
public record PortfolioAssetReturnDto(string Ticker, double TotalReturnPct);
public record PortfolioBacktestDto(
    IReadOnlyList<PortfolioBacktestPointDto> Points,
    IReadOnlyList<PortfolioAssetReturnDto> AssetReturns,
    long TotalInvested,
    long FinalValue,
    double AnnualizedReturnPct,
    string EffectiveStartDate,
    string EffectiveEndDate,
    bool IsPartialData,
    string? DataNote
);
```

---

## UX — Montagem de Carteira

O `PortfolioBuilder` é o componente central. Cada linha de ativo tem:

| Campo | Backtest | Projeção |
|-------|----------|----------|
| Ticker (search/select) | ✅ | ✅ |
| Nome do ativo | ✅ (readonly) | ✅ (readonly) |
| Peso % | ✅ | ✅ |
| Categoria fiscal | — | ✅ |
| Taxa anual (%) | — | ✅ (pré-preenchida com CAGR histórico) |

**Validações:**
- Mínimo 2 ativos, máximo 10
- Soma dos pesos deve ser exatamente 100% (barra de progresso visual)
- Peso mínimo por ativo: 1%
- Ticker inválido ou sem dados: aviso inline

**Asset search:** reutiliza o mesmo mecanismo do `HistoricalSimulator` — busca entre `AvailableBenchmarks` do banco + benchmarks fixos (CDI, SELIC, IBOVESPA, etc.).

**Rebalanceamento automático de pesos:** botão "Distribuir igualmente" divide 100% pelo número de ativos.

---

## Limitações & Decisões de Design

| Decisão | Justificativa |
|---------|---------------|
| Rebalanceamento mensal implícito | Simplifica o cálculo; o resultado é uma estimativa de backtest, não uma simulação de portfólio com drift real |
| Projeção 100% no frontend | Sem chamada de API — mesma abordagem do CompoundInterest e ScenarioComparator existentes |
| Sem otimização de carteira (Markowitz) | Fora de escopo para V1 desta feature; pode vir em V2 como "Sugerir alocação ótima" |
| Máximo 10 ativos | Limita a complexidade de UX e o custo de queries paralelas na Brapi |
| Sem cálculo de imposto no backtest | Backtest mostra retorno bruto da carteira — adicionar IR por ativo no backtest histórico adiciona complexidade desproporcional ao valor agregado |

---

## Ordem de Implementação

### Fase 1 — Backend (Backtest)
1. Criar DTOs de request/response em `FinanceControl.Shared`
2. Adicionar `GetPortfolioBacktestAsync` à interface `ISimulationService`
3. Implementar o método em `SimulationService` (reutiliza `GetMonthlyReturnsForBenchmarkAsync`)
4. Adicionar endpoint `POST /simulation/portfolio/backtest` no `SimulationController`

### Fase 2 — Frontend (Builder + Backtest)
5. Adicionar tipos `PortfolioAsset`, `PortfolioBacktestResult` em `simulation.ts`
6. Adicionar `portfolioBacktest()` em `lib/api/simulation.ts`
7. Adicionar `usePortfolioBacktest()` em `useSimulation.ts`
8. Criar `PortfolioBuilder.tsx` — componente de montagem da carteira
9. Criar `PortfolioSimulator.tsx` com sub-tabs, integrando o backtest
10. Adicionar a aba "Carteira" no `SimulationsPage.tsx`

### Fase 3 — Frontend (Projeção)
11. Implementar `PortfolioProjection` dentro do `PortfolioSimulator` usando `simulateMonthly()` por ativo
12. Implementar gráfico de área empilhado por ativo
13. Tabela anual com breakdown por ativo e imposto estimado

---

## Arquivos Impactados

### Novos
- `apps/web/src/features/simulations/components/PortfolioSimulator.tsx`
- `apps/web/src/features/simulations/components/PortfolioBuilder.tsx`
- `apps/api/FinanceControl.Shared/Dtos/Request/Simulation/PortfolioBacktestRequestDto.cs`
- `apps/api/FinanceControl.Shared/Dtos/Response/Simulation/PortfolioBacktestDto.cs`

### Modificados
- `apps/web/src/features/simulations/SimulationsPage.tsx` — nova aba
- `apps/web/src/lib/api/simulation.ts` — novo endpoint
- `apps/web/src/lib/types/simulation.ts` — novos tipos
- `apps/web/src/features/simulations/hooks/useSimulation.ts` — novo hook
- `apps/api/FinanceControl.Domain/Interfaces/Services/ISimulationService.cs` — novo método
- `apps/api/FinanceControl.Services/Services/SimulationService.cs` — implementação
- `apps/api/FinanceControl.WebApi/Controllers/SimulationController.cs` — novo endpoint

---

## Estimativa de Complexidade

| Fase | Esforço estimado |
|------|-----------------|
| Fase 1 — Backend Backtest | Médio (reutiliza ~80% do código existente) |
| Fase 2 — Builder + Backtest UI | Alto (novo componente complexo de UX) |
| Fase 3 — Projeção UI | Médio (reutiliza lógica do CompoundInterest) |

A parte mais trabalhosa é o `PortfolioBuilder`: validação de pesos em tempo real, search de ativos, UX responsiva para N linhas. O backend é relativamente simples porque já existe toda a infraestrutura de busca de retornos mensais.
