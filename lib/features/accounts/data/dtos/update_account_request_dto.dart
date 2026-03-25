import 'package:json_annotation/json_annotation.dart';

part 'update_account_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateAccountRequestDto {
  const UpdateAccountRequestDto({
    required this.name,
    required this.currentBalance,
    required this.isDefaultAccount,
    required this.excludeFromNetWorth,
    this.goalAmount,
  });

  final String name;
  final int currentBalance;
  final bool isDefaultAccount;
  final bool excludeFromNetWorth;
  final int? goalAmount;

  Map<String, dynamic> toJson() => _$UpdateAccountRequestDtoToJson(this);
}
