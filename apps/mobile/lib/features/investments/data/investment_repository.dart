import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'investment_models.dart';

final investmentRepositoryProvider = Provider<InvestmentRepository>(
  (ref) => InvestmentRepository(ref.read(apiClientProvider).dio),
);

class InvestmentRepository {
  const InvestmentRepository(this._dio);

  final Dio _dio;

  Future<InvestmentPortfolio> getPortfolio() async {
    final response = await _dio.get(ApiEndpoints.investments);
    return InvestmentPortfolio.fromJson(response.data as Map<String, dynamic>);
  }

  /// Registers a buy/sell operation and returns the recomputed portfolio.
  Future<InvestmentPortfolio> registerTransaction(
    CreateInvestmentTransactionRequest request,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.investmentTransactions,
      data: request.toJson(),
    );
    return InvestmentPortfolio.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<InvestmentPricePoint>> getPriceHistory(int id) async {
    final response = await _dio.get(ApiEndpoints.investmentPriceHistory(id));
    return (response.data as List)
        .map((e) => InvestmentPricePoint.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
