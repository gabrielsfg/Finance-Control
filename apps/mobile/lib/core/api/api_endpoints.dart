import '../config/app_config.dart';

abstract class ApiEndpoints {
  static String get baseUrl => AppConfig.apiBaseUrl;

  // Auth — UserController.
  // Mobile uses the body-based token variants (refresh token in the request
  // body, not an HttpOnly cookie). The cookie-based /api/user/{login,refresh,
  // logout} endpoints are reserved for the web client.
  static const String login = '/api/user/mobile/login';
  static const String register = '/api/user/mobile/register';
  static const String refreshToken = '/api/user/mobile/refresh';
  static const String logout = '/api/user/mobile/logout';
  static const String verifyEmail = '/api/user/mobile/verify-email';
  static const String twoFactorLogin = '/api/user/mobile/login/two-factor';
  // No mobile variant — these carry no tokens either way, so both clients share them.
  static const String resendVerificationCode = '/api/user/verify-email/resend';
  static const String twoFactor = '/api/user/two-factor';
  static const String forgotPassword = '/api/user/forgot-password';
  static const String resetPassword = '/api/user/reset-password';
  static const String userProfile = '/api/user/profile';
  static const String deleteAccount = '/api/user/me';
  static const String resetData = '/api/user/me/reset-data';
  static const String userPreferences = '/api/user/preferences';
  static String banks(String country) => '/api/banks?country=$country';

  // Main page
  static const String mainPageSummary = '/api/mainpage/summary';

  // Accounts
  static const String accounts = '/api/Account';
  static String accountById(int id) => '/api/Account/$id';

  // Transactions
  static const String transactions = '/api/transaction';
  static String transactionById(int id) => '/api/transaction/$id';
  static const String transactionsFiltered = '/api/transaction/filtered';
  static String updateRecurringTransaction(int recurringId) =>
      '/api/transaction/$recurringId/recurring';
  static String cancelRecurringTransaction(int recurringId) =>
      '/api/transaction/$recurringId/recurring/cancel';

  // Categories (user-owned — CRUD)
  static const String userCategories = '/api/category';
  static String userCategoryById(int id) => '/api/category/$id';
  static const String userCategoryUpdate = '/api/category';

  // Subcategories
  static const String subcategories = '/api/SubCategory';
  static String subcategoryById(int id) => '/api/SubCategory/$id';
  static String deleteSubcategory(int id) => '/api/SubCategory/$id';

  // Analytics
  static const String analyticsIncomeExpense = '/api/analytics/income-expense';
  static const String analyticsBalanceEvolution =
      '/api/analytics/balance-evolution';
  static const String analyticsExpensesByCategory =
      '/api/analytics/expenses-by-category';
  static const String analyticsCategoryEvolution =
      '/api/analytics/category-evolution';
  static const String analyticsNetWorthEvolution =
      '/api/analytics/net-worth-evolution';
  static const String analyticsFutureCommitments =
      '/api/analytics/future-commitments';
  static const String analyticsSpendingHeatmap =
      '/api/analytics/spending-heatmap';
  static const String analyticsBudgetPace = '/api/analytics/budget-pace';
  static const String analyticsProjectionBalance =
      '/api/analytics/projection/balance';
  static const String analyticsProjectionCategories =
      '/api/analytics/projection/categories';
  static const String analyticsProjectionNetWorth =
      '/api/analytics/projection/net-worth';
  static const String analyticsProjectionCommitmentsImpact =
      '/api/analytics/projection/commitments-impact';

  // Recurrences (subscriptions + installments overview)
  static const String recurrences = '/api/recurrences';
  static const String recurringCreate = '/api/recurrences/recurring';
  static String recurringById(int id) => '/api/recurrences/recurring/$id';
  static String recurringCancel(int id) =>
      '/api/recurrences/recurring/$id/cancel';
  static String recurringReactivate(int id) =>
      '/api/recurrences/recurring/$id/reactivate';

  // Goals (metas)
  static const String goals = '/api/goals';
  static String goalById(int id) => '/api/goals/$id';
  static String goalContribute(int id) => '/api/goals/$id/contribute';
  static String goalWithdraw(int id) => '/api/goals/$id/withdraw';
  static String goalPurchase(int id) => '/api/goals/$id/purchase';
  static String goalInvestmentTransactions(int id) =>
      '/api/goals/$id/investment-transactions';

  // Investments
  static const String investments = '/api/Investment';
  static String investmentById(int id) => '/api/Investment/$id';
  static const String investmentTransactions = '/api/Investment/transactions';
  static const String investmentDividends = '/api/Investment/dividends';
  static String investmentPriceHistory(int id) =>
      '/api/Investment/$id/price-history';

  // Market
  static String market({String? type, String sort = 'change_desc', int limit = 20}) {
    final params = <String, String>{
      'sort': sort,
      'limit': '$limit',
      if (type != null) 'type': type,
    };
    final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    return '/api/Market?$query';
  }

  static String marketSearch(String q) =>
      '/api/Market/search?q=${Uri.encodeQueryComponent(q)}';
  static String marketAsset(String ticker) => '/api/Market/$ticker';
  static const String marketMacro = '/api/Market/macro';

  // Budgets
  static const String budgets = '/api/budget';
  static String budgetById(int id) => '/api/budget/$id';
  static String budgetWithAllocations(int id) => '/api/budget/$id/allocation';

  // Budget Areas
  static const String budgetAreas = '/api/area';
  static String areaById(int id) => '/api/area/$id';
  static String budgetAreasByBudget(int budgetId) => '/api/area?budgetId=$budgetId';
  static const String allAreas = '/api/area/all';

  // Budget Allocations
  static String budgetAllocations(int budgetId) =>
      '/api/budgets/$budgetId/allocation';
  static String budgetAllocationsByArea(int budgetId, int areaId) =>
      '/api/budgets/$budgetId/allocation/by-area/$areaId';
  static String budgetAllocationById(int budgetId, int allocationId) =>
      '/api/budgets/$budgetId/allocation/$allocationId';
}
