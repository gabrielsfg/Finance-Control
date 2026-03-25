import 'package:json_annotation/json_annotation.dart';

part 'budget_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class GetAllBudgetResponseDto {
  const GetAllBudgetResponseDto({
    required this.id,
    required this.name,
    required this.recurrence,
  });

  final int id;
  final String name;
  final String recurrence;

  factory GetAllBudgetResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetAllBudgetResponseDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class AllocationInBudgetResponseDto {
  const AllocationInBudgetResponseDto({
    required this.id,
    required this.subCategoryId,
    required this.subCategoryName,
    required this.expectedValue,
    required this.allocationType,
    this.spentValue = 0,
  });

  final int id;
  final int subCategoryId;
  final String subCategoryName;
  final int expectedValue;
  final String allocationType;
  final int spentValue;

  factory AllocationInBudgetResponseDto.fromJson(Map<String, dynamic> json) =>
      _$AllocationInBudgetResponseDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class AreaInBudgetResponseDto {
  const AreaInBudgetResponseDto({
    required this.id,
    required this.name,
    required this.allocations,
  });

  final int id;
  final String name;
  final List<AllocationInBudgetResponseDto> allocations;

  factory AreaInBudgetResponseDto.fromJson(Map<String, dynamic> json) =>
      _$AreaInBudgetResponseDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class GetBudgetByIdResponseDto {
  const GetBudgetByIdResponseDto({
    required this.id,
    required this.name,
    required this.startDate,
    required this.finishDate,
    required this.recurrence,
    this.isActive = true,
    this.areas = const [],
  });

  final int id;
  final String name;
  final String startDate;
  final String finishDate;
  final String recurrence;
  final bool isActive;
  final List<AreaInBudgetResponseDto> areas;

  factory GetBudgetByIdResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetBudgetByIdResponseDtoFromJson(json);
}
