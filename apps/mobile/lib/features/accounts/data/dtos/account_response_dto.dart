import 'package:json_annotation/json_annotation.dart';

part 'account_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class GetAccountItemResponseDto {
  const GetAccountItemResponseDto({
    required this.id,
    required this.name,
    required this.type,
    required this.currentAmount,
    required this.isDefaultAccount,
  });

  final int id;
  final String name;

  /// "Checking" | "Savings" | "Credit" | "Cash"
  final String type;

  final int currentAmount;
  final bool isDefaultAccount;

  factory GetAccountItemResponseDto.fromJson(Map<String, dynamic> json) =>
      _$GetAccountItemResponseDtoFromJson(json);
}
