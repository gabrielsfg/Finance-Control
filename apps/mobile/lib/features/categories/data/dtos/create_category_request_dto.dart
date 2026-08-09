import 'package:json_annotation/json_annotation.dart';

part 'create_category_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class CreateCategoryRequestDto {
  const CreateCategoryRequestDto({required this.name, this.color});

  final String name;
  final String? color;

  Map<String, dynamic> toJson() => _$CreateCategoryRequestDtoToJson(this);
}
