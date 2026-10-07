import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'ai_models.dart';

final insightRepositoryProvider = Provider<InsightRepository>(
  (ref) => InsightRepository(ref.read(apiClientProvider).dio),
);

/// Weekly analyses and the "IA no Quantia" settings — InsightController.
class InsightRepository {
  const InsightRepository(this._dio);

  final Dio _dio;

  // Generating an analysis calls the model on a cache miss, which can outlast
  // the client-wide 30 s receive timeout.
  static final _slowCall = Options(receiveTimeout: const Duration(seconds: 90));

  Future<AiInsightResult> getSpending() => _getInsight(ApiEndpoints.insightSpending);

  Future<AiInsightResult> getPortfolio() =>
      _getInsight(ApiEndpoints.insightPortfolio);

  Future<AiInsightResult> _getInsight(String path) async {
    final response = await _dio.get(path, options: _slowCall);
    return AiInsightResult.fromJson(response.data as Map<String, dynamic>);
  }

  /// Deletes every stored analysis. Returns how many were removed.
  Future<int> deleteInsights() async {
    final response = await _dio.delete(ApiEndpoints.insights);
    return ((response.data as Map<String, dynamic>)['deleted'] as num?)
            ?.toInt() ??
        0;
  }

  Future<AiSettings> getSettings() async {
    final response = await _dio.get(ApiEndpoints.insightSettings);
    return AiSettings.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AiSettings> updateSettings({required bool aiEnabled}) async {
    final response = await _dio.put(
      ApiEndpoints.insightSettings,
      data: {'aiEnabled': aiEnabled},
    );
    return AiSettings.fromJson(response.data as Map<String, dynamic>);
  }
}
