import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../budgets/providers/budget_provider.dart';
import '../data/models/transaction_filter_state.dart';
import '../data/models/transaction_item.dart';
import 'transaction_filter_provider.dart';
import 'transaction_provider.dart';

/// Derived provider — no network calls. Filters the full transaction list
/// from [transactionsNotifierProvider] using [transactionFilterProvider].
final transactionFilteredProvider = Provider<List<TransactionItem>>((ref) {
  final asyncTx = ref.watch(transactionsNotifierProvider);
  final filter = ref.watch(transactionFilterProvider);
  final asyncBudget = ref.watch(budgetNotifierProvider);

  final all = asyncTx.valueOrNull ?? [];

  var result = List<TransactionItem>.from(all);

  // ── Period ──────────────────────────────────────────────────────────────────
  final now = DateTime.now();

  switch (filter.period) {
    case TransactionPeriod.currentBudget:
      final budget = asyncBudget.valueOrNull;
      if (budget != null) {
        result = result
            .where(
              (t) =>
                  !t.date.isBefore(budget.startDate) &&
                  !t.date.isAfter(budget.endDate),
            )
            .toList();
      }
    case TransactionPeriod.last7Days:
      final from = now.subtract(const Duration(days: 7));
      result = result.where((t) => !t.date.isBefore(from)).toList();
    case TransactionPeriod.last15Days:
      final from = now.subtract(const Duration(days: 15));
      result = result.where((t) => !t.date.isBefore(from)).toList();
    case TransactionPeriod.lastMonth:
      final from = DateTime(now.year, now.month - 1, now.day);
      result = result.where((t) => !t.date.isBefore(from)).toList();
    case TransactionPeriod.last3Months:
      final from = DateTime(now.year, now.month - 3, now.day);
      result = result.where((t) => !t.date.isBefore(from)).toList();
    case TransactionPeriod.last6Months:
      final from = DateTime(now.year, now.month - 6, now.day);
      result = result.where((t) => !t.date.isBefore(from)).toList();
    case TransactionPeriod.last365Days:
      final from = now.subtract(const Duration(days: 365));
      result = result.where((t) => !t.date.isBefore(from)).toList();
    case TransactionPeriod.custom:
      if (filter.customFrom != null) {
        result =
            result.where((t) => !t.date.isBefore(filter.customFrom!)).toList();
      }
      if (filter.customTo != null) {
        result =
            result.where((t) => !t.date.isAfter(filter.customTo!)).toList();
      }
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  if (filter.search != null && filter.search!.isNotEmpty) {
    final q = filter.search!.toLowerCase();
    result = result.where((t) {
      return (t.description?.toLowerCase().contains(q) ?? false) ||
          t.subCategoryName.toLowerCase().contains(q) ||
          t.accountName.toLowerCase().contains(q);
    }).toList();
  }

  // ── Type ────────────────────────────────────────────────────────────────────
  if (filter.typeFilter != null) {
    if (filter.typeFilter == 'Recurring') {
      result =
          result.where((t) => t.paymentType == 'Recurring').toList();
    } else {
      result =
          result.where((t) => t.type == filter.typeFilter).toList();
    }
  }

  // ── Account ─────────────────────────────────────────────────────────────────
  if (filter.accountId != null) {
    result =
        result.where((t) => t.accountId == filter.accountId).toList();
  }

  // ── Subcategory ─────────────────────────────────────────────────────────────
  if (filter.subCategoryId != null) {
    result = result
        .where((t) => t.subCategoryId == filter.subCategoryId)
        .toList();
  }

  // ── Area ────────────────────────────────────────────────────────────────────
  if (filter.areaId != null) {
    result = result.where((t) => t.areaId == filter.areaId).toList();
  }

  // ── Value range ─────────────────────────────────────────────────────────────
  if (filter.minValueCents != null) {
    result = result
        .where((t) => t.amountCents.abs() >= filter.minValueCents!)
        .toList();
  }
  if (filter.maxValueCents != null) {
    result = result
        .where((t) => t.amountCents.abs() <= filter.maxValueCents!)
        .toList();
  }

  // ── Sort newest first ────────────────────────────────────────────────────────
  result.sort((a, b) => b.date.compareTo(a.date));

  return result;
});
