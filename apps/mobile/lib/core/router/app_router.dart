import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/accounts/presentation/accounts_page.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/budgets/presentation/budgets_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/transactions/presentation/transactions_page.dart';
import '../../shared/widgets/app_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterListenable(ref);

  final router = GoRouter(
    initialLocation: '/login',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);

      // Não redireciona enquanto o estado está carregando
      if (authState.isLoading) return null;

      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final isOnAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isAuthenticated && !isOnAuthRoute) return '/login';
      if (isAuthenticated && isOnAuthRoute) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, _) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, _) => const RegisterPage(),
      ),
      ShellRoute(
        builder: (context, _, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (_, _) => const HomePage(),
          ),
          GoRoute(
            path: '/transactions',
            builder: (_, _) => const TransactionsPage(),
          ),
          GoRoute(
            path: '/budgets',
            builder: (_, _) => const BudgetsPage(),
          ),
          GoRoute(
            path: '/accounts',
            builder: (_, _) => const AccountsPage(),
          ),
        ],
      ),
    ],
  );

  ref.onDispose(notifier.dispose);
  return router;
});

/// Escuta mudanças no AuthState e notifica o GoRouter para reavaliar o redirect.
class _RouterListenable extends ChangeNotifier {
  _RouterListenable(Ref ref) {
    _subscription = ref.listen<AsyncValue<AuthState>>(
      authNotifierProvider,
      (_, _) => notifyListeners(),
    );
  }

  ProviderSubscription<AsyncValue<AuthState>>? _subscription;

  @override
  void dispose() {
    _subscription?.close();
    super.dispose();
  }
}
