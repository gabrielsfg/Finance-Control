import 'package:json_annotation/json_annotation.dart';

part 'update_user_profile_request_dto.g.dart';

@JsonSerializable(createFactory: false, includeIfNull: false)
class UpdateUserProfileRequestDto {
  const UpdateUserProfileRequestDto({this.name, this.email});

  final String? name;
  final String? email;

  Map<String, dynamic> toJson() => _$UpdateUserProfileRequestDtoToJson(this);
}
