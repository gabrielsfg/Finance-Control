import 'package:flutter/material.dart';

// TODO: replace with API-connected model
/// Lightweight view model used to display a top-spending category on the home screen.
class CategoryPreview {
  final String name;
  final IconData icon;
  final int amountCents;
  final Color color;

  const CategoryPreview(this.name, this.icon, this.amountCents, this.color);
}
