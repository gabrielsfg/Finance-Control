import 'package:json_annotation/json_annotation.dart';

part 'update_recurring_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateRecurringRequestDto {
  const UpdateRecurringRequestDto({
    required this.subCategoryId,
    required this.accountId,
    required this.value,
    this.budgetId,
    this.description,
    this.endDate,
  });

  final int subCategoryId;
  final int accountId;

  /// In cents.
  final int value;

  /// null to unlink from budget.
  final int? budgetId;
  final String? description;

  /// Optional end date for the recurrence. Format: "YYYY-MM-DD"
  final String? endDate;

  Map<String, dynamic> toJson() => _$UpdateRecurringRequestDtoToJson(this);
}
