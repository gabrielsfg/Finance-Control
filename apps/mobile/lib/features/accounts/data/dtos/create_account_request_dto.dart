import 'package:json_annotation/json_annotation.dart';

part 'create_account_request_dto.g.dart';

@JsonSerializable(createFactory: false)
class CreateAccountRequestDto {
  const CreateAccountRequestDto({
    required this.name,
    required this.type,
    required this.isDefaultAccount,
    this.goalAmount,
    this.billingDueDay,
    this.creditLimit,
    this.initialBalance,
  });

  final String name;

  /// "Debit" | "Checking" | "Savings" | "Credit" | "Cash"
  final String type;

  final bool isDefaultAccount;
  final int? goalAmount;

  /// Sent when type == "Credit" or "Checking". In cents.
  final int? billingDueDay;

  /// Sent when type == "Credit" or "Checking". In cents.
  final int? creditLimit;

  /// Current balance in cents; backend creates an Income adjustment transaction.
  final int? initialBalance;

  Map<String, dynamic> toJson() => _$CreateAccountRequestDtoToJson(this);
}
