import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/io.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import '../../features/auth/providers/auth_provider.dart';
import 'api_endpoints.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.read(tokenStorageProvider);
  return ApiClient(
    storage,
    onUnauthorized: () => ref.read(authNotifierProvider.notifier).logout(),
  );
});

class ApiClient {
  ApiClient(TokenStorage storage, {required Future<void> Function() onUnauthorized}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Allow self-signed certificates on local dev only.
    if (AppConfig.allowBadCertificate) {
      (_dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
        final client = HttpClient();
        client.badCertificateCallback = (cert, host, port) => true;
        return client;
      };
    }

    _dio.interceptors.add(
      _AuthInterceptor(_dio, storage, onUnauthorized: onUnauthorized),
    );
    if (!kReleaseMode) {
      _dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));
    }
  }

  late final Dio _dio;

  Dio get dio => _dio;
}

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this._dio, this._storage, {required this.onUnauthorized});

  final Dio _dio;
  final TokenStorage _storage;
  final Future<void> Function() onUnauthorized;

  // Auth endpoints must never trigger the refresh-and-retry flow. A 401 from
  // any of these (e.g. logout with an already-expired access token, or the
  // refresh call itself) would otherwise re-enter this interceptor and loop
  // indefinitely, hammering the server.
  static const _authPaths = <String>{
    ApiEndpoints.login,
    ApiEndpoints.register,
    ApiEndpoints.refreshToken,
    ApiEndpoints.logout,
    ApiEndpoints.forgotPassword,
    ApiEndpoints.resetPassword,
  };

  // Single-flight guard: concurrent 401s share one refresh attempt instead of
  // each firing its own (which would burn the auth rate-limit budget).
  Future<bool>? _refreshFuture;

  // Ensures the session is torn down (logout) at most once per interceptor.
  bool _sessionEnded = false;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final isAuthPath = _authPaths.contains(err.requestOptions.path);
    if (err.response?.statusCode != 401 || isAuthPath) {
      handler.next(err);
      return;
    }

    // Coalesce concurrent refresh attempts into a single in-flight request.
    final refreshed = await (_refreshFuture ??=
        _refreshTokens().whenComplete(() => _refreshFuture = null));

    if (!refreshed) {
      await _endSession();
      handler.next(err);
      return;
    }

    // Retry the original request once with the refreshed access token.
    try {
      final token = await _storage.getAccessToken();
      final retryOptions = err.requestOptions
        ..headers['Authorization'] = 'Bearer $token';
      final retryResponse = await _dio.fetch(retryOptions);
      handler.resolve(retryResponse);
    } on DioException catch (e) {
      handler.next(e);
    }
  }

  /// Exchanges the stored refresh token for a new token pair.
  /// Returns true on success. Never throws — any failure resolves to false.
  Future<bool> _refreshTokens() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _dio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      final data = response.data as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String?;
      final newRefreshToken = data['refreshToken'] as String?;
      if (accessToken == null || newRefreshToken == null) return false;

      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: newRefreshToken,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Tears down the session locally exactly once (clears tokens + auth state).
  Future<void> _endSession() async {
    if (_sessionEnded) return;
    _sessionEnded = true;
    await onUnauthorized();
  }
}
