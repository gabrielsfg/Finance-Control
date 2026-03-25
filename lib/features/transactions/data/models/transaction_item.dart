import '../dtos/get_transaction_response_dto.dart';

/// Domain model for a single transaction — mapped from [GetTransactionResponseDto].
class TransactionItem {
  final int id;
  final int subCategoryId;
  final String subCategoryName;
  final int accountId;
  final String accountName;

  /// In cents. Negative = expense, positive = income.
  final int amountCents;

  /// "Expense" | "Income"
  final String type;

  /// "OneTime" | "Installment" | "Recurring"
  final String paymentType;

  final DateTime date;
  final bool isPaid;
  final int? budgetId;
  final String? description;
  final int? recurringTransactionId;
  final int? parentTransactionId;
  final int? installmentNumber;
  final int? totalInstallments;

  const TransactionItem({
    required this.id,
    required this.subCategoryId,
    required this.subCategoryName,
    required this.accountId,
    required this.accountName,
    required this.amountCents,
    required this.type,
    required this.paymentType,
    required this.date,
    required this.isPaid,
    this.budgetId,
    this.description,
    this.recurringTransactionId,
    this.parentTransactionId,
    this.installmentNumber,
    this.totalInstallments,
  });

  factory TransactionItem.fromDto(GetTransactionResponseDto dto) {
    // Backend sends positive values for both types; sign is determined by type.
    final signedCents =
        dto.type == 'Expense' ? -dto.value.abs() : dto.value.abs();
    return TransactionItem(
      id: dto.id,
      subCategoryId: dto.subCategoryId,
      subCategoryName: dto.subCategoryName,
      accountId: dto.accountId,
      accountName: dto.accountName,
      amountCents: signedCents,
      type: dto.type,
      paymentType: dto.paymentType,
      date: DateTime.parse(dto.transactionDate),
      isPaid: dto.isPaid,
      budgetId: dto.budgetId,
      description: dto.description,
      recurringTransactionId: dto.recurringTransactionId,
      parentTransactionId: dto.parentTransactionId,
      installmentNumber: dto.installmentNumber,
      totalInstallments: dto.totalInstallments,
    );
  }
}

/// A group of transactions sharing the same calendar date.
class TransactionGroup {
  final DateTime date;
  final List<TransactionItem> items;

  const TransactionGroup({required this.date, required this.items});
}
