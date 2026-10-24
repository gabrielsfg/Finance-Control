import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'models/subscription_state.dart';

final Provider<SubscriptionRepository> subscriptionRepositoryProvider = Provider<SubscriptionRepository>(
  (ref) => SubscriptionRepository(ref.read(apiClientProvider).dio),
);

class SubscriptionRepository {
  const SubscriptionRepository(this._dio);

  final Dio _dio;

  Future<SubscriptionState> get() async {
    final response = await _dio.get(ApiEndpoints.subscription);
    return SubscriptionState.fromJson(response.data as Map<String, dynamic>);
  }
}
