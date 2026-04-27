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
    required this.type,
    required this.balanceCents,
    required this.isDefault,
    this.goalAmountCents,
    this.billingDueDay,
    this.creditLimitCents,
    required this.recentTransactions,
  });

  final int id;
  final String name;

  /// "Checking" | "Savings" | "Credit" | "Cash"
  final String type;

  final int balanceCents;
  final bool isDefault;
  final int? goalAmountCents;

  /// Only non-null when type == "Credit".
  final int? billingDueDay;

  /// Only non-null when type == "Credit". In cents.
  final int? creditLimitCents;

  final List<RecentTransaction> recentTransactions;

  bool get isCredit => type == 'Credit';

  factory AccountDetail.fromDto(GetAccountByIdResponseDto dto) => AccountDetail(
        id: dto.id,
        name: dto.name,
        type: dto.type,
        balanceCents: dto.currentAmount,
        isDefault: dto.isDefaultAccount,
        goalAmountCents: dto.goalAmount,
        billingDueDay: dto.billingDueDay,
        creditLimitCents: dto.creditLimit,
        recentTransactions: dto.recentTransactions
            .map(RecentTransaction.fromDto)
            .toList(),
      );
}
