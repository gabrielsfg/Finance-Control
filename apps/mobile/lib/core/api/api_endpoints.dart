import '../config/app_config.dart';

abstract class ApiEndpoints {
  static String get baseUrl => AppConfig.apiBaseUrl;

  // Auth — UserController
  static const String login = '/api/user/login';
  static const String register = '/api/user/register';
  static const String refreshToken = '/api/user/refresh';
  static const String logout = '/api/user/logout';
  static const String forgotPassword = '/api/user/forgot-password';
  static const String resetPassword = '/api/user/reset-password';
  static const String userProfile = '/api/user/profile';
  static const String deleteAccount = '/api/user/me';
  static const String resetData = '/api/user/me/reset-data';
  static const String userPreferences = '/api/user/preferences';
  static String currencies({String base = 'USD'}) => '/api/currencies?base=$base';
  static String banks(String country) => '/api/banks?country=$country';

  // Main page
  static const String mainPageSummary = '/api/mainpage/summary';

  // Accounts
  static const String accounts = '/api/Account';
  static String accountById(int id) => '/api/Account/$id';

  // Transactions
  static const String transactions = '/api/transaction';
  static String transactionById(int id) => '/api/transaction/$id';
  static String transactionsByBudget(int budgetId) =>
      '/api/transaction/by-budget/$budgetId';
  static String transactionsByAccount(int accountId) =>
      '/api/transaction/by-account/$accountId';
  static String transactionsBySubcategory(int subCategoryId) =>
      '/api/transaction/by-subcategory/$subCategoryId';
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

  // Wishlist
  static const String wishlist = '/api/wishlist';
  static String wishlistById(int id) => '/api/wishlist/$id';
  static String wishlistPrice(int id) => '/api/wishlist/$id/price';
  static String wishlistPurchase(int id) => '/api/wishlist/$id/purchase';
  static String wishlistPriceHistory(int id) => '/api/wishlist/$id/price-history';

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
