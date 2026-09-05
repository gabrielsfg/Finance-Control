import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons/lucide_icons.dart';
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

const _savingsAccount = Account(
  id: 4,
  name: 'Poupança',
  type: 'Savings',
  balanceCents: 20000,
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

/// The form is a scrolling column taller than the default 800x600 test window,
/// so the payment-type controls sit off-screen and cannot be tapped. Giving the
/// test a tall surface keeps the whole form laid out at once — simpler and more
/// stable than scrolling to each control before touching it.
void _useTallSurface(WidgetTester tester) {
  tester.view.physicalSize = const Size(1200, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

// ── Tests ──────────────────────────────────────────────────────────────────

void main() {
  group('AddTransactionPage — render', () {
    testWidgets('renders page title and type toggle', (tester) async {
      await tester.pumpWidget(_buildSubject());
      await tester.pumpAndSettle();

      expect(find.text('Nova transação'), findsOneWidget);
      expect(find.text('Despesa'), findsOneWidget);
      expect(find.text('Receita'), findsOneWidget);
    });

    testWidgets('renders Subcategory and Account field rows', (tester) async {
      await tester.pumpWidget(_buildSubject());
      await tester.pumpAndSettle();

      expect(find.text('Subcategoria'), findsOneWidget);
      expect(find.text('Conta'), findsOneWidget);
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

      await tester.tap(find.text('Salvar transação'));
      await tester.pump();

      expect(find.text('Informe um valor válido'), findsOneWidget);
    });

    testWidgets('shows subcategory error when not selected on submit', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount], categories: _categories),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Salvar transação'));
      await tester.pump();

      expect(find.text('Selecione uma subcategoria'), findsOneWidget);
    });

    testWidgets('shows account error when no account loaded', (tester) async {
      await tester.pumpWidget(_buildSubject(accounts: [], categories: _categories));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Salvar transação'));
      await tester.pump();

      expect(find.text('Selecione uma conta'), findsOneWidget);
    });
  });

  group('AddTransactionPage — payment method toggle', () {
    testWidgets('hides payment method toggle for Credit account', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_creditAccount]),
      );
      await tester.pumpAndSettle();

      // Credit accounts fix the method — no toggle shown
      expect(find.text('Débito'), findsNothing);
    });

    testWidgets('hides payment method toggle for Cash account', (tester) async {
      await tester.pumpWidget(
        _buildSubject(accounts: [_debitAccount]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Débito'), findsNothing);
    });

    testWidgets('shows Debit/Credit toggle for Checking account', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Débito'), findsOneWidget);
      expect(find.text('Crédito'), findsOneWidget);
    });
  });

  group('AddTransactionPage — payment type availability', () {
    // Cash, Debit and Savings accounts reject instalments and recurrences on the
    // server, so the chips are not offered at all.
    testWidgets('hides Parcelado and Recorrente for Cash account', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(_buildSubject(accounts: [_debitAccount]));
      await tester.pumpAndSettle();

      expect(find.text('À vista'), findsOneWidget);
      expect(find.text('Parcelado'), findsNothing);
      expect(find.text('Recorrente'), findsNothing);
    });

    testWidgets('hides Parcelado and Recorrente for Savings account', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(_buildSubject(accounts: [_savingsAccount]));
      await tester.pumpAndSettle();

      expect(find.text('Parcelado'), findsNothing);
      expect(find.text('Recorrente'), findsNothing);
    });

    testWidgets('offers Parcelado and Recorrente for Credit account', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(_buildSubject(accounts: [_creditAccount]));
      await tester.pumpAndSettle();

      expect(find.text('Parcelado'), findsOneWidget);
      expect(find.text('Recorrente'), findsOneWidget);
    });

    testWidgets('drops back to À vista when the account stops supporting it',
        (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount, _debitAccount]),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Parcelado'));
      await tester.pumpAndSettle();
      expect(find.text('Nº de parcelas'), findsOneWidget);

      // Switch to the Cash account through the account picker sheet.
      await tester.tap(find.text('Nubank'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Carteira').last);
      await tester.pumpAndSettle();

      expect(find.text('Parcelado'), findsNothing);
      expect(find.text('Nº de parcelas'), findsNothing);
    });
  });

  group('AddTransactionPage — payment type', () {
    testWidgets('shows installment stepper when Installment is selected', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(_buildSubject(accounts: [_checkingAccount]));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Parcelado'));
      await tester.pumpAndSettle();

      expect(find.text('Nº de parcelas'), findsOneWidget);
    });

    // The API rejects a single instalment (minimum is 2), so the stepper has to
    // stop there instead of letting the request fail.
    testWidgets('installment stepper never goes below 2', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(_buildSubject(accounts: [_checkingAccount]));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Parcelado'));
      await tester.pumpAndSettle();
      expect(find.text('2'), findsOneWidget);

      await tester.tap(find.byIcon(LucideIcons.minus));
      await tester.pumpAndSettle();
      expect(find.text('2'), findsOneWidget);
      expect(find.text('1'), findsNothing);

      // And it still counts up from there.
      await tester.tap(find.byIcon(LucideIcons.plus));
      await tester.pumpAndSettle();
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('shows recurrence picker when Recurring is selected', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(_buildSubject(accounts: [_checkingAccount]));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Recorrente'));
      await tester.pumpAndSettle();

      expect(find.text('Recorrência'), findsOneWidget);
    });

    testWidgets('shows recurrence error when Recurring selected but no recurrence chosen', (tester) async {
      _useTallSurface(tester);

      await tester.pumpWidget(
        _buildSubject(accounts: [_checkingAccount], categories: _categories),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Recorrente'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Salvar transação'));
      await tester.pumpAndSettle();

      expect(find.text('Selecione a recorrência'), findsOneWidget);
    });
  });
}
