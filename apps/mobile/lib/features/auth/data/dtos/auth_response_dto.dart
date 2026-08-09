import 'package:json_annotation/json_annotation.dart';

part 'auth_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class AuthResponseDto {
  const AuthResponseDto({
    required this.accessToken,
    required this.refreshToken,
    this.trustedDeviceToken,
  });

  final String accessToken;
  final String refreshToken;

  /// Only returned when the user asked to trust the device during two-factor.
  /// It goes to the keystore and rides along on the next login.
  final String? trustedDeviceToken;

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseDtoFromJson(json);
}
