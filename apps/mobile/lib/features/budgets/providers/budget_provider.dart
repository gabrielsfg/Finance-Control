import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/budget_period.dart';
import '../../auth/providers/auth_provider.dart';
import '../../transactions/data/transaction_repository.dart';
import '../data/budget_repository.dart';
import '../data/dtos/create_budget_request_dto.dart';
import '../data/models/budget_models.dart';

// ── Active budget provider ────────────────────────────────────────────────────
//
// Loads the most recently created budget (first in the list) as the active one.
// Returns null when there are no budgets.

class BudgetNotifier extends AsyncNotifier<Budget?> {
  /// Period offset relative to the current period (0 = current, -1 = previous…).
  int _offset = 0;

  @override
  Future<Budget?> build() async {
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      return null;
    }
    return _fetchActive();
  }

  Future<Budget?> _fetchActive() async {
    final repo = ref.read(budgetRepositoryProvider);
    final summaries = await repo.getAllBudgets();
    if (summaries.isEmpty) return null;

    // Use the first budget in the list as the active one
    final id = summaries.first.id;

    // Reference date for the requested period (null = current period).
    final referenceDate = _offset == 0
        ? null
        : shiftBudgetPeriod(
            DateTime.now(), summaries.first.recurrence, _offset);

    // Single endpoint returns budget + areas + allocations + spentValue each.
    final budgetDto =
        await repo.getBudgetWithAllocations(id, referenceDate: referenceDate);

    // Build set of allocated subcategory IDs to identify unallocated transactions.
    final allocatedIds = <int>{
      for (final area in budgetDto.areas)
        for (final alloc in area.allocations) alloc.subCategoryId,
    };

    final transactions = await ref
        .read(transactionRepositoryProvider)
        .getTransactionsByBudget(
          id,
          startDate: DateTime.parse(budgetDto.startDate),
          finishDate: DateTime.parse(budgetDto.finishDate),
        );

    final otherTransactions = transactions
        .where((tx) => !allocatedIds.contains(tx.subCategoryId))
        .map((tx) => UnallocatedTransaction(
              id: tx.id,
              subCategoryId: tx.subCategoryId,
              subCategoryName: tx.subCategoryName,
              valueCents: tx.value.abs(),
              type: tx.type,
            ))
        .toList();

    return Budget.fromCompositeDto(budgetDto, otherTransactions: otherTransactions);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchActive);
  }

  /// Navigates to the previous budget period.
  Future<void> previousPeriod() async {
    _offset -= 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchActive);
  }

  /// Navigates to the next budget period.
  Future<void> nextPeriod() async {
    _offset += 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchActive);
  }

  bool get isCurrentPeriod => _offset == 0;

  /// Creates a new budget with all areas and allocations in a single request.
  /// Income areas and expense areas are kept separate so allocationType can be
  /// inferred automatically without the user having to select it per subcategory.
  Future<void> createBudget({
    required String name,
    required String recurrence,
    required int startDay,
    required List<DraftArea> incomeAreas,
    required List<DraftArea> expenseAreas,
  }) async {
    state = const AsyncLoading();
    try {
      final repo = ref.read(budgetRepositoryProvider);

      CreateAreaInBudgetDto mapArea(DraftArea a, String allocationType) =>
          CreateAreaInBudgetDto(
            name: a.name,
            allocations: a.subcategories
                .where((s) => s.allocatedCents > 0)
                .map((s) => CreateAllocationInBudgetDto(
                      subCategoryId: s.id,
                      expectedValue: s.allocatedCents,
                      allocationType: allocationType,
                    ))
                .toList(),
          );

      final requestDto = CreateBudgetRequestDto(
        name: name,
        startDate: startDay,
        recurrence: recurrence,
        isActive: true,
        areas: [
          ...incomeAreas.map((a) => mapArea(a, 'Income')),
          ...expenseAreas.map((a) => mapArea(a, 'Expense')),
        ],
      );

      final budgetDto = await repo.createBudget(requestDto);
      _offset = 0;
      state = AsyncData(Budget.fromCompositeDto(budgetDto));
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> deleteBudget(int id) async {
    _offset = 0;
    state = const AsyncLoading();
    await ref.read(budgetRepositoryProvider).deleteBudget(id);
    state = await AsyncValue.guard(_fetchActive);
  }
}

final budgetNotifierProvider =
    AsyncNotifierProvider<BudgetNotifier, Budget?>(BudgetNotifier.new);
