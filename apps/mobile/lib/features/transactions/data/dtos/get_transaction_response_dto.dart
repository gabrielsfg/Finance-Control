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
    this.budgetId,
    this.description,
    this.recurringTransactionId,
    this.parentTransactionId,
    this.installmentNumber,
    this.totalInstallments,
    this.areaId,
    this.areaName,
    this.paymentMethod,
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

  final int? budgetId;
  final String? description;
  final int? recurringTransactionId;
  final int? parentTransactionId;
  final int? installmentNumber;
  final int? totalInstallments;
  final int? areaId;
  final String? areaName;

  /// "Credit" | "Debit" | null (legacy transactions)
  final String? paymentMethod;

  factory GetTransactionResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetTransactionResponseDtoFromJson(json);
}
