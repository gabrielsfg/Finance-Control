import 'package:json_annotation/json_annotation.dart';

part 'register_response_dto.g.dart';

/// Espelho de User + BaseEntity retornado pelo endpoint POST /api/user/register.
@JsonSerializable(createToJson: false)
class RegisterResponseDto {
  const RegisterResponseDto({
    required this.id,
    required this.email,
    required this.name,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
  });

  final int id;
  final String email;
  final String name;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  factory RegisterResponseDto.fromJson(Map<String, dynamic> json) =>
      _$RegisterResponseDtoFromJson(json);
}
