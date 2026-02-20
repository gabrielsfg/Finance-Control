import 'package:json_annotation/json_annotation.dart';

part 'login_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class LoginRequestDto {
  const LoginRequestDto({required this.email, required this.password});

  final String email;
  final String password;

  Map<String, dynamic> toJson() => _$LoginRequestDtoToJson(this);
}
