import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/features/auth/data/auth_repository.dart';
import 'package:finance_control_front/features/auth/data/dtos/auth_response_dto.dart';
import 'package:finance_control_front/features/auth/data/dtos/login_request_dto.dart';
import 'package:finance_control_front/features/auth/presentation/login_page.dart';
import 'package:finance_control_front/features/auth/providers/auth_provider.dart';

// ── Fakes ──────────────────────────────────────────────────────────────────

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.response, this.error, this.loginCompleter});

  final AuthResponseDto? response;
  final DioException? error;

  /// When set, login() waits for this completer — useful for testing loading state.
  final Completer<AuthResponseDto>? loginCompleter;

  @override
  Future<AuthResponseDto> login(LoginRequestDto dto) async {
    if (loginCompleter != null) return loginCompleter!.future;
    if (error != null) throw error!;
    return response!;
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
  }) async {
    loginSuccessCalled = true;
    state = AsyncData(
      AuthState(isAuthenticated: true, accessToken: accessToken),
    );
  }
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
}) {
  final fakeNotifier = notifier ?? _FakeAuthNotifier();
  return ProviderScope(
    overrides: [
      authRepositoryProvider.overrideWithValue(repo),
      authNotifierProvider.overrideWith(() => fakeNotifier),
    ],
    child: const MaterialApp(home: LoginPage()),
  );
}

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
      final completer = Completer<AuthResponseDto>();
      final repo = _FakeAuthRepository(loginCompleter: completer);

      await tester.pumpWidget(_buildSubject(repo: repo));
      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'Password1!');
      await tester.tap(find.text('Entrar'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete(
        const AuthResponseDto(accessToken: 'at', refreshToken: 'rt'),
      );
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
      const dto = AuthResponseDto(accessToken: 'access', refreshToken: 'refresh');
      final notifier = _FakeAuthNotifier();

      await tester.pumpWidget(
        _buildSubject(
          repo: _FakeAuthRepository(response: dto),
          notifier: notifier,
        ),
      );

      await tester.enterText(find.byType(TextField).first, 'user@test.com');
      await tester.enterText(find.byType(TextField).last, 'ValidPass1!');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();

      expect(notifier.loginSuccessCalled, isTrue);
    });
  });
}
