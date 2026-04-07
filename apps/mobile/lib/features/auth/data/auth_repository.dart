import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/auth_response_dto.dart';
import 'dtos/login_request_dto.dart';
import 'dtos/register_request_dto.dart';
import 'dtos/register_response_dto.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider).dio),
);

class AuthRepository {
  const AuthRepository(this._dio);

  final Dio _dio;

  /// Autentica o usuário e retorna access + refresh tokens.
  /// Lança [DioException] em caso de falha (ex: 400 credenciais inválidas).
  Future<AuthResponseDto> login(LoginRequestDto dto) async {
    final response = await _dio.post(
      ApiEndpoints.login,
      data: dto.toJson(),
    );
    return AuthResponseDto.fromJson(response.data as Map<String, dynamic>);
  }

  /// Cria uma nova conta e retorna o usuário criado.
  /// Lança [DioException] em caso de falha (ex: 400 e-mail já cadastrado).
  Future<RegisterResponseDto> register(RegisterRequestDto dto) async {
    final response = await _dio.post(
      ApiEndpoints.register,
      data: dto.toJson(),
    );
    return RegisterResponseDto.fromJson(response.data as Map<String, dynamic>);
  }

  /// Troca um refresh token por um novo par access + refresh tokens.
  /// Lança [DioException] em caso de falha (ex: 401 token inválido/expirado).
  Future<AuthResponseDto> refresh(String refreshToken) async {
    final response = await _dio.post(
      ApiEndpoints.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return AuthResponseDto.fromJson(response.data as Map<String, dynamic>);
  }
}
