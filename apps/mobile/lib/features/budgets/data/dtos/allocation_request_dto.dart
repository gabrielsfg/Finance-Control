import 'package:json_annotation/json_annotation.dart';

part 'allocation_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class CreateAllocationRequestDto {
  const CreateAllocationRequestDto({
    required this.areaId,
    required this.subCategoryId,
    required this.expectedValue,
    required this.allocationType,
  });

  final int areaId;
  final int subCategoryId;
  final int expectedValue;
  final String allocationType;

  Map<String, dynamic> toJson() => _$CreateAllocationRequestDtoToJson(this);
}

@JsonSerializable(createFactory: false)
class UpdateAllocationRequestDto {
  const UpdateAllocationRequestDto({
    required this.expectedValue,
    required this.allocationType,
  });

  final int expectedValue;
  final String allocationType;

  Map<String, dynamic> toJson() => _$UpdateAllocationRequestDtoToJson(this);
}
