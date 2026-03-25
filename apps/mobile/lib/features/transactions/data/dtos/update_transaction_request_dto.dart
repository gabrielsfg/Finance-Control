import 'package:json_annotation/json_annotation.dart';

part 'update_transaction_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateTransactionRequestDto {
  const UpdateTransactionRequestDto({
    required this.subCategoryId,
    required this.accountId,
    required this.value,
    required this.transactionDate,
    this.budgetId,
    this.description,
  });

  final int subCategoryId;
  final int accountId;

  /// In cents.
  final int value;

  /// Format: "YYYY-MM-DD"
  final String transactionDate;

  /// null to unlink from budget.
  final int? budgetId;
  final String? description;

  Map<String, dynamic> toJson() => _$UpdateTransactionRequestDtoToJson(this);
}
