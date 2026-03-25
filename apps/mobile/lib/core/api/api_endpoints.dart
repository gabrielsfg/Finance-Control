import '../config/app_config.dart';

abstract class ApiEndpoints {
  static String get baseUrl => AppConfig.apiBaseUrl;

  // Auth — UserController
  static const String login = '/api/user/login';
  static const String register = '/api/user/register';

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

  // Categories (transaction picker — includes system categories)
  static const String categories = '/api/categories';

  // Categories (user-owned — CRUD)
  static const String userCategories = '/api/category';
  static String userCategoryById(int id) => '/api/category/$id';
  static const String userCategoryUpdate = '/api/category';

  // Subcategories
  static const String subcategories = '/api/SubCategory';
  static String subcategoryById(int id) => '/api/SubCategory/$id';
  static String deleteSubcategory(int id) => '/api/SubCategory/$id';

  // Budgets
  static const String budgets = '/api/budget';
  static String budgetById(int id) => '/api/budget/$id';
  static String budgetWithAllocations(int id) => '/api/budget/$id/allocation';

  // Budget Areas
  static const String budgetAreas = '/api/area';
  static String areaById(int id) => '/api/area/$id';
  static String budgetAreasByBudget(int budgetId) => '/api/area?budgetId=$budgetId';

  // Budget Allocations
  static String budgetAllocations(int budgetId) =>
      '/api/budgets/$budgetId/allocation';
  static String budgetAllocationsByArea(int budgetId, int areaId) =>
      '/api/budgets/$budgetId/allocation/by-area/$areaId';
  static String budgetAllocationById(int budgetId, int allocationId) =>
      '/api/budgets/$budgetId/allocation/$allocationId';
}
