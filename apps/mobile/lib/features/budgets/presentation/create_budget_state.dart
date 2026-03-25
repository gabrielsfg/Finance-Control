import '../data/models/budget_models.dart';

/// Singleton that holds wizard state across the 4 creation steps.
/// Cleared when the wizard is dismissed or completed.
class CreateBudgetState {
  CreateBudgetState._();
  static final instance = CreateBudgetState._();

  String name = '';
  String recurrence = 'Monthly';
  int startDay = 1;

  /// Areas defined in step 2 — all allocations are Income.
  List<DraftArea> incomeAreas = [];

  /// Areas defined in step 3 — all allocations are Expense.
  List<DraftArea> expenseAreas = [];

  void reset() {
    name = '';
    recurrence = 'Monthly';
    startDay = 1;
    incomeAreas = [];
    expenseAreas = [];
  }
}
