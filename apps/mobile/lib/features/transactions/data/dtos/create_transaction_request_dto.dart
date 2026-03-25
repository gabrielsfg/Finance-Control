import 'package:json_annotation/json_annotation.dart';

part 'create_transaction_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class CreateTransactionRequestDto {
  const CreateTransactionRequestDto({
    required this.subCategoryId,
    required this.accountId,
    required this.value,
    required this.type,
    required this.transactionDate,
    required this.paymentType,
    required this.includeInBudget,
    this.description,
    this.totalInstallments,
    this.recurrence,
  });

  final int subCategoryId;
  final int accountId;

  /// Always in cents. R$ 150,00 → 15000.
  final int value;

  /// "Expense" | "Income"
  final String type;

  /// Format: "YYYY-MM-DD"
  final String transactionDate;

  /// "OneTime" | "Installment" | "Recurring"
  final String paymentType;

  final bool includeInBudget;
  final String? description;

  /// Required when paymentType == "Installment". Must be > 1.
  final int? totalInstallments;

  /// Required when paymentType == "Recurring". Must not be null or "None".
  final String? recurrence;

  Map<String, dynamic> toJson() => _$CreateTransactionRequestDtoToJson(this);
}
