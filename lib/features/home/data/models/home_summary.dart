/// Domain model for the home screen summary.
/// Mapped from [MainPageSummaryResponseDto] — never use DTOs directly in the UI.
class HomeSummary {
  const HomeSummary({
    required this.totalIncome,
    required this.totalExpenses,
    required this.balance,
    required this.recentTransactions,
    required this.budgetTotalExpected,
    required this.budgetTotalSpent,
    required this.budgetSpentPercentage,
    required this.topCategories,
  });

  /// All monetary values are in cents.
  final int totalIncome;
  final int totalExpenses;
  final int balance;
  final List<RecentTransactionSummary> recentTransactions;
  final int budgetTotalExpected;
  final int budgetTotalSpent;

  /// 0.0–100.0
  final double budgetSpentPercentage;
  final List<TopCategorySummary> topCategories;
}

class RecentTransactionSummary {
  const RecentTransactionSummary({
    required this.id,
    required this.description,
    required this.valueCents,
    required this.isExpense,
    required this.subCategoryName,
    required this.categoryName,
  });

  final int id;
  final String description;

  /// Positive = income, negative = expense (cents).
  final int valueCents;
  final bool isExpense;
  final String subCategoryName;
  final String categoryName;
}

class TopCategorySummary {
  const TopCategorySummary({
    required this.categoryName,
    required this.totalSpentCents,
  });

  final String categoryName;
  final int totalSpentCents;
}
