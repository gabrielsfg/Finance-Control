import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/bank_response_dto.dart';
import 'dtos/update_user_preferences_request_dto.dart';
import 'dtos/user_preferences_response_dto.dart';

final userPreferencesRepositoryProvider = Provider<UserPreferencesRepository>(
  (ref) => UserPreferencesRepository(ref.read(apiClientProvider).dio),
);

class UserPreferencesRepository {
  const UserPreferencesRepository(this._dio);

  final Dio _dio;

  Future<UserPreferencesResponseDto> getPreferences() async {
    final response = await _dio.get(ApiEndpoints.userPreferences);
    return UserPreferencesResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<UserPreferencesResponseDto> updatePreferences(
    UpdateUserPreferencesRequestDto dto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.userPreferences,
      data: dto.toJson(),
    );
    return UserPreferencesResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<List<BankResponseDto>> getBanks(String country) async {
    final response = await _dio.get(ApiEndpoints.banks(country));
    return (response.data as List)
        .map((e) => BankResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
