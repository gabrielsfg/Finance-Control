import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/category_response_dto.dart';

final categoriesRepositoryProvider = Provider<CategoriesRepository>(
  (ref) => CategoriesRepository(ref.read(apiClientProvider).dio),
);

class CategoriesRepository {
  const CategoriesRepository(this._dio);

  final Dio _dio;

  Future<List<CategoryResponseDto>> getCategories() async {
    final response = await _dio.get(ApiEndpoints.userCategories);
    return (response.data as List)
        .map((e) => CategoryResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
