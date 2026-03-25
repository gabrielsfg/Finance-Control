import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/main_page_summary_response_dto.dart';
import 'models/home_summary.dart';

final homeRepositoryProvider = Provider<HomeRepository>(
  (ref) => HomeRepository(ref.read(apiClientProvider).dio),
);

class HomeRepository {
  const HomeRepository(this._dio);

  final Dio _dio;

  static String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<HomeSummary> getSummary({
    required DateTime startDate,
    required DateTime finishDate,
    int? budgetId,
  }) async {
    final params = <String, dynamic>{
      'startDate': _formatDate(startDate),
      'finishDate': _formatDate(finishDate),
      if (budgetId != null) 'budgetId': budgetId,
    };

    final response = await _dio.get(
      ApiEndpoints.mainPageSummary,
      queryParameters: params,
    );

    final dto = MainPageSummaryResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );

    return _mapToModel(dto);
  }

  HomeSummary _mapToModel(MainPageSummaryResponseDto dto) {
    return HomeSummary(
      totalIncome: dto.balanceSummary.totalIncome,
      totalExpenses: dto.balanceSummary.totalExpenses,
      balance: dto.balanceSummary.balance,
      recentTransactions: dto.recentTransactions.map((t) {
        final isExpense = t.type == 'Expense';
        return RecentTransactionSummary(
          id: t.id,
          description: t.description,
          // API returns absolute value; negate for expenses so UI can use sign.
          valueCents: isExpense ? -t.value.abs() : t.value.abs(),
          isExpense: isExpense,
          subCategoryName: t.subCategoryName,
          categoryName: t.categoryName,
        );
      }).toList(),
      budgetTotalExpected: dto.budgetSummary.totalExpected,
      budgetTotalSpent: dto.budgetSummary.totalSpent,
      budgetSpentPercentage: dto.budgetSummary.spentPercentage,
      topCategories: dto.topCategories
          .map((c) => TopCategorySummary(
                categoryName: c.categoryName,
                totalSpentCents: c.totalSpent,
              ))
          .toList(),
    );
  }
}
