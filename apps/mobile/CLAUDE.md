# FinanceControl — Flutter Mobile

## Project purpose

Personal finance tracking app for 18–30 year-olds. All data entry is **manual and intentional** — no bank statement import in V1. The key UX constraint is: **register a transaction in under 10 seconds**.

- Backend: .NET 8 REST API with JWT authentication (`apps/api/`)
- Frontend: this Flutter app, consuming that API
- Target platforms: **Android and iOS only**

---

## Tech stack

| Concern | Package |
|---|---|
| State management | `flutter_riverpod` + `riverpod_annotation` |
| Navigation | `go_router` |
| HTTP client | `dio` |
| Token storage | `flutter_secure_storage` |
| Immutable models | `freezed` + `json_serializable` |
| Code generation | `build_runner` + `riverpod_generator` + `freezed` |
| Linting | `flutter_lints` + `custom_lint` + `riverpod_lint` |

---

## Architecture

Feature-first folder structure:

```
lib/
├── main.dart                    # Entry point — ProviderScope + MaterialApp.router
├── core/                        # App-wide infrastructure, no business logic
│   ├── api/
│   │   ├── api_client.dart      # Dio setup + AuthInterceptor
│   │   └── api_endpoints.dart   # All URL constants
│   ├── router/
│   │   └── app_router.dart      # GoRouter + auth redirect + _RouterListenable
│   ├── storage/
│   │   └── token_storage.dart   # JWT access/refresh token persistence
│   └── theme/
│       └── app_theme.dart       # Material 3 theme (update with Figma colors)
├── features/                    # One folder per domain
│   ├── auth/
│   │   ├── data/                # Repository + DTOs (Request/Response separated)
│   │   ├── providers/           # Riverpod state (AuthNotifier)
│   │   └── presentation/        # Pages + widgets
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   └── home/
└── shared/
    └── widgets/                 # Reusable widgets with no feature affinity
        └── app_shell.dart       # Bottom NavigationBar shell
```

**Layer order inside a feature:** `data/` (repository + DTOs + models) → `providers/` (Riverpod) → `presentation/` (pages/widgets).

---

## Domain model

### Account
`name`, `balance`, `initialBalance`, `goalAmount?`, `isDefault`, `excludeFromNetWorth`.
- **Net Worth** = sum of balances where `excludeFromNetWorth = false`
- The `isDefault` account is pre-selected when creating a transaction

### Category / Subcategory
Two-level hierarchy: `Category → Subcategory`. Transactions always link to a **subcategory** (category is inferred). Defaults are provisioned on registration; user can modify freely.

### Transaction
`value` (in cents — positive = income, negative = expense), `date`, `description?`, `subcategoryId`, `accountId`, `budgetId?`, `recurrence`, `installmentCount`.

Three mutually exclusive types:
- **OneTime** — single entry or exit
- **Recurring** — repeats automatically (`Daily | WorkDay | Weekly | Biweekly | Monthly | Quarterly | Semiannually | Annually`)
- **Installment** — total value split into N parcelas; backend creates N transactions, first absorbs remainder cents

> Recurring and Installment are **mutually exclusive**.

### Budget
`name`, `startDate`, `recurrence` (calculated `endDate`).
- **Area** — logical group inside a budget (e.g., "Moradia", "Lazer")
- **BudgetSubcategoryAllocation** — `subcategoryId` + `expectedAmount` + `type` (Income/Expense)
- **"Outras Despesas"** — transactions within the budget period that have no matching allocation

---

## Coding conventions

### Naming

| Element | Convention | Example |
|---|---|---|
| Files & folders | `snake_case.dart` | `transaction_repository.dart` |
| Classes | `PascalCase` | `TransactionRepository` |
| Variables & methods | `camelCase` | `getAllTransactions()` |
| Constants | `camelCase` | `baseUrl` |
| Private members | `_camelCase` | `_dio` |
| Providers (manual) | `camelCaseProvider` | `tokenStorageProvider` |

> File and folder names follow the Flutter/Dart standard `snake_case`. All other identifiers (classes, methods, variables, providers) use `camelCase` / `PascalCase` as usual in Dart.

### DTOs

Separate request and response DTOs, mirroring the backend pattern:

```dart
// data/dtos/create_transaction_request_dto.dart
@freezed
class CreateTransactionRequestDto with _$CreateTransactionRequestDto {
  const factory CreateTransactionRequestDto({
    required int subCategoryId,
    required int accountId,
    required int value,        // always in cents
    required String type,      // "Expense" | "Income"
    required String paymentType, // "OneTime" | "Installment" | "Recurring"
    required DateTime transactionDate,
    int? budgetId,
    int? totalInstallments,
    String? recurrence,
    DateTime? recurringEndDate,
  }) = _CreateTransactionRequestDto;

  factory CreateTransactionRequestDto.fromJson(Map<String, dynamic> json) =>
      _$CreateTransactionRequestDtoFromJson(json);
}

// data/dtos/get_transaction_response_dto.dart
@freezed
class GetTransactionResponseDto with _$GetTransactionResponseDto {
  const factory GetTransactionResponseDto({
    required int id,
    required int subCategoryId,
    required String subCategoryName,
    required int accountId,
    required String accountName,
    required int value,
    required String type,
    required String paymentType,
    required DateTime transactionDate,
    int? budgetId,
    int? recurringTransactionId,
    int? parentTransactionId,
    int? installmentNumber,
    int? totalInstallments,
    required bool isPaid,
  }) = _GetTransactionResponseDto;

  factory GetTransactionResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetTransactionResponseDtoFromJson(json);
}
```

Rules:
- Request DTOs → what you send to the API
- Response DTOs → what you receive from the API
- Domain models (`Account`, `Transaction`) → what the UI and providers consume, mapped from response DTOs
- Never use response DTOs directly in the UI layer — always map to a domain model

### Providers

**Todo o projeto usa providers manuais** (`riverpod_generator` foi removido por incompatibilidade com Dart SDK 3.11+).
```dart
// Repositório
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider).dio),
);

// Notifier com estado assíncrono
final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
```

Rules:
- Use `ref.watch` in `build()` for reactive reads
- Use `ref.read` only in callbacks/event handlers — never in `build()`
- Use `ref.listen` to react to state changes (e.g., navigation after success)

### Repository pattern

Each feature has a repository that maps API responses to domain models:

```dart
class TransactionRepository {
  const TransactionRepository(this._dio);
  final Dio _dio;

  Future<List<GetTransactionResponseDto>> getAllTransactions() async {
    final response = await _dio.get(ApiEndpoints.transactions);
    return (response.data as List)
        .map((e) => GetTransactionResponseDto.fromJson(e))
        .toList();
  }

  Future<CreateTransactionResponseDto> createTransaction(
    CreateTransactionRequestDto requestDto,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.transactions,
      data: requestDto.toJson(),
    );
    return CreateTransactionResponseDto.fromJson(response.data);
  }
}
```

The repository receives `Dio` directly (via `apiClientProvider.dio`), not `ApiClient`.

### Value representation

- All monetary values are in **cents** (`int`) — never `double` for money
- Display conversion happens only in the UI layer: `value / 100` for rendering
- Example: R$ 132,12 is stored and sent as `13212`

### Enum strings

Enums are sent to the backend as their exact name string. Match the backend enums:

```dart
// TransactionType
"Expense" | "Income"

// PaymentType
"OneTime" | "Installment" | "Recurring"

// RecurrenceType
"None" | "Daily" | "WorkDay" | "Weekly" | "Biweekly" |
"Monthly" | "Quarterly" | "Semiannually" | "Annually"
```

### Error handling

- Repositories let `DioException` propagate — catch in the calling provider/notifier
- For 401 errors: call `ref.read(authNotifierProvider.notifier).logout()` from the notifier
- For 422 errors: surface validation messages from the response body to the user
- For 404 errors: resource not found — handle gracefully in UI

### Navigation

- `context.go('/path')` — replaces the navigation stack (use for bottom nav tabs)
- `context.push('/path')` — pushes onto the stack (back button works)
- Never use `Navigator.of(context)` — always use GoRouter

### Widgets

- `ConsumerWidget` when you need Riverpod but no local state
- `ConsumerStatefulWidget` when you need both local state and Riverpod
- All pages: `features/<name>/presentation/<name>_page.dart`
- Reusable widgets: `shared/widgets/`

---

## Auth flow

1. App starts → `AuthNotifier.build()` reads token from `TokenStorage`
2. No token → GoRouter `redirect` sends to `/login`
3. Token present → GoRouter `redirect` sends to `/` (home shell)
4. **Login success** → call `ref.read(authNotifierProvider.notifier).onLoginSuccess(accessToken, refreshToken)` → tokens saved → router auto-redirects to `/`
5. **Logout** → call `.logout()` → tokens cleared → router auto-redirects to `/login`
6. `_RouterListenable` (a `ChangeNotifier` subscribed to `authNotifierProvider`) triggers GoRouter to re-evaluate `redirect` on auth state changes

API base URL is `http://10.0.2.2:5000` (Android emulator → localhost).

---

## Adding a new feature

1. Create `lib/features/<name>/`
2. Create request/response DTOs: `data/dtos/<name>_request_dto.dart` and `<name>_response_dto.dart` (Freezed + fromJson/toJson)
3. Create the domain model: `data/models/<name>.dart` (Freezed + fromJson)
4. Create the repository: `data/<name>_repository.dart` (class + manual `Provider`)
5. Create the state: `providers/<name>_provider.dart` (manual `AsyncNotifierProvider` or `NotifierProvider`)
6. Create the page: `presentation/<name>_page.dart`
7. Add endpoint to `lib/core/api/api_endpoints.dart`
8. Add route to `lib/core/router/app_router.dart` (inside `ShellRoute` if it uses the bottom nav)
9. Run build_runner

---

## Common tasks

### Running build_runner

Always run after adding/modifying `@riverpod` providers, `@freezed` models, or `@JsonSerializable` classes:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Consulting the backend

Before implementing any API call, check the .NET controllers in `apps/api/` to get the exact endpoint path, HTTP method, request body shape, and response structure. **Do not assume — read the controller.** Pay attention to:
- Which fields are nullable (`?`) vs required
- HTTP verb semantics (PATCH for partial updates, not PUT)
- Route parameters vs body parameters

### Updating the theme

`lib/core/theme/app_theme.dart` currently uses a placeholder green seed color. When implementing screens from Figma, update `AppTheme.light` and `AppTheme.dark` with the actual color tokens, typography, and shape values from the design.

### API connectivity

| Environment | Base URL |
|---|---|
| Android emulator | `http://10.0.2.2:5000` (current default) |
| iOS simulator | `http://localhost:5000` |
| Physical device | Machine's LAN IP, e.g. `http://192.168.x.x:5000` |

Change `ApiEndpoints.baseUrl` in `lib/core/api/api_endpoints.dart`.

---

## What is NOT implemented yet

- **All feature screens** — pages are empty `Scaffold` placeholders. Replace from Figma.
- **Theme** — placeholder green color; replace with Figma design tokens.
- **`features/<name>/data/` layer** — no repositories, DTOs, or models exist yet.
- **JWT refresh logic** — `_AuthInterceptor` passes 401 through without retrying. Implement refresh-token interceptor before production.
- **Auth screens** — no form, validation, or API call wired up yet.