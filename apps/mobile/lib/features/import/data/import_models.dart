// Domain models for the statement import (OFX/CSV). Plain classes, manual
// fromJson/toJson — money in cents, dates as plain calendar days.

/// One line the server read out of the uploaded file, already matched against
/// the existing transactions of that account.
class ParsedTransaction {
  const ParsedTransaction({
    required this.externalId,
    required this.date,
    required this.description,
    required this.value,
    required this.type,
    required this.suggestedSubCategoryId,
    required this.suggestedSubCategoryName,
    required this.paymentType,
    required this.totalInstallments,
    required this.installmentNumber,
    required this.isDuplicate,
    required this.duplicateReason,
  });

  final String externalId;
  final DateTime date;
  final String description;

  /// Always positive — [type] carries the direction.
  final int value;

  /// "Expense" | "Income" | "Transfer"
  final String type;

  final int? suggestedSubCategoryId;
  final String? suggestedSubCategoryName;

  /// "OneTime" | "Installment" | "Recurring"
  final String paymentType;

  final int? totalInstallments;
  final int? installmentNumber;

  /// True when the account already holds a transaction that looks like this one.
  final bool isDuplicate;
  final String? duplicateReason;

  factory ParsedTransaction.fromJson(Map<String, dynamic> json) =>
      ParsedTransaction(
        externalId: json['externalId'] as String? ?? '',
        date: DateTime.parse(json['date'] as String),
        description: json['description'] as String? ?? '',
        value: (json['value'] as num?)?.toInt() ?? 0,
        type: json['type'] as String? ?? 'Expense',
        suggestedSubCategoryId:
            (json['suggestedSubCategoryId'] as num?)?.toInt(),
        suggestedSubCategoryName: json['suggestedSubCategoryName'] as String?,
        paymentType: json['paymentType'] as String? ?? 'OneTime',
        totalInstallments: (json['totalInstallments'] as num?)?.toInt(),
        installmentNumber: (json['installmentNumber'] as num?)?.toInt(),
        isDuplicate: json['isDuplicate'] as bool? ?? false,
        duplicateReason: json['duplicateReason'] as String?,
      );
}

class ParsedStatement {
  const ParsedStatement({
    required this.transactions,
    required this.totalFound,
    required this.duplicatesFound,
  });

  final List<ParsedTransaction> transactions;
  final int totalFound;
  final int duplicatesFound;

  factory ParsedStatement.fromJson(Map<String, dynamic> json) =>
      ParsedStatement(
        transactions: ((json['transactions'] as List?) ?? [])
            .map((e) => ParsedTransaction.fromJson(e as Map<String, dynamic>))
            .toList(),
        totalFound: (json['totalFound'] as num?)?.toInt() ?? 0,
        duplicatesFound: (json['duplicatesFound'] as num?)?.toInt() ?? 0,
      );
}

/// A parsed line plus the choices made about it on the review screen: whether
/// it comes in at all, which subcategory it lands on and which direction it
/// takes. Starts from the server's suggestion and is edited from there.
class ImportRow {
  const ImportRow({
    required this.parsed,
    required this.selected,
    required this.subCategoryId,
    required this.subCategoryName,
    required this.type,
  });

  final ParsedTransaction parsed;
  final bool selected;
  final int? subCategoryId;
  final String? subCategoryName;
  final String type;

  /// Duplicates start unselected: the common case is re-importing an overlapping
  /// period, and silently doubling entries is the one outcome worth avoiding.
  factory ImportRow.from(ParsedTransaction parsed) => ImportRow(
        parsed: parsed,
        selected: !parsed.isDuplicate,
        subCategoryId: parsed.suggestedSubCategoryId,
        subCategoryName: parsed.suggestedSubCategoryName,
        type: parsed.type,
      );

  ImportRow copyWith({
    bool? selected,
    int? subCategoryId,
    String? subCategoryName,
    String? type,
  }) =>
      ImportRow(
        parsed: parsed,
        selected: selected ?? this.selected,
        subCategoryId: subCategoryId ?? this.subCategoryId,
        subCategoryName: subCategoryName ?? this.subCategoryName,
        type: type ?? this.type,
      );

  ImportTransactionItem toRequestItem() => ImportTransactionItem(
        date: parsed.date,
        description: parsed.description,
        value: parsed.value,
        type: type,
        subCategoryId: subCategoryId,
        paymentType: parsed.paymentType,
        totalInstallments: parsed.totalInstallments,
        installmentNumber: parsed.installmentNumber,
      );
}

/// A single line as it will be created. Only the rows the user kept selected
/// are sent, with whatever category and direction they settled on.
class ImportTransactionItem {
  const ImportTransactionItem({
    required this.date,
    required this.description,
    required this.value,
    required this.type,
    required this.subCategoryId,
    required this.paymentType,
    this.totalInstallments,
    this.installmentNumber,
  });

  final DateTime date;
  final String description;
  final int value;
  final String type;
  final int? subCategoryId;
  final String paymentType;
  final int? totalInstallments;
  final int? installmentNumber;

  Map<String, dynamic> toJson() => {
        // The API takes a DateOnly here, so the time part must not travel.
        'date': _dateOnly(date),
        'description': description,
        'value': value,
        'type': type,
        'subCategoryId': subCategoryId,
        'destinationAccountId': null,
        'paymentType': paymentType,
        'totalInstallments': totalInstallments,
        'installmentNumber': installmentNumber,
      };
}

class ImportTransactionsRequest {
  const ImportTransactionsRequest({
    required this.accountId,
    required this.countForBudget,
    required this.transactions,
  });

  final int accountId;
  final bool countForBudget;
  final List<ImportTransactionItem> transactions;

  Map<String, dynamic> toJson() => {
        'accountId': accountId,
        'countForBudget': countForBudget,
        'transactions': transactions.map((e) => e.toJson()).toList(),
      };
}

String _dateOnly(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}
