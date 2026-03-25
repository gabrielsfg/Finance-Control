import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/category_response_dto.dart';
import 'dtos/create_category_request_dto.dart';
import 'dtos/update_category_request_dto.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>(
  (ref) => CategoryRepository(ref.read(apiClientProvider).dio),
);

class CategoryRepository {
  const CategoryRepository(this._dio);

  final Dio _dio;

  Future<List<CategoryItemResponseDto>> getCategories() async {
    final response = await _dio.get(ApiEndpoints.userCategories);
    return (response.data as List)
        .map((e) => CategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<CategoryItemResponseDto>> createCategory(
    CreateCategoryRequestDto requestDto,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.userCategories,
      data: requestDto.toJson(),
    );
    return (response.data as List)
        .map((e) => CategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<CategoryItemResponseDto>> updateCategories(
    UpdateCategoriesRequestDto requestDto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.userCategoryUpdate,
      data: requestDto.toJson(),
    );
    return (response.data as List)
        .map((e) => CategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<CategoryItemResponseDto>> deleteCategory(int id) async {
    final response = await _dio.delete(ApiEndpoints.userCategoryById(id));
    return (response.data as List)
        .map((e) => CategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
