import '../dtos/account_response_dto.dart';

class Account {
  const Account({
    required this.id,
    required this.name,
    required this.type,
    required this.balanceCents,
    required this.isDefault,
  });

  final int id;
  final String name;

  /// "Debit" | "Checking" | "Savings" | "Credit" | "Cash"
  final String type;

  final int balanceCents;
  final bool isDefault;

  factory Account.fromDto(GetAccountItemResponseDto dto) => Account(
        id: dto.id,
        name: dto.name,
        type: dto.type,
        balanceCents: dto.currentAmount,
        isDefault: dto.isDefaultAccount,
      );
}
