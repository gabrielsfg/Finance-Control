import 'package:flutter/material.dart';

/// View model for a single transaction row in the list and detail screen.
class TransactionItem {
  final String name;
  final String subtitle; // e.g. "Food · Café"
  final int amountCents; // positive = income, negative = expense
  final IconData icon;
  final Color color;
  final DateTime date;

  // Detail-screen fields
  final String category;
  final String subcategory;
  final String account;
  final String type; // "Expense" | "Income"
  final String recurrence; // "None" | "Daily" | etc.
  final int installments; // 1 = not installment
  final String? description;

  const TransactionItem({
    required this.name,
    required this.subtitle,
    required this.amountCents,
    required this.icon,
    required this.color,
    required this.date,
    required this.category,
    required this.subcategory,
    required this.account,
    required this.type,
    this.recurrence = 'None',
    this.installments = 1,
    this.description,
  });
}

/// A group of transactions sharing the same calendar date.
class TransactionGroup {
  final DateTime date;
  final List<TransactionItem> items;

  const TransactionGroup({required this.date, required this.items});
}
