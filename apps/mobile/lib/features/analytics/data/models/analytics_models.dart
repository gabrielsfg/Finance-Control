// Analytics domain models — mapped from API response DTOs.
// All monetary values are in cents.

class IncomeExpenseItem {
  const IncomeExpenseItem({
    required this.month,
    required this.year,
    required this.totalIncome,
    required this.totalExpense,
  });
  final int month;
  final int year;
  final int totalIncome;
  final int totalExpense;

  factory IncomeExpenseItem.fromJson(Map<String, dynamic> j) =>
      IncomeExpenseItem(
        month: j['month'] as int,
        year: j['year'] as int,
        totalIncome: j['totalIncome'] as int,
        totalExpense: j['totalExpense'] as int,
      );
}

class BalanceEvolutionItem {
  const BalanceEvolutionItem({required this.date, required this.balance});
  final DateTime date;
  final int balance;

  factory BalanceEvolutionItem.fromJson(Map<String, dynamic> j) =>
      BalanceEvolutionItem(
        date: DateTime.parse(j['date'] as String),
        balance: j['balance'] as int,
      );
}

class SubCategoryExpenseItem {
  const SubCategoryExpenseItem({
    required this.id,
    required this.name,
    required this.total,
  });
  final int id;
  final String name;
  final int total;

  factory SubCategoryExpenseItem.fromJson(Map<String, dynamic> j) =>
      SubCategoryExpenseItem(
        id: j['id'] as int,
        name: j['name'] as String,
        total: j['total'] as int,
      );
}

class ExpensesByCategory {
  const ExpensesByCategory({
    required this.categoryId,
    required this.categoryName,
    required this.total,
    required this.subcategories,
  });
  final int categoryId;
  final String categoryName;
  final int total;
  final List<SubCategoryExpenseItem> subcategories;

  factory ExpensesByCategory.fromJson(Map<String, dynamic> j) =>
      ExpensesByCategory(
        categoryId: j['categoryId'] as int,
        categoryName: j['categoryName'] as String,
        total: j['total'] as int,
        subcategories: (j['subcategories'] as List)
            .map((e) => SubCategoryExpenseItem.fromJson(e))
            .toList(),
      );
}

class CategoryEvolutionItem {
  const CategoryEvolutionItem({
    required this.month,
    required this.year,
    required this.total,
  });
  final int month;
  final int year;
  final int total;

  factory CategoryEvolutionItem.fromJson(Map<String, dynamic> j) =>
      CategoryEvolutionItem(
        month: j['month'] as int,
        year: j['year'] as int,
        total: j['total'] as int,
      );
}

class AccountBalanceItem {
  const AccountBalanceItem({
    required this.accountId,
    required this.accountName,
    required this.balance,
  });
  final int accountId;
  final String accountName;
  final int balance;

  factory AccountBalanceItem.fromJson(Map<String, dynamic> j) =>
      AccountBalanceItem(
        accountId: j['accountId'] as int,
        accountName: j['accountName'] as String,
        balance: j['balance'] as int,
      );
}

class NetWorthEvolutionItem {
  const NetWorthEvolutionItem({
    required this.month,
    required this.year,
    required this.netWorth,
    required this.breakdown,
  });
  final int month;
  final int year;
  final int netWorth;
  final List<AccountBalanceItem> breakdown;

  factory NetWorthEvolutionItem.fromJson(Map<String, dynamic> j) =>
      NetWorthEvolutionItem(
        month: j['month'] as int,
        year: j['year'] as int,
        netWorth: j['netWorth'] as int,
        breakdown: (j['breakdown'] as List)
            .map((e) => AccountBalanceItem.fromJson(e))
            .toList(),
      );
}

class CommitmentDetail {
  const CommitmentDetail({required this.description, required this.value});
  final String description;
  final int value;

  factory CommitmentDetail.fromJson(Map<String, dynamic> j) =>
      CommitmentDetail(
        description: j['description'] as String,
        value: j['value'] as int,
      );
}

class FutureCommitmentsItem {
  const FutureCommitmentsItem({
    required this.month,
    required this.year,
    required this.totalCommitted,
    required this.installments,
  });
  final int month;
  final int year;
  final int totalCommitted;
  final List<CommitmentDetail> installments;

  factory FutureCommitmentsItem.fromJson(Map<String, dynamic> j) =>
      FutureCommitmentsItem(
        month: j['month'] as int,
        year: j['year'] as int,
        totalCommitted: j['totalCommitted'] as int,
        installments: (j['installments'] as List)
            .map((e) => CommitmentDetail.fromJson(e))
            .toList(),
      );
}

class SpendingHeatmapItem {
  const SpendingHeatmapItem({required this.date, required this.total});
  final DateTime date;
  final int total;

  factory SpendingHeatmapItem.fromJson(Map<String, dynamic> j) =>
      SpendingHeatmapItem(
        date: DateTime.parse(j['date'] as String),
        total: j['total'] as int,
      );
}

class BudgetPacePoint {
  const BudgetPacePoint({required this.date, required this.accumulated});
  final DateTime date;
  final int accumulated;

  factory BudgetPacePoint.fromJson(Map<String, dynamic> j) => BudgetPacePoint(
        date: DateTime.parse(j['date'] as String),
        accumulated: j['accumulated'] as int,
      );
}

class BudgetPace {
  const BudgetPace({
    required this.dailyIdeal,
    required this.periodStart,
    required this.periodEnd,
    required this.totalExpected,
    required this.actual,
  });
  final double dailyIdeal;
  final DateTime periodStart;
  final DateTime periodEnd;
  final int totalExpected;
  final List<BudgetPacePoint> actual;

  factory BudgetPace.fromJson(Map<String, dynamic> j) => BudgetPace(
        dailyIdeal: (j['dailyIdeal'] as num).toDouble(),
        periodStart: DateTime.parse(j['periodStart'] as String),
        periodEnd: DateTime.parse(j['periodEnd'] as String),
        totalExpected: j['totalExpected'] as int,
        actual: (j['actual'] as List)
            .map((e) => BudgetPacePoint.fromJson(e))
            .toList(),
      );
}

// ── Projections ───────────────────────────────────────────────────────────────

class BalanceProjectionPoint {
  const BalanceProjectionPoint({required this.date, required this.balance});
  final DateTime date;
  final int balance;

  factory BalanceProjectionPoint.fromJson(Map<String, dynamic> j) =>
      BalanceProjectionPoint(
        date: DateTime.parse(j['date'] as String),
        balance: j['balance'] as int,
      );
}

class BalanceProjection {
  const BalanceProjection({
    required this.currentBalance,
    required this.projectedBalance,
    required this.dailyAvgIncome,
    required this.dailyAvgExpense,
    required this.actual,
    required this.projected,
  });
  final int currentBalance;
  final int projectedBalance;
  final double dailyAvgIncome;
  final double dailyAvgExpense;
  final List<BalanceProjectionPoint> actual;
  final List<BalanceProjectionPoint> projected;

  factory BalanceProjection.fromJson(Map<String, dynamic> j) =>
      BalanceProjection(
        currentBalance: j['currentBalance'] as int,
        projectedBalance: j['projectedBalance'] as int,
        dailyAvgIncome: (j['dailyAvgIncome'] as num).toDouble(),
        dailyAvgExpense: (j['dailyAvgExpense'] as num).toDouble(),
        actual: (j['actual'] as List)
            .map((e) => BalanceProjectionPoint.fromJson(e))
            .toList(),
        projected: (j['projected'] as List)
            .map((e) => BalanceProjectionPoint.fromJson(e))
            .toList(),
      );
}

class CategoryProjection {
  const CategoryProjection({
    required this.categoryId,
    required this.categoryName,
    required this.spentSoFar,
    required this.projectedTotal,
    required this.historicalMonthlyAvg,
    required this.monthElapsedPercent,
    required this.spentPercent,
  });
  final int categoryId;
  final String categoryName;
  final int spentSoFar;
  final int projectedTotal;
  final double historicalMonthlyAvg;
  final double monthElapsedPercent;
  final double spentPercent;

  factory CategoryProjection.fromJson(Map<String, dynamic> j) =>
      CategoryProjection(
        categoryId: j['categoryId'] as int,
        categoryName: j['categoryName'] as String,
        spentSoFar: j['spentSoFar'] as int,
        projectedTotal: j['projectedTotal'] as int,
        historicalMonthlyAvg: (j['historicalMonthlyAvg'] as num).toDouble(),
        monthElapsedPercent: (j['monthElapsedPercent'] as num).toDouble(),
        spentPercent: (j['spentPercent'] as num).toDouble(),
      );
}

class NetWorthProjectionPoint {
  const NetWorthProjectionPoint({
    required this.month,
    required this.year,
    required this.netWorth,
  });
  final int month;
  final int year;
  final int netWorth;

  factory NetWorthProjectionPoint.fromJson(Map<String, dynamic> j) =>
      NetWorthProjectionPoint(
        month: j['month'] as int,
        year: j['year'] as int,
        netWorth: j['netWorth'] as int,
      );
}

class NetWorthProjection {
  const NetWorthProjection({
    required this.currentNetWorth,
    required this.monthlyAvgGrowth,
    required this.historical,
    required this.projected,
    this.monthsUntilZero,
    this.monthsUntilTarget,
    this.targetAmount,
  });
  final int currentNetWorth;
  final double monthlyAvgGrowth;
  final int? monthsUntilZero;
  final int? monthsUntilTarget;
  final int? targetAmount;
  final List<NetWorthProjectionPoint> historical;
  final List<NetWorthProjectionPoint> projected;

  factory NetWorthProjection.fromJson(Map<String, dynamic> j) =>
      NetWorthProjection(
        currentNetWorth: j['currentNetWorth'] as int,
        monthlyAvgGrowth: (j['monthlyAvgGrowth'] as num).toDouble(),
        monthsUntilZero: j['monthsUntilZero'] as int?,
        monthsUntilTarget: j['monthsUntilTarget'] as int?,
        targetAmount: j['targetAmount'] as int?,
        historical: (j['historical'] as List)
            .map((e) => NetWorthProjectionPoint.fromJson(e))
            .toList(),
        projected: (j['projected'] as List)
            .map((e) => NetWorthProjectionPoint.fromJson(e))
            .toList(),
      );
}

class CommitmentsImpactMonth {
  const CommitmentsImpactMonth({
    required this.month,
    required this.year,
    required this.projectedIncome,
    required this.totalCommitments,
    required this.projectedBalance,
    required this.isNegative,
    required this.commitments,
  });
  final int month;
  final int year;
  final int projectedIncome;
  final int totalCommitments;
  final int projectedBalance;
  final bool isNegative;
  final List<CommitmentDetail> commitments;

  factory CommitmentsImpactMonth.fromJson(Map<String, dynamic> j) =>
      CommitmentsImpactMonth(
        month: j['month'] as int,
        year: j['year'] as int,
        projectedIncome: j['projectedIncome'] as int,
        totalCommitments: j['totalCommitments'] as int,
        projectedBalance: j['projectedBalance'] as int,
        isNegative: j['isNegative'] as bool,
        commitments: (j['commitments'] as List)
            .map((e) => CommitmentDetail.fromJson(e))
            .toList(),
      );
}

class CommitmentsImpact {
  const CommitmentsImpact({
    required this.currentBalance,
    required this.months,
  });
  final int currentBalance;
  final List<CommitmentsImpactMonth> months;

  factory CommitmentsImpact.fromJson(Map<String, dynamic> j) =>
      CommitmentsImpact(
        currentBalance: j['currentBalance'] as int,
        months: (j['months'] as List)
            .map((e) => CommitmentsImpactMonth.fromJson(e))
            .toList(),
      );
}
