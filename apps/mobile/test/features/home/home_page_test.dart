import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/core/utils/app_locale.dart';
import 'package:finance_control_front/features/accounts/data/models/account.dart';
import 'package:finance_control_front/features/accounts/providers/accounts_provider.dart';
import 'package:finance_control_front/features/goals/data/goal_models.dart';
import 'package:finance_control_front/features/goals/providers/goal_provider.dart';
import 'package:finance_control_front/features/home/data/models/home_summary.dart';
import 'package:finance_control_front/features/home/presentation/home_page.dart';
import 'package:finance_control_front/features/home/providers/home_provider.dart';
import 'package:finance_control_front/features/notifications/providers/notification_provider.dart';
import 'package:finance_control_front/features/recurrences/data/recurrence_models.dart';
import 'package:finance_control_front/features/recurrences/providers/recurrence_provider.dart';

// ── Fakes ──────────────────────────────────────────────────────────────────

// Everything the home screen reads besides the summary itself. Without these the
// real notifiers reach for Dio, and the test ends with a pending timer instead of
// an assertion.
class _FakeAccountsNotifier extends AccountsNotifier {
  @override
  Future<List<Account>> build() async => const [];
}

class _FakeGoalsNotifier extends GoalsNotifier {
  @override
  Future<List<Goal>> build() async => const [];
}

class _FakeRecurrenceNotifier extends RecurrenceNotifier {
  @override
  Future<RecurrencePageData> build() async => RecurrencePageData.empty;
}

class _FakeUnreadNotificationCountNotifier
    extends UnreadNotificationCountNotifier {
  @override
  Future<int> build() async => 0;
}

class _FakeHomeNotifier extends HomeNotifier {
  _FakeHomeNotifier(this._state);

  final AsyncValue<HomeState> _state;

  @override
  Future<HomeState> build() async {
    // Simulate a persistent loading state (never completes) so the loading UI
    // stays on screen for the test.
    if (_state is AsyncLoading) return Completer<HomeState>().future;
    // Surface errors so the error UI renders.
    if (_state case AsyncError(:final error)) throw error;
    return _state.requireValue;
  }

  @override
  Future<void> refresh() async {}
}

// ── Helpers ────────────────────────────────────────────────────────────────

final _now = DateTime(2026, 4, 1);

HomeState _emptyState() => HomeState(
      startDate: _now,
      finishDate: DateTime(2026, 4, 30),
      summary: null,
    );

HomeState _stateWithSummary() => HomeState(
      startDate: _now,
      finishDate: DateTime(2026, 4, 30),
      summary: HomeSummary(
        totalIncome: 500000,
        totalExpenses: 200000,
        balance: 300000,
        budgetTotalExpected: 400000,
        budgetTotalSpent: 200000,
        budgetSpentPercentage: 50.0,
        topCategories: [
          TopCategorySummary(categoryName: 'Food', totalSpentCents: 80000),
        ],
        recentTransactions: [
          RecentTransactionSummary(
            id: 1,
            description: 'Supermarket',
            valueCents: -5000,
            isExpense: true,
            subCategoryName: 'Groceries',
            categoryName: 'Food',
          ),
        ],
      ),
    );

Widget _buildSubject(AsyncValue<HomeState> asyncState) {
  return ProviderScope(
    overrides: [
      homeNotifierProvider.overrideWith(() => _FakeHomeNotifier(asyncState)),
      accountsNotifierProvider.overrideWith(_FakeAccountsNotifier.new),
      goalsProvider.overrideWith(_FakeGoalsNotifier.new),
      recurrenceProvider.overrideWith(_FakeRecurrenceNotifier.new),
      unreadNotificationCountProvider
          .overrideWith(_FakeUnreadNotificationCountNotifier.new),
    ],
    child: const MaterialApp(
      home: AppLocaleScope(
        locale: AppLocale.defaultLocale,
        child: Scaffold(body: HomePage()),
      ),
    ),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

void main() {
  group('HomePage', () {
    testWidgets('shows loading indicator while data is loading', (tester) async {
      await tester.pumpWidget(_buildSubject(const AsyncLoading()));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows error view with retry button on error', (tester) async {
      await tester.pumpWidget(
        _buildSubject(AsyncError(Exception('Network error'), StackTrace.empty)),
      );
      await tester.pump();

      expect(find.text('Não foi possível carregar'), findsOneWidget);
      expect(find.text('Tentar de novo'), findsOneWidget);
    });

    testWidgets('shows hero panel when summary is null', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_emptyState())));
      await tester.pumpAndSettle();

      expect(find.text('Saldo do período'), findsOneWidget);
    });

    testWidgets('shows hero and flow bar when summary is present', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pumpAndSettle();

      expect(find.text('Saldo do período'), findsOneWidget);
      expect(find.text('Entradas e saídas'), findsOneWidget);
      expect(find.text('Entradas'), findsOneWidget);
      expect(find.text('Saídas'), findsOneWidget);
    });

    testWidgets('shows budget section with percentage', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pumpAndSettle();

      expect(find.text('ORÇAMENTO'), findsOneWidget);
      expect(find.text('50%'), findsOneWidget);
    });

    testWidgets('shows top category tile when categories exist', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pumpAndSettle();

      expect(find.text('Principais categorias'), findsOneWidget);
      // The same category name also labels the recent-transaction card, so the
      // finder matches more than once by design.
      expect(find.text('Food'), findsWidgets);
    });

    // The cards stay put when there is nothing to show and carry a hint instead —
    // a section that disappears makes the home feel broken on a quiet month.
    testWidgets('keeps the categories card with a hint when there is no spending', (tester) async {
      final state = HomeState(
        startDate: _now,
        finishDate: DateTime(2026, 4, 30),
        summary: HomeSummary(
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          budgetTotalExpected: 0,
          budgetTotalSpent: 0,
          budgetSpentPercentage: 0,
          topCategories: [],
          recentTransactions: [],
        ),
      );

      await tester.pumpWidget(_buildSubject(AsyncData(state)));
      await tester.pumpAndSettle();

      expect(find.text('Principais categorias'), findsOneWidget);
      expect(find.text('Nenhum gasto por categoria neste período.'), findsOneWidget);
    });

    testWidgets('shows recent transaction row with description', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pumpAndSettle();

      expect(find.text('Transações recentes'), findsOneWidget);
      expect(find.text('Supermarket'), findsOneWidget);
    });

    testWidgets('keeps the recent transactions card with a hint when empty', (tester) async {
      final state = HomeState(
        startDate: _now,
        finishDate: DateTime(2026, 4, 30),
        summary: HomeSummary(
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          budgetTotalExpected: 0,
          budgetTotalSpent: 0,
          budgetSpentPercentage: 0,
          topCategories: [],
          recentTransactions: [],
        ),
      );

      await tester.pumpWidget(_buildSubject(AsyncData(state)));
      await tester.pumpAndSettle();

      expect(find.text('Transações recentes'), findsOneWidget);
      expect(find.text('Nenhuma transação registrada ainda.'), findsOneWidget);
    });
  });
}
