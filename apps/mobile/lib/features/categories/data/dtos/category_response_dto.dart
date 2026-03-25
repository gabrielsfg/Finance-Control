import 'package:json_annotation/json_annotation.dart';

part 'category_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class CategoryItemResponseDto {
  const CategoryItemResponseDto({
    required this.id,
    required this.name,
    required this.subCategories,
  });

  final int id;
  final String name;
  final List<SubcategoryItemResponseDto> subCategories;

  factory CategoryItemResponseDto.fromJson(Map<String, dynamic> json) =>
      _$CategoryItemResponseDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class SubcategoryItemResponseDto {
  const SubcategoryItemResponseDto({
    required this.id,
    required this.name,
    required this.categoryId,
    this.categoryName,
  });

  final int id;
  final String name;
  final int categoryId;

  /// Only present when fetched via GET /api/SubCategory/all.
  /// Not included when subcategories are nested inside a category response.
  final String? categoryName;

  factory SubcategoryItemResponseDto.fromJson(Map<String, dynamic> json) =>
      _$SubcategoryItemResponseDtoFromJson(json);
}
