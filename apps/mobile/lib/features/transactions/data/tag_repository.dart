import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

class TagItem {
  const TagItem({required this.id, required this.name});

  final int id;
  final String name;

  factory TagItem.fromJson(Map<String, dynamic> json) => TagItem(
        id: json['id'] as int,
        name: json['name'] as String,
      );
}

class TagRepository {
  const TagRepository(this._dio);
  final Dio _dio;

  Future<List<TagItem>> getAllTags() async {
    final response = await _dio.get(ApiEndpoints.tags);
    return (response.data as List)
        .map((e) => TagItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final tagRepositoryProvider = Provider<TagRepository>(
  (ref) => TagRepository(ref.read(apiClientProvider).dio),
);
