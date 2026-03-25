import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/accounts/presentation/accounts_page.dart';
import '../../features/accounts/presentation/create_account_page.dart';
import '../../features/accounts/presentation/edit_account_page.dart';
import '../../features/categories/presentation/categories_page.dart';
import '../../features/categories/presentation/create_category_page.dart';
import '../../features/categories/presentation/edit_categories_page.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/auth/presentation/splash_page.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/budgets/data/models/budget_models.dart';
import '../../features/budgets/presentation/budgets_page.dart';
import '../../features/budgets/presentation/create_budget_step1_page.dart';
import '../../features/budgets/presentation/edit_budget_page.dart';
import '../../features/budgets/presentation/create_budget_step2_page.dart';
import '../../features/budgets/presentation/create_budget_step3_page.dart';
import '../../features/budgets/presentation/create_budget_step4_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/transactions/data/models/transaction_item.dart';
import '../../features/transactions/presentation/add_transaction_page.dart';
import '../../features/transactions/presentation/edit_transaction_page.dart';
import '../../features/transactions/presentation/transaction_detail_page.dart';
import '../../features/transactions/presentation/transactions_page.dart';
import '../../shared/widgets/app_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterListenable(ref);

  final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);

      // Do not redirect while auth state is loading
      if (authState.isLoading) return null;

      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final isOnAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/splash';

      if (!isAuthenticated && !isOnAuthRoute) return '/login';
      if (isAuthenticated && isOnAuthRoute) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, _) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, _) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, _) => const RegisterPage(),
      ),
      GoRoute(
        path: '/transactions/add',
        builder: (_, _) => const AddTransactionPage(),
      ),
      GoRoute(
        path: '/transactions/edit',
        builder: (_, state) {
          final transaction = state.extra as TransactionItem;
          return EditTransactionPage(transaction: transaction);
        },
      ),
      GoRoute(
        path: '/accounts/create',
        builder: (_, _) => const CreateAccountPage(),
      ),
      GoRoute(
        path: '/categories',
        builder: (_, _) => const CategoriesPage(),
        routes: [
          GoRoute(
            path: 'create',
            builder: (_, _) => const CreateCategoryPage(),
          ),
          GoRoute(
            path: 'edit',
            builder: (_, _) => const EditCategoriesPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/accounts/:id/edit',
        builder: (_, state) {
          final id = int.parse(state.pathParameters['id']!);
          return EditAccountPage(accountId: id);
        },
      ),
      GoRoute(
        path: '/budgets/edit',
        builder: (_, state) {
          final budget = state.extra as Budget;
          return EditBudgetPage(budget: budget);
        },
      ),
      GoRoute(
        path: '/budgets/create/step1',
        builder: (_, _) => const CreateBudgetStep1Page(),
      ),
      GoRoute(
        path: '/budgets/create/step2',
        builder: (_, _) => const CreateBudgetStep2Page(),
      ),
      GoRoute(
        path: '/budgets/create/step3',
        builder: (_, _) => const CreateBudgetStep3Page(),
      ),
      GoRoute(
        path: '/budgets/create/step4',
        builder: (_, _) => const CreateBudgetStep4Page(),
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
            routes: [
              GoRoute(
                path: 'detail',
                builder: (context, state) {
                  final transaction = state.extra as TransactionItem;
                  return TransactionDetailPage(transaction: transaction);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/budgets',
            builder: (_, _) => const BudgetsPage(),
          ),
          GoRoute(
            path: '/accounts',
            builder: (_, _) => const AccountsPage(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, _) => const ProfilePage(),
          ),
        ],
      ),
    ],
  );

  ref.onDispose(notifier.dispose);
  return router;
});

/// Listens for AuthState changes and notifies GoRouter to re-evaluate the redirect.
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
