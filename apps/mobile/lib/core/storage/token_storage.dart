import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => const TokenStorage());

class TokenStorage {
  const TokenStorage();

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _trustedDeviceTokenKey = 'trusted_device_token';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }

  // ── Trusted device ────────────────────────────────────────────────────────
  // Deliberately outside saveTokens/clearTokens: this token says "this phone is
  // known", not "someone is signed in". Logging out must not discard it, or
  // every logout would cost the user another two-factor code on the way back.

  Future<String?> getTrustedDeviceToken() =>
      _storage.read(key: _trustedDeviceTokenKey);

  Future<void> saveTrustedDeviceToken(String token) =>
      _storage.write(key: _trustedDeviceTokenKey, value: token);

  Future<void> clearTrustedDeviceToken() =>
      _storage.delete(key: _trustedDeviceTokenKey);
}
