import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'recurrence_models.dart';

final recurrenceRepositoryProvider = Provider<RecurrenceRepository>(
  (ref) => RecurrenceRepository(ref.read(apiClientProvider).dio),
);

class RecurrenceRepository {
  const RecurrenceRepository(this._dio);

  final Dio _dio;

  Future<RecurrencePageData> getPage() async {
    final response = await _dio.get(ApiEndpoints.recurrences);
    return RecurrencePageData.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> updateRecurring(int id, UpdateRecurringRequest request) async {
    await _dio.patch(ApiEndpoints.recurringById(id), data: request.toJson());
  }

  Future<void> cancelRecurring(int id) async {
    await _dio.patch(ApiEndpoints.recurringCancel(id));
  }

  Future<void> reactivateRecurring(int id) async {
    await _dio.patch(ApiEndpoints.recurringReactivate(id));
  }

  Future<void> deleteRecurring(int id) async {
    await _dio.delete(ApiEndpoints.recurringById(id));
  }
}
