enum TransactionPeriod {
  currentBudget,
  last7Days,
  last15Days,
  lastMonth,
  last3Months,
  last6Months,
  last365Days,
  custom,
}

class TransactionFilterState {
  const TransactionFilterState({
    this.search,
    this.period = TransactionPeriod.currentBudget,
    this.customFrom,
    this.customTo,
    this.typeFilter,
    this.accountId,
    this.accountName,
    this.subCategoryId,
    this.subCategoryName,
    this.areaId,
    this.areaName,
    this.minValueCents,
    this.maxValueCents,
  });

  final String? search;
  final TransactionPeriod period;

  /// Only used when [period] == [TransactionPeriod.custom].
  final DateTime? customFrom;
  final DateTime? customTo;

  /// null | 'Expense' | 'Income' | 'Recurring'
  final String? typeFilter;

  final int? accountId;
  final String? accountName;
  final int? subCategoryId;
  final String? subCategoryName;
  final int? areaId;
  final String? areaName;
  final int? minValueCents;
  final int? maxValueCents;

  int get activeFilterCount {
    var count = 0;
    if (search != null && search!.isNotEmpty) count++;
    if (period != TransactionPeriod.currentBudget) count++;
    if (typeFilter != null) count++;
    if (accountId != null) count++;
    if (subCategoryId != null) count++;
    if (areaId != null) count++;
    if (minValueCents != null || maxValueCents != null) count++;
    return count;
  }

  TransactionFilterState copyWith({
    String? search,
    bool clearSearch = false,
    TransactionPeriod? period,
    DateTime? customFrom,
    bool clearCustomFrom = false,
    DateTime? customTo,
    bool clearCustomTo = false,
    String? typeFilter,
    bool clearTypeFilter = false,
    int? accountId,
    String? accountName,
    bool clearAccount = false,
    int? subCategoryId,
    String? subCategoryName,
    bool clearSubCategory = false,
    int? areaId,
    String? areaName,
    bool clearArea = false,
    int? minValueCents,
    bool clearMinValue = false,
    int? maxValueCents,
    bool clearMaxValue = false,
  }) {
    return TransactionFilterState(
      search: clearSearch ? null : (search ?? this.search),
      period: period ?? this.period,
      customFrom: clearCustomFrom ? null : (customFrom ?? this.customFrom),
      customTo: clearCustomTo ? null : (customTo ?? this.customTo),
      typeFilter: clearTypeFilter ? null : (typeFilter ?? this.typeFilter),
      accountId: clearAccount ? null : (accountId ?? this.accountId),
      accountName: clearAccount ? null : (accountName ?? this.accountName),
      subCategoryId:
          clearSubCategory ? null : (subCategoryId ?? this.subCategoryId),
      subCategoryName:
          clearSubCategory ? null : (subCategoryName ?? this.subCategoryName),
      areaId: clearArea ? null : (areaId ?? this.areaId),
      areaName: clearArea ? null : (areaName ?? this.areaName),
      minValueCents:
          clearMinValue ? null : (minValueCents ?? this.minValueCents),
      maxValueCents:
          clearMaxValue ? null : (maxValueCents ?? this.maxValueCents),
    );
  }
}
