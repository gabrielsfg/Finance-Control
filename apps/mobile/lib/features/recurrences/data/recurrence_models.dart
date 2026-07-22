// Domain models for the Recurrences feature (subscriptions + installments).
// Plain classes with manual fromJson — the API returns camelCase JSON.
// All monetary values are in cents (int).

int _asInt(dynamic v) => v is int ? v : (v as num?)?.toInt() ?? 0;

DateTime? _asDate(dynamic v) =>
    v == null ? null : DateTime.tryParse(v as String);

/// Recurrence cadence, matching the backend enum names.
enum RecurrenceType {
  daily('Daily', 'Diária'),
  workDay('WorkDay', 'Dias úteis'),
  weekly('Weekly', 'Semanal'),
  biweekly('Biweekly', 'Quinzenal'),
  monthly('Monthly', 'Mensal'),
  quarterly('Quarterly', 'Trimestral'),
  semiannually('Semiannually', 'Semestral'),
  annually('Annually', 'Anual');

  const RecurrenceType(this.wire, this.labelPt);
  final String wire;
  final String labelPt;

  static RecurrenceType fromWire(String? value) => values.firstWhere(
        (e) => e.wire == value,
        orElse: () => RecurrenceType.monthly,
      );
}

class RecurringItem {
  const RecurringItem({
    required this.id,
    required this.subCategoryId,
    required this.subCategoryName,
    this.subCategoryEmoji,
    required this.categoryId,
    required this.categoryName,
    this.categoryColor,
    required this.accountId,
    required this.accountName,
    required this.value,
    required this.type,
    required this.description,
    required this.recurrence,
    required this.startDate,
    this.endDate,
    required this.isActive,
  });

  final int id;
  final int subCategoryId;
  final String subCategoryName;
  final String? subCategoryEmoji;
  final int categoryId;
  final String categoryName;
  final String? categoryColor;
  final int accountId;
  final String accountName;
  final int value; // cents
  final String type; // "Income" | "Expense"
  final String description;
  final RecurrenceType recurrence;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isActive;

  bool get isIncome => type == 'Income';

  /// The next charge date on or after today, projected from [startDate] by the
  /// recurrence cadence. Used to preview upcoming charges.
  DateTime get nextCharge {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final start = DateTime(startDate.year, startDate.month, startDate.day);
    if (!start.isBefore(today)) return start;

    switch (recurrence) {
      case RecurrenceType.daily:
      case RecurrenceType.workDay:
        return today;
      case RecurrenceType.weekly:
        return _advanceDays(start, today, 7);
      case RecurrenceType.biweekly:
        return _advanceDays(start, today, 14);
      case RecurrenceType.monthly:
        return _advanceMonths(start, today, 1);
      case RecurrenceType.quarterly:
        return _advanceMonths(start, today, 3);
      case RecurrenceType.semiannually:
        return _advanceMonths(start, today, 6);
      case RecurrenceType.annually:
        return _advanceMonths(start, today, 12);
    }
  }

  static DateTime _advanceDays(DateTime from, DateTime today, int step) {
    final diff = today.difference(from).inDays;
    final periods = (diff / step).ceil();
    return from.add(Duration(days: periods * step));
  }

  static DateTime _advanceMonths(DateTime from, DateTime today, int step) {
    var d = from;
    while (d.isBefore(today)) {
      var year = d.year;
      var month = d.month + step;
      while (month > 12) {
        month -= 12;
        year++;
      }
      final lastDay = DateTime(year, month + 1, 0).day;
      final day = from.day > lastDay ? lastDay : from.day;
      d = DateTime(year, month, day);
    }
    return d;
  }

  factory RecurringItem.fromJson(Map<String, dynamic> j) => RecurringItem(
        id: _asInt(j['id']),
        subCategoryId: _asInt(j['subCategoryId']),
        subCategoryName: j['subCategoryName'] as String? ?? '',
        subCategoryEmoji: j['subCategoryEmoji'] as String?,
        categoryId: _asInt(j['categoryId']),
        categoryName: j['categoryName'] as String? ?? '',
        categoryColor: j['categoryColor'] as String?,
        accountId: _asInt(j['accountId']),
        accountName: j['accountName'] as String? ?? '',
        value: _asInt(j['value']),
        type: j['type'] as String? ?? 'Expense',
        description: j['description'] as String? ?? '',
        recurrence: RecurrenceType.fromWire(j['recurrence'] as String?),
        startDate: _asDate(j['startDate']) ?? DateTime.now(),
        endDate: _asDate(j['endDate']),
        isActive: j['isActive'] as bool? ?? true,
      );
}

class InstallmentItem {
  const InstallmentItem({
    required this.id,
    required this.subCategoryId,
    required this.subCategoryName,
    this.subCategoryEmoji,
    required this.categoryId,
    required this.categoryName,
    this.categoryColor,
    required this.accountId,
    required this.accountName,
    required this.value,
    required this.totalValue,
    required this.type,
    required this.description,
    required this.transactionDate,
    required this.totalInstallments,
    required this.paidInstallments,
    required this.remainingInstallments,
    required this.remainingAmount,
    this.paymentMethod,
  });

  final int id;
  final int subCategoryId;
  final String subCategoryName;
  final String? subCategoryEmoji;
  final int categoryId;
  final String categoryName;
  final String? categoryColor;
  final int accountId;
  final String accountName;
  final int value; // per-installment cents
  final int totalValue; // cents
  final String type;
  final String description;
  final DateTime transactionDate;
  final int totalInstallments;
  final int paidInstallments;
  final int remainingInstallments;
  final int remainingAmount; // cents
  final String? paymentMethod;

  double get progress =>
      totalInstallments == 0 ? 0 : paidInstallments / totalInstallments;

  factory InstallmentItem.fromJson(Map<String, dynamic> j) => InstallmentItem(
        id: _asInt(j['id']),
        subCategoryId: _asInt(j['subCategoryId']),
        subCategoryName: j['subCategoryName'] as String? ?? '',
        subCategoryEmoji: j['subCategoryEmoji'] as String?,
        categoryId: _asInt(j['categoryId']),
        categoryName: j['categoryName'] as String? ?? '',
        categoryColor: j['categoryColor'] as String?,
        accountId: _asInt(j['accountId']),
        accountName: j['accountName'] as String? ?? '',
        value: _asInt(j['value']),
        totalValue: _asInt(j['totalValue']),
        type: j['type'] as String? ?? 'Expense',
        description: j['description'] as String? ?? '',
        transactionDate: _asDate(j['transactionDate']) ?? DateTime.now(),
        totalInstallments: _asInt(j['totalInstallments']),
        paidInstallments: _asInt(j['paidInstallments']),
        remainingInstallments: _asInt(j['remainingInstallments']),
        remainingAmount: _asInt(j['remainingAmount']),
        paymentMethod: j['paymentMethod'] as String?,
      );
}

class RecurrencePageData {
  const RecurrencePageData({
    required this.totalMonthlyAmount,
    required this.subscriptionMonthlyAmount,
    required this.installmentMonthlyAmount,
    required this.activeRecurringCount,
    required this.activeInstallmentCount,
    required this.monthlyIncome,
    required this.recurring,
    required this.installments,
  });

  final int totalMonthlyAmount; // cents
  final int subscriptionMonthlyAmount;
  final int installmentMonthlyAmount;
  final int activeRecurringCount;
  final int activeInstallmentCount;
  final int monthlyIncome; // cents
  final List<RecurringItem> recurring;
  final List<InstallmentItem> installments;

  /// Committed monthly outflow as a share of monthly income (0.0–1.0+).
  double get incomeShare =>
      monthlyIncome == 0 ? 0 : totalMonthlyAmount / monthlyIncome;

  static const empty = RecurrencePageData(
    totalMonthlyAmount: 0,
    subscriptionMonthlyAmount: 0,
    installmentMonthlyAmount: 0,
    activeRecurringCount: 0,
    activeInstallmentCount: 0,
    monthlyIncome: 0,
    recurring: [],
    installments: [],
  );

  factory RecurrencePageData.fromJson(Map<String, dynamic> j) =>
      RecurrencePageData(
        totalMonthlyAmount: _asInt(j['totalMonthlyAmount']),
        subscriptionMonthlyAmount: _asInt(j['subscriptionMonthlyAmount']),
        installmentMonthlyAmount: _asInt(j['installmentMonthlyAmount']),
        activeRecurringCount: _asInt(j['activeRecurringCount']),
        activeInstallmentCount: _asInt(j['activeInstallmentCount']),
        monthlyIncome: _asInt(j['monthlyIncome']),
        recurring: (j['recurring'] as List? ?? [])
            .map((e) => RecurringItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        installments: (j['installments'] as List? ?? [])
            .map((e) => InstallmentItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Partial update payload for a recurring item.
class UpdateRecurringRequest {
  const UpdateRecurringRequest({
    this.value,
    this.description,
    this.endDate,
  });

  final int? value; // cents
  final String? description;
  final DateTime? endDate;

  Map<String, dynamic> toJson() => {
        if (value != null) 'value': value,
        if (description != null) 'description': description,
        if (endDate != null)
          'endDate': endDate!.toIso8601String().split('T').first,
      };
}
