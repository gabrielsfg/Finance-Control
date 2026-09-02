import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'notification_models.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(ref.read(apiClientProvider).dio),
);

class NotificationRepository {
  const NotificationRepository(this._dio);

  final Dio _dio;

  Future<List<AppNotification>> getAll() async {
    final response = await _dio.get(ApiEndpoints.notifications);
    return _listFrom(response.data);
  }

  Future<int> getUnreadCount() async {
    final response = await _dio.get(ApiEndpoints.notificationsUnreadCount);
    final data = response.data as Map<String, dynamic>;
    return (data['count'] as num?)?.toInt() ?? 0;
  }

  /// Both mark endpoints answer with the refreshed list, so the caller never
  /// has to re-fetch to know the new read state.
  Future<List<AppNotification>> markAsRead(int id) async {
    final response = await _dio.patch(ApiEndpoints.notificationRead(id));
    return _listFrom(response.data);
  }

  Future<List<AppNotification>> markAllAsRead() async {
    final response = await _dio.post(ApiEndpoints.notificationsReadAll);
    return _listFrom(response.data);
  }

  Future<NotificationPreferences> getPreferences() async {
    final response = await _dio.get(ApiEndpoints.notificationPreferences);
    return NotificationPreferences.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<NotificationPreferences> updatePreferences(
    NotificationPreferences preferences,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.notificationPreferences,
      data: preferences.toJson(),
    );
    return NotificationPreferences.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  static List<AppNotification> _listFrom(dynamic data) => (data as List)
      .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
      .toList();
}
