# Finance Control API — Personal Finance Management Backend

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat&logo=dotnet)
![C#](https://img.shields.io/badge/C%23-13.0-239120?style=flat&logo=csharp)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-EF_Core_9-336791?style=flat&logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT_Bearer-000000?style=flat&logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/Docs-Swagger-85EA2D?style=flat&logo=swagger)
![Status](https://img.shields.io/badge/Status-Feature_Complete-brightgreen?style=flat)

A RESTful API built with ASP.NET Core for managing personal finances. It handles user authentication, multi-account management, hierarchical budgeting, and provides analytics for spending patterns — all designed to be consumed by the [Finance Control App](https://github.com/gabrielsfg/Finance-Control-App) mobile client.

---

## About the Project

Finance Control API is the backend of a full-stack personal finance system. The goal of this project is to give users full visibility and control over their financial life: tracking income and expenses, organizing spending into budgets, and surfacing insights about where money is going.

The API supports multiple financial accounts per user, a flexible multi-level category system (Category → SubCategory → Area), and three types of transactions: one-time, installment-based, and recurring. It also provides a dashboard summary endpoint that powers the app's home screen with balance analytics, budget performance, and top spending categories.

This is a personal project built to deepen expertise in .NET backend development, clean architecture, and real-world API design patterns.

---

## Features

| Feature | Status |
|---|---|
| User registration & JWT authentication | ✅ Done |
| Multi-account management (balance + savings goal) | ✅ Done |
| Hierarchical categories (Category → SubCategory → Area) | ✅ Done |
| One-time, installment & recurring transactions | ✅ Done |
| Budget management with sub-category allocations | ✅ Done |
| Dashboard analytics (balance, top categories, budget performance) | ✅ Done |
| Swagger UI with Bearer token support | ✅ Done |

---

## Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| ASP.NET Core | Web API framework | .NET 9.0 |
| Entity Framework Core | ORM & database migrations | 9.0 |
| PostgreSQL | Relational database | — |
| JWT Bearer | Authentication | — |
| FluentValidation | Request DTO validation | 12.x |
| Swagger / Swashbuckle | API documentation | 10.x |

---

## Architecture

The solution follows a **Layered (N-Tier) Architecture** split into 5 projects with clear separation of concerns:

```
FinanceControl.sln
├── FinanceControl.Domain        # Entities, interfaces, enums — no dependencies
├── FinanceControl.Data          # EF Core DbContext, migrations, entity mappings
├── FinanceControl.Services      # Business logic, FluentValidation validators
├── FinanceControl.Shared        # DTOs (request/response), helpers, shared models
└── FinanceControl.WebApi        # Controllers, DI setup, Swagger, entry point
```

**Key patterns used:**
- **Result\<T\> pattern** — service methods return `Result<T>` instead of throwing exceptions, making error handling explicit and predictable
- **OwnedEntity base class** — all user-owned entities inherit `UserId`, enforcing multi-user data isolation at the model level
- **BaseController** — shared `GetUserId()` method extracts the authenticated user's ID from JWT claims, used across all controllers
- **Repository-less services** — business logic lives in services that directly use the EF Core DbContext, keeping the stack pragmatic and lean

---

## API Endpoints Overview

All endpoints except `/api/user/register` and `/api/user/login` require a `Authorization: Bearer <token>` header.

| Group | Endpoints |
|---|---|
| Auth | `POST /api/user/register`, `POST /api/user/login` |
| Accounts | CRUD `/api/account` |
| Categories | CRUD `/api/category`, `/api/subcategory` |
| Areas | CRUD `/api/area`, `/api/areacategory` |
| Budgets | CRUD `/api/budget`, `/api/budgetsubcategoryallocation` |
| Transactions | CRUD `/api/transaction` + recurring management |
| Dashboard | `GET /api/mainpage/summary?startDate=&finishDate=&budgetId=` |

Full interactive documentation is available via Swagger UI after running the project.

---

## Getting Started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [PostgreSQL](https://www.postgresql.org/download/) (v12+)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/gabrielsfg/FinanceControl.git
cd FinanceControl

# 2. Restore dependencies
dotnet restore
```

### Configuration

Edit `FinanceControl.WebApi/appsettings.Development.json`:

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

### Run Migrations & Start

```bash
# Apply database migrations
dotnet ef database update --project FinanceControl.Data --startup-project FinanceControl.WebApi

# Run the API
cd FinanceControl.WebApi
dotnet run
```

The API will be available at `http://localhost:5112`.
Swagger UI: `http://localhost:5112/swagger/index.html`

---

## Related Repository

This API is consumed by the **Finance Control App** — a Flutter mobile app for Android and iOS.

[Finance Control App →](https://github.com/gabrielsfg/Finance-Control-App)

The app communicates with this API using JWT tokens stored in secure device storage. Authentication state is managed with Riverpod and GoRouter handles auth-aware navigation.

---

## Project Status

The backend is **feature-complete** for the initial version. All core domain features are implemented and the API is ready to be consumed by the frontend.

Active frontend development is ongoing in the [Finance Control App](https://github.com/gabrielsfg/Finance-Control-App) repository.
