import 'package:json_annotation/json_annotation.dart';

part 'category_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class CategoryResponseDto {
  const CategoryResponseDto({
    required this.id,
    required this.name,
    required this.subCategories,
  });

  final int id;
  final String name;
  final List<SubcategoryResponseDto> subCategories;

  factory CategoryResponseDto.fromJson(Map<String, dynamic> json) =>
      _$CategoryResponseDtoFromJson(json);
}

@JsonSerializable(createToJson: false)
class SubcategoryResponseDto {
  const SubcategoryResponseDto({
    required this.id,
    required this.name,
  });

  final int id;
  final String name;

  factory SubcategoryResponseDto.fromJson(Map<String, dynamic> json) =>
      _$SubcategoryResponseDtoFromJson(json);
}
