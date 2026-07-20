<div align="center">

# 💰 Finance Control

**A full-stack personal finance platform for people who want deliberate control over their money.**

No automatic bank imports. Every transaction is entered on purpose — so the product is built for speed, clarity, and insight.

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat&logo=dotnet)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat&logo=flutter)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql)

</div>

---

## Overview

Finance Control is a monorepo containing a **.NET 9 REST API**, a **Next.js web app**, and a **Flutter mobile app** that share the same backend. It covers the full financial picture:

- 🏦 **Accounts & net worth** — Checking, Savings, Credit, and Cash accounts. Balances are always *derived from transactions*, never stored.
- 🔁 **Transactions** — one-time, installment, and recurring entries, plus account-to-account transfers, tags, and a two-level category hierarchy.
- 📊 **Budgets** — organized into areas with per-subcategory allocations (expected vs. actual).
- 🎯 **Goals** — item and investment targets with progress tracking.
- 📈 **Investments & market data** — portfolio tracking with live prices synced from [Brapi](https://brapi.dev/).
- 🧮 **Analytics & simulations** — spending/savings dashboards and compound-interest projections.
- 🔔 **Notifications & alerts** — recurring reminders and configurable price/spending alerts.

Built as a personal project to explore clean architecture, real-world API design, and modern frontend patterns across web and mobile.

## Repository Layout

| App | Stack | Description | Docs |
|---|---|---|---|
| [`apps/api`](apps/api) | ASP.NET Core 9 · EF Core · PostgreSQL | REST API, background workers, market-data sync | [README](apps/api/README.md) |
| [`apps/web`](apps/web) | Next.js 16 · React 19 · TypeScript | Primary web client | [README](apps/web/README.md) |
| [`apps/mobile`](apps/mobile) | Flutter · Dart · Riverpod | Android & iOS client | [README](apps/mobile/README.md) |

Additional documentation (SRS, data model, ADRs, roadmap, requirements) lives in [`FinanceControlFilesDocumentation/`](FinanceControlFilesDocumentation) and [`docs/`](docs).

## Tech Stack

**Backend** — .NET 9 · C# 13 · ASP.NET Core Web API · EF Core 9 + Npgsql (PostgreSQL) · JWT (with refresh tokens) · FluentValidation · rate limiting · Swagger/OpenAPI · background hosted services · Docker

**Web** — Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn + Base UI · React Query 5 · Zustand 5 · React Hook Form + Zod · Recharts · Axios

**Mobile** — Flutter · Dart 3.11+ · Riverpod · GoRouter · Dio · FlutterSecureStorage · Freezed · fl_chart

## Quick Start

> Run the **API first**, then start the web and/or mobile client. Each app's README has full prerequisites and configuration.

**1. API** → http://localhost:5112 (Swagger at `/swagger`)
```bash
cd apps/api
dotnet restore
dotnet ef database update --project FinanceControl.Data --startup-project FinanceControl.WebApi
dotnet run --project FinanceControl.WebApi
```

**2. Web** → http://localhost:3000
```bash
cd apps/web
npm install
npm run dev            # expects the API at http://localhost:5112/api
```

**3. Mobile**
```bash
cd apps/mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## Conventions

A few decisions that apply across the whole codebase:

- **Money is stored and transmitted as integer cents** — never `double`. Convert only at the display layer.
- **Account balances are computed, never persisted** — always the sum of the account's transactions.
- **All code is written in English** — identifiers, comments, and messages. Portuguese appears only in user-facing UI copy.
- **The API returns the updated collection on mutations**, so clients refresh their cache in a single round trip.

## License

Personal project — all rights reserved unless stated otherwise.
