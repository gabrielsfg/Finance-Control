import 'package:json_annotation/json_annotation.dart';

part 'main_page_summary_response_dto.g.dart';

@JsonSerializable()
class MainPageSummaryResponseDto {
  const MainPageSummaryResponseDto({
    required this.balanceSummary,
    required this.recentTransactions,
    required this.budgetSummary,
    required this.topCategories,
  });

  final BalanceSummaryDto balanceSummary;
  final List<RecentTransactionDto> recentTransactions;
  final BudgetSummaryDto budgetSummary;
  final List<TopCategoryDto> topCategories;

  factory MainPageSummaryResponseDto.fromJson(Map<String, dynamic> json) =>
      _$MainPageSummaryResponseDtoFromJson(json);
}

@JsonSerializable()
class BalanceSummaryDto {
  const BalanceSummaryDto({
    required this.totalIncome,
    required this.totalExpenses,
    required this.balance,
  });

  final int totalIncome;
  final int totalExpenses;
  final int balance;

  factory BalanceSummaryDto.fromJson(Map<String, dynamic> json) =>
      _$BalanceSummaryDtoFromJson(json);
}

@JsonSerializable()
class RecentTransactionDto {
  const RecentTransactionDto({
    required this.id,
    required this.description,
    required this.value,
    required this.type,
    required this.subCategoryName,
    required this.categoryName,
  });

  final int id;
  final String description;
  final int value;
  final String type;
  final String subCategoryName;
  final String categoryName;

  factory RecentTransactionDto.fromJson(Map<String, dynamic> json) =>
      _$RecentTransactionDtoFromJson(json);
}

@JsonSerializable()
class BudgetSummaryDto {
  const BudgetSummaryDto({
    required this.totalExpected,
    required this.totalSpent,
    required this.spentPercentage,
  });

  final int totalExpected;
  final int totalSpent;
  final double spentPercentage;

  factory BudgetSummaryDto.fromJson(Map<String, dynamic> json) =>
      _$BudgetSummaryDtoFromJson(json);
}

@JsonSerializable()
class TopCategoryDto {
  const TopCategoryDto({
    required this.categoryName,
    required this.totalSpent,
  });

  final String categoryName;
  final int totalSpent;

  factory TopCategoryDto.fromJson(Map<String, dynamic> json) =>
      _$TopCategoryDtoFromJson(json);
}
