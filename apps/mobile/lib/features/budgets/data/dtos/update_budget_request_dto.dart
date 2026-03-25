import 'package:json_annotation/json_annotation.dart';

part 'update_budget_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateAllocationInBudgetDto {
  const UpdateAllocationInBudgetDto({
    required this.id,
    required this.subCategoryId,
    required this.expectedValue,
    required this.allocationType,
  });

  final int? id;
  final int subCategoryId;
  final int expectedValue;
  final String allocationType;

  Map<String, dynamic> toJson() => _$UpdateAllocationInBudgetDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class UpdateAreaInBudgetDto {
  const UpdateAreaInBudgetDto({
    required this.id,
    required this.name,
    required this.allocations,
  });

  final int? id;
  final String name;
  final List<UpdateAllocationInBudgetDto> allocations;

  Map<String, dynamic> toJson() => _$UpdateAreaInBudgetDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class UpdateBudgetRequestDto {
  const UpdateBudgetRequestDto({
    required this.id,
    required this.name,
    required this.startDate,
    required this.recurrence,
    required this.isActive,
    required this.areas,
  });

  final int id;
  final String name;
  final int startDate;
  final String recurrence;
  final bool isActive;
  final List<UpdateAreaInBudgetDto> areas;

  Map<String, dynamic> toJson() => _$UpdateBudgetRequestDtoToJson(this);
}
