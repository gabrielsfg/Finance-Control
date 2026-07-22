import 'package:flutter/material.dart';

import 'color_hex.dart';

/// Category color palette — mirrors the web `CategoryColorPicker` swatches so
/// colors chosen on either platform look identical.
const categoryPalette = <String>[
  '#F5A623', '#4A9EFF', '#00C98D', '#7C6FE0', '#F25F5C', '#F5CE42',
  '#00D4A0', '#E07C6F', '#6FD4E0', '#B06FE0', '#8A95A3', '#F97316',
];

const categoryFallbackColor = '#8A95A3';

/// Resolves a category's color: the explicit [color] if set, otherwise a
/// deterministic pick from the name (mirrors the web `getCategoryColor`).
Color categoryColor(String? color, String name) {
  const fallback = Color(0xFF8A95A3);
  if (color != null && color.trim().isNotEmpty) {
    return colorFromHex(color, fallback: fallback);
  }
  final palette = categoryPalette.take(10).toList();
  if (name.isEmpty) return fallback;
  var hash = 0;
  for (final unit in name.codeUnits) {
    hash = (hash + unit) % palette.length;
  }
  return colorFromHex(palette[hash], fallback: fallback);
}
