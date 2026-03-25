import '../dtos/get_account_by_id_response_dto.dart';

class RecentTransaction {
  const RecentTransaction({
    required this.id,
    required this.description,
    required this.valueCents,
    required this.type,
    required this.subCategoryName,
    required this.categoryName,
  });

  final int id;
  final String? description;
  final int valueCents;
  final String type;
  final String subCategoryName;
  final String categoryName;

  bool get isExpense => type == 'Expense';

  factory RecentTransaction.fromDto(RecentTransactionDto dto) =>
      RecentTransaction(
        id: dto.id,
        description: dto.description,
        valueCents: dto.value,
        type: dto.type,
        subCategoryName: dto.subCategoryName,
        categoryName: dto.categoryName,
      );
}

class AccountDetail {
  const AccountDetail({
    required this.id,
    required this.name,
    required this.balanceCents,
    this.initialBalanceCents,
    required this.isDefault,
    required this.excludeFromNetWorth,
    this.goalAmountCents,
    required this.recentTransactions,
  });

  final int id;
  final String name;
  final int balanceCents;
  final int? initialBalanceCents;
  final bool isDefault;
  final bool excludeFromNetWorth;
  final int? goalAmountCents;
  final List<RecentTransaction> recentTransactions;

  factory AccountDetail.fromDto(GetAccountByIdResponseDto dto) => AccountDetail(
        id: dto.id,
        name: dto.name,
        balanceCents: dto.currentAmount,
        initialBalanceCents: dto.initialAmount,
        isDefault: dto.isDefaultAccount,
        excludeFromNetWorth: dto.excludeFromNetWorth,
        goalAmountCents: dto.goalAmount,
        recentTransactions: dto.recentTransactions
            .map(RecentTransaction.fromDto)
            .toList(),
      );
}
