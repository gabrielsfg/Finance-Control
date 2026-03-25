import 'package:json_annotation/json_annotation.dart';

part 'get_transaction_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class GetTransactionResponseDto {
  const GetTransactionResponseDto({
    required this.id,
    required this.subCategoryId,
    required this.subCategoryName,
    required this.accountId,
    required this.accountName,
    required this.value,
    required this.type,
    required this.transactionDate,
    required this.paymentType,
    required this.isPaid,
    this.budgetId,
    this.description,
    this.recurringTransactionId,
    this.parentTransactionId,
    this.installmentNumber,
    this.totalInstallments,
  });

  final int id;
  final int subCategoryId;
  final String subCategoryName;
  final int accountId;
  final String accountName;

  /// In cents. R$ 150,00 = 15000.
  final int value;

  /// "Expense" | "Income"
  final String type;

  /// Format: "YYYY-MM-DD"
  final String transactionDate;

  /// "OneTime" | "Installment" | "Recurring"
  final String paymentType;

  final bool isPaid;
  final int? budgetId;
  final String? description;
  final int? recurringTransactionId;
  final int? parentTransactionId;
  final int? installmentNumber;
  final int? totalInstallments;

  factory GetTransactionResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetTransactionResponseDtoFromJson(json);
}
