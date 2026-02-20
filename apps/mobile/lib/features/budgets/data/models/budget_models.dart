import 'package:flutter/material.dart';

// ── Subcategory allocation ────────────────────────────────────────────────

class BudgetSubcategory {
  final int id;
  final String name;
  final int allocatedCents; // 0 = not allocated (informational only)
  final int spentCents;

  const BudgetSubcategory({
    required this.id,
    required this.name,
    required this.allocatedCents,
    this.spentCents = 0,
  });

  double get spentPercent =>
      allocatedCents > 0 ? (spentCents / allocatedCents).clamp(0.0, 2.0) : 0.0;
}

// ── Category inside an area ───────────────────────────────────────────────

class BudgetCategory {
  final int id;
  final String name;
  final IconData icon;
  final Color color;
  final List<BudgetSubcategory> subcategories;

  const BudgetCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
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
  final String recurrence; // Monthly | Weekly | etc.
  final DateTime startDate;
  final DateTime endDate;
  final List<BudgetArea> areas;

  const Budget({
    required this.id,
    required this.name,
    required this.recurrence,
    required this.startDate,
    required this.endDate,
    required this.areas,
  });

  int get totalAllocatedCents =>
      areas.fold(0, (sum, a) => sum + a.allocatedCents);

  int get totalSpentCents =>
      areas.fold(0, (sum, a) => sum + a.spentCents);

  double get overallPercent => totalAllocatedCents > 0
      ? (totalSpentCents / totalAllocatedCents).clamp(0.0, 2.0)
      : 0.0;
}

// ── Draft models used during the creation wizard ─────────────────────────

class DraftSubcategory {
  final int id;
  final String name;
  int allocatedCents;

  DraftSubcategory({
    required this.id,
    required this.name,
    this.allocatedCents = 0,
  });
}

class DraftCategory {
  final int id;
  final String name;
  final IconData icon;
  final Color color;
  final List<DraftSubcategory> subcategories;

  DraftCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.subcategories,
  });

  int get totalAllocatedCents =>
      subcategories.fold(0, (sum, s) => sum + s.allocatedCents);
}

class DraftArea {
  final String name;
  final List<DraftCategory> categories;

  DraftArea({required this.name, required this.categories});

  int get totalAllocatedCents =>
      categories.fold(0, (sum, c) => sum + c.totalAllocatedCents);
}
