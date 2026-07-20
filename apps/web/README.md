<div align="center">

# Finance Control Web

**The primary web client for the Finance Control platform.**

A Next.js app for accounts, transactions, budgets, investments, analytics, and simulations — powered by the [Finance Control API](../api).

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss)
![React Query](https://img.shields.io/badge/React_Query-5-FF4154?style=flat&logo=reactquery)

</div>

## Table of Contents

- [Quick Start](#quick-start)
- [Feature Map](#feature-map)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Patterns](#core-patterns)
- [Authentication](#authentication)
- [Scripts](#scripts)

## Quick Start

**Prerequisites:** Node.js 20+ · the [Finance Control API](../api) running locally.

```bash
cd apps/web
npm install

# Point the app at your API
echo "NEXT_PUBLIC_API_URL=http://localhost:5112/api" > .env.local

npm run dev
```

Open **http://localhost:3000**.

> **Heads up:** this app targets **Next.js 16**, which has breaking changes vs. earlier versions. When writing framework code, consult the docs bundled in `node_modules/next/dist/docs/`.

## Feature Map

| Route | Feature |
|---|---|
| `/dashboard` | KPI cards, recent transactions, budget summary |
| `/accounts` | Account CRUD, net worth, per-type icons |
| `/transactions` | Paginated table, filters, search, tags, transfers, installments & recurrences |
| `/recurring` | Recurrence management |
| `/budgets` | Areas, per-subcategory allocations, progress bars |
| `/investments` | Positions, allocation charts, portfolio metrics |
| `/market` | Asset pages, rankings, intraday/historical charts, price alerts |
| `/goals` | Item & investment targets with progress |
| `/analytics` | Spending, savings & budget-performance charts |
| `/simulations` | Compound-interest & projection scenarios |
| `/categories` | Category / subcategory management |
| `/profile` | User data & preferences |
| `/login` | Authentication (public) |

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 · TypeScript 5 |
| Styling | Tailwind CSS v4 · shadcn · Base UI |
| Server state | React Query 5 |
| Client state | Zustand 5 |
| Forms | React Hook Form 7 · Zod v4 |
| HTTP | Axios (JWT interceptors) |
| Charts | Recharts 3 |
| Icons | Lucide React |

## Project Structure

Feature-first. Route files are thin re-exports; all page logic lives under `features/`.

```
src/
├── app/
│   ├── (app)/                    # authenticated routes (protected)
│   │   ├── dashboard/  accounts/  transactions/  recurring/
│   │   ├── budgets/    investments/  market/     goals/
│   │   ├── analytics/  simulations/  categories/  profile/
│   │   └── layout.tsx            # AppLayout wrapper
│   ├── (public)/login/
│   ├── globals.css               # design tokens + Tailwind v4
│   └── layout.tsx
├── components/
│   ├── layout/                   # AppLayout, Header, Sidebar, GlobalSearch
│   ├── shared/                   # StatCard, Money, pickers, ProgressBar, …
│   └── ui/                       # shadcn + Base UI primitives
├── features/
│   └── <feature>/
│       ├── components/
│       ├── hooks/                # useXxx.ts — React Query
│       └── <Feature>Page.tsx     # page root component
└── lib/
    ├── api/                      # axios.ts + one endpoint module per feature
    ├── config/                   # accountTypes, categoryColors
    ├── providers/                # QueryProvider
    ├── stores/                   # authStore, uiStore, headerStore (Zustand)
    ├── types/                    # one types module per feature
    └── utils/                    # formatCurrency, formatDate, formatNumber, cn()
```

**Page convention** — `app/(app)/<feature>/page.tsx` is always a one-line re-export:

```ts
// app/(app)/dashboard/page.tsx
import { DashboardPage } from "@/features/dashboard/DashboardPage";
export default DashboardPage;
```

## Core Patterns

- **Money in cents** — divide by 100 to display, multiply by 100 to send.
- **Server vs. client state** — React Query owns server data; Zustand owns auth, theme, and sidebar.
- **Cache updates on mutation** — the API returns the updated list, so mutations refresh via `setQueryData` in one call.
- **Drawers, not modals** — create/edit/detail flows use drawers.
- **Reuse shared primitives** — import date/month-range pickers, category selectors, and `StatCard` from `components/shared` instead of recreating one-off controls.
- **Theming** — dark (default) and light themes via CSS variables in `globals.css`; fonts are Space Grotesk (display), DM Sans (body), JetBrains Mono (monetary values).

## Authentication

- The JWT **access token** lives in memory (Zustand); the Axios interceptor attaches `Authorization: Bearer <token>` to every request.
- The **refresh token** is an HttpOnly cookie set by the API — never readable by JavaScript. It is sent automatically via `withCredentials: true`.
- On a `401`, the interceptor calls `POST /user/refresh` (deduplicated via a shared promise), retries the original request, and on failure clears auth state and redirects to `/login`.
- Only the `isAuthenticated` flag is persisted to `localStorage` — no tokens or PII.

## Scripts

```bash
npm run dev         # start dev server
npm run build       # production build
npm run start       # serve production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run format      # Prettier
```

---

<div align="center">

Part of the **Finance Control** monorepo · [API](../api) · [Mobile](../mobile)

</div>
