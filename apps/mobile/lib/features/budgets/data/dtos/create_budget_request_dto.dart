import 'package:json_annotation/json_annotation.dart';

part 'create_budget_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class CreateAllocationInBudgetDto {
  const CreateAllocationInBudgetDto({
    required this.subCategoryId,
    required this.expectedValue,
    required this.allocationType,
  });

  final int subCategoryId;
  final int expectedValue;
  final String allocationType;

  Map<String, dynamic> toJson() => _$CreateAllocationInBudgetDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class CreateAreaInBudgetDto {
  const CreateAreaInBudgetDto({
    required this.name,
    required this.allocations,
  });

  final String name;
  final List<CreateAllocationInBudgetDto> allocations;

  Map<String, dynamic> toJson() => _$CreateAreaInBudgetDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class CreateBudgetRequestDto {
  const CreateBudgetRequestDto({
    required this.name,
    required this.startDate,
    required this.recurrence,
    required this.isActive,
    required this.areas,
  });

  final String name;
  final int startDate;
  final String recurrence;
  final bool isActive;
  final List<CreateAreaInBudgetDto> areas;

  Map<String, dynamic> toJson() => _$CreateBudgetRequestDtoToJson(this);
}
