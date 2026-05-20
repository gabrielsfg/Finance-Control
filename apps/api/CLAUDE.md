# Finance-Control — Backend API

## Stack

- **.NET 9** — ASP.NET Core Web API
- **Entity Framework Core 9** + **Npgsql** — PostgreSQL database
- **FluentValidation** — request validation (never DataAnnotations)
- **JWT Bearer** — authentication; refresh tokens stored in DB
- **ASP.NET Core Rate Limiting** — fixed-window policies
- **Swagger / OpenAPI** — available in Development

## Solution structure

```
FinanceControl.sln
├── FinanceControl.Domain/          # Entities, interfaces, enums
│   ├── Common/                     # BaseEntity, OwnedEntity
│   ├── Entities/                   # Domain models
│   └── Interfaces/Services/        # IXxxService contracts
├── FinanceControl.Data/            # EF Core
│   ├── Data/ApplicationDbContext.cs
│   ├── Mappings/                   # IEntityTypeConfiguration per entity
│   └── Migrations/
├── FinanceControl.Services/        # Business logic
│   ├── Services/                   # XxxService implementations
│   ├── Validations/                # FluentValidation validators
│   ├── Extensions/ServicesExtensions.cs  # DI registration
│   └── Seeds/
├── FinanceControl.Workers/         # IHostedService / BackgroundService implementations
│   └── (all background workers live here)
├── FinanceControl.Shared/          # Shared across projects
│   ├── Dtos/Request/               # One DTO class per file
│   ├── Dtos/Response/              # One DTO class per file
│   ├── Dtos/Others/
│   ├── Enums/
│   ├── Models/                     # Result<T>, Result, PagedResponse<T>
│   └── Helpers/
└── FinanceControl.WebApi/          # Entry point
    ├── Controllers/
    │   └── Base/BaseController.cs
    ├── Extensions/ControllerValidationExtensions.cs
    ├── Middleware/GlobalExceptionMiddleware.cs
    └── Program.cs
```

## Domain model

### Entity hierarchy

- `BaseEntity` — `Id` (int), `CreatedAt` (DateTime), `UpdatedAt` (DateTime?)
- `OwnedEntity : BaseEntity` — adds `UserId` (int)

Most entities inherit `OwnedEntity`. The exceptions that inherit `BaseEntity` directly (no `UserId`) are:
- `User` — is the user itself
- `RefreshToken` — has `UserId` as a plain FK property, not inherited

Never create a user-owned entity without `UserId`.

### Entities

| Entity | Notes |
|---|---|
| `User` | Auth, preferences, lockout, password reset |
| `Account` | Debit/Checking/Savings/Credit/Cash; balance is derived from transactions, never stored |
| `Category` / `SubCategory` | Two-level hierarchy; transactions always link to a subcategory |
| `Transaction` | Expense/Income/Transfer; OneTime/Installment/Recurring; links to subcategory |
| `RecurringTransaction` | Defines the recurrence rule; spawns transactions via a hosted service |
| `Budget` | Named period with recurrence; contains Areas |
| `Area` | Logical group inside a budget |
| `BudgetSubcategoryAllocation` | Expected vs. spent per subcategory in an area |
| `Goal` | Item or investment targets; uses virtual account transactions |
| `Investment` / `InvestmentTransaction` / `InvestmentDividend` | Portfolio tracking |
| `Tag` | Many-to-many with Transaction |
| `UserPreferences` | Per-user settings (currency, language) |
| `RefreshToken` | JWT refresh token persistence |

### Account balance rule

Account balance is **never stored** — it is always computed from the sum of its transactions:
- `Income` → `+value`
- `Expense` → `-value`
- `Transfer` (outbound) → `-value`; `Transfer` (inbound via DestinationAccountId) → `+value`

## Monetary values

- All monetary amounts are stored and transmitted as **`int` (cents)**: R$ 132,12 → `13212`
- **Exception**: `Investment` entities use `decimal` for unit price and quantity because the Brapi API returns these as long/decimal values
- Never use `double` for money anywhere in the codebase

## Patterns

### Result<T>

Services return `Result<T>` or `Result` for operations that can fail. Controllers unwrap these — never return `Result<T>` directly from a controller action.

```csharp
// Service
public async Task<Result<IEnumerable<GetAccountItemResponseDto>>> UpdateAccountAsync(...)
{
    var account = await _context.Accounts.FirstOrDefaultAsync(...);
    if (account == null)
        return Result<IEnumerable<GetAccountItemResponseDto>>.Failure("Account not found.");
    // ...
    return Result<IEnumerable<GetAccountItemResponseDto>>.Success(accounts);
}

// Controller
var result = await _accountService.UpdateAccountAsync(requestDto, userId);
if (result.IsFailure)
    return NotFound(new { error = result.Error });
return Ok(result.Value);
```

When a service returns a plain collection or object (not `Result<T>`), the controller returns `Ok(result)` directly.

### No Repository Pattern

Services inject `ApplicationDbContext` directly — there is no repository or unit-of-work layer. Do not introduce repositories or a unit-of-work abstraction.

`SaveChangesAsync()` is called by the service after each logical operation.

### Controllers

All controllers:
- Inherit `BaseController` — provides `GetUserId()` from JWT claims
- Are decorated with `[Route("api/[controller]")]`, `[ApiController]`, and `[Authorize]`
- Validate route `int` ids with `this.ValidatePositiveId(id, "id")` before using them
- Validate request DTOs with an injected `IValidator<T>` and `validationResult.ToActionResult()`
- Never expose `Result<T>` in the response — always unwrap to `Ok` / `NotFound` / `BadRequest`
- Auth endpoints (`UserController` login/register/refresh) use `[EnableRateLimiting("auth")]`

```csharp
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AccountController : BaseController
{
    private readonly IAccountService _accountService;
    private readonly IValidator<CreateAccountRequestDto> _createAccountValidator;

    public AccountController(IAccountService accountService, IValidator<CreateAccountRequestDto> createAccountValidator)
    {
        _accountService = accountService;
        _createAccountValidator = createAccountValidator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAccountAsync([FromBody] CreateAccountRequestDto requestDto)
    {
        var validationResult = _createAccountValidator.Validate(requestDto);
        if (validationResult.ToActionResult() is { } errorResult)
            return errorResult;

        var userId = GetUserId();
        var result = await _accountService.CreateAccountAsync(requestDto, userId);
        return Created($"/api/accounts", result.Value);
    }
}
```

### Ownership enforcement

Every query against a user-owned entity **must** filter by `UserId`. Never fetch data without scoping to the authenticated user:

```csharp
var account = await _context.Accounts
    .FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id);
```

### FluentValidation

Validators live in `FinanceControl.Services/Validations/`. Each validator:
- Inherits `AbstractValidator<TDto>`
- Uses `When()` for conditional rules
- Writes error messages in English

Never use DataAnnotations (`[Required]`, `[Range]`, etc.) for validation.

### DTOs

- Each DTO class lives in **its own file** — one class per file, no exceptions
- Request DTOs → `FinanceControl.Shared/Dtos/Request/`
- Response DTOs → `FinanceControl.Shared/Dtos/Response/`
- Other / shared DTOs → `FinanceControl.Shared/Dtos/Others/`
- Use `public T Property { get; set; }` style

### Enums

Enums live in `FinanceControl.Shared/Enums/`. Enums are serialized as strings (`JsonStringEnumConverter` is registered globally in `Program.cs`).

Key enums:

| Enum | Values |
|---|---|
| `EnumTransactionType` | `Expense`, `Income`, `Transfer` |
| `EnumPaymentType` | `OneTime`, `Installment`, `Recurring` |
| `EnumRecurrenceType` | `None`, `Daily`, `WorkDay`, `Weekly`, `Biweekly`, `Monthly`, `Quarterly`, `Semiannually`, `Annually` |
| `EnumAccountType` | `Debit`, `Checking`, `Savings`, `Credit`, `Cash` |

### Mutations return the updated list

Mutating operations (create, update, delete) return the full updated collection for the affected resource, not just the changed item. The web and mobile clients use this to refresh their local cache in a single round trip.

## Adding a new feature — canonical flow

1. **Entity** → `FinanceControl.Domain/Entities/XxxEntity.cs`, inheriting `OwnedEntity` (or `BaseEntity` if not user-owned)
2. **Mapping** → `FinanceControl.Data/Mappings/XxxEntityMap.cs`, implementing `IEntityTypeConfiguration<XxxEntity>`
3. **DbSet** → add `DbSet<XxxEntity>` to `ApplicationDbContext`
4. **Migration** → tell the user to run `dotnet ef migrations add <Name>` (never run it yourself)
5. **DTOs** → one file per DTO in `Shared/Dtos/Request/` and `Shared/Dtos/Response/`
6. **Validator** → `FinanceControl.Services/Validations/CreateXxxValidator.cs`
7. **Service interface** → `FinanceControl.Domain/Interfaces/Services/IXxxService.cs`
8. **Service** → `FinanceControl.Services/Services/XxxService.cs`
9. **DI** → register in `ServicesExtensions.AddAplicationServices()` as `Scoped`
10. **Controller** → `FinanceControl.WebApi/Controllers/XxxController.cs`

When a feature only adds behavior to existing entities (no new table), skip steps 1–4.

## Configuration

```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=MyFinanceDb;Username=postgres;Password=..."
  },
  "AppSettings": {
    "Token": "<min 32 chars secret>",
    "Issuer": "http://localhost:5112",
    "Audience": "http://localhost:5112",
    "TokenValidityMins": 10
  }
}
```

Rate limiting policies (defined in `Program.cs`):
- `"auth"` — 5 requests / 15 min (login, register, refresh, forgot-password)
- `"general"` — 100 requests / 1 min (applied to all controllers by default)

CORS policy `"WebApp"` allows `http://localhost:3000` and `https://localhost:3000`.

## Background services

All `IHostedService` / `BackgroundService` implementations live in the `FinanceControl.Workers` project. Services that contain the job logic (`XxxJobService`) live in `FinanceControl.Services` and are called by the workers.

- `RecurringTransactionHostedService` (Workers) → drives `RecurringTransactionJobService` (Services)
- Brapi sync workers and any future scheduled jobs follow the same pattern: hosted service in Workers, logic in Services

## Naming conventions

All code must be written in English. No Portuguese in identifiers, comments, or error messages. UI-facing strings visible to the user are the only exception.

| Element | Convention | Example |
|---|---|---|
| Classes, interfaces, enums | PascalCase | `AccountService`, `IAccountService`, `EnumAccountType` |
| Methods, properties | PascalCase | `CreateAccountAsync`, `IsDefaultAccount` |
| Private fields | `_camelCase` | `_context`, `_accountService` |
| Local variables | camelCase | `userId`, `validationResult` |
| Files | match class name exactly | `AccountService.cs` |
| Enum prefix | `Enum` prefix | `EnumTransactionType` |

### File naming by role

File names must reflect their role with a suffix, except for entities which use only the entity name:

| Role | Suffix | Example |
|---|---|---|
| Entity | _(none)_ | `Account.cs`, `Transaction.cs` |
| Controller | `Controller` | `AccountController.cs` |
| Service | `Service` | `AccountService.cs` |
| Service interface | `Service` (prefixed with `I`) | `IAccountService.cs` |
| Request DTO | `RequestDto` | `CreateAccountRequestDto.cs` |
| Response DTO | `ResponseDto` | `GetAccountItemResponseDto.cs` |
| Validator | `Validator` | `CreateAccountValidator.cs` |
| EF mapping | `Map` | `AccountMap.cs` |
| Enum | `Enum` prefix | `EnumAccountType.cs` |
| Middleware | `Middleware` | `GlobalExceptionMiddleware.cs` |
| Extension | `Extensions` | `ServicesExtensions.cs` |

## Rules — never do these

- **Never run `dotnet ef migrations add` or `dotnet ef database update`** — the user runs migrations manually. After changes that require a migration, only suggest the migration name.
- **Never run `git commit`, `git merge`, or `git push`** — the user executes git operations manually.
- **Never use DataAnnotations** (`[Required]`, `[Range]`, etc.) for validation — only FluentValidation.
- **Never add Repository Pattern, Unit of Work, or extra abstraction layers** — services use `ApplicationDbContext` directly by design.
- **Never return unhandled exceptions** — `GlobalExceptionMiddleware` is the last-resort fallback, not the intended error path. Use `Result<T>.Failure` in services.
- **Never query user-owned data without filtering by `UserId`** — every owned entity query must be scoped to the authenticated user.
- **Never put more than one DTO class in a single file** — one class per file, always.
