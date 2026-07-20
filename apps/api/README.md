<div align="center">

# Finance Control API

**The .NET backend powering the Finance Control platform.**

Authentication, accounts, budgets, investments with live market data, analytics, simulations, and notifications — served to the [web](../web) and [mobile](../mobile) clients.

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat&logo=dotnet)
![C#](https://img.shields.io/badge/C%23-13.0-239120?style=flat&logo=csharp)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-EF_Core_9-336791?style=flat&logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT_Bearer-000000?style=flat&logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/Docs-Swagger-85EA2D?style=flat&logo=swagger)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat&logo=docker)

</div>

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Domain Model](#domain-model)
- [Background Workers](#background-workers)
- [API Endpoints](#api-endpoints)
- [Conventions](#conventions)
- [Testing & Docker](#testing--docker)

## Quick Start

**Prerequisites:** [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) · [PostgreSQL](https://www.postgresql.org/download/) 12+

```bash
cd apps/api

# 1. Restore dependencies
dotnet restore

# 2. Configure appsettings.Development.json (see Configuration below)

# 3. Apply migrations
dotnet ef database update --project FinanceControl.Data --startup-project FinanceControl.WebApi

# 4. Run
dotnet run --project FinanceControl.WebApi
```

The API starts at **http://localhost:5112**. Interactive docs (Development only): **http://localhost:5112/swagger**.

## Configuration

Edit `FinanceControl.WebApi/appsettings.Development.json` (or copy from an `appsettings.Local.json.example` template if present):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=FinanceControlDb;Username=postgres;Password=YOUR_PASSWORD"
  },
  "AppSettings": {
    "Token": "your-secret-key-minimum-32-characters",
    "Issuer": "http://localhost:5112",
    "Audience": "http://localhost:5112",
    "TokenValidityMins": 60
  }
}
```

| Concern | Detail |
|---|---|
| **Rate limiting** | `auth` policy: 5 req / 15 min (login, register, refresh, forgot-password) · `general` policy: 100 req / min (default) |
| **CORS** | `WebApp` policy allows the web client origin (`http://localhost:3000`) |
| **Security headers** | Applied globally via `SecurityHeadersMiddleware` (X-Content-Type-Options, X-Frame-Options, …) |
| **Auth** | JWT access tokens; refresh tokens persisted in DB and delivered as an HttpOnly cookie to the web client |

> ⚠️ Migrations are run manually. This project never runs `dotnet ef migrations add` / `database update` automatically.

## Architecture

A **layered (N-tier) architecture** across 7 projects, with a strict dependency direction (Domain has no dependencies; WebApi is the composition root):

```
FinanceControl.sln
├── FinanceControl.Domain     → Entities, service interfaces, enums (no dependencies)
├── FinanceControl.Data       → EF Core DbContext, entity mappings, migrations
├── FinanceControl.Services   → Business logic, FluentValidation validators, job logic, seeds
├── FinanceControl.Workers    → Background hosted services (BackgroundService / IHostedService)
├── FinanceControl.Shared     → DTOs, Result<T>, PagedResponse<T>, enums, helpers
├── FinanceControl.WebApi     → Controllers, DI, middleware, Swagger, Program.cs
└── FinanceControl.Tests      → xUnit unit tests
```

### Design principles

- **`Result<T>` over exceptions** — services return `Result<T>` / `Result`; controllers unwrap them into `Ok` / `NotFound` / `BadRequest`. Exceptions are a last resort caught by `GlobalExceptionMiddleware`.
- **No repository layer** — services use `ApplicationDbContext` directly. No repository or unit-of-work abstraction by design.
- **Ownership isolation** — user-owned entities inherit `OwnedEntity` (`UserId`); *every* query is scoped to the authenticated user via `BaseController.GetUserId()`.
- **Workers/Services split** — hosted services in `FinanceControl.Workers` delegate to `XxxJobService` classes in `FinanceControl.Services`.
- **Validation via FluentValidation only** — never DataAnnotations.

## Domain Model

Most entities inherit `OwnedEntity` (`BaseEntity` + `UserId`); `User` and `RefreshToken` are the exceptions.

| Area | Entities |
|---|---|
| **Users & auth** | `User`, `UserPreferences`, `RefreshToken` |
| **Accounts** | `Account` — Checking / Savings / Credit / Cash; balance derived, never stored |
| **Categories** | `Category`, `SubCategory` — transactions always link to a subcategory |
| **Transactions** | `Transaction`, `RecurringTransaction`, `Tag` |
| **Budgets** | `Budget`, `Area`, `BudgetSubcategoryAllocation` |
| **Goals** | `Goal` — item & investment targets |
| **Investments** | `Investment`, `InvestmentTransaction`, `InvestmentDividend` |
| **Market data** | `MarketAsset`, `MarketAssetFundamentals`, `MarketPriceHistory`, `MarketPriceIntraday` |
| **Notifications** | `Notification`, `NotificationPreference`, `AlertRule` |

**Money** is `int` (cents) everywhere. The only exception is `Investment` unit price/quantity, which use `decimal` to match the market-data provider.

**Key enums** (serialized as strings): `EnumTransactionType` (`Expense`/`Income`/`Transfer`), `EnumPaymentType` (`OneTime`/`Installment`/`Recurring`), `EnumRecurrenceType`, `EnumAccountType`.

## Background Workers

| Worker | Responsibility |
|---|---|
| `RecurringTransactionHostedService` | Spawns transactions from recurrence rules |
| `BrapiPriceUpdateHostedService` | Syncs daily market prices from Brapi |
| `BrapiIntradayHostedService` | Syncs intraday market prices |
| `BrapiCleanupHostedService` | Prunes stale market data |
| `NotificationReminderHostedService` | Generates recurring bill/goal reminders |
| `RefreshTokenCleanupHostedService` | Removes expired refresh tokens |

## API Endpoints

All routes require `Authorization: Bearer <token>`, except `POST /api/user/{register,login,refresh}` and the password-reset endpoints.

| Group | Route base |
|---|---|
| Auth & users | `/api/user` |
| Accounts | `/api/account` |
| Categories | `/api/category`, `/api/subcategory` |
| Transactions | `/api/transaction`, `/api/recurrence`, `/api/tag` |
| Budgets | `/api/budget` |
| Goals | `/api/goal` |
| Investments | `/api/investment` |
| Market data | `/api/market` |
| Analytics | `/api/analytics`, `/api/mainpage/summary` |
| Simulations | `/api/simulation` |
| Notifications | `/api/notification`, `/api/alertrule` |
| Import | `/api/import` |
| Admin | `/api/admin` |

Full request/response schemas are documented interactively in Swagger.

## Conventions

- **One DTO class per file** — requests in `Shared/Dtos/Request/`, responses in `Shared/Dtos/Response/`.
- **Mutations return the updated collection** — not just the changed item — so clients refresh in one round trip.
- **All code in English** — identifiers, comments, and error messages.
- **File naming by role** — `Account.cs` (entity), `AccountController.cs`, `AccountService.cs` / `IAccountService.cs`, `CreateAccountRequestDto.cs`, `CreateAccountValidator.cs`, `AccountMap.cs`.

## Testing & Docker

```bash
# Run the test suite
dotnet test

# Build & run the container
docker build -t finance-control-api .
docker run -p 5112:8080 finance-control-api
```

---

<div align="center">

Part of the **Finance Control** monorepo · [Web](../web) · [Mobile](../mobile)

</div>
