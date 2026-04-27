import 'package:json_annotation/json_annotation.dart';

part 'user_preferences_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class UserPreferencesResponseDto {
  const UserPreferencesResponseDto({
    required this.currencyCode,
    required this.locale,
    this.country,
  });

  final String currencyCode;
  final String locale;
  final String? country;

  factory UserPreferencesResponseDto.fromJson(Map<String, dynamic> json) =>
      _$UserPreferencesResponseDtoFromJson(json);
}
