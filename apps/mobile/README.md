<div align="center">

# Finance Control Mobile

**The Flutter client for the Finance Control platform — Android & iOS.**

Designed around one constraint: **register a transaction in under 10 seconds.** Powered by the [Finance Control API](../api).

![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat&logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.11+-0175C2?style=flat&logo=dart)
![Riverpod](https://img.shields.io/badge/State-Riverpod_2-00BCD4?style=flat)
![Platform](https://img.shields.io/badge/Platform-Android_%7C_iOS-lightgrey?style=flat)

</div>

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Patterns](#core-patterns)
- [Authentication](#authentication)

## Quick Start

**Prerequisites:** [Flutter SDK](https://docs.flutter.dev/get-started/install) (Dart 3.11+) · Android Studio or Xcode · the [Finance Control API](../api) running.

```bash
cd apps/mobile

# Install dependencies
flutter pub get

# Generate Freezed models + JSON serialization
dart run build_runner build --delete-conflicting-outputs

# Run
flutter devices                    # list devices
flutter run -d emulator-5554       # Android emulator
flutter run -d "iPhone 15"         # iOS simulator
```

> Re-run the `build_runner` command after changing any Freezed model or JSON-serializable class.

## Configuration

The API base URL is chosen by environment in `lib/core/config/app_config.dart` — change `_current` to switch:

```dart
static const AppEnv _current = AppEnv.local; // → http://localhost:5112
```

| Environment | Base URL |
|---|---|
| Android emulator | `http://10.0.2.2:5112` (maps to host localhost) |
| iOS simulator | `http://localhost:5112` |
| Physical device | Your machine's LAN IP, e.g. `http://192.168.x.x:5112` |

> Start the API with the Kestrel HTTP profile so it isn't bound to IIS Express only:
> `dotnet run --project FinanceControl.WebApi --launch-profile http`

## Tech Stack

| Concern | Package |
|---|---|
| State management | `flutter_riverpod` |
| Navigation | `go_router` |
| HTTP client | `dio` |
| Token storage | `flutter_secure_storage` |
| Models & JSON | `freezed` + `json_serializable` |
| Charts | `fl_chart` |
| Icons | `lucide_icons` |
| Flags | `country_flags` (SVG) |
| Typography | `google_fonts` |

> **On code generation:** `riverpod_generator` was removed due to an incompatibility with the Dart 3.11 analyzer — **all providers are written manually**. `build_runner` is still used for Freezed and JSON serialization.

## Project Structure

Feature-first. Each feature is self-contained with `data/`, `providers/`, and `presentation/` layers.

```
lib/
├── main.dart                 # ProviderScope + MaterialApp.router
├── core/                     # app-wide infrastructure (no business logic)
│   ├── api/                  # Dio client + auth interceptor + endpoint constants
│   ├── config/               # environment config (local / staging / production)
│   ├── router/               # GoRouter + auth-aware redirect
│   ├── storage/              # JWT token persistence (FlutterSecureStorage)
│   ├── theme/                # Material 3 theme, tokens, typography
│   └── utils/                # formatters + extensions
├── features/                 # one folder per domain
│   ├── auth/                 # login, register, forgot/reset password, splash
│   ├── accounts/             # account CRUD
│   ├── transactions/         # transaction management
│   ├── budgets/              # budget tracking
│   ├── categories/           # category / subcategory management
│   ├── analytics/            # charts & spending analytics
│   ├── home/                 # dashboard summary
│   ├── wishlist/             # wishlist items
│   └── profile/              # user profile & preferences
└── shared/
    └── widgets/              # reusable UI (AppShell, …)
```

**Layer order inside a feature:** `data/` (repository + DTOs + models) → `providers/` (Riverpod) → `presentation/` (pages + widgets).

## Core Patterns

- **Money in cents** — all monetary values are `int`; convert to `double` only at the display layer.
- **Manual Riverpod providers** — full explicit control, no code generation for state.
- **Environment-aware config** — one enum switches `local` / `staging` / `production`.
- **Separate request/response DTOs** — mapped to domain models before reaching the UI.
- **Auth interceptor** — Dio attaches the bearer token to every request and triggers logout on `401`.
- **English-only code** — identifiers, comments, and mock data; Portuguese only in user-facing copy.

## Authentication

1. App starts → the auth notifier reads the token from `TokenStorage`.
2. No token → GoRouter redirects to `/login`; token present → redirects to `/` (home shell).
3. **Login success** → tokens saved to secure storage → router auto-redirects to `/`.
4. **Logout** → tokens cleared → router auto-redirects to `/login`.
5. A `ChangeNotifier` subscribed to the auth provider makes GoRouter re-evaluate its redirect on every auth state change.

---

<div align="center">

Part of the **Finance Control** monorepo · [API](../api) · [Web](../web)

</div>
