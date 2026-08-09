import 'transaction_filter_state.dart';

/// The server-side shape of a [TransactionFilterState].
///
/// The UI thinks in relative periods ("últimos 7 dias", "orçamento atual") and
/// in a single `typeFilter` that mixes transaction type with payment type. The
/// endpoint wants absolute dates and the two split apart. This is where that
/// translation lives, so the notifier and the repository stay dumb.
class TransactionQuery {
  const TransactionQuery({
    required this.startDate,
    required this.finishDate,
    this.accountIds,
    this.subCategoryIds,
    this.areaIds,
    this.tagIds,
    this.search,
    this.type,
    this.paymentType,
    this.minValueCents,
    this.maxValueCents,
  });

  final DateTime startDate;
  final DateTime finishDate;
  final List<int>? accountIds;
  final List<int>? subCategoryIds;
  final List<int>? areaIds;
  final List<int>? tagIds;
  final String? search;

  /// "Expense" | "Income" | "Transfer"
  final String? type;

  /// "OneTime" | "Installment" | "Recurring"
  final String? paymentType;

  final int? minValueCents;
  final int? maxValueCents;

  /// Resolves [filter] into absolute dates and server field names.
  ///
  /// [budgetStart]/[budgetEnd] are only read for
  /// [TransactionPeriod.currentBudget]; when there is no active budget the
  /// period falls back to the current calendar month.
  factory TransactionQuery.fromFilter(
    TransactionFilterState filter, {
    DateTime? budgetStart,
    DateTime? budgetEnd,
    required DateTime now,
  }) {
    // The relative presets are lower bounds only — the previous client-side
    // filter never capped the upper end, and future-dated rows (installments,
    // recurring) must keep showing up. A wide ceiling preserves that.
    final farFuture = DateTime(now.year + 10, 12, 31);
    final farPast = DateTime(2000, 1, 1);

    DateTime start;
    DateTime finish = farFuture;

    switch (filter.period) {
      case TransactionPeriod.currentBudget:
        start = budgetStart ?? DateTime(now.year, now.month, 1);
        finish = budgetEnd ?? DateTime(now.year, now.month + 1, 0);
      case TransactionPeriod.last7Days:
        start = now.subtract(const Duration(days: 7));
      case TransactionPeriod.last15Days:
        start = now.subtract(const Duration(days: 15));
      case TransactionPeriod.lastMonth:
        start = DateTime(now.year, now.month - 1, now.day);
      case TransactionPeriod.last3Months:
        start = DateTime(now.year, now.month - 3, now.day);
      case TransactionPeriod.last6Months:
        start = DateTime(now.year, now.month - 6, now.day);
      case TransactionPeriod.last365Days:
        start = now.subtract(const Duration(days: 365));
      case TransactionPeriod.custom:
        start = filter.customFrom ?? farPast;
        finish = filter.customTo ?? farFuture;
    }

    // 'Recurring' is a payment type wearing the type filter's clothes.
    final isRecurring = filter.typeFilter == 'Recurring';

    return TransactionQuery(
      startDate: start,
      finishDate: finish,
      accountIds: filter.accountId == null ? null : [filter.accountId!],
      subCategoryIds:
          filter.subCategoryId == null ? null : [filter.subCategoryId!],
      areaIds: filter.areaId == null ? null : [filter.areaId!],
      tagIds: filter.tagId == null ? null : [filter.tagId!],
      search: filter.search,
      type: isRecurring ? null : filter.typeFilter,
      paymentType: isRecurring ? 'Recurring' : null,
      minValueCents: filter.minValueCents,
      maxValueCents: filter.maxValueCents,
    );
  }
}
