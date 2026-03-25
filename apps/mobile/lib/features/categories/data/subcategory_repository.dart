import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/category_response_dto.dart';
import 'dtos/subcategory_request_dto.dart';

final subcategoryRepositoryProvider = Provider<SubcategoryRepository>(
  (ref) => SubcategoryRepository(ref.read(apiClientProvider).dio),
);

class SubcategoryRepository {
  const SubcategoryRepository(this._dio);

  final Dio _dio;

  Future<List<SubcategoryItemResponseDto>> getAll() async {
    final response = await _dio.get(ApiEndpoints.subcategories);
    return (response.data as List)
        .map((e) => SubcategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<SubcategoryItemResponseDto>> create(
    CreateSubcategoryRequestDto requestDto,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.subcategories,
      data: requestDto.toJson(),
    );
    return (response.data as List)
        .map((e) => SubcategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<SubcategoryItemResponseDto>> update(
    UpdateSubcategoryRequestDto requestDto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.subcategoryById(requestDto.id),
      data: requestDto.toJson(),
    );
    return (response.data as List)
        .map((e) => SubcategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<SubcategoryItemResponseDto>> delete(int id) async {
    final response = await _dio.delete(ApiEndpoints.deleteSubcategory(id));
    return (response.data as List)
        .map((e) => SubcategoryItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
