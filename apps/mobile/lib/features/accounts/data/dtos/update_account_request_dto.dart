import 'package:json_annotation/json_annotation.dart';

part 'update_account_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class UpdateAccountRequestDto {
  const UpdateAccountRequestDto({
    required this.id,
    required this.name,
    required this.type,
    required this.isDefaultAccount,
    this.goalAmount,
    this.billingDueDay,
    this.creditLimit,
  });

  final int id;
  final String name;

  /// "Checking" | "Savings" | "Credit" | "Cash"
  final String type;

  final bool isDefaultAccount;
  final int? goalAmount;

  /// Only sent when type == "Credit".
  final int? billingDueDay;

  /// Only sent when type == "Credit". In cents.
  final int? creditLimit;

  Map<String, dynamic> toJson() => _$UpdateAccountRequestDtoToJson(this);
}
