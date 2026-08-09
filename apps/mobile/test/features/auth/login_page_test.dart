import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:finance_control_front/core/storage/token_storage.dart';
import 'package:finance_control_front/features/auth/data/auth_repository.dart';
import 'package:finance_control_front/features/auth/data/dtos/auth_response_dto.dart';
import 'package:finance_control_front/features/auth/data/dtos/login_request_dto.dart';
import 'package:finance_control_front/features/auth/data/models/login_outcome.dart';
import 'package:finance_control_front/features/auth/presentation/login_page.dart';
import 'package:finance_control_front/features/auth/providers/auth_provider.dart';

// ── Fakes ──────────────────────────────────────────────────────────────────

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.outcome, this.error, this.loginCompleter});

  final LoginOutcome? outcome;
  final DioException? error;

  /// When set, login() waits for this completer — useful for testing loading state.
  final Completer<LoginOutcome>? loginCompleter;

  @override
  Future<LoginOutcome> login(LoginRequestDto dto) async {
    if (loginCompleter != null) return loginCompleter!.future;
    if (error != null) throw error!;
    return outcome!;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeAuthNotifier extends AuthNotifier {
  bool loginSuccessCalled = false;

  @override
  Future<AuthState> build() async => const AuthState.unauthenticated();

  @override
  Future<void> onLoginSuccess({
    required String accessToken,
    required String refreshToken,
    String? trustedDeviceToken,
  }) async {
    loginSuccessCalled = true;
    state = AsyncData(
      AuthState(isAuthenticated: true, accessToken: accessToken),
    );
  }
}

/// The real one talks to the OS keystore, which has no platform channel here.
class _FakeTokenStorage implements TokenStorage {
  _FakeTokenStorage({this.trustedDeviceToken});

  final String? trustedDeviceToken;

  @override
  Future<String?> getTrustedDeviceToken() async => trustedDeviceToken;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

// ── Helpers ────────────────────────────────────────────────────────────────

DioException _dioError(int statusCode, [Map<String, dynamic>? data]) {
  return DioException(
    requestOptions: RequestOptions(path: '/login'),
    response: Response(
      requestOptions: RequestOptions(path: '/login'),
      statusCode: statusCode,
      data: data,
    ),
    type: DioExceptionType.badResponse,
  );
}

Widget _buildSubject({
  required AuthRepository repo,
  AuthNotifier? notifier,
  TokenStorage? storage,
}) {
  final fakeNotifier = notifier ?? _FakeAuthNotifier();

  // A real router, because the challenge branches navigate: with a plain
  // MaterialApp the push would throw and surface as a generic error banner,
  // making a broken flow look like a handled one.
  final router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const LoginPage()),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) => Text('verify:${state.extra}'),
      ),
      GoRoute(
        path: '/two-factor',
        builder: (_, state) => Text('two-factor:${state.extra}'),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      authRepositoryProvider.overrideWithValue(repo),
      authNotifierProvider.overrideWith(() => fakeNotifier),
      tokenStorageProvider.overrideWithValue(storage ?? _FakeTokenStorage()),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

const _tokens = AuthResponseDto(accessToken: 'access', refreshToken: 'refresh');

// ── Tests ──────────────────────────────────────────────────────────────────

void main() {
  group('LoginPage', () {
    testWidgets('renders email field, password field and submit button', (tester) async {
      await tester.pumpWidget(_buildSubject(repo: _FakeAuthRepository()));

      expect(find.byType(TextField), findsAtLeastNWidgets(2));
      expect(find.text('Entrar'), findsOneWidget);
    });

    testWidgets('shows email error when field is empty on submit', (tester) async {
      await tester.pumpWidget(_buildSubject(repo: _FakeAuthRepository()));
      await tester.tap(find.text('Entrar'));
      await tester.pump();

      expect(find.text('Informe seu e-mail'), findsOneWidget);
    });

    testWidgets('shows email format error for invalid email', (tester) async {
      await tester.pumpWidget(_buildSubject(repo: _FakeAuthRepository()));

      await tester.enterText(find.byType(TextField).first, 'not-an-email');
      await tester.tap(find.text('Entrar'));
      await tester.pump();

      expect(find.text('E-mail inválido'), findsOneWidget);
    });

    testWidgets('shows password error when field is empty on submit', (tester) async {
      await tester.pumpWidget(_buildSubject(repo: _FakeAuthRepository()));

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.tap(find.text('Entrar'));
      await tester.pump();

      expect(find.text('Informe sua senha'), findsOneWidget);
    });

    testWidgets('shows loading indicator while request is in flight', (tester) async {
      final completer = Completer<LoginOutcome>();
      final repo = _FakeAuthRepository(loginCompleter: completer);

      await tester.pumpWidget(_buildSubject(repo: repo));
      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'Password1!');
      await tester.tap(find.text('Entrar'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete(const LoginAuthenticated(_tokens));
      await tester.pumpAndSettle();
    });

    testWidgets('shows error banner for wrong credentials (401)', (tester) async {
      await tester.pumpWidget(
        _buildSubject(repo: _FakeAuthRepository(error: _dioError(401))),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'WrongPass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(find.text('E-mail ou senha incorretos.'), findsOneWidget);
    });

    testWidgets('shows lockout message with minutes for 423 with retryAfterSeconds', (tester) async {
      await tester.pumpWidget(
        _buildSubject(
          repo: _FakeAuthRepository(
            error: _dioError(423, {'retryAfterSeconds': 300}),
          ),
        ),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'SomePass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Conta bloqueada'), findsOneWidget);
      expect(find.textContaining('5 min'), findsOneWidget);
    });

    testWidgets('shows generic lockout message for 423 without retryAfterSeconds', (tester) async {
      await tester.pumpWidget(
        _buildSubject(repo: _FakeAuthRepository(error: _dioError(423))),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'SomePass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(
        find.text('Conta bloqueada temporariamente. Tente mais tarde.'),
        findsOneWidget,
      );
    });

    testWidgets('shows rate limit message for 429', (tester) async {
      await tester.pumpWidget(
        _buildSubject(repo: _FakeAuthRepository(error: _dioError(429))),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'SomePass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(find.text('Muitas tentativas. Aguarde alguns minutos.'), findsOneWidget);
    });

    testWidgets('calls onLoginSuccess on successful login', (tester) async {
      final notifier = _FakeAuthNotifier();

      await tester.pumpWidget(
        _buildSubject(
          repo: _FakeAuthRepository(outcome: const LoginAuthenticated(_tokens)),
          notifier: notifier,
        ),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'ValidPass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(notifier.loginSuccessCalled, isTrue);
    });

    testWidgets('routes to verification when the email was never confirmed', (tester) async {
      final notifier = _FakeAuthNotifier();

      await tester.pumpWidget(
        _buildSubject(
          repo: _FakeAuthRepository(
            outcome: const LoginChallenged(
              challenge: LoginChallenge.emailNotVerified,
            ),
          ),
          notifier: notifier,
        ),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'ValidPass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      // The email travels along so the next screen does not have to ask again.
      expect(find.text('verify:user@test.com'), findsOneWidget);
      expect(notifier.loginSuccessCalled, isFalse);
    });

    testWidgets('routes to two-factor with the challenge token', (tester) async {
      final notifier = _FakeAuthNotifier();

      await tester.pumpWidget(
        _buildSubject(
          repo: _FakeAuthRepository(
            outcome: const LoginChallenged(
              challenge: LoginChallenge.twoFactorRequired,
              challengeToken: 'challenge-abc',
            ),
          ),
          notifier: notifier,
        ),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'ValidPass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(find.text('two-factor:challenge-abc'), findsOneWidget);
      expect(notifier.loginSuccessCalled, isFalse);
    });
  });
}
