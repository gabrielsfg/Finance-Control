# Quantia — Sistema de Design (rebrand)

Guia completo para aplicar o novo design no Finance Control.
A **fonte da verdade visual** é o protótipo [`design/rebrand-model.html`](./rebrand-model.html) — sempre que houver dúvida sobre um detalhe, abra-o e inspecione. Este documento traduz o protótipo em regras e em código para o stack real do projeto: **Next.js (App Router) + Tailwind CSS v4 + shadcn/ui + lucide + recharts**.

---

## Índice

1. [Direção & princípios](#1-direção--princípios)
2. [Cor — tokens (claro + escuro)](#2-cor--tokens-claro--escuro)
3. [Tipografia](#3-tipografia)
4. [Espaçamento, raios e sombras](#4-espaçamento-raios-e-sombras)
5. [Layout](#5-layout)
6. [Componentes](#6-componentes)
7. [Dinheiro como tipografia (assinatura)](#7-dinheiro-como-tipografia-assinatura)
8. [Gráficos](#8-gráficos)
9. [Modo escuro](#9-modo-escuro)
10. [Movimento](#10-movimento)
11. [Acessibilidade — piso de qualidade](#11-acessibilidade--piso-de-qualidade)
12. [Voz & texto](#12-voz--texto)
13. [Como aplicar no projeto](#13-como-aplicar-no-projeto)
14. [Checklist de migração](#14-checklist-de-migração)

---

## 1. Direção & princípios

**Tese.** O app é um *demonstrativo financeiro*. O **dinheiro é o material principal** — por isso ele vira o herói tipográfico, em fonte monoespaçada (precisão de extrato/livro-razão). A identidade é brasileira sem cair em clichê: um **selo geométrico de azulejo** (linha Athos Bulcão) e uma paleta **cobalto sobre osso e petróleo**.

**Os 5 não-negociáveis** (o que mantém o design coeso e longe do genérico):

1. **Dinheiro é sempre monoespaçado** (IBM Plex Mono, `tabular-nums`). Cifra e centavos menores e em tom reduzido.
2. **Existe UM painel escuro** — o herói do dashboard (patrimônio + fluxo). É o ponto dramático; o resto da tela é calmo.
3. **A "barra de fluxo"** (entradas vs. saídas) é a viz-assinatura — preferir a um gráfico genérico quando o objetivo é "quanto entrou × quanto saiu".
4. **O selo de azulejo** é a marca. Use no logo; ecos sutis só em momentos pontuais.
5. **Gaste ousadia em um lugar só** (regra Chanel: antes de sair, tire um acessório). A assinatura é a tipografia do dinheiro + a barra de fluxo. Tudo ao redor fica disciplinado.

**O que evitar** (denuncia design "de template"):
- Roxo fintech (Nubank), verde-cifra berrante, vermelho-fogo.
- Hero genérico "número grande + gradiente".
- *Fade-in* escalonado de cards (cheira a IA gerada). Veja [§10](#10-movimento).
- Cantos sem raio + colunas de jornal.

---

## 2. Cor — tokens (claro + escuro)

A paleta inteira é semântica e vive em CSS variables. **Lição central que viabiliza o modo escuro:** separe os papéis do cobalto e isole o painel-herói.

- `--brand-cobalt` → **preenchimento** (fundo de botão, fill de barra). É escuro, combina com texto branco.
- `--brand-accent` → **cobalto como texto/marca** (links, %, wordmark). No escuro ele clareia para continuar legível.
- `--panel*` → o painel-herói, que é **escuro nos dois temas** — por isso tem tokens próprios e não herda `--background`/`--foreground`.

### Paleta — modo claro

| Papel | Token | Hex |
|---|---|---|
| Fundo do app | `--background` | `#EFEBE1` (osso) |
| Texto principal | `--foreground` | `#17211D` (petróleo) |
| Superfície de card | `--card` | `#FAF8F3` |
| Superfície recuada / hover | `--muted` / `--secondary` | `#F3F0E8` |
| Texto secundário | `--muted-foreground` | `#6B6657` |
| Fio / borda | `--border` / `--input` | `#DCD7C9` |
| Cobalto (preenchimento) | `--brand-cobalt` / `--primary` | `#1F3CE0` |
| Cobalto (texto/marca) | `--brand-accent` / `--ring` | `#1F3CE0` |
| Cobalto claro (gradiente) | `--cobalt-lift` | `#8197FF` |
| Musgo — positivo/entradas | `--moss` | `#2C6B57` |
| Musgo claro | `--moss-lift` | `#5FC6A0` |
| Barro — negativo/saídas | `--clay` / `--destructive` | `#B0451F` |
| Barro claro | `--clay-lift` | `#FF8A5B` |
| Ouro — destaque pontual | `--gold` | `#C8932B` |
| **Painel-herói** fundo | `--panel` / `--panel-2` | `#17211D` / `#1E2B26` |
| Painel-herói texto | `--panel-foreground` | `#EFEBE1` |
| Painel-herói texto fraco | `--panel-muted` | `#A7A293` |

### Paleta — modo escuro

| Papel | Token | Hex |
|---|---|---|
| Fundo do app | `--background` | `#0E1613` |
| Texto principal | `--foreground` | `#ECE7DA` |
| Superfície de card | `--card` | `#16201C` |
| Superfície recuada / hover | `--muted` / `--secondary` | `#1E2A25` |
| Texto secundário | `--muted-foreground` | `#8E9A91` |
| Fio / borda | `--border` / `--input` | `#2B3833` |
| Cobalto (preenchimento) | `--brand-cobalt` / `--primary` | `#3D5BFF` |
| Cobalto (texto/marca) | `--brand-accent` / `--ring` | `#8197FF` |
| Musgo — positivo | `--moss` | `#5FC6A0` |
| Barro — negativo | `--clay` / `--destructive` | `#FF8A5B` |
| Ouro | `--gold` | `#E3B65A` |
| Painel-herói fundo | `--panel` / `--panel-2` | `#12201E` / `#1A302C` |
| Painel-herói texto | `--panel-foreground` | `#ECE7DA` |
| Painel-herói texto fraco | `--panel-muted` | `#8FA39A` |

> **Sinais (positivo/negativo) nunca são crayon.** Positivo = musgo (verde-petróleo), negativo = barro (laranja-queimado). No escuro eles usam as versões mais claras para manter contraste sobre superfície escura.

> **Tons translúcidos** (fundo de tag, ícone tonal) usam `color-mix(in srgb, var(--token) 14%, transparent)` em vez de `rgba()` fixo — assim acompanham o tema automaticamente.

---

## 3. Tipografia

Três famílias, três papéis. O contraste entre a grotesca de display e a monoespaçada de dados é parte da personalidade.

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| **Display** | Bricolage Grotesque | 400/600/700/800 | Títulos de página, títulos de card, rótulos grandes |
| **Texto/UI** | Hanken Grotesk | 400/500/600/700 | Corpo, navegação, botões, descrições |
| **Dados** | IBM Plex Mono | 400/500/600 | **Todo dinheiro**, números, *eyebrows*, badges, labels de eixo |

### Escala de tipo

| Estilo | Família | Tamanho | Detalhes |
|---|---|---|---|
| Cifra-herói (patrimônio) | mono | `clamp(44px, 6.4vw, 78px)` | peso 600, `letter-spacing: -.035em`, `line-height: .96` |
| Título de página `h1` | display | `clamp(26px, 3vw, 36px)` | peso 700, `-.025em` |
| Título de card `h3` | display | `17px` | peso 700, `-.01em` |
| *Eyebrow* / cabeçalho de seção | mono | `11–13px` | maiúsculas, `letter-spacing: .18em`, cor `--muted-foreground` |
| Corpo | sans | `15px` | `line-height: 1.5` |
| Pequeno | sans | `13px` | descrições, sublabels |
| Micro / label | mono | `11px` | maiúsculas, `.12–.2em` |
| Valor monetário (lista) | mono | `14–15px` | `tabular-nums`, peso 500, `-.01em` |

---

## 4. Espaçamento, raios e sombras

**Raios** (escala intencional — nada de 16px em tudo):

| Token | Valor | Uso |
|---|---|---|
| `--radius-hero` | `26px` (1.625rem) | painel-herói |
| `--radius-card` | `20px` (1.25rem) | cards |
| `--radius` (base shadcn) | `~13px` (0.8rem) | botões, inputs, ícones |
| pequeno | `9px` | chips internos, swatches |
| pílula | `999px` | tags, barras de progresso, busca |

**Grid / espaçamento:** *gutter* base **22px** (`--gut`). Sidebar **252px**. Conteúdo `max-width: 1320px`, padding `26px clamp(20px, 3.4vw, 46px) 60px`.

**Sombras** (suaves; sem *drop shadow* genérico forte):

```css
/* claro */
--shadow-sm: 0 1px 0 rgba(23,33,29,.04), 0 10px 24px -20px rgba(23,33,29,.45);
--shadow-md: 0 1px 0 rgba(23,33,29,.04), 0 26px 50px -34px rgba(23,33,29,.55);
/* escuro */
--shadow-sm: 0 1px 0 rgba(255,255,255,.03), 0 14px 30px -22px rgba(0,0,0,.7);
--shadow-md: 0 1px 0 rgba(255,255,255,.03), 0 34px 60px -36px rgba(0,0,0,.85);
```

No escuro, o herói também ganha `border: 1px solid var(--border)` para se destacar do fundo.

---

## 5. Layout

```
┌──────────┬───────────────────────────────────────────────┐
│ SIDEBAR  │  TOPBAR: eyebrow + título · busca · tema · sino · CTA │
│ 252px    ├───────────────────────────────────────────────┤
│          │  HERÓI (escuro, 12 cols): patrimônio | fluxo    │
│ marca    ├───────────────────────────────────────────────┤
│ nav      │  Movimentações (7)        │  Contas (5)         │
│ (grupos) ├───────────────────────────────────────────────┤
│          │  Carteira (5) │ Metas (4) │ Orçamento (3)       │
│ user     ├───────────────────────────────────────────────┤
│          │  GRÁFICOS / outras seções (grid 12)             │
└──────────┴───────────────────────────────────────────────┘
```

- **Grid de 12 colunas**, `gap: 22px`. Use spans editoriais (7/5, 5/4/3) — assimetria proposital, não tudo igual.
- **Sidebar** sticky, altura total, fundo `--sidebar` (leve gradiente), borda direita `--border`. Grupos com rótulo em mono maiúsculo (`Geral`, `Planejar`, `Mercado`). Item ativo = pílula `--sidebar-primary` com barra vertical `--brand-accent` à esquerda.
- **Responsivo:** `≤1080px` spans viram 6 colunas; `≤860px` a sidebar colapsa para uma barra horizontal (some a nav); `≤680px` tudo em 1 coluna.

---

## 6. Componentes

Specs essenciais (detalhes finos no protótipo). Como o projeto usa **shadcn**, a maioria herda dos tokens — ajuste só variantes e raios.

**Botões**
- **Primário:** fundo `--brand-cobalt`, texto branco, `rounded-[--radius]`, sombra colorida sutil; hover sobe 1px e escurece.
- **Secundário:** transparente, borda `--foreground`; hover inverte (fundo `--foreground`, texto `--background`).
- **Fantasma:** fundo `--secondary`; hover `--muted`/`--border`.

**Card**
- Fundo `--card`, borda `--border`, `rounded-card`, `--shadow-sm`, padding `22px`.
- Cabeçalho: `h3` (display) + link de ação à direita em mono maiúsculo, cor `--brand-accent`.

**Painel-herói** (o único escuro): fundo `radial-gradient(var(--panel-2), var(--panel))`, texto `--panel-foreground`, fracos em `--panel-muted`. Eco do azulejo no canto a `opacity .10`.

**Barra de fluxo** (assinatura): duas linhas (Entradas/Saídas) com trilho `rgba(255,255,255,.07)` e preenchimento em gradiente `--moss→--moss-lift` / `--clay→--clay-lift`. Largura via `transform: scaleX(--to)`. Rodapé com "Saldo do mês" destacado.

**Item de navegação:** ícone lucide 18px (opacidade .7) + label sans 14px. Ativo: pílula + barra `--brand-accent`.

**Campo (input):** fundo `--card`, borda `--input`, `rounded-[--radius]`. Foco: borda `--ring` + halo `0 0 0 3px color-mix(in srgb, var(--ring) 14%, transparent)`. Em campo de valor, prefixe `R$` em mono `--muted-foreground` e o input em mono.

**Tags/badges:** mono 11px, pílula. Fundo translúcido via `color-mix` da própria cor (cobalt/moss/clay/gold) + texto na cor cheia. Variante "ink": fundo `--foreground`, texto `--background`.

**Linhas de lista** (conta / transação / meta):
- Ícone à esquerda (quadrado arredondado, cor de marca ou tonal), meta no meio (nome sans + categoria em mono `--muted-foreground`), valor à direita (mono, colorido por sinal).
- Separador: `border-bottom: 1px solid var(--border)` (último sem).
- **Meta:** barra de progresso (trilho `--secondary`, fill na cor da meta) + `X% / total` em mono.

---

## 7. Dinheiro como tipografia (assinatura)

Regra única e consistente em todo valor monetário. Centralize num componente `<Money />`.

- Sempre **IBM Plex Mono** + `font-variant-numeric: tabular-nums` (alinhamento em qualquer tabela).
- **Cifra** `R$`: `font-size: .62em`, `opacity: .7`, leve `vertical-align`.
- **Centavos**: `font-size: .66em`, `opacity: .72`.
- **Cor por sinal:** positivo → `--moss`; negativo → `--clay`; neutro → `--foreground`.
- Em listas/tabelas, **alinhar à direita**.
- A cifra-herói (patrimônio) é a única instância gigante.

```tsx
// components/ui/money.tsx
import { cn } from "@/lib/utils";

type Props = { value: number; sign?: boolean; className?: string };

export function Money({ value, sign = false, className }: Props) {
  const neg = value < 0;
  const [int, cents] = Math.abs(value)
    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    .split(",");
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-medium tracking-[-0.01em]",
        neg ? "text-[--clay]" : sign ? "text-[--moss]" : "text-foreground",
        className,
      )}
    >
      <span className="text-[0.62em] opacity-70 mr-[0.18em] align-[0.06em]">R$</span>
      {sign && !neg ? "+ " : neg ? "− " : ""}
      {int}
      <span className="text-[0.66em] opacity-70">,{cents}</span>
    </span>
  );
}
```

---

## 8. Gráficos

O projeto usa **recharts**. As regras valem para qualquer lib — o importante é a linguagem visual.

**Princípios**
- **Cores da paleta** (mapeadas em `--chart-1..5`): musgo = entradas/positivo · cobalto = série principal/patrimônio · barro = saídas/negativo · ouro = 4ª categoria · neutro = resto.
- **Grade mínima:** poucas linhas em `--border`, frequentemente tracejadas. Sem eixos pesados, sem 3D, sem sombra de barra.
- **Rótulos** em IBM Plex Mono, cor `--muted-foreground`.
- **Linha:** área + linha, com gradiente sutil e **ponto final destacado** (anel + miolo).
- **Pizza:** preferir **rosca** (donut) com o **total no centro** e legenda lateral com valores/%.
- **Barras:** cantos arredondados (`radius={4}`), **agrupadas** para comparar (ex.: entradas × saídas).
- Tudo via tokens → **acompanha o tema sozinho**.

**Mapeamento recharts** — defina os `--chart-*` (já feito em [§13](#13-como-aplicar-no-projeto)) e referencie com `var(--chart-n)`:

```tsx
// Linha — evolução do patrimônio
<AreaChart data={data} margin={{ left: 4, right: 12, top: 16, bottom: 0 }}>
  <defs>
    <linearGradient id="g-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stopColor="var(--chart-2)" stopOpacity={0.18} />
      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
    </linearGradient>
  </defs>
  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
  <XAxis dataKey="mes" tickLine={false} axisLine={false}
         tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--muted-foreground)" }} />
  <Area type="monotone" dataKey="patrimonio"
        stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#g-area)"
        dot={false} activeDot={{ r: 5 }} />
</AreaChart>

// Barras — entradas × saídas
<BarChart data={data} barGap={6}>
  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
  <XAxis dataKey="mes" tickLine={false} axisLine={false} />
  <Bar dataKey="entradas" fill="var(--chart-1)" radius={4} />
  <Bar dataKey="saidas"   fill="var(--chart-3)" radius={4} />
</BarChart>

// Rosca — gastos por categoria
<PieChart>
  <Pie data={cats} dataKey="valor" nameKey="nome"
       innerRadius={64} outerRadius={88} paddingAngle={2} stroke="none">
    {cats.map((c, i) => <Cell key={i} fill={`var(--chart-${i + 1})`} />)}
  </Pie>
  {/* total no centro via <text> ou um div sobreposto */}
</PieChart>
```

> Dica: o shadcn tem `components/ui/chart.tsx` (`ChartContainer` + `ChartConfig`). Use-o e aponte cada série para `var(--chart-n)` no `ChartConfig` — ganha tooltip/legend padronizados de graça.

---

## 9. Modo escuro

O sistema inteiro foi construído para que o tema seja **só um remapeamento de tokens** — nenhum componente precisa de lógica de tema própria.

- Trocar `:root` → `.dark` reescreve ~15 variáveis; **todo o resto herda** (inclusive os gráficos, porque usam `var()`).
- Funciona porque os papéis estão separados: `--brand-cobalt` (fill) vs `--brand-accent` (texto), e o painel tem tokens próprios (`--panel*`).
- No projeto, use **`next-themes`** com `attribute="class"` (alterna `.dark` no `<html>`). O protótipo faz o equivalente com `data-theme` + `localStorage` + preferência do sistema na 1ª visita.
- Coloque `suppressHydrationWarning` no `<html>` e aplique o tema antes da pintura para evitar *flash*.

---

## 10. Movimento

**Menos é mais** — excesso de animação denuncia design gerado por IA. Há **um único gesto de marca**: as barras (fluxo, metas, orçamento) **"enchem" na entrada**.

- **Estado de repouso = já preenchido** (`transform: scaleX(--to)`). A animação `growX` (de `scaleX(0)`) só roda quando há JS/visibilidade — assim funciona **sem JS, sob *throttling* e com `prefers-reduced-motion`**.
- **Não** use *fade-in* escalonado de cards. (Foi removido do protótipo de propósito: além de cliché, escondia conteúdo quando a animação não rodava.)
- Fora isso: só micro-interações de **hover/foco** (sobem 1px, mudam fundo).
- **Sempre** respeitar `@media (prefers-reduced-motion: reduce)` (zera durações e fixa o estado final).

---

## 11. Acessibilidade — piso de qualidade

- **Foco visível:** `outline: 2.5px solid var(--ring); outline-offset: 3px` em tudo focável.
- **Contraste AA:** `--muted-foreground` e `--clay` foram calibrados para passar em texto normal. Ao criar novas combinações, verifique.
- **Responsivo** até mobile (≤375px).
- **`prefers-reduced-motion`** respeitado.
- Ícones decorativos com `aria-hidden`; SVGs de gráfico com `role="img"` + `aria-label` descritivo.

---

## 12. Voz & texto

Texto é material de design, não decoração. Em **pt-BR**, *sentence case*, voz ativa, sem floreio.

- Nomeie pelo que a pessoa controla, não pela implementação ("Notificações", não "config de webhook").
- A ação mantém o nome no fluxo todo: botão "Salvar alterações" → toast "Alterações salvas".
- Verbos diretos: "Nova transação", "Ver extrato", "Gerenciar".
- Estados vazios e de erro **dão direção** ("Nenhuma transação ainda. Adicione a primeira."), sem pedir desculpas nem ser vagos.
- Cada elemento faz um trabalho: rótulo rotula, exemplo demonstra.

---

## 13. Como aplicar no projeto

Ordem sugerida. Tudo gira em torno de **um arquivo de tokens** (`src/app/globals.css`).

### Passo 1 — Fontes (`src/app/layout.tsx`)

```tsx
import { Bricolage_Grotesque, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["400","600","700","800"] });
const sans    = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", weight: ["400","500","600","700"] });
const mono    = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500","600"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning
          className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

> O `next/font` popula `--font-display/sans/mono` automaticamente — não declare essas famílias à mão no `globals.css`.

### Passo 2 — Tokens (`src/app/globals.css`)

Substitua os valores dos tokens shadcn por estes (mantenha os nomes que seu `globals.css` já tem; adicione os tokens de marca). Os hex podem ficar como estão — Tailwind v4 aceita qualquer cor.

```css
:root {
  --radius: 0.8rem;
  --radius-card: 1.25rem;   /* 20px */
  --radius-hero: 1.625rem;  /* 26px */

  --background: #EFEBE1;
  --foreground: #17211D;
  --card: #FAF8F3;            --card-foreground: #17211D;
  --popover: #FAF8F3;         --popover-foreground: #17211D;
  --primary: #1F3CE0;         --primary-foreground: #FFFFFF;
  --secondary: #F3F0E8;       --secondary-foreground: #17211D;
  --muted: #F3F0E8;           --muted-foreground: #6B6657;
  --accent: #F3F0E8;          --accent-foreground: #17211D;  /* hover do shadcn, NÃO o cobalto */
  --destructive: #B0451F;     --destructive-foreground: #FFFFFF;
  --border: #DCD7C9;          --input: #DCD7C9;              --ring: #1F3CE0;

  /* gráficos */
  --chart-1: #2C6B57;  --chart-2: #1F3CE0;  --chart-3: #B0451F;  --chart-4: #C8932B;  --chart-5: #6B6657;

  /* sidebar shadcn */
  --sidebar: #FAF8F3;                  --sidebar-foreground: #17211D;
  --sidebar-primary: #17211D;          --sidebar-primary-foreground: #EFEBE1;
  --sidebar-accent: #F3F0E8;           --sidebar-accent-foreground: #17211D;
  --sidebar-border: #DCD7C9;           --sidebar-ring: #1F3CE0;

  /* ===== tokens próprios da marca ===== */
  --brand-cobalt: #1F3CE0;  --brand-accent: #1F3CE0;  --cobalt-lift: #8197FF;
  --moss: #2C6B57;  --moss-lift: #5FC6A0;
  --clay: #B0451F;  --clay-lift: #FF8A5B;
  --gold: #C8932B;
  --panel: #17211D;  --panel-2: #1E2B26;  --panel-foreground: #EFEBE1;  --panel-muted: #A7A293;
}

.dark {
  --background: #0E1613;
  --foreground: #ECE7DA;
  --card: #16201C;            --card-foreground: #ECE7DA;
  --popover: #16201C;         --popover-foreground: #ECE7DA;
  --primary: #3D5BFF;         --primary-foreground: #FFFFFF;
  --secondary: #1E2A25;       --secondary-foreground: #ECE7DA;
  --muted: #1E2A25;           --muted-foreground: #8E9A91;
  --accent: #1E2A25;          --accent-foreground: #ECE7DA;
  --destructive: #FF8A5B;     --destructive-foreground: #17211D;
  --border: #2B3833;          --input: #2B3833;              --ring: #8197FF;

  --chart-1: #5FC6A0;  --chart-2: #8197FF;  --chart-3: #FF8A5B;  --chart-4: #E3B65A;  --chart-5: #8E9A91;

  --sidebar: #121916;                  --sidebar-foreground: #ECE7DA;
  --sidebar-primary: #ECE7DA;          --sidebar-primary-foreground: #0E1613;
  --sidebar-accent: #1E2A25;           --sidebar-accent-foreground: #ECE7DA;
  --sidebar-border: #2B3833;           --sidebar-ring: #8197FF;

  --brand-cobalt: #3D5BFF;  --brand-accent: #8197FF;  --cobalt-lift: #8197FF;
  --moss: #5FC6A0;  --moss-lift: #5FC6A0;
  --clay: #FF8A5B;  --clay-lift: #FF8A5B;
  --gold: #E3B65A;
  --panel: #12201E;  --panel-2: #1A302C;  --panel-foreground: #ECE7DA;  --panel-muted: #8FA39A;
}
```

### Passo 3 — Mapear no Tailwind v4 (`@theme inline` no `globals.css`)

Adicione ao bloco `@theme inline` que o shadcn já gerou, para criar utilitários (`bg-moss`, `text-brand-accent`, `font-display`, `rounded-card`, `bg-panel`…):

```css
@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);

  --color-brand: var(--brand-cobalt);
  --color-brand-accent: var(--brand-accent);
  --color-moss: var(--moss);
  --color-clay: var(--clay);
  --color-gold: var(--gold);
  --color-panel: var(--panel);
  --color-panel-foreground: var(--panel-foreground);
  --color-panel-muted: var(--panel-muted);

  --radius-card: var(--radius-card);
  --radius-hero: var(--radius-hero);
}
```

E no corpo, defina a fonte padrão e os números tabulares do mono:

```css
body { font-family: var(--font-sans); background: var(--background); color: var(--foreground); }
.font-mono, [class*="tabular"] { font-variant-numeric: tabular-nums; }
```

### Passo 4 — Modo escuro

```bash
npm i next-themes
```

```tsx
// app/providers.tsx
"use client";
import { ThemeProvider } from "next-themes";
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>;
}
```

Envolva o `children` no `RootLayout` com `<Providers>`. O botão de tema chama `useTheme().setTheme("dark" | "light")` e troca o ícone (lua no claro, sol no escuro), como no protótipo.

### Passo 5 → 9 — Construção

5. **Primitivos shadcn** (button, card, input, badge): em geral só herdam os tokens. Ajuste o raio do `Card` para `rounded-card` e confira a variante primária do `Button`.
6. **Shell**: `Sidebar` (use o bloco `sidebar` do shadcn, já tem os tokens) + grid de 12 colunas para o conteúdo.
7. **`<Money />`** ([§7](#7-dinheiro-como-tipografia-assinatura)) — troque toda formatação de valor por ele.
8. **Painel-herói** + **barra de fluxo** ([§6](#6-componentes)).
9. **Gráficos** com recharts apontando para `--chart-*` ([§8](#8-gráficos)).

**Migre página por página**, começando pelo **Dashboard** (valida tokens, shell, herói, money e gráficos de uma vez), depois Contas → Transações → Análises/Investimentos → resto.

---

## 14. Checklist de migração

- [ ] Fontes via `next/font` (Bricolage / Hanken / IBM Plex Mono)
- [ ] Tokens `:root` + `.dark` no `globals.css` (cores, raios, sombras)
- [ ] `@theme inline` com cores de marca, fontes e raios
- [ ] `next-themes` + botão de tema (ícone lua/sol) + `suppressHydrationWarning`
- [ ] `--chart-1..5` definidos e gráficos recharts usando `var(--chart-n)`
- [ ] Componente `<Money />` aplicado em todos os valores
- [ ] Sidebar com grupos, item ativo (pílula + barra), user chip
- [ ] Painel-herói (escuro) com patrimônio + barra de fluxo
- [ ] Barras com estado de repouso preenchido (anim. só de entrada)
- [ ] Foco visível, contraste AA, `prefers-reduced-motion`
- [ ] Copy revisada (sentence case, voz ativa, estados vazios com direção)
- [ ] Conferido claro **e** escuro em cada tela

---

*Fonte da verdade visual: [`design/rebrand-model.html`](./rebrand-model.html). Abra-o lado a lado durante a implementação.*
