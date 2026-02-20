import 'package:flutter/material.dart';

// TODO: replace with API-connected model
/// Lightweight view model used to display a recent transaction on the home screen.
class TransactionPreview {
  final String name;
  final String category;
  final int amountCents;
  final IconData icon;
  final Color color;

  const TransactionPreview(
      this.name, this.category, this.amountCents, this.icon, this.color);
}
