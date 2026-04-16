import 'package:json_annotation/json_annotation.dart';

part 'update_user_preferences_request_dto.g.dart';

@JsonSerializable(createFactory: false, includeIfNull: false)
class UpdateUserPreferencesRequestDto {
  const UpdateUserPreferencesRequestDto({
    this.currencyCode,
    this.locale,
    this.country,
  });

  final String? currencyCode;
  final String? locale;
  final String? country;

  Map<String, dynamic> toJson() =>
      _$UpdateUserPreferencesRequestDtoToJson(this);
}
