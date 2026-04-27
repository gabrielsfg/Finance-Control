import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/core/utils/app_locale.dart';
import 'package:finance_control_front/features/accounts/data/models/account.dart';
import 'package:finance_control_front/features/transactions/data/dtos/category_response_dto.dart';
import 'package:finance_control_front/features/transactions/presentation/add_transaction_page.dart';
import 'package:finance_control_front/features/transactions/providers/picker_providers.dart';
import 'package:finance_control_front/features/transactions/providers/transaction_provider.dart';

// ── Fakes ──────────────────────────────────────────────────────────────────

class _FakeCreateTransactionNotifier extends CreateTransactionNotifier {
  @override
  CreateTransactionState build() => const CreateTransactionIdle();

  @override
  Future<void> submit(dto) async {
    state = const CreateTransactionSuccess(transactions: []);
  }
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const _checkingAccount = Account(
  id: 1,
  name: 'Nubank',
  type: 'Checking',
  balanceCents: 100000,
  isDefault: true,
);

const _creditAccount = Account(
  id: 2,
  name: 'Visa',
  type: 'Credit',
  balanceCents: 0,
  isDefault: false,
);

const _debitAccount = Account(
  id: 3,
  name: 'Carteira',
  type: 'Cash',
  balanceCents: 5000,
  isDefault: false,
);

const _categories = [
  CategoryResponseDto(
    id: 1,
    name: 'Food',
    subCategories: [
      SubcategoryResponseDto(id: 10, name: 'Groceries'),
    ],
  ),
];

// ── Helper ─────────────────────────────────────────────────────────────────

Widget _buildSubject({
  List<Account> accounts = const [],
  List<CategoryResponseDto> categories = const [],
  CreateTransactionNotifier? notifier,
}) {
  return ProviderScope(
    overrides: [
      accountsProvider.overrideWith((_) async => accounts),
      categoriesProvider.overrideWith((_) async => categories),
      createTransactionProvider.overrideWith(
        () => notifier ?? _FakeCreateTransactionNotifier(),
      ),
    ],
    child: const MaterialApp(
      home: AppLocaleScope(
        locale: AppLocale.defaultLocale,
        child: AddTransactionPage(),
      ),
    ),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

void main() {
  group('AddTransactionPage — render', () {
    testWidgets('renders page title and type toggle', (tester) async {
      await tester.pumpWidget(_buildSubject());
      await tester.pumpAndSettle();

      expect(find.text('New Transaction'), findsOneWidget);
      expect(find.text('Expense'), findsOneWidget);
      expect(find.text('Income'), findsOneWidget);
    });

    testWidgets('renders Subcategory and Account field rows', (tester) async {
      await tester.pumpWidget(_buildSubject());
      await tester.pumpAndSettle();

      expect(find.text('Subcategory'), findsOneWidget);
      expect(find.text('Account'), findsOneWidget);
    });

    testWidgets('pre-selects default account when accounts load', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount, _creditAccount]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Nubank'), findsOneWidget);
    });
  });

  group('AddTransactionPage — validation', () {
    testWidgets('shows amount error when value is zero on submit', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount], categories: _categories),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Save'));
      await tester.pump();

      expect(find.text('Enter a valid amount'), findsOneWidget);
    });

    testWidgets('shows subcategory error when not selected on submit', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount], categories: _categories),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Save'));
      await tester.pump();

      expect(find.text('Select a subcategory'), findsOneWidget);
    });

    testWidgets('shows account error when no account loaded', (tester) async {
      await tester.pumpWidget(_buildSubject(accounts: [], categories: _categories));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Save'));
      await tester.pump();

      expect(find.text('Select an account'), findsOneWidget);
    });
  });

  group('AddTransactionPage — payment method toggle', () {
    testWidgets('hides payment method toggle for Credit account', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_creditAccount]),
      );
      await tester.pumpAndSettle();

      // Credit accounts fix the method — no toggle shown
      expect(find.text('Debit'), findsNothing);
    });

    testWidgets('hides payment method toggle for Cash account', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_debitAccount]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Debit'), findsNothing);
    });

    testWidgets('shows Debit/Credit toggle for Checking account', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount]),
      );
      await tester.pumpAndSettle();

      // Scroll down to find the payment method toggle
      await tester.scrollUntilVisible(find.text('Debit'), 100);
      expect(find.text('Debit'), findsOneWidget);
      expect(find.text('Credit'), findsOneWidget);
    });
  });

  group('AddTransactionPage — payment type', () {
    testWidgets('shows installment stepper when Installment is selected', (tester) async {
      await tester.pumpWidget(_buildSubject(accounts: [_checkingAccount]));
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(find.text('Installment'), 100);
      await tester.tap(find.text('Installment'));
      await tester.pumpAndSettle();

      expect(find.text('Installments'), findsOneWidget);
    });

    testWidgets('shows recurrence picker when Recurring is selected', (tester) async {
      await tester.pumpWidget(_buildSubject(accounts: [_checkingAccount]));
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(find.text('Recurring'), 100);
      await tester.tap(find.text('Recurring'));
      await tester.pumpAndSettle();

      expect(find.text('Recurrence'), findsOneWidget);
    });

    testWidgets('shows recurrence error when Recurring selected but no recurrence chosen', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount], categories: _categories),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(find.text('Recurring'), 100);
      await tester.tap(find.text('Recurring'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Save'));
      await tester.pump();

      expect(find.text('Select the recurrence'), findsOneWidget);
    });
  });
}
