import 'package:json_annotation/json_annotation.dart';

part 'bank_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class BankResponseDto {
  const BankResponseDto({
    required this.name,
    required this.country,
  });

  final String name;
  final String country;

  factory BankResponseDto.fromJson(Map<String, dynamic> json) =>
      _$BankResponseDtoFromJson(json);
}
