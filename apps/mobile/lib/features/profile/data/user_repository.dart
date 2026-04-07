import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/update_user_profile_request_dto.dart';
import 'dtos/user_profile_response_dto.dart';

final userRepositoryProvider = Provider<UserRepository>(
  (ref) => UserRepository(ref.read(apiClientProvider).dio),
);

class UserRepository {
  const UserRepository(this._dio);

  final Dio _dio;

  Future<UserProfileResponseDto> getProfile() async {
    final response = await _dio.get(ApiEndpoints.userProfile);
    return UserProfileResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<UserProfileResponseDto> updateProfile(
    UpdateUserProfileRequestDto dto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.userProfile,
      data: dto.toJson(),
    );
    return UserProfileResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }
}
