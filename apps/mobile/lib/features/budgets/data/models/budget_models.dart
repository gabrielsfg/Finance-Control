import '../dtos/allocation_response_dto.dart';
import '../dtos/budget_response_dto.dart';

// ── Unallocated transaction (Outras Despesas) ─────────────────────────────

class UnallocatedTransaction {
  final int id;
  final int subCategoryId;
  final String subCategoryName;
  final int valueCents;
  final String type;

  const UnallocatedTransaction({
    required this.id,
    required this.subCategoryId,
    required this.subCategoryName,
    required this.valueCents,
    required this.type,
  });

  bool get isExpense => type == 'Expense';
}

// ── Subcategory allocation ────────────────────────────────────────────────

class BudgetSubcategory {
  final int allocationId;
  final int id;
  final String name;
  final int allocatedCents;
  final int spentCents;
  final String allocationType;

  const BudgetSubcategory({
    required this.allocationId,
    required this.id,
    required this.name,
    required this.allocatedCents,
    required this.allocationType,
    this.spentCents = 0,
  });

  bool get isExpense => allocationType == 'Expense';

  double get spentPercent =>
      allocatedCents > 0 ? (spentCents / allocatedCents).clamp(0.0, 2.0) : 0.0;
}

// ── Category inside an area ───────────────────────────────────────────────

class BudgetCategory {
  final int id;
  final String name;
  final List<BudgetSubcategory> subcategories;

  const BudgetCategory({
    required this.id,
    required this.name,
    required this.subcategories,
  });

  int get allocatedCents =>
      subcategories.fold(0, (sum, s) => sum + s.allocatedCents);

  int get spentCents =>
      subcategories.fold(0, (sum, s) => sum + s.spentCents);

  double get spentPercent =>
      allocatedCents > 0 ? (spentCents / allocatedCents).clamp(0.0, 2.0) : 0.0;
}

// ── Area inside a budget ──────────────────────────────────────────────────

class BudgetArea {
  final int id;
  final String name;
  final List<BudgetCategory> categories;

  const BudgetArea({
    required this.id,
    required this.name,
    required this.categories,
  });

  /// All subcategories are either Income or Expense within an area (by design).
  /// We infer the area type from the first allocation found.
  String get allocationType {
    for (final cat in categories) {
      for (final sub in cat.subcategories) {
        return sub.allocationType;
      }
    }
    return 'Expense';
  }

  bool get isIncome => allocationType == 'Income';

  int get allocatedCents =>
      categories.fold(0, (sum, c) => sum + c.allocatedCents);

  int get spentCents =>
      categories.fold(0, (sum, c) => sum + c.spentCents);

  double get spentPercent =>
      allocatedCents > 0 ? (spentCents / allocatedCents).clamp(0.0, 2.0) : 0.0;
}

// ── Budget (top-level) ────────────────────────────────────────────────────

class Budget {
  final int id;
  final String name;
  final String recurrence;
  final DateTime startDate;
  final DateTime endDate;
  final List<BudgetArea> areas;

  /// Transactions within the budget period whose subcategory has no allocation.
  final List<UnallocatedTransaction> otherTransactions;

  const Budget({
    required this.id,
    required this.name,
    required this.recurrence,
    required this.startDate,
    required this.endDate,
    required this.areas,
    this.otherTransactions = const [],
  });

  int get expectedIncomeCents => areas
      .where((a) => a.isIncome)
      .fold(0, (sum, a) => sum + a.allocatedCents);

  int get expectedExpenseCents => areas
      .where((a) => !a.isIncome)
      .fold(0, (sum, a) => sum + a.allocatedCents);

  int get actualIncomeCents => areas
      .where((a) => a.isIncome)
      .fold(0, (sum, a) => sum + a.spentCents);

  int get actualExpenseCents =>
      areas.where((a) => !a.isIncome).fold(0, (sum, a) => sum + a.spentCents) +
      otherExpenseCents;

  int get otherExpenseCents => otherTransactions
      .where((t) => t.isExpense)
      .fold(0, (sum, t) => sum + t.valueCents);

  int get otherIncomeCents => otherTransactions
      .where((t) => !t.isExpense)
      .fold(0, (sum, t) => sum + t.valueCents);

  int get balanceCents => actualIncomeCents - actualExpenseCents;

  // Legacy helpers kept for progress bar in _OverviewCard
  int get totalAllocatedCents => expectedIncomeCents + expectedExpenseCents;
  int get totalSpentCents => actualIncomeCents + actualExpenseCents;

  double get overallPercent => expectedExpenseCents > 0
      ? (actualExpenseCents / expectedExpenseCents).clamp(0.0, 2.0)
      : 0.0;

  static Budget fromDtos({
    required GetBudgetByIdResponseDto budgetDto,
    required List<AllocationByAreaResponseDto> allocationDtos,
    List<UnallocatedTransaction> otherTransactions = const [],
  }) {
    final areas = allocationDtos.map((areaDto) {
      final categories = areaDto.categories.map((catDto) {
        final subcategories = catDto.subCategories.map((subDto) {
          return BudgetSubcategory(
            allocationId: subDto.allocationId,
            id: subDto.subCategoryId,
            name: subDto.subCategoryName,
            allocatedCents: subDto.subCategoryExpectedValue,
            allocationType: subDto.allocationType,
            spentCents: subDto.spentValue,
          );
        }).toList();
        return BudgetCategory(
          id: catDto.categoryId,
          name: catDto.categoryName,
          subcategories: subcategories,
        );
      }).toList();
      return BudgetArea(
        id: areaDto.areaId,
        name: areaDto.areaName,
        categories: categories,
      );
    }).toList();

    return Budget(
      id: budgetDto.id,
      name: budgetDto.name,
      recurrence: budgetDto.recurrence,
      startDate: DateTime.parse(budgetDto.startDate),
      endDate: DateTime.parse(budgetDto.finishDate),
      areas: areas,
      otherTransactions: otherTransactions,
    );
  }

  /// Maps from the composite GET/POST/PATCH response (areas+allocations embedded).
  static Budget fromCompositeDto(
    GetBudgetByIdResponseDto dto, {
    List<UnallocatedTransaction> otherTransactions = const [],
  }) {
    final areas = dto.areas.map((areaDto) {
      final subcategories = areaDto.allocations.map((alloc) {
        return BudgetSubcategory(
          allocationId: alloc.id,
          id: alloc.subCategoryId,
          name: alloc.subCategoryName,
          allocatedCents: alloc.expectedValue,
          allocationType: alloc.allocationType,
          spentCents: alloc.spentValue,
        );
      }).toList();

      return BudgetArea(
        id: areaDto.id,
        name: areaDto.name,
        categories: [
          BudgetCategory(
            id: areaDto.id,
            name: areaDto.name,
            subcategories: subcategories,
          ),
        ],
      );
    }).toList();

    return Budget(
      id: dto.id,
      name: dto.name,
      recurrence: dto.recurrence,
      startDate: DateTime.parse(dto.startDate),
      endDate: DateTime.parse(dto.finishDate),
      areas: areas,
      otherTransactions: otherTransactions,
    );
  }
}

// ── Budget summary (from list endpoint) ──────────────────────────────────

class BudgetSummary {
  final int id;
  final String name;
  final String recurrence;

  const BudgetSummary({
    required this.id,
    required this.name,
    required this.recurrence,
  });

  static BudgetSummary fromDto(GetAllBudgetResponseDto dto) => BudgetSummary(
        id: dto.id,
        name: dto.name,
        recurrence: dto.recurrence,
      );
}

// ── Draft models used during the creation wizard ─────────────────────────

class DraftSubcategory {
  final int id;
  final String name;
  final String categoryName;
  int allocatedCents;

  DraftSubcategory({
    required this.id,
    required this.name,
    required this.categoryName,
    this.allocatedCents = 0,
  });
}

class DraftArea {
  final String name;
  final List<DraftSubcategory> subcategories;

  DraftArea({required this.name, required this.subcategories});

  int get totalAllocatedCents =>
      subcategories.fold(0, (sum, s) => sum + s.allocatedCents);
}
