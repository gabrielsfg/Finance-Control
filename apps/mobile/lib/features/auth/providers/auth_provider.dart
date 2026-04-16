import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';

// ---------------------------------------------------------------------------
// Auth State
// ---------------------------------------------------------------------------

class AuthState {
  const AuthState({required this.isAuthenticated, this.accessToken});

  const AuthState.unauthenticated()
      : isAuthenticated = false,
        accessToken = null;

  final bool isAuthenticated;
  final String? accessToken;
}

// ---------------------------------------------------------------------------
// Auth Notifier
// ---------------------------------------------------------------------------

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final storage = ref.read(tokenStorageProvider);
    final token = await storage.getAccessToken();

    return token != null
        ? AuthState(isAuthenticated: true, accessToken: token)
        : const AuthState.unauthenticated();
  }

  Future<void> onLoginSuccess({
    required String accessToken,
    required String refreshToken,
  }) async {
    await ref.read(tokenStorageProvider).saveTokens(
          accessToken: accessToken,
          refreshToken: refreshToken,
        );
    state = AsyncData(AuthState(isAuthenticated: true, accessToken: accessToken));
  }

  Future<void> logout() async {
    final storage = ref.read(tokenStorageProvider);
    final refreshToken = await storage.getRefreshToken();
    if (refreshToken != null) {
      try {
        await ref.read(authRepositoryProvider).logout(refreshToken);
      } catch (_) {
        // Server-side invalidation is best-effort; proceed with local logout.
      }
    }
    await storage.clearTokens();
    state = const AsyncData(AuthState.unauthenticated());
  }
}

final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
