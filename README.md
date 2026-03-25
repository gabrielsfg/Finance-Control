# Finance Control

A personal finance management application built as a full-stack project with clean architecture and software engineering best practices.

## Monorepo Structure

apps/api     - ASP.NET Core 9 REST API (C#), EF Core + PostgreSQL, JWT Auth
apps/mobile  - Flutter 3.11 (Android/iOS), Riverpod, GoRouter
apps/web     - (planned) Web frontend
docs/        - (planned) SRS, ADRs, data model, API specification, roadmap

## Tech Stack

Backend (apps/api)
- .NET 9 / C# 13
- ASP.NET Core Web API
- Entity Framework Core + PostgreSQL
- JWT Authentication
- FluentValidation
- Swagger / OpenAPI

Mobile (apps/mobile)
- Flutter 3.11 / Dart 3
- Riverpod (state management)
- GoRouter (navigation)
- Dio (HTTP client)
- Material 3

## Getting Started

API
  cd apps/api
  dotnet restore
  dotnet run --project FinanceControl.WebApi

Mobile
  cd apps/mobile
  flutter pub get
  flutter run

## Features

- JWT Authentication (register and login)
- Multi-account management with savings goals
- Hierarchical category system
- Three transaction types: one-time, installment-based, and recurring
- Budget tracking per subcategory
- Financial summary dashboard
- Wishlist management
