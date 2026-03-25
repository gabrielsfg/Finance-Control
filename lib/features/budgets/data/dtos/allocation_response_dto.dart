import 'package:json_annotation/json_annotation.dart';

part 'allocation_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class AllocationByAreaResponseDto {
  const AllocationByAreaResponseDto({
    required this.areaId,
    required this.areaName,
    required this.categories,
  });

  final int areaId;
  final String areaName;
  final List<AllocationCategoryDto> categories;

  factory AllocationByAreaResponseDto.fromJson(Map<String, dynamic> json) =>
      _$AllocationByAreaResponseDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class AllocationCategoryDto {
  const AllocationCategoryDto({
    required this.categoryId,
    required this.categoryName,
    required this.categoryExpectedValue,
    required this.subCategories,
  });

  final int categoryId;
  final String categoryName;
  final int categoryExpectedValue;
  final List<AllocationSubcategoryDto> subCategories;

  factory AllocationCategoryDto.fromJson(Map<String, dynamic> json) =>
      _$AllocationCategoryDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class AllocationSubcategoryDto {
  const AllocationSubcategoryDto({
    required this.allocationId,
    required this.subCategoryId,
    required this.subCategoryName,
    required this.subCategoryExpectedValue,
    required this.allocationType,
    this.spentValue = 0,
  });

  final int allocationId;
  final int subCategoryId;
  final String subCategoryName;
  final int subCategoryExpectedValue;
  final String allocationType;
  final int spentValue;

  factory AllocationSubcategoryDto.fromJson(Map<String, dynamic> json) =>
      _$AllocationSubcategoryDtoFromJson(json);
}
