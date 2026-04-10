import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

class AreaItem {
  const AreaItem({required this.id, required this.name});

  final int id;
  final String name;

  factory AreaItem.fromJson(Map<String, dynamic> json) => AreaItem(
        id: json['id'] as int,
        name: json['name'] as String,
      );
}

class AreaRepository {
  const AreaRepository(this._dio);
  final Dio _dio;

  Future<List<AreaItem>> getAllAreas() async {
    final response = await _dio.get(ApiEndpoints.allAreas);
    return (response.data as List)
        .map((e) => AreaItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final areaRepositoryProvider = Provider<AreaRepository>(
  (ref) => AreaRepository(ref.read(apiClientProvider).dio),
);
