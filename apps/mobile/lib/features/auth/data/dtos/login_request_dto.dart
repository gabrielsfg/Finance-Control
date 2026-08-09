import 'package:json_annotation/json_annotation.dart';

part 'login_request_dto.g.dart';

@JsonSerializable(createFactory: false, includeIfNull: false)
class LoginRequestDto {
  const LoginRequestDto({
    required this.email,
    required this.password,
    this.trustedDeviceToken,
  });

  final String email;
  final String password;

  /// Lets a known device skip two-factor. Null on a device that was never trusted.
  final String? trustedDeviceToken;

  Map<String, dynamic> toJson() => _$LoginRequestDtoToJson(this);
}
