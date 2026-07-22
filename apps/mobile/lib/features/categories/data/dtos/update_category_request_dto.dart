import 'package:json_annotation/json_annotation.dart';

part 'update_category_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateCategoryItemDto {
  const UpdateCategoryItemDto({
    required this.id,
    required this.name,
    this.color,
  });

  final int id;
  final String name;
  final String? color;

  Map<String, dynamic> toJson() => _$UpdateCategoryItemDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class UpdateCategoriesRequestDto {
  const UpdateCategoriesRequestDto({required this.categories});

  final List<UpdateCategoryItemDto> categories;

  Map<String, dynamic> toJson() => _$UpdateCategoriesRequestDtoToJson(this);
}
