@AGENTS.md

# Finance-Control — Web App

## Stack

- **Next.js 16** (App Router, React 19) — `"use client"` em todas as páginas de rota
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS v4** + shadcn (base-nova style) + Base UI React 1.4
- **React Query 5** — server state; staleTime padrão 60s, retry 1
- **Zustand 5** — client state (auth, UI); persistido em localStorage
- **React Hook Form 7** + **Zod v4** (`zod/v4`) — validação de formulários
- **Axios 1** — cliente HTTP com interceptors JWT
- **Recharts 3** — gráficos
- **Lucide React** — ícones

## Estrutura de pastas

```
src/
├── app/
│   ├── (app)/           # rotas autenticadas (protegidas pelo middleware)
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── investments/
│   │   ├── simulations/
│   │   ├── analytics/
│   │   ├── profile/
│   │   └── layout.tsx   # AppLayout wrapper
│   ├── (public)/
│   │   └── login/
│   └── globals.css      # design tokens + Tailwind v4
├── components/
│   ├── layout/          # AppLayout, Header, Sidebar
│   ├── shared/          # StatCard, ProgressBar, SectionHeader
│   └── ui/              # shadcn + base-ui (Button, Dialog, Select, etc.)
├── features/
│   └── <feature>/
│       ├── components/
│       ├── hooks/       # useXxx.ts — React Query
│       └── <Feature>Page.tsx  # componente raiz da página
├── lib/
│   ├── api/             # axios.ts + endpoints por feature
│   ├── providers/       # QueryProvider
│   ├── stores/          # authStore, uiStore
│   ├── types/           # tipos por feature
│   └── utils/           # formatCurrency, formatDate, formatNumber, cn()
└── proxy.ts             # middleware de auth
```

### Convenção de páginas

Cada página vive em `features/<feature>/<Feature>Page.tsx` como um componente nomeado exportado. O arquivo `app/(app)/<feature>/page.tsx` é apenas um re-export de uma linha:

```ts
// app/(app)/dashboard/page.tsx
import { DashboardPage } from "@/features/dashboard/DashboardPage";
export default DashboardPage;
```

Todo o código da página (hooks, estado, JSX) fica exclusivamente em `features/<feature>/<Feature>Page.tsx`. Nunca adicionar lógica nos arquivos `page.tsx` do App Router.

## Design tokens (globals.css)

Tema escuro (padrão) / claro via CSS variables:

| Token | Dark | Light |
|---|---|---|
| `--background` | `#08090c` | `#f5f7fa` |
| `--surface` | `#0e1117` | `#ffffff` |
| `--surface2` | `#141920` | `#f0f4f8` |
| `--text` | `#edf2f7` | `#0f1318` |
| `--text-sub` | `#8a95a3` | `#566070` |
| `--text-muted` | `#4e5968` | `#90a0b0` |
| `--green` | `#00c98d` | same |
| `--red` | `#f25f5c` | same |
| `--purple` | `#7c6fe0` | same |
| `--blue` | `#4a9eff` | same |
| `--orange` | `#f5a623` | same |
| `--yellow` | `#f5ce42` | same |
| `--cyan` | `#00d4a0` | same |

Fontes: `font-display` = Space Grotesk (títulos), `font-sans` = DM Sans (corpo), `font-mono` / `.font-money` = JetBrains Mono (valores monetários, tabular-nums).

Border radius: `--radius-sm` 6px → `--radius-3xl` 16px.

## Padrões de código

### Componentes
- `app/(app)/<feature>/page.tsx` é sempre um re-export de uma linha — nenhuma lógica aqui
- Todo o código da página fica em `features/<feature>/<Feature>Page.tsx`
- Componentes de feature recebem dados via props
- Shared components são styling-agnostic
- `cn()` (clsx + tailwind-merge) para classNames dinâmicos

### API layer
```ts
// lib/api/<feature>.ts
import { api } from "./axios";
export const xyzApi = {
  getAll: async (): Promise<XyzItem[]> => {
    const response = await api.get<XyzItem[]>("/xyz");
    return response.data;
  },
};
```

### Hooks React Query
```ts
// features/<feature>/hooks/useXyz.ts
export const useXyz = () =>
  useQuery({ queryKey: ["xyz"], queryFn: xyzApi.getAll });

export const useCreateXyz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateXyzRequest) => xyzApi.create(data),
    onSuccess: (updated) => queryClient.setQueryData(["xyz"], updated),
  });
};
```
O backend retorna a lista atualizada em operações de mutação — atualizar o cache diretamente com `setQueryData`.

### Formulários
```ts
const schema = z.object({ ... });
type FormValues = z.infer<typeof schema>;
const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
});
```
Import: `import { z } from "zod/v4"` (não `"zod"`).

### Valores monetários
API trafega **centavos** (int). Dividir por 100 antes de exibir, multiplicar por 100 antes de enviar.

### Inputs / classes comuns
```
border-border bg-surface2 text-text placeholder:text-text-muted
h-9 rounded-lg border px-3 text-[13px] outline-none focus:border-green/60
```

### State management
- `authStore` — `accessToken`, `refreshToken`, `user`, `isAuthenticated`; persiste como `controle-auth`
- `uiStore` — `sidebarCollapsed`, `theme`; persiste como `controle-ui`

## Padrões de UI compartilhados (filtros, seletores, botões)

> **Leia esta tabela ANTES de criar qualquer filtro, seletor ou data picker.**
> Regra de ouro: **importe o componente compartilhado, não recrie**. Nunca use
> `<input type="date">` nativo nem invente um one-off para um controle que já existe.
> Se um padrão se repetir e ainda não tiver componente em `components/shared/`,
> **extraia para lá** (e adicione nesta tabela) em vez de copiar.

| Controle | Componente / referência canônica | Quando usar |
|---|---|---|
| **Range de datas** (início → fim) | `components/shared/DateRangePicker` | 1 calendário único; clica início depois fim, com hover preview. Props opcionais `minDate`/`maxDate` limitam a janela. É presentational — você embala no seu popover/painel e controla abrir/fechar (ex.: `MarketPriceChart`, `TransactionsFilters`). |
| **Range de meses** (mês/ano início → fim) | `components/shared/MonthRangePicker` | Filtro por intervalo de meses (ex.: simulações histórico). Grid de meses + seletor de ano. |
| **Data única** | `components/shared/DatePickerField` | Campo único de data em formulários (popover com calendário, `allowClear` opcional). |
| **Categoria → subcategoria (dropdown)** | `components/shared/CategorySelectContent` | Dentro de um `<Select>`: agrupa subcategorias sob o cabeçalho da categoria. Cabeçalho mostra a **cor** da categoria (dot); cada sub mostra o **emoji** (ou dot esmaecido da cor como fallback). Sempre seleciona por `subCategoryId`. |
| **Categoria → subcategoria (multi-seleção / checkbox)** | `CheckRow` em `features/recurrences/components/RecurrencesFilters.tsx` | Filtros com checkboxes de categoria + subcategoria. Mesma regra de cor/emoji; subs com `indent`. Marcar/desmarcar categoria propaga para suas subs. |
| **Seletor de opção genérico** (pill dropdown) | `components/shared/PillSelect` | Seletor compacto não-categoria/não-data (ex.: período de gráfico, ordenação). Borda verde quando o valor não é o default. |
| **Abas / chips** | `components/shared/TabChips` | Alternância entre modos/visões (sub-tabs). Suporta `size="sm" \| "md"`. |
| **Filtro multi-seção (popover "Filtros")** | `features/recurrences/components/RecurrencesFilters.tsx` ou `features/transactions/components/TransactionsFilters.tsx` | Popover com nav lateral de seções (Tipo, Categoria, Contas…), badges de contagem, "Limpar tudo" / "Aplicar". Botão trigger com badge de filtros ativos. |
| **Filtro multi-seleção simples** (lista com check) | `features/investments/components/InvestmentTypeFilter.tsx` | Dropdown de checkboxes para mostrar/ocultar itens, com contador no trigger e "Mostrar todos". |
| **Barra de busca** | `features/transactions/components/TransactionsFilterBar.tsx` | Input pill arredondado com ícone `Search`; `focus-within:border-green/60`. |
| **Botão** | `components/ui/button` | Variantes shadcn. Não estilizar `<button>` cru para ações primárias. |
| **Totalizador / resumo** | `components/shared/StatCard` | Toda linha de KPI/summary (ver `feedback_statcard_pattern`). |

### Regras transversais
- **Cor de categoria**: sempre via `getCategoryColor(color, name)` de `@/lib/config/categoryColors` (faz fallback determinístico por nome). Categoria → dot colorido; subcategoria → emoji (fallback: dot esmaecido da cor da categoria).
- **Drawer, não modal**, para criar/editar/detalhe (ver `feedback_ui_patterns`).
- **Números coloridos** (verde/vermelho) não levam sinal `+`/`-`.
- **Datas em ISO** `YYYY-MM-DD` (dia) ou `YYYY-MM` (mês) no estado e nas props dos pickers; formatação pt-BR só na exibição.

## Auth flow
- Tokens em localStorage; interceptor Axios injeta `Authorization: Bearer`
- 401 → tenta refresh via `POST /user/refresh` → retry → falha: limpa e redireciona `/login`
- Middleware (`proxy.ts`) protege rotas `(app)`

## Roadmap de implementação (ordem)

1. ✅ Fundação — layout, sidebar, header, design tokens
2. ✅ Autenticação — login/register, interceptors JWT
3. ✅ Dashboard — KPI cards, transações recentes, resumo orçamento
4. ✅ Contas — CRUD completo com modais
5. ⬜ Transações — tabela paginada, filtros, busca
6. ⬜ Orçamentos — barras de progresso, subcategorias
7. ⬜ Investimentos — cards, gráfico de alocação, tabela de posições
8. ⬜ Analytics — gráficos mensais, por categoria, heatmap
9. ⬜ Simulações — juros compostos, projeção, cenários
10. ⬜ Perfil — dados, preferências, plano, wishlist
11. ⬜ Landing Page — hero, features, CTA

## Decisões de produto / V2+

- **Ícones de banco**: V1 usa ícones Lucide por tipo de conta. V2 migra para S3 + CloudFront com SVGs por `{country}/{bank_slug}`.
- **AI Daily Insight**: card de insight diário gerado com Claude Haiku (prompt caching), somente premium, TTL 24h. Spec em `financeControlFilesDocumentation/Documents/ai-daily-insight.md`.
- **Recuperação de senha**: endpoint existe mas entrega o token direto na resposta (dev). Produção requer integração de email (SendGrid/Mailgun).
- **i18n**: adiado para pós-v1.

## Regras de trabalho

- **Nunca rodar `dotnet ef migrations add` ou `dotnet ef database update`** — o usuário executa manualmente. Ao final de mudanças que requerem migration, apenas indicar o nome sugerido.
- **Nunca fazer `git commit`, `git merge` ou `git push`** — o usuário executa manualmente. Quando pedido, fornecer apenas o texto da mensagem (título + bullets em inglês, sem `Co-Authored-By`).
- **Não editar seções já concluídas ou em andamento no ROADMAP.md** — apenas adicionar em fases futuras.
