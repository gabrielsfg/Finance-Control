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

  // Guard against recursive refresh attempts.
  bool _isRefreshing = false;

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
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }

    // 401 on the refresh endpoint itself — tokens are invalid, log out.
    if (err.requestOptions.path == ApiEndpoints.refreshToken) {
      await onUnauthorized();
      handler.next(err);
      return;
    }

    // 401 while another refresh is already in progress — log out to avoid
    // looping (the first refresh attempt already failed or will fail).
    if (_isRefreshing) {
      await onUnauthorized();
      handler.next(err);
      return;
    }

    _isRefreshing = true;
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        await onUnauthorized();
        handler.next(err);
        return;
      }

      final refreshResponse = await _dio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      final newAccessToken = refreshResponse.data['accessToken'] as String;
      final newRefreshToken = refreshResponse.data['refreshToken'] as String;

      await _storage.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );

      // Retry the original request with the new access token.
      final retryOptions = err.requestOptions;
      retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';
      final retryResponse = await _dio.fetch(retryOptions);
      handler.resolve(retryResponse);
    } on DioException {
      await onUnauthorized();
      handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }
}
