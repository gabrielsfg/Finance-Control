import 'package:json_annotation/json_annotation.dart';

part 'register_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class RegisterRequestDto {
  const RegisterRequestDto({
    required this.email,
    required this.password,
    required this.name,
    required this.acceptedTerms,
  });

  final String email;
  final String password;
  final String name;

  /// Only the tick. Which document version was accepted, when, and from where is
  /// decided and recorded by the backend.
  final bool acceptedTerms;

  Map<String, dynamic> toJson() => _$RegisterRequestDtoToJson(this);
}
