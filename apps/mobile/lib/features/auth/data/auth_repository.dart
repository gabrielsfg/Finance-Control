import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/auth_response_dto.dart';
import 'dtos/login_request_dto.dart';
import 'dtos/register_request_dto.dart';
import 'models/login_outcome.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider).dio),
);

class AuthRepository {
  const AuthRepository(this._dio);

  final Dio _dio;

  /// Autentica o usuário.
  ///
  /// Responds with tokens or with a challenge — an unverified address or a
  /// two-factor step — both as 200. Lança [DioException] em caso de falha
  /// (ex: 400 credenciais inválidas, 423 conta bloqueada).
  Future<LoginOutcome> login(LoginRequestDto dto) async {
    final response = await _dio.post(
      ApiEndpoints.login,
      data: dto.toJson(),
    );

    final data = response.data as Map<String, dynamic>;

    if (data['challenge'] case final String challenge) {
      return LoginChallenged(
        challenge: LoginChallenge.fromApi(challenge),
        challengeToken: data['challengeToken'] as String?,
      );
    }

    return LoginAuthenticated(AuthResponseDto.fromJson(data));
  }

  /// Cria a conta e dispara o código de verificação.
  ///
  /// Não retorna tokens: a conta só fica utilizável depois de [verifyEmail].
  /// Lança [DioException] em caso de falha (ex: 400 e-mail já cadastrado).
  Future<void> register(RegisterRequestDto dto) async {
    await _dio.post(
      ApiEndpoints.register,
      data: dto.toJson(),
    );
  }

  /// Confirma o e-mail com o código de 6 dígitos e já autentica o usuário.
  /// Lança [DioException] com status 400 se o código for inválido ou expirado.
  Future<AuthResponseDto> verifyEmail({
    required String email,
    required String code,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.verifyEmail,
      data: {'email': email, 'code': code},
    );
    return AuthResponseDto.fromJson(response.data as Map<String, dynamic>);
  }

  /// Reenvia o código de verificação. Responde 204 mesmo para e-mail
  /// inexistente ou já verificado — não dá para inferir nada da resposta.
  Future<void> resendVerificationCode(String email) async {
    await _dio.post(
      ApiEndpoints.resendVerificationCode,
      data: {'email': email},
    );
  }

  /// Conclui o login de dois fatores.
  ///
  /// Com [trustDevice], a resposta traz um `trustedDeviceToken` para guardar no
  /// keystore — é ele que dispensa o código nos próximos logins deste aparelho.
  Future<AuthResponseDto> verifyTwoFactor({
    required String challengeToken,
    required String code,
    required bool trustDevice,
    String? deviceName,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.twoFactorLogin,
      data: {
        'challengeToken': challengeToken,
        'code': code,
        'trustDevice': trustDevice,
        if (deviceName != null) 'deviceName': deviceName,
      },
    );
    return AuthResponseDto.fromJson(response.data as Map<String, dynamic>);
  }

  /// Liga ou desliga a verificação em duas etapas. Exige a senha atual.
  /// Lança [DioException] com status 400 se a senha estiver errada.
  Future<void> updateTwoFactor({
    required bool enabled,
    required String password,
  }) async {
    await _dio.patch(
      ApiEndpoints.twoFactor,
      data: {'enabled': enabled, 'password': password},
    );
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

  /// Envia o código de redefinição de senha para [email].
  /// Responde 200 mesmo para e-mail não cadastrado.
  Future<void> forgotPassword(String email) async {
    await _dio.post(
      ApiEndpoints.forgotPassword,
      data: {'email': email},
    );
  }

  /// Redefine a senha com o código recebido por e-mail.
  ///
  /// Derruba todas as sessões e dispositivos confiáveis do usuário — inclusive
  /// o deste aparelho, que precisará de um novo código no próximo login.
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    await _dio.post(
      ApiEndpoints.resetPassword,
      data: {'email': email, 'code': code, 'newPassword': newPassword},
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
