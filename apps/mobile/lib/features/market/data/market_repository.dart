import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'market_models.dart';

final marketRepositoryProvider = Provider<MarketRepository>(
  (ref) => MarketRepository(ref.read(apiClientProvider).dio),
);

class MarketRepository {
  const MarketRepository(this._dio);

  final Dio _dio;

  Future<List<MarketAsset>> list({
    String? type,
    String sort = 'change_desc',
    int limit = 20,
  }) async {
    final response =
        await _dio.get(ApiEndpoints.market(type: type, sort: sort, limit: limit));
    return (response.data as List)
        .map((e) => MarketAsset.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<MarketAsset>> search(String query) async {
    final response = await _dio.get(ApiEndpoints.marketSearch(query));
    return (response.data as List)
        .map((e) => MarketAsset.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<MarketAssetDetail> getAsset(String ticker) async {
    final response = await _dio.get(ApiEndpoints.marketAsset(ticker));
    return MarketAssetDetail.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<MacroIndicator>> getMacro() async {
    final response = await _dio.get(ApiEndpoints.marketMacro);
    return (response.data as List)
        .map((e) => MacroIndicator.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Loads the dashboard (macro + three rankings) concurrently.
  Future<MarketDashboard> getDashboard() async {
    final results = await Future.wait([
      getMacro(),
      list(sort: 'change_desc', limit: 8),
      list(sort: 'change_asc', limit: 8),
      list(sort: 'dy_desc', limit: 8),
    ]);
    return MarketDashboard(
      macro: results[0] as List<MacroIndicator>,
      topGainers: results[1] as List<MarketAsset>,
      topLosers: results[2] as List<MarketAsset>,
      topDividends: results[3] as List<MarketAsset>,
    );
  }
}
