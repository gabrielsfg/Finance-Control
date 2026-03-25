import 'package:json_annotation/json_annotation.dart';

part 'account_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class GetAccountItemResponseDto {
  const GetAccountItemResponseDto({
    required this.id,
    required this.name,
    required this.currentAmount,
    required this.isDefaultAccount,
  });

  final int id;
  final String name;
  final int currentAmount;
  final bool isDefaultAccount;

  factory GetAccountItemResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetAccountItemResponseDtoFromJson(json);
}
