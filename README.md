# Finance Control App — Personal Finance Mobile Application

![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat&logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.11+-0175C2?style=flat&logo=dart)
![Riverpod](https://img.shields.io/badge/State-Riverpod_2-00BCD4?style=flat)
![Platform](https://img.shields.io/badge/Platform-Android_%7C_iOS-lightgrey?style=flat)
![Status](https://img.shields.io/badge/Status-In_Development-yellow?style=flat)

A Flutter mobile app for personal finance tracking on Android and iOS. Designed around a core UX constraint: **register a transaction in under 10 seconds**. Consumes the [Finance Control API](https://github.com/gabrielsfg/FinanceControl) — a .NET 9 backend with JWT authentication.

---

## About the Project

Finance Control App is the mobile frontend of a full-stack personal finance system. The app is built for users who want intentional, manual control over their finances — no automatic bank imports. Every transaction is entered deliberately, so the UX is optimized for speed and minimal friction.

The app covers the full financial picture: multiple accounts with net worth tracking, a hierarchical category and budget system, recurring transactions, and a dashboard that surfaces spending patterns and budget performance at a glance.

This is a personal project built to deepen expertise in Flutter, Riverpod state management, and feature-first mobile architecture.

---

## Features

| Feature | Status |
|---|---|
| JWT authentication (login, register, logout) | ✅ Done |
| Secure token storage (FlutterSecureStorage) | ✅ Done |
| Auth-aware navigation with auto-redirect | ✅ Done |
| API client with auth interceptor (auto 401 logout) | ✅ Done |
| Material 3 theme with light/dark mode | ✅ Done |
| Account management screens | 🚧 In Progress |
| Transaction entry (one-time, installment, recurring) | 🚧 In Progress |
| Budget tracking with progress visualization | 🚧 In Progress |
| Dashboard (balance, income/expense, top categories) | 🚧 In Progress |
| Category & subcategory management | 🚧 In Progress |
| Profile screen | 🚧 In Progress |

---

## Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| Flutter | UI framework (Android + iOS) | 3.x |
| Dart | Language | 3.11+ |
| Riverpod | State management | 2.5.x |
| GoRouter | Navigation & auth routing | 14.x |
| Dio | HTTP client | 5.7.x |
| FlutterSecureStorage | Encrypted token storage | 9.x |
| Freezed + JsonSerializable | Immutable models & JSON | 2.5.x |
| Google Fonts | Typography | 6.x |

> **Note on Riverpod:** Code generation (`riverpod_generator`) was removed due to an incompatibility with Dart 3.11+. All providers are written manually.

---

## Architecture

The project follows a **feature-first** structure. Each feature is self-contained with its own data, state, and UI layers:

```
lib/
├── core/
│   ├── api/          # Dio client setup + auth interceptor + endpoint constants
│   ├── config/       # Environment config (local / staging / production)
│   ├── router/       # GoRouter setup + auth-aware redirect logic
│   ├── storage/      # JWT token persistence (FlutterSecureStorage)
│   ├── theme/        # Material 3 theme, color tokens, spacing, typography
│   └── utils/        # Formatters (currency, date, percentage) + extensions
│
├── features/
│   ├── auth/         # Login, register, splash — providers + pages
│   ├── accounts/     # Account CRUD — repo + providers + pages
│   ├── transactions/ # Transaction management — repo + providers + pages
│   ├── budgets/      # Budget tracking — repo + providers + pages
│   ├── categories/   # Category/subcategory — repo + providers + pages
│   ├── home/         # Dashboard summary
│   └── profile/      # User profile
│
└── shared/
    └── widgets/      # Reusable UI components (AppShell, buttons, etc.)
```

**Layer order inside each feature:** `data/` (repository + DTOs + models) → `providers/` (Riverpod state) → `presentation/` (pages + widgets)

**Key implementation decisions:**
- **All monetary values are integers (cents)** — never `double`, avoiding floating-point precision errors
- **Manual Riverpod providers** — no code generation, full explicit control
- **Environment-aware API config** — switch between `local`, `staging`, and `production` via a single enum
- **Auth interceptor** — Dio automatically attaches `Authorization: Bearer <token>` to every request and triggers logout on `401`

---

## Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (Dart 3.11+)
- Android Studio or Xcode (for emulator/simulator)
- [Finance Control API](https://github.com/gabrielsfg/FinanceControl) running locally or on a remote server

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/gabrielsfg/Finance-Control-App.git
cd Finance-Control-App

# 2. Install dependencies
flutter pub get

# 3. Run code generation (for Freezed models)
flutter pub run build_runner build --delete-conflicting-outputs
```

### Configuration

Set the API base URL in `lib/core/config/app_config.dart` by changing the `_current` environment:

```dart
// Android emulator maps to host machine's localhost
static const _current = AppEnv.local; // baseUrl: http://10.0.2.2:5112

// iOS simulator uses localhost directly
// For physical device: update AppEnv.local to your machine's LAN IP
```

### Run

```bash
# Android emulator
flutter run -d emulator-5554

# iOS simulator
flutter run -d "iPhone 15"

# List available devices
flutter devices
```

---

## Related Repository

This app consumes the **Finance Control API** — a RESTful .NET 9 backend with PostgreSQL, JWT auth, and full Swagger documentation.

[Finance Control API →](https://github.com/gabrielsfg/FinanceControl)

---

## Project Status

The project infrastructure is complete (auth flow, navigation, API client, theming, architecture). Feature screens are **actively being developed**.

**Done:** JWT authentication, auth-aware routing, API integration layer, secure token storage, Material 3 theming with light/dark mode support.

**In progress:** All feature screens — accounts, transactions, budgets, categories, dashboard, and profile.
