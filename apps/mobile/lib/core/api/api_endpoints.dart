abstract class ApiEndpoints {
  // Trocar pela URL do servidor em produção via variável de ambiente ou flavor
  static const String baseUrl = 'http://10.0.2.2:5000'; // Android emulator → localhost

  // Auth — UserController (api/user/...)
  static const String login = '/api/user/login';
  static const String register = '/api/user/register';

  // Accounts
  static const String accounts = '/api/accounts';

  // Transactions
  static const String transactions = '/api/transactions';

  // Categories
  static const String categories = '/api/categories';

  // Budgets
  static const String budgets = '/api/budgets';
}
