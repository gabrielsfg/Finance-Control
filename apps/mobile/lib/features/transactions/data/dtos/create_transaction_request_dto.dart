import 'package:json_annotation/json_annotation.dart';

part 'create_transaction_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class CreateTransactionRequestDto {
  const CreateTransactionRequestDto({
    this.subCategoryId,
    required this.accountId,
    required this.value,
    required this.type,
    required this.transactionDate,
    required this.paymentType,
    required this.includeInBudget,
    this.destinationAccountId,
    this.description,
    this.totalInstallments,
    this.recurrence,
    this.paymentMethod,
  });

  /// Null for transfers (which have no subcategory).
  final int? subCategoryId;
  final int accountId;

  /// Destination account for transfers (type == "Transfer").
  final int? destinationAccountId;

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

  /// "Credit" | "Debit" | null
  final String? paymentMethod;

  Map<String, dynamic> toJson() => _$CreateTransactionRequestDtoToJson(this);
}
