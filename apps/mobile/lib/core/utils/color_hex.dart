import 'package:flutter/material.dart';

/// Parses a hex color string (`#RRGGBB`, `RRGGBB`, `#AARRGGBB`) into a [Color].
/// Returns [fallback] when the string is null, empty, or malformed.
Color colorFromHex(String? hex, {required Color fallback}) {
  if (hex == null) return fallback;
  var value = hex.trim().replaceFirst('#', '');
  if (value.length == 6) value = 'FF$value';
  if (value.length != 8) return fallback;
  final parsed = int.tryParse(value, radix: 16);
  return parsed == null ? fallback : Color(parsed);
}
