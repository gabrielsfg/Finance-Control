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

  /// Requests a password reset token for [email].
  /// Returns the reset token (dev mode — production sends it via email).
  Future<String?> forgotPassword(String email) async {
    final response = await _dio.post(
      ApiEndpoints.forgotPassword,
      data: {'email': email},
    );
    return (response.data as Map<String, dynamic>)['resetToken'] as String?;
  }

  /// Resets the password using [token] obtained from [forgotPassword].
  Future<void> resetPassword(String token, String newPassword) async {
    await _dio.post(
      ApiEndpoints.resetPassword,
      data: {'token': token, 'newPassword': newPassword},
    );
  }

  /// Invalidates the refresh token on the server.
  Future<void> logout(String refreshToken) async {
    await _dio.post(
      ApiEndpoints.logout,
      data: {'refreshToken': refreshToken},
    );
  }

  /// Permanently deletes the authenticated user's account.
  /// Throws [DioException] with status 400 if [password] is wrong.
  Future<void> deleteAccount(String password) async {
    await _dio.delete(
      ApiEndpoints.deleteAccount,
      data: {'password': password},
    );
  }

  /// Deletes all financial data for the authenticated user (keeps the account).
  /// Throws [DioException] with status 400 if [password] is wrong.
  Future<void> resetData(String password) async {
    await _dio.post(
      ApiEndpoints.resetData,
      data: {'password': password},
    );
  }
}
