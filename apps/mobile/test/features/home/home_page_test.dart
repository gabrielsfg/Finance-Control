import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/core/utils/app_locale.dart';
import 'package:finance_control_front/features/home/data/models/home_summary.dart';
import 'package:finance_control_front/features/home/presentation/home_page.dart';
import 'package:finance_control_front/features/home/providers/home_provider.dart';

// ── Fakes ──────────────────────────────────────────────────────────────────

class _FakeHomeNotifier extends HomeNotifier {
  _FakeHomeNotifier(this._state);

  final AsyncValue<HomeState> _state;

  @override
  Future<HomeState> build() async {
    state = _state;
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

      expect(find.text('Failed to load data'), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
    });

    testWidgets('shows balance card with dashes when summary is null', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_emptyState())));
      await tester.pump();

      expect(find.text('Total Balance'), findsOneWidget);
      expect(find.text('—'), findsWidgets);
    });

    testWidgets('shows formatted balance when summary is present', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pump();

      expect(find.text('Total Balance'), findsOneWidget);
      // R$ 3.000,00 formatted from 300000 cents with pt-BR locale
      expect(find.textContaining('3.000'), findsOneWidget);
    });

    testWidgets('shows INCOME and EXPENSES mini-cards', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pump();

      expect(find.text('INCOME'), findsOneWidget);
      expect(find.text('EXPENSES'), findsOneWidget);
    });

    testWidgets('shows budget section with percentage', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pump();

      expect(find.text('BUDGET'), findsOneWidget);
      expect(find.text('50%'), findsOneWidget);
    });

    testWidgets('shows top category chip when categories exist', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pump();

      expect(find.text('Top Categories'), findsOneWidget);
      expect(find.text('Food'), findsOneWidget);
    });

    testWidgets('hides top categories section when list is empty', (tester) async {
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
      await tester.pump();

      expect(find.text('Top Categories'), findsNothing);
    });

    testWidgets('shows recent transaction row with description and amount', (tester) async {
      await tester.pumpWidget(_buildSubject(AsyncData(_stateWithSummary())));
      await tester.pump();

      expect(find.text('Recent Transactions'), findsOneWidget);
      expect(find.text('Supermarket'), findsOneWidget);
      expect(find.textContaining('50,00'), findsOneWidget);
    });

    testWidgets('hides recent transactions section when list is empty', (tester) async {
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
      await tester.pump();

      expect(find.text('Recent Transactions'), findsNothing);
    });
  });
}
