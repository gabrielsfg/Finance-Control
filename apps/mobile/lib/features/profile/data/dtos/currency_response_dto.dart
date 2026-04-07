import 'package:json_annotation/json_annotation.dart';

part 'currency_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class CurrencyResponseDto {
  const CurrencyResponseDto({
    required this.code,
    required this.name,
    required this.symbol,
  });

  final String code;
  final String name;
  final String symbol;

  factory CurrencyResponseDto.fromJson(Map<String, dynamic> json) =>
      _$CurrencyResponseDtoFromJson(json);
}
