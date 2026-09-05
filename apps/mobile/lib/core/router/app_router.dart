import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/accounts/presentation/account_detail_page.dart';
import '../../features/accounts/presentation/accounts_page.dart';
import '../../features/accounts/presentation/create_account_page.dart';
import '../../features/accounts/presentation/edit_account_page.dart';
import '../../features/categories/presentation/categories_page.dart';
import '../../features/categories/presentation/create_category_page.dart';
import '../../features/categories/presentation/edit_categories_page.dart';
import '../../features/categories/presentation/subcategories_page.dart';
import '../../features/auth/presentation/forgot_password_page.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/auth/presentation/reset_password_page.dart';
import '../../features/profile/presentation/edit_profile_page.dart';
import '../../features/profile/presentation/preferences_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/auth/presentation/splash_page.dart';
import '../../features/auth/presentation/two_factor_page.dart';
import '../../features/auth/presentation/verify_email_page.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../providers/overlay_provider.dart';
import '../../features/budgets/data/models/budget_models.dart';
import '../../features/budgets/presentation/budgets_page.dart';
import '../../features/budgets/presentation/create_budget_step1_page.dart';
import '../../features/budgets/presentation/edit_budget_page.dart';
import '../../features/budgets/presentation/create_budget_step2_page.dart';
import '../../features/budgets/presentation/create_budget_step3_page.dart';
import '../../features/budgets/presentation/create_budget_step4_page.dart';
import '../../features/analytics/presentation/analytics_page.dart';
import '../../features/feedback/presentation/feedback_page.dart';
import '../../features/goals/presentation/goals_page.dart';
import '../../features/import/presentation/import_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/investments/presentation/investments_page.dart';
import '../../features/investments/presentation/register_investment_page.dart';
import '../../features/market/presentation/market_asset_page.dart';
import '../../features/market/presentation/market_page.dart';
import '../../features/menu/presentation/menu_page.dart';
import '../../features/notifications/presentation/notification_preferences_page.dart';
import '../../features/notifications/presentation/notifications_page.dart';
import '../../features/legal/data/legal_repository.dart';
import '../../features/legal/presentation/legal_document_page.dart';
import '../../features/recurrences/presentation/recurrences_page.dart';
import '../../features/transactions/data/models/transaction_item.dart';
import '../../features/transactions/presentation/add_transaction_page.dart';
import '../../features/transactions/presentation/edit_transaction_page.dart';
import '../../features/transactions/presentation/transaction_detail_page.dart';
import '../../features/transactions/presentation/transactions_page.dart';
import '../../shared/widgets/app_shell.dart';

/// Routes reachable without a session.
///
/// The verification and two-factor screens belong here even though they finish a
/// login: at the moment they run there is no token yet, and the redirect below
/// would bounce them straight back to /login. Password recovery had the same
/// problem and was unreachable.
const _publicRoutes = {
  '/splash',
  '/login',
  '/register',
  '/verify-email',
  '/two-factor',
  '/forgot-password',
  '/reset-password',
};

/// Reachable in both states, so neither redirect rule may claim them: the legal
/// documents are linked from the signup form and have to stay readable after the
/// account exists.
const _openRoutes = {
  '/legal/privacy',
  '/legal/terms',
};

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterListenable(ref);

  final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    observers: [OverlayRouteObserver(ref)],
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);

      // Do not redirect while auth state is loading
      if (authState.isLoading) return null;

      if (_openRoutes.contains(state.matchedLocation)) return null;

      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final isOnAuthRoute = _publicRoutes.contains(state.matchedLocation);

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
        path: '/forgot-password',
        builder: (_, _) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordPage(email: state.extra as String),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) => VerifyEmailPage(email: state.extra as String),
      ),
      GoRoute(
        path: '/two-factor',
        builder: (_, state) =>
            TwoFactorPage(challengeToken: state.extra as String),
      ),
      GoRoute(
        path: '/legal/privacy',
        builder: (_, _) => const LegalDocumentPage(
          type: LegalDocumentTypes.privacyPolicy,
          title: 'Política de Privacidade',
        ),
      ),
      GoRoute(
        path: '/legal/terms',
        builder: (_, _) => const LegalDocumentPage(
          type: LegalDocumentTypes.termsOfUse,
          title: 'Termos de Uso',
        ),
      ),
      GoRoute(
        path: '/analytics',
        builder: (_, _) => const AnalyticsPage(),
      ),
      GoRoute(
        path: '/recurring',
        builder: (_, _) => const RecurrencesPage(),
      ),
      GoRoute(
        path: '/feedback',
        builder: (_, _) => const FeedbackPage(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, _) => const NotificationsPage(),
        routes: [
          GoRoute(
            path: 'preferences',
            builder: (_, _) => const NotificationPreferencesPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/goals',
        builder: (_, _) => const GoalsPage(),
      ),
      GoRoute(
        path: '/investments',
        builder: (_, _) => const InvestmentsPage(),
        routes: [
          GoRoute(
            path: 'register',
            builder: (_, _) => const RegisterInvestmentPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/market',
        builder: (_, _) => const MarketPage(),
        routes: [
          GoRoute(
            path: ':ticker',
            builder: (_, state) =>
                MarketAssetPage(ticker: state.pathParameters['ticker']!),
          ),
        ],
      ),
      GoRoute(
        path: '/transactions/add',
        builder: (_, _) => const AddTransactionPage(),
      ),
      GoRoute(
        path: '/transactions/import',
        builder: (_, _) => const ImportPage(),
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
          GoRoute(
            path: 'subcategories',
            builder: (_, _) => const SubcategoriesPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/accounts/:id',
        builder: (_, state) {
          final id = int.parse(state.pathParameters['id']!);
          return AccountDetailPage(accountId: id);
        },
        routes: [
          GoRoute(
            path: 'edit',
            builder: (_, state) {
              final id = int.parse(state.pathParameters['id']!);
              return EditAccountPage(accountId: id);
            },
          ),
        ],
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
            routes: [
              GoRoute(
                path: 'edit',
                builder: (_, _) => const EditProfilePage(),
              ),
              GoRoute(
                path: 'preferences',
                builder: (_, _) => const PreferencesPage(),
              ),
            ],
          ),
          GoRoute(
            path: '/menu',
            builder: (_, _) => const MenuPage(),
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
