import 'package:json_annotation/json_annotation.dart';

part 'user_profile_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class UserProfileResponseDto {
  const UserProfileResponseDto({
    required this.id,
    required this.name,
    required this.email,
    this.twoFactorEnabled = false,
    this.emailVerified = false,
  });

  final int id;
  final String name;
  final String email;

  /// Drives the security row: its state, and what confirming the toggle will do.
  final bool twoFactorEnabled;
  final bool emailVerified;

  factory UserProfileResponseDto.fromJson(Map<String, dynamic> json) =>
      _$UserProfileResponseDtoFromJson(json);
}
