import 'package:json_annotation/json_annotation.dart';

part 'update_category_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateCategoryItemDto {
  const UpdateCategoryItemDto({required this.id, required this.name});

  final int id;
  final String name;

  Map<String, dynamic> toJson() => _$UpdateCategoryItemDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class UpdateCategoriesRequestDto {
  const UpdateCategoriesRequestDto({required this.categories});

  final List<UpdateCategoryItemDto> categories;

  Map<String, dynamic> toJson() => _$UpdateCategoriesRequestDtoToJson(this);
}
