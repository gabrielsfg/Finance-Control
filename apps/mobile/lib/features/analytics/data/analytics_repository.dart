import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'models/analytics_models.dart';

class AnalyticsRepository {
  const AnalyticsRepository(this._dio);
  final Dio _dio;

  Map<String, dynamic> _dateParams(DateTime start, DateTime end,
      {int? accountId, int? categoryId}) {
    return {
      'startDate': _fmt(start),
      'finishDate': _fmt(end),
      'accountId': accountId,
      'categoryId': categoryId,
    }..removeWhere((_, v) => v == null);
  }

  String _fmt(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<List<IncomeExpenseItem>> getIncomeExpense(
      DateTime start, DateTime end, {int? accountId}) async {
    final res = await _dio.get(ApiEndpoints.analyticsIncomeExpense,
        queryParameters: _dateParams(start, end, accountId: accountId));
    return (res.data as List).map((e) => IncomeExpenseItem.fromJson(e)).toList();
  }

  Future<List<BalanceEvolutionItem>> getBalanceEvolution(
      DateTime start, DateTime end, {int? accountId}) async {
    final res = await _dio.get(ApiEndpoints.analyticsBalanceEvolution,
        queryParameters: _dateParams(start, end, accountId: accountId));
    return (res.data as List)
        .map((e) => BalanceEvolutionItem.fromJson(e))
        .toList();
  }

  Future<List<ExpensesByCategory>> getExpensesByCategory(
      DateTime start, DateTime end, {int? accountId}) async {
    final res = await _dio.get(ApiEndpoints.analyticsExpensesByCategory,
        queryParameters: _dateParams(start, end, accountId: accountId));
    return (res.data as List)
        .map((e) => ExpensesByCategory.fromJson(e))
        .toList();
  }

  Future<List<CategoryEvolutionItem>> getCategoryEvolution(
      DateTime start, DateTime end, int categoryId, {int? accountId}) async {
    final res = await _dio.get(ApiEndpoints.analyticsCategoryEvolution,
        queryParameters: {
          ..._dateParams(start, end, accountId: accountId),
          'categoryId': categoryId,
        });
    return (res.data as List)
        .map((e) => CategoryEvolutionItem.fromJson(e))
        .toList();
  }

  Future<List<NetWorthEvolutionItem>> getNetWorthEvolution(
      DateTime start, DateTime end) async {
    final res = await _dio.get(ApiEndpoints.analyticsNetWorthEvolution,
        queryParameters: _dateParams(start, end));
    return (res.data as List)
        .map((e) => NetWorthEvolutionItem.fromJson(e))
        .toList();
  }

  Future<List<FutureCommitmentsItem>> getFutureCommitments(
      {int months = 6}) async {
    final res = await _dio.get(ApiEndpoints.analyticsFutureCommitments,
        queryParameters: {'months': months});
    return (res.data as List)
        .map((e) => FutureCommitmentsItem.fromJson(e))
        .toList();
  }

  Future<List<SpendingHeatmapItem>> getSpendingHeatmap(
      DateTime start, DateTime end, {int? accountId}) async {
    final res = await _dio.get(ApiEndpoints.analyticsSpendingHeatmap,
        queryParameters: _dateParams(start, end, accountId: accountId));
    return (res.data as List)
        .map((e) => SpendingHeatmapItem.fromJson(e))
        .toList();
  }

  Future<BudgetPace?> getBudgetPace(int budgetId) async {
    final res = await _dio.get(ApiEndpoints.analyticsBudgetPace,
        queryParameters: {'budgetId': budgetId});
    if (res.statusCode == 404) return null;
    return BudgetPace.fromJson(res.data);
  }

  Future<BalanceProjection> getBalanceProjection(
      {int? accountId, int lookbackDays = 30}) async {
    final res = await _dio.get(ApiEndpoints.analyticsProjectionBalance,
        queryParameters: <String, dynamic>{
          'accountId': accountId,
          'lookbackDays': lookbackDays,
        }..removeWhere((_, v) => v == null));
    return BalanceProjection.fromJson(res.data);
  }

  Future<List<CategoryProjection>> getCategoryProjection(
      {int? accountId, int lookbackMonths = 3}) async {
    final res = await _dio.get(ApiEndpoints.analyticsProjectionCategories,
        queryParameters: <String, dynamic>{
          'accountId': accountId,
          'lookbackMonths': lookbackMonths,
        }..removeWhere((_, v) => v == null));
    return (res.data as List)
        .map((e) => CategoryProjection.fromJson(e))
        .toList();
  }

  Future<NetWorthProjection> getNetWorthProjection(
      {int projectionMonths = 12, int? targetAmount}) async {
    final res = await _dio.get(ApiEndpoints.analyticsProjectionNetWorth,
        queryParameters: <String, dynamic>{
          'projectionMonths': projectionMonths,
          'targetAmount': targetAmount,
        }..removeWhere((_, v) => v == null));
    return NetWorthProjection.fromJson(res.data);
  }

  Future<CommitmentsImpact> getCommitmentsImpact({int months = 6}) async {
    final res = await _dio.get(
        ApiEndpoints.analyticsProjectionCommitmentsImpact,
        queryParameters: {'months': months});
    return CommitmentsImpact.fromJson(res.data);
  }
}

final analyticsRepositoryProvider = Provider<AnalyticsRepository>(
  (ref) => AnalyticsRepository(ref.read(apiClientProvider).dio),
);
